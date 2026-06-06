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
  const recentHistory = await prisma.chatLog.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { role: true, content: true }
  });
  const chatHistory = [
    ...recentHistory.reverse().map((turn) => ({ role: turn.role, content: turn.content })),
    { role: 'user', content: message }
  ];

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

  // 2. Generate jawaban dari ai-engine yang sudah membaca knowledge base dari PostgreSQL
  const aiResult = await aiGenerate(userId, sessionId, message, imageBase64, chatHistory);

  // AI Result from FastAPI sometimes uses 'response_text' instead of 'reply'
  const reply = aiResult.response_text || aiResult.reply || "Maaf, sistem tidak memberikan respon.";
  const engineUsedData = aiResult.engine_used || aiResult.engineUsed || 'ollama-local';
  const confidence = typeof aiResult.confidence_score === 'number' ? aiResult.confidence_score : 0;
  const escalated = aiResult.escalated ?? (confidence < 0.60);
  const kbSources = Array.isArray(aiResult.sources) ? aiResult.sources : [];

  // 3. Simpan pesan asisten
  const assistantMsgId = `msg_${Date.now()}_a`;
  await prisma.chatLog.create({
    data: {
      id:        assistantMsgId,
      sessionId, userId,
      role:      'assistant',
      content:   reply,
      confidence,
      escalated,
      engineUsed: engineUsedData,
      kbSources
    }
  });

  // 4. Jika eskalasi, minta user buat ticket manual dari tombol di chat UI
  const ticketSuggested = escalated;
  const ticketSuggestion = escalated ? 'Buat Ticket Eskalasi' : null;

  return {
    reply,
    confidence,
    sources: kbSources,
    escalated,
    ticketSuggested,
    ticketSuggestion,
    messageId: assistantMsgId,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { processChat, vectorSearch, triggerEscalationWebhook };
