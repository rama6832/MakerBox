const prisma = require('../lib/prisma');

// POST /api/proyectos
const crearProyecto = async (req, res) => {
  const {titulo, descripcion, categoria} = req.body;
  const autorId = req.usuario.id;

  if (!titulo || !descripcion || !categoria) {
    return res.status(400).json({mensaje: 'Todos los campos son obligatorios'});
  }

  try {
    const proyecto = await prisma.proyecto.create({
      data: {titulo, descripcion, categoria, autorId},
    });
    return res.status(201).json(proyecto);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/proyectos/mis-proyectos
const getMisProyectos = async (req, res) => {
  const autorId = req.usuario.id;
  try {
    const proyectos = await prisma.proyecto.findMany({
      where: {autorId},
      orderBy: {creadoEn: 'desc'},
    });
    return res.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {crearProyecto, getMisProyectos};
