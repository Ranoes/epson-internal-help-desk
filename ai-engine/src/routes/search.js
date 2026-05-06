const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const { search } = require("../clawbot");

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/**
 * POST /search
 * Body: { query: string, topK?: number }
 */
router.post(
  "/",
  [body("query").trim().notEmpty().withMessage("query is required")],
  validate,
  async (req, res, next) => {
    try {
      const { query, topK } = req.body;
      const results = search(query, topK);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
