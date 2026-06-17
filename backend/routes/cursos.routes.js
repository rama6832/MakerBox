const express = require('express');
const router = express.Router();
const {
  crearCurso,
  getMisCursos,
  getEstudiantesDisponibles,
  agregarEstudiante,
  eliminarEstudiante,
} = require('../controllers/cursos.controller');
const {verificarToken, soloProfesor} = require('../middlewares/auth.middleware');

router.post('/', verificarToken, soloProfesor, crearCurso);
router.get('/mis-cursos', verificarToken, soloProfesor, getMisCursos);
router.get('/estudiantes-disponibles', verificarToken, soloProfesor, getEstudiantesDisponibles);
router.post('/:id/estudiantes', verificarToken, soloProfesor, agregarEstudiante);
router.delete('/:id/estudiantes/:estudianteId', verificarToken, soloProfesor, eliminarEstudiante);

module.exports = router;
