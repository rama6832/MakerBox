const express = require('express');
const router = express.Router();
const {
  getArticulos,
  getArticulosDisponibles,
  crearArticulo,
  actualizarStock,
  eliminarArticulo,
} = require('../controllers/inventario.controller');
const {verificarToken, soloAyudante} = require('../middlewares/auth.middleware');

router.get('/disponibles', verificarToken, getArticulosDisponibles);
router.get('/', verificarToken, soloAyudante, getArticulos);
router.post('/', verificarToken, soloAyudante, crearArticulo);
router.patch('/:id/stock', verificarToken, soloAyudante, actualizarStock);
router.delete('/:id', verificarToken, soloAyudante, eliminarArticulo);

module.exports = router;