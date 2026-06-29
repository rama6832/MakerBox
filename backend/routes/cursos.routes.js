const express = require('express');
const router = express.Router();
const {
  crearCurso,
  getMisCursos,
  getMisCursosEstudiante,
  getEstudiantesDisponibles,
  agregarEstudiante,
  eliminarEstudiante,
  crearGrupo,
  eliminarGrupo,
  asignarEstudianteAGrupo,
  quitarEstudianteDeGrupo,
  cargarEstudiantesCSV,
} = require('../controllers/cursos.controller');
const {verificarToken, soloProfesor} = require('../middlewares/auth.middleware');

router.post('/', verificarToken, soloProfesor, crearCurso);
router.get('/mis-cursos', verificarToken, soloProfesor, getMisCursos);
router.get('/mis-cursos-estudiante', verificarToken, getMisCursosEstudiante);
router.get('/estudiantes-disponibles', verificarToken, soloProfesor, getEstudiantesDisponibles);

router.post('/:id/estudiantes', verificarToken, soloProfesor, agregarEstudiante);
router.delete('/:id/estudiantes/:estudianteId', verificarToken, soloProfesor, eliminarEstudiante);
router.post('/:id/estudiantes-csv', verificarToken, soloProfesor, cargarEstudiantesCSV);

router.post('/:id/grupos', verificarToken, soloProfesor, crearGrupo);
router.delete('/:id/grupos/:grupoId', verificarToken, soloProfesor, eliminarGrupo);
router.post('/:id/grupos/:grupoId/estudiantes', verificarToken, soloProfesor, asignarEstudianteAGrupo);
router.delete('/:id/grupos/:grupoId/estudiantes/:estudianteId', verificarToken, soloProfesor, quitarEstudianteDeGrupo);

module.exports = router;