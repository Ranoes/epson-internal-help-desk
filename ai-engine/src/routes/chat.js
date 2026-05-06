const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const { chat } = require("../ollamaClient");
const { buildSystemPrompt } = require("../clawbot");

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/**
 * POST /chat
 * Body: { message: string, history?: {role, content}[], ticketId?: string }
 */
router.post(
  "/",
  [
    body("message").trim().notEmpty().withMessage("message is required"),
    body("history").optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;
      const systemPrompt = buildSystemPrompt(message);
      const reply = await chat(systemPrompt, history, message);
      res.json({ reply });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
