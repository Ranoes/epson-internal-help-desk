const authRouter = require('express').Router();
const { login }  = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string().min(6).required()
});

authRouter.post('/login', validate(loginSchema), login);
module.exports = authRouter;
