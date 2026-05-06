const { Router } = require("express");
const { body, param, query, validationResult } = require("express-validator");
const prisma = require("../prismaClient");

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/knowledge-base
router.get(
  "/",
  [query("category").optional().trim(), query("q").optional().trim()],
  validate,
  async (req, res, next) => {
    try {
      const { category, q } = req.query;

      const items = await prisma.knowledgeBase.findMany({
        where: {
          ...(category ? { category } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q } },
                  { content: { contains: q } },
                  { tags: { contains: q } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/knowledge-base/:id
router.get("/:id", param("id").isUUID(), validate, async (req, res, next) => {
  try {
    const item = await prisma.knowledgeBase.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Knowledge base entry not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/knowledge-base
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("category").optional().trim(),
    body("tags").optional().trim(),
    body("filePath").optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, content, category, tags, filePath } = req.body;
      const item = await prisma.knowledgeBase.create({
        data: { title, content, category, tags, filePath },
      });
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/knowledge-base/:id
router.patch(
  "/:id",
  [
    param("id").isUUID(),
    body("title").optional().trim().notEmpty(),
    body("content").optional().trim().notEmpty(),
    body("category").optional().trim(),
    body("tags").optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, content, category, tags, filePath } = req.body;
      const item = await prisma.knowledgeBase.update({
        where: { id: req.params.id },
        data: { title, content, category, tags, filePath },
      });
      res.json(item);
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Knowledge base entry not found" });
      next(err);
    }
  }
);

// DELETE /api/knowledge-base/:id
router.delete("/:id", param("id").isUUID(), validate, async (req, res, next) => {
  try {
    await prisma.knowledgeBase.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Knowledge base entry not found" });
    next(err);
  }
});

module.exports = router;
