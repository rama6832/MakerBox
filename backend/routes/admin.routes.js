const express = require('express');
const router = express.Router();
const {getUsuarios, cambiarRol} = require('../controllers/admin.controller');
const {verificarToken, soloAdmin} = require('../middlewares/auth.middleware');

router.get('/usuarios', verificarToken, soloAdmin, getUsuarios);
router.patch('/usuarios/:id/rol', verificarToken, soloAdmin, cambiarRol);

module.exports = router;
