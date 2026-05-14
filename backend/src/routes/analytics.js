const analyticsRouter = require('express').Router();
const { summary } = require('../controllers/analyticsController');
const { authMiddleware: am3, requireRole: rr3 } = require('../middlewares/auth');

analyticsRouter.get('/summary', am3, rr3('admin','manager'), summary);
module.exports = analyticsRouter;