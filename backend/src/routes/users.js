const { Router } = require("express");
const { body, param, validationResult } = require("express-validator");
const prisma = require("../prismaClient");

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/users
router.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get("/:id", param("id").isUUID(), validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { tickets: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("role").optional().isIn(["ADMIN", "AGENT", "USER"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, role } = req.body;
      const user = await prisma.user.create({ data: { name, email, role } });
      res.status(201).json(user);
    } catch (err) {
      if (err.code === "P2002") return res.status(409).json({ error: "Email already exists" });
      next(err);
    }
  }
);

// PATCH /api/users/:id
router.patch(
  "/:id",
  [
    param("id").isUUID(),
    body("name").optional().trim().notEmpty(),
    body("email").optional().isEmail(),
    body("role").optional().isIn(["ADMIN", "AGENT", "USER"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, role } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { name, email, role },
      });
      res.json(user);
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "User not found" });
      next(err);
    }
  }
);

module.exports = router;
