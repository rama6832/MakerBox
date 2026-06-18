const prisma = require('../lib/prisma');

// POST /api/cursos
const crearCurso = async (req, res) => {
  const {nombre, descripcion, semestre} = req.body;
  const profesorId = req.usuario.id;

  if (!nombre || !semestre) {
    return res.status(400).json({mensaje: 'Nombre y semestre son obligatorios'});
  }

  try {
    const curso = await prisma.curso.create({
      data: {nombre, descripcion, semestre, profesorId},
    });
    return res.status(201).json(curso);
  } catch (error) {
    console.error('Error al crear curso:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/cursos/mis-cursos
const getMisCursos = async (req, res) => {
  const profesorId = req.usuario.id;
  try {
    const cursos = await prisma.curso.findMany({
      where: {profesorId},
      include: {
        estudiantes: {
          include: {
            estudiante: {
              select: {id: true, nombre: true, apellido: true, email: true},
            },
          },
        },
      },
      orderBy: {creadoEn: 'desc'},
    });
    return res.json(cursos);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/cursos/estudiantes-disponibles
const getEstudiantesDisponibles = async (req, res) => {
  try {
    const estudiantes = await prisma.usuario.findMany({
      where: {rol: 'ESTUDIANTE', estado: true},
      select: {id: true, nombre: true, apellido: true, email: true},
      orderBy: {nombre: 'asc'},
    });
    return res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// POST /api/cursos/:id/estudiantes
const agregarEstudiante = async (req, res) => {
  const {id: cursoId} = req.params;
  const {estudianteId} = req.body;
  const profesorId = req.usuario.id;

  if (!estudianteId) {
    return res.status(400).json({mensaje: 'El ID del estudiante es obligatorio'});
  }

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    const relacion = await prisma.cursoEstudiante.create({
      data: {cursoId, estudianteId},
      include: {
        estudiante: {select: {id: true, nombre: true, apellido: true, email: true}},
      },
    });
    return res.status(201).json(relacion);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({mensaje: 'El estudiante ya está en este curso'});
    }
    console.error('Error al agregar estudiante:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// DELETE /api/cursos/:id/estudiantes/:estudianteId
const eliminarEstudiante = async (req, res) => {
  const {id: cursoId, estudianteId} = req.params;
  const profesorId = req.usuario.id;

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    await prisma.cursoEstudiante.deleteMany({
      where: {cursoId, estudianteId},
    });
    return res.json({mensaje: 'Estudiante eliminado del curso'});
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {crearCurso, getMisCursos, getEstudiantesDisponibles, agregarEstudiante, eliminarEstudiante};
