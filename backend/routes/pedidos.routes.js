const express = require('express');
const router = express.Router();
const {
  crearPedido,
  getMisPedidos,
  getTodosPedidos,
  cambiarEstado,
} = require('../controllers/pedidos.controller');
const {verificarToken, soloAyudante} = require('../middlewares/auth.middleware');

router.post('/', verificarToken, crearPedido);
router.get('/mis-pedidos', verificarToken, getMisPedidos);
router.get('/', verificarToken, soloAyudante, getTodosPedidos);
router.patch('/:id/estado', verificarToken, soloAyudante, cambiarEstado);

module.exports = router;
