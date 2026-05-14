const { processChat } = require('../services/chatService');
const prisma2 = new (require('@prisma/client').PrismaClient)();

async function sendMessage(req, res, next) {
  try {
    const { sessionId, userId, message, imageBase64 } = req.body;
    const result = await processChat(userId, sessionId, message, imageBase64 || null);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const messages = await prisma2.chatLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, confidence: true, createdAt: true }
    });
    res.json({
      success: true,
      sessionId,
      messages: messages.map(m => ({
        messageId:  m.id,
        role:       m.role,
        content:    m.content,
        confidence: m.confidence,
        timestamp:  m.createdAt
      }))
    });
  } catch (err) { next(err); }
}

module.exports = { sendMessage, getHistory };

