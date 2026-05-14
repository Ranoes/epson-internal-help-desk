const ticketRouter = require('express').Router();
const ticketCtrl   = require('../controllers/ticketsController');
const { authMiddleware: am2, requireRole: rr2 } = require('../middlewares/auth');

ticketRouter.get('/',              am2, ticketCtrl.list);
ticketRouter.post('/',             am2, ticketCtrl.create);
ticketRouter.patch('/:id/status',  am2, rr2('admin','manager'), ticketCtrl.updateStatus);
module.exports = ticketRouter;
