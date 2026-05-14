const { PrismaClient } = require('@prisma/client');
const { selectAndGenerate: aiGenerate } = require('./aiService');
const fetch2 = require('node-fetch');

const prisma = new PrismaClient();

/**
 * vectorSearch - stub sementara.
 * RASKY: ganti isi fungsi ini dengan panggilan ke ChromaDB / pgvector.
 * Harus return array of: { id, title, content, score }
 */
async function vectorSearch(message, topK = 3) {
  // Stub: ambil KB entries dari DB sebagai placeholder
  const docs = await prisma.knowledgeBase.findMany({ take: topK });
  return docs.map(d => ({ id: d.id, title: d.title, content: d.content, score: 0.85 }));
}

async function triggerEscalationWebhook(payload) {
  if (!process.env.N8N_WEBHOOK_URL) return;
  try {
    await fetch2(process.env.N8N_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('[Webhook] n8n escalation failed:', err.message);
  }
}

async function processChat(userId, sessionId, message, imageBase64 = null) {
  // 1. Simpan pesan user
  await prisma.chatLog.create({
    data: {
      id:        `msg_${Date.now()}_u`,
      sessionId, userId,
      role:      'user',
      content:   message,
      kbSources: []
    }
  });

  // 2. RAG: cari dokumen relevan
  const topDocs    = await vectorSearch(message);
  const confidence = topDocs.length > 0 ? topDocs[0].score : 0;
  const escalated  = confidence < 0.60;

  // 3. Build system prompt dengan context
  const context = topDocs
    .map(d => `[Source: ${d.title}]\n${d.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `Kamu adalah asisten helpdesk teknis PT. Indonesia Epson Industry. \
Jawab pertanyaan karyawan HANYA berdasarkan context di bawah ini. \
Jika tidak ada informasi relevan, katakan tidak tahu dan sarankan eskalasi ke IT Support. \
Gunakan bahasa Indonesia yang jelas dan berikan langkah-langkah yang spesifik.\n\nCONTEXT:\n${context}`;

  // 4. Generate jawaban
  const { reply, engineUsed } = escalated
    ? {
        reply:      'Maaf, saya tidak menemukan solusi untuk masalah ini. Tim IT Support akan segera dihubungi.',
        engineUsed: 'none'
      }
    : await aiGenerate(systemPrompt, message, imageBase64);

  // 5. Simpan pesan asisten
  const asstMsgId = `msg_${Date.now()}_a`;
  await prisma.chatLog.create({
    data: {
      id:        asstMsgId,
      sessionId, userId,
      role:      'assistant',
      content:   reply,
      confidence,
      escalated,
      engineUsed,
      kbSources: topDocs.map(d => d.id)
    }
  });

  // 6. Buat tiket otomatis jika eskalasi
  let ticketId = null;
  if (escalated) {
    const ticket = await prisma.ticket.create({
      data: {
        id:        `tkt_${Date.now()}`,
        userId,
        sessionId,
        question:  message,
        status:    'open'
      }
    });
    ticketId = ticket.id;
    await triggerEscalationWebhook({ ticketId, userId, question: message });
  }

  return {
    messageId:  asstMsgId,
    reply,
    confidence,
    sources:    topDocs.map(d => ({ docId: d.id, title: d.title, relevance: d.score })),
    escalated,
    ticketId,
    timestamp:  new Date().toISOString()
  };
}
