const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const kbRouter = require('express').Router();
const kbCtrl   = require('../controllers/knowledgeController');
const { authMiddleware: am, requireRole: rr } = require('../middlewares/auth');

const kbSchema = Joi.object({
  title:          Joi.string().required(),
  category:       Joi.string().valid('quality_printing','hardware','firmware','general_ops').required(),
  subcategory:    Joi.string().optional(),
  content:        Joi.string().required(),
  tags:           Joi.array().items(Joi.string()).optional(),
  sourceDocument: Joi.string().optional()
});

kbRouter.get('/',      am, kbCtrl.list);
kbRouter.get('/:id',   am, kbCtrl.getOne);
kbRouter.post('/',     am, rr('admin'), validate(kbSchema), kbCtrl.create);
kbRouter.put('/:id',   am, rr('admin'), kbCtrl.update);
kbRouter.delete('/:id',am, rr('admin'), kbCtrl.remove);
module.exports = kbRouter;
