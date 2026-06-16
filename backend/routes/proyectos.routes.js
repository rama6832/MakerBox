const express = require('express');
const router = express.Router();
const {crearProyecto, getMisProyectos} = require('../controllers/proyectos.controller');
const {verificarToken} = require('../middlewares/auth.middleware');

router.post('/', verificarToken, crearProyecto);
router.get('/mis-proyectos', verificarToken, getMisProyectos);

module.exports = router;
