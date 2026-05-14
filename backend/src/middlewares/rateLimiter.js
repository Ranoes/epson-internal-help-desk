const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: 'Too many requests, slow down.' })
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: 'Chat rate limit exceeded.' })
});

module.exports = { globalLimiter, chatLimiter };