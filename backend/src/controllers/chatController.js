const { processChat } = require('../services/chatService');
const prisma2 = new (require('@prisma/client').PrismaClient)();

async function sendMessage(req, res, next) {
  try {
    const { sessionId, message, imageBase64 } = req.body;
    const userId = req.user.id;
    const result = await processChat(userId, sessionId, message, imageBase64 || null);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const messages = await prisma2.chatLog.findMany({
      where: { sessionId, userId: req.user.id },
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

async function listSessions(req, res, next) {
  try {
    const sessions = await prisma2.chatLog.findMany({
      where: { userId: req.user.id },
      distinct: ['sessionId'],
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true, content: true, role: true, createdAt: true }
    });

    res.json({
      success: true,
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        preview: session.content.length > 60 ? `${session.content.slice(0, 60)}...` : session.content,
        lastRole: session.role,
        updatedAt: session.createdAt,
      }))
    });
  } catch (err) { next(err); }
}

module.exports = { sendMessage, getHistory, listSessions };

