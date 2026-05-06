const { Router } = require("express");
const { body, param, validationResult } = require("express-validator");
const prisma = require("../prismaClient");

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/tickets
router.get("/", async (_req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { user: true, messages: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id
router.get("/:id", param("id").isUUID(), validate, async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { user: true, messages: true },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("userId").isUUID().withMessage("Valid userId is required"),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    body("category").optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, userId, priority, category } = req.body;
      const ticket = await prisma.ticket.create({
        data: { title, description, userId, priority, category },
        include: { user: true },
      });
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/tickets/:id
router.patch(
  "/:id",
  [
    param("id").isUUID(),
    body("status").optional().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, status, priority, category } = req.body;
      const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: { title, description, status, priority, category },
        include: { user: true },
      });
      res.json(ticket);
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Ticket not found" });
      next(err);
    }
  }
);

// DELETE /api/tickets/:id
router.delete("/:id", param("id").isUUID(), validate, async (req, res, next) => {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Ticket not found" });
    next(err);
  }
});

// POST /api/tickets/:id/messages
router.post(
  "/:id/messages",
  [
    param("id").isUUID(),
    body("content").trim().notEmpty().withMessage("Message content is required"),
    body("role").optional().isIn(["USER", "ASSISTANT", "SYSTEM"]),
    body("userId").optional().isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { content, role, userId } = req.body;
      const message = await prisma.message.create({
        data: { content, role: role || "USER", ticketId: req.params.id, userId },
      });
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
