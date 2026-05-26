const authRouter = require('express').Router();
const { login, register }  = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  department: Joi.string().optional(),
  role: Joi.string().valid('user', 'admin', 'manager').optional()
});

authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/register', validate(registerSchema), register);

module.exports = authRouter;
