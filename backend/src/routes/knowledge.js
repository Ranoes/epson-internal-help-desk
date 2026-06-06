const Joi = require('joi');
const multer = require('multer');
const { validate } = require('../middlewares/validate');
const kbRouter = require('express').Router();
const kbCtrl   = require('../controllers/knowledgeController');
const { authMiddleware: am, requireRole: rr } = require('../middlewares/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Only PDF files are supported for knowledge-base uploads.'));
    }
    cb(null, true);
  }
});

const kbSchema = Joi.object({
  title:          Joi.string().required(),
  category:       Joi.string().valid(
                    'manufacturing',
                    'production_line',
                    'quality_control',
                    'equipment_setup',
                    'safety',
                    'logistics'
                  ).required(),
  subcategory:    Joi.string().optional(),
  content:        Joi.string().allow('').optional(),
  tags:           Joi.alternatives().try(
                    Joi.array().items(Joi.string()),
                    Joi.string().allow('')
                  ).optional(),
  sourceDocument: Joi.string().optional()
});

kbRouter.get('/',      am, kbCtrl.list);
kbRouter.get('/:id',   am, kbCtrl.getOne);
kbRouter.post('/',     am, rr('admin'), upload.single('pdf'), validate(kbSchema), kbCtrl.create);
kbRouter.put('/:id',   am, rr('admin'), kbCtrl.update);
kbRouter.delete('/:id',am, rr('admin'), kbCtrl.remove);
module.exports = kbRouter;
