const express = require('express');
const router = express.Router();
const multer = require('multer');
const {subirArchivo} = require('../controllers/archivos.controller');
const {verificarToken} = require('../middlewares/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 50 * 1024 * 1024}, // 50MB máximo
  fileFilter: (req, file, cb) => {
    const extensionesPermitidas = ['.stl', '.obj', '.3mf'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (extensionesPermitidas.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .stl, .obj o .3mf'));
    }
  },
});

router.post('/stl', verificarToken, upload.single('archivo'), subirArchivo);

module.exports = router;
