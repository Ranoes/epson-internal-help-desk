const prisma3 = new (require('@prisma/client').PrismaClient)();
const axios = require('axios');
const { readSettings } = require('../services/runtimeSettings');
const { convertPdfBufferToMarkdown } = require('../services/pdfToMarkdown');

async function refreshKnowledgeIndex() {
  const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  const runtimeSettings = await readSettings();
  const aiProvider = runtimeSettings.aiProvider || 'ollama';
  try {
    await axios.post(`${aiEngineUrl}/reload-knowledge`, { provider: aiProvider });
  } catch (err) {
    console.warn('[KB] Failed to refresh ai-engine knowledge index:', err.message);
  }
}

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof rawTags === 'string') {
    const trimmed = rawTags.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch (err) {
      // Fall through to comma-separated parsing.
    }

    return trimmed
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

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
    const { title, category, subcategory, content, sourceDocument } = req.body;
    const newId = `kb_${Date.now()}`;
    const uploadedPdf = req.file;

    if (!title || !category) {
      return res.status(400).json({ success: false, error: 'Title and category are required.' });
    }

    let finalContent = typeof content === 'string' ? content.trim() : '';
    let sourceDoc = typeof sourceDocument === 'string' ? sourceDocument.trim() : '';

    if (uploadedPdf) {
      finalContent = await convertPdfBufferToMarkdown(uploadedPdf.buffer, uploadedPdf.originalname);
      sourceDoc = sourceDoc || uploadedPdf.originalname;
    }

    if (!finalContent) {
      return res.status(400).json({
        success: false,
        error: 'Content is required when no PDF file is uploaded.'
      });
    }

    const kb = await prisma3.knowledgeBase.create({
      data: {
        id: newId,
        title: title.trim(),
        category,
        subcategory: typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim() : null,
        content: finalContent,
        tags: normalizeTags(req.body.tags),
        sourceDoc: sourceDoc || null
      }
    });
    await refreshKnowledgeIndex();
    res.status(201).json({
      success: true,
      id: kb.id,
      article: kb,
      message: 'Knowledge entry created and indexed successfully'
    });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const kb = await prisma3.knowledgeBase.update({ where: { id: req.params.id }, data: req.body });
    await refreshKnowledgeIndex();
    res.json({ success: true, article: kb });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma3.knowledgeBase.delete({ where: { id: req.params.id } });
    await refreshKnowledgeIndex();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
