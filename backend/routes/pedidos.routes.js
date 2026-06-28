const express = require('express');
const router = express.Router();
const {
  crearPedido,
  getMisPedidos,
  getTodosPedidos,
  getPedidosPorCurso,
  getPedidosFinalizados,
  cambiarEstado,
} = require('../controllers/pedidos.controller');
const {verificarToken, soloAyudante, soloProfesor} = require('../middlewares/auth.middleware');

router.post('/', verificarToken, crearPedido);
router.get('/mis-pedidos', verificarToken, getMisPedidos);
router.get('/finalizados', verificarToken, getPedidosFinalizados);
router.get('/curso/:cursoId', verificarToken, soloProfesor, getPedidosPorCurso);
router.get('/', verificarToken, soloAyudante, getTodosPedidos);
router.patch('/:id/estado', verificarToken, soloAyudante, cambiarEstado);

module.exports = router;