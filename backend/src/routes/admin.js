const adminRouter = require('express').Router();
const { authMiddleware: am, requireRole: rr } = require('../middlewares/auth');
const { getAiSettings, updateAiSettings } = require('../controllers/adminController');

adminRouter.get('/settings/ai', am, rr('admin'), getAiSettings);
adminRouter.put('/settings/ai', am, rr('admin'), updateAiSettings);

module.exports = adminRouter;