const prisma5 = new (require('@prisma/client').PrismaClient)();

function getTicketComparisonWindow(now = new Date()) {
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const comparableDay = Math.min(now.getDate(), previousMonthLastDay);
  const previousEnd = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    comparableDay,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );

  return { currentStart, previousStart, previousEnd, now };
}

function calculateGrowthPercent(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return +(((currentValue - previousValue) / previousValue) * 100).toFixed(1);
}

async function summary(req, res, next) {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to)   dateFilter.lte = new Date(to);
    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const ticketWindow = getTicketComparisonWindow();

    const [totalMessages, escalatedCount, avgConfResult, topIssueRaw, totalTickets, activeTickets, totalKB, totalUsers] = await Promise.all([
      prisma5.chatLog.count({ where: { ...where, role: 'assistant' } }),
      prisma5.chatLog.count({ where: { ...where, role: 'assistant', escalated: true } }),
      prisma5.chatLog.aggregate({ where: { ...where, role: 'assistant' }, _avg: { confidence: true } }),
      prisma5.knowledgeBase.groupBy({
        by: ['category'], _count: { id: true },
        orderBy: { _count: { id: 'desc' } }, take: 5
      }),
      prisma5.ticket.count(),
      prisma5.ticket.count({ where: { status: { notIn: ['resolved', 'RESOLVED'] } } }),
      prisma5.knowledgeBase.count(),
      prisma5.user.count()
    ]);

    const [currentPeriodTickets, previousPeriodTickets] = await Promise.all([
      prisma5.ticket.count({
        where: {
          createdAt: {
            gte: ticketWindow.currentStart,
            lte: ticketWindow.now
          }
        }
      }),
      prisma5.ticket.count({
        where: {
          createdAt: {
            gte: ticketWindow.previousStart,
            lte: ticketWindow.previousEnd
          }
        }
      })
    ]);

    const resolved = totalMessages - escalatedCount;
    const resolvedTickets = totalTickets - activeTickets;
    res.json({
      success: true,
      period: { from: from || null, to: to || null },
      totalTickets,
      activeTickets,
      resolvedTickets,
      totalUsers,
      knowledgeBaseArticles: totalKB,
      averageResolutionTime: "N/A", // Calculated later if needed
      ticketGrowthPercent: calculateGrowthPercent(currentPeriodTickets, previousPeriodTickets),
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