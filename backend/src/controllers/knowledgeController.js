const prisma3 = new (require('@prisma/client').PrismaClient)();

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (category) where.category = category;
    if (search) where.OR = [
      { title:   { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
    const [total, data] = await Promise.all([
      prisma3.knowledgeBase.count({ where }),
      prisma3.knowledgeBase.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } })
    ]);
    res.json({ success: true, total, page: parseInt(page), limit: parseInt(limit), articles: data });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const kb = await prisma3.knowledgeBase.findUnique({ where: { id: req.params.id } });
    if (!kb) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, article: kb });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title, category, subcategory, content, tags, sourceDocument } = req.body;
    const newId = `kb_${Date.now()}`;
    const kb = await prisma3.knowledgeBase.create({
      data: { id: newId, title, category, subcategory, content, tags: tags || [], sourceDoc: sourceDocument }
    });
    res.status(201).json({ success: true, id: kb.id, message: 'Knowledge entry created and indexed successfully' });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const kb = await prisma3.knowledgeBase.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, article: kb });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma3.knowledgeBase.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
