const { Router } = require("express");
const { body, validationResult } = require("express-validator");

const router = Router();

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:5000";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/**
 * POST /api/ai/chat
 * Forward a user message to the AI engine (Clawbot/Ollama) and return the response.
 */
router.post(
  "/chat",
  [
    body("message").trim().notEmpty().withMessage("message is required"),
    body("history").optional().isArray(),
    body("ticketId").optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { message, history = [], ticketId } = req.body;

      const response = await fetch(`${AI_ENGINE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, ticketId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(502).json({ error: "AI engine error", detail: errorBody });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
        return res.status(503).json({ error: "AI engine is unavailable" });
      }
      next(err);
    }
  }
);

/**
 * POST /api/ai/search-knowledge
 * Query the AI engine's knowledge base for relevant SOP content.
 */
router.post(
  "/search-knowledge",
  [body("query").trim().notEmpty().withMessage("query is required")],
  validate,
  async (req, res, next) => {
    try {
      const { query } = req.body;

      const response = await fetch(`${AI_ENGINE_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(502).json({ error: "AI engine error", detail: errorBody });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
        return res.status(503).json({ error: "AI engine is unavailable" });
      }
      next(err);
    }
  }
);

module.exports = router;
