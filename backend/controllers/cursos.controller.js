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

// GET /api/cursos/mis-cursos (profesor)
const getMisCursos = async (req, res) => {
  const profesorId = req.usuario.id;
  try {
    const cursos = await prisma.curso.findMany({
      where: {profesorId},
      include: {
        estudiantes: {
          include: {
            estudiante: {select: {id: true, nombre: true, apellido: true, email: true}},
          },
        },
        grupos: {
          include: {
            estudiantes: {
              include: {estudiante: {select: {id: true, nombre: true, apellido: true, email: true}}},
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

// GET /api/cursos/mis-cursos-estudiante (estudiante)
const getMisCursosEstudiante = async (req, res) => {
  const estudianteId = req.usuario.id;
  try {
    const inscripciones = await prisma.cursoEstudiante.findMany({
      where: {estudianteId},
      include: {
        curso: {
          select: {
            id: true, nombre: true, semestre: true,
            grupos: {
              include: {
                estudiantes: {where: {estudianteId}, select: {grupoId: true}},
              },
            },
          },
        },
      },
    });

    const cursos = inscripciones.map(insc => {
      const grupoPropio = insc.curso.grupos.find(g => g.estudiantes.length > 0);
      return {
        id: insc.curso.id,
        nombre: insc.curso.nombre,
        semestre: insc.curso.semestre,
        grupo: grupoPropio ? {id: grupoPropio.id, nombre: grupoPropio.nombre} : null,
      };
    });

    return res.json(cursos);
  } catch (error) {
    console.error('Error al obtener cursos del estudiante:', error);
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

    await prisma.cursoEstudiante.deleteMany({where: {cursoId, estudianteId}});
    return res.json({mensaje: 'Estudiante eliminado del curso'});
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// POST /api/cursos/:id/grupos
const crearGrupo = async (req, res) => {
  const {id: cursoId} = req.params;
  const {nombre} = req.body;
  const profesorId = req.usuario.id;

  if (!nombre) {
    return res.status(400).json({mensaje: 'El nombre del grupo es obligatorio'});
  }

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    const grupo = await prisma.grupo.create({
      data: {nombre, cursoId},
    });
    return res.status(201).json({...grupo, estudiantes: []});
  } catch (error) {
    console.error('Error al crear grupo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// DELETE /api/cursos/:id/grupos/:grupoId
const eliminarGrupo = async (req, res) => {
  const {id: cursoId, grupoId} = req.params;
  const profesorId = req.usuario.id;

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    await prisma.grupoEstudiante.deleteMany({where: {grupoId}});
    await prisma.grupo.delete({where: {id: grupoId}});
    return res.json({mensaje: 'Grupo eliminado correctamente'});
  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// POST /api/cursos/:id/grupos/:grupoId/estudiantes
const asignarEstudianteAGrupo = async (req, res) => {
  const {id: cursoId, grupoId} = req.params;
  const {estudianteId} = req.body;
  const profesorId = req.usuario.id;

  if (!estudianteId) {
    return res.status(400).json({mensaje: 'El ID del estudiante es obligatorio'});
  }

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    const inscrito = await prisma.cursoEstudiante.findUnique({
      where: {cursoId_estudianteId: {cursoId, estudianteId}},
    });
    if (!inscrito) {
      return res.status(400).json({mensaje: 'El estudiante debe estar inscrito en el curso primero'});
    }

    // Quitar de cualquier otro grupo del mismo curso antes de asignar
    const gruposDelCurso = await prisma.grupo.findMany({where: {cursoId}, select: {id: true}});
    await prisma.grupoEstudiante.deleteMany({
      where: {estudianteId, grupoId: {in: gruposDelCurso.map(g => g.id)}},
    });

    const relacion = await prisma.grupoEstudiante.create({
      data: {grupoId, estudianteId},
      include: {estudiante: {select: {id: true, nombre: true, apellido: true, email: true}}},
    });
    return res.status(201).json(relacion);
  } catch (error) {
    console.error('Error al asignar estudiante a grupo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// DELETE /api/cursos/:id/grupos/:grupoId/estudiantes/:estudianteId
const quitarEstudianteDeGrupo = async (req, res) => {
  const {id: cursoId, grupoId, estudianteId} = req.params;
  const profesorId = req.usuario.id;

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    await prisma.grupoEstudiante.deleteMany({where: {grupoId, estudianteId}});
    return res.json({mensaje: 'Estudiante quitado del grupo'});
  } catch (error) {
    console.error('Error al quitar estudiante de grupo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// POST /api/cursos/:id/estudiantes-csv
const cargarEstudiantesCSV = async (req, res) => {
  const {id: cursoId} = req.params;
  const {estudiantes} = req.body; // [{nombre, apellido, email}, ...]
  const profesorId = req.usuario.id;

  if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
    return res.status(400).json({mensaje: 'Debes enviar al menos un estudiante'});
  }

  try {
    const curso = await prisma.curso.findUnique({where: {id: cursoId}});
    if (!curso) return res.status(404).json({mensaje: 'Curso no encontrado'});
    if (curso.profesorId !== profesorId) return res.status(403).json({mensaje: 'Acceso denegado'});

    const bcrypt = require('bcrypt');
    const resultados = {agregados: 0, creados: 0, errores: []};

    for (const fila of estudiantes) {
      const {nombre, apellido, email} = fila;
      if (!nombre || !apellido || !email) {
        resultados.errores.push(`Fila inválida: ${JSON.stringify(fila)}`);
        continue;
      }

      try {
        let usuario = await prisma.usuario.findUnique({where: {email}});

        if (!usuario) {
          const hash = await bcrypt.hash('1234', 10);
          usuario = await prisma.usuario.create({
            data: {nombre, apellido, email, password: hash, rol: 'ESTUDIANTE'},
          });
          resultados.creados++;
        }

        await prisma.cursoEstudiante.upsert({
          where: {cursoId_estudianteId: {cursoId, estudianteId: usuario.id}},
          create: {cursoId, estudianteId: usuario.id},
          update: {},
        });
        resultados.agregados++;
      } catch (err) {
        resultados.errores.push(`Error con ${email}: ${err.message}`);
      }
    }

    return res.status(201).json({mensaje: 'Carga procesada', resultados});
  } catch (error) {
    console.error('Error al cargar CSV:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {
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
};