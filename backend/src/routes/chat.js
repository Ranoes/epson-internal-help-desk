const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const chatRouter = require('express').Router();
const { sendMessage, getHistory, listSessions } = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/auth');
const { chatLimiter }    = require('../middlewares/rateLimiter');

const msgSchema = Joi.object({
  sessionId:   Joi.string().required(),
  userId:      Joi.string().optional(),
  message:     Joi.string().min(1).max(2000).required(),
  imageBase64: Joi.string().allow(null, '').optional()
});

chatRouter.post('/message',        authMiddleware, chatLimiter, validate(msgSchema), sendMessage);
chatRouter.get('/sessions',        authMiddleware, listSessions);
chatRouter.get('/history/:sessionId', authMiddleware, getHistory);
module.exports = chatRouter;
