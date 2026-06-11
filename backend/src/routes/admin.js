const adminRouter = require('express').Router();
const { authMiddleware: am, requireRole: rr } = require('../middlewares/auth');
const { getAiSettings, updateAiSettings, getUsers, deleteUser } = require('../controllers/adminController');

adminRouter.get('/settings/ai', am, rr('admin'), getAiSettings);
adminRouter.put('/settings/ai', am, rr('admin'), updateAiSettings);
adminRouter.get('/users', am, rr('admin'), getUsers);
adminRouter.delete('/users/:userId', am, rr('admin'), deleteUser);

module.exports = adminRouter;