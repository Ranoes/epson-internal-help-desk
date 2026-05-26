const prisma4 = new (require('@prisma/client').PrismaClient)();

async function list(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, data] = await Promise.all([
      prisma4.ticket.count({ where }),
      prisma4.ticket.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      })
    ]);
    res.json({
      success: true, total,
      tickets: data.map(t => ({
        id: t.id, 
        userId: t.userId, 
        userName: t.user.name,
        title: t.question.substring(0, 50) + (t.question.length > 50 ? '...' : ''),
        description: t.question, 
        question: t.question, 
        sessionId: t.sessionId, 
        status: t.status.toLowerCase(),
        priority: t.priority?.toLowerCase() || 'medium',
        assignedTo: t.assignedTo, 
        createdAt: t.createdAt,
        updatedAt: t.updatedAt || t.createdAt
      }))
    });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { userId, sessionId, question } = req.body;
    const ticket = await prisma4.ticket.create({
      data: { id: `tkt_${Date.now()}`, userId, sessionId, question }
    });
    res.status(201).json({ success: true, ticketId: ticket.id });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status, assignedTo, resolution } = req.body;
    const ticket = await prisma4.ticket.update({
      where: { id: req.params.id },
      data: { status, assignedTo, resolution }
    });
    res.json({ success: true, ticket: ticket });
  } catch (err) { next(err); }
}

module.exports = { list, create, updateStatus };
