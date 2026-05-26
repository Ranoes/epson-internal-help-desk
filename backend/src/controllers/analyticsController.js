const prisma5 = new (require('@prisma/client').PrismaClient)();

async function summary(req, res, next) {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to)   dateFilter.lte = new Date(to);
    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [totalMessages, escalatedCount, avgConfResult, topIssueRaw, totalTickets, activeTickets, totalKB, totalUsers] = await Promise.all([
      prisma5.chatLog.count({ where: { ...where, role: 'assistant' } }),
      prisma5.chatLog.count({ where: { ...where, role: 'assistant', escalated: true } }),
      prisma5.chatLog.aggregate({ where: { ...where, role: 'assistant' }, _avg: { confidence: true } }),
      prisma5.knowledgeBase.groupBy({
        by: ['category'], _count: { id: true },
        orderBy: { _count: { id: 'desc' } }, take: 5
      }),
      prisma5.ticket.count(),
      prisma5.ticket.count({ where: { status: { not: 'RESOLVED' } } }),
      prisma5.knowledgeBase.count(),
      prisma5.user.count({ where: { role: 'USER' } })
    ]);

    const resolved = totalMessages - escalatedCount;
    res.json({
      success: true,
      period: { from: from || null, to: to || null },
      totalTickets,
      activeTickets,
      resolvedTickets: totalTickets - activeTickets,
      totalUsers,
      knowledgeBaseArticles: totalKB,
      averageResolutionTime: "N/A", // Calculated later if needed
      stats: {
        totalMessages,
        resolvedByChatbot: resolved,
        escalated: escalatedCount,
        resolutionRate: totalMessages > 0 ? +(resolved / totalMessages).toFixed(3) : 0,
        avgConfidence: +(avgConfResult._avg.confidence || 0).toFixed(2),
        topIssues: topIssueRaw.map(t => ({ category: t.category, count: t._count.id }))
      }
    });
  } catch (err) { next(err); }
}

module.exports = { summary };