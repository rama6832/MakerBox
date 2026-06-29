const express = require('express');
const router = express.Router();
const {getMisNotificaciones, marcarLeida, marcarTodasLeidas} = require('../controllers/notificaciones.controller');
const {verificarToken} = require('../middlewares/auth.middleware');

router.get('/', verificarToken, getMisNotificaciones);
router.patch('/:id/leida', verificarToken, marcarLeida);
router.patch('/marcar-todas', verificarToken, marcarTodasLeidas);

module.exports = router;
