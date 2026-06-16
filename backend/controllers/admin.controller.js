const prisma = require('../lib/prisma');

const ROLES_VALIDOS = ['ESTUDIANTE', 'AYUDANTE', 'PROFESOR', 'ADMINISTRADOR'];

// GET /api/admin/usuarios
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        estado: true,
        creadoEn: true,
      },
      orderBy: {creadoEn: 'desc'},
    });
    return res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// PATCH /api/admin/usuarios/:id/rol
const cambiarRol = async (req, res) => {
  const {id} = req.params;
  const {rol} = req.body;

  if (!rol || !ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({mensaje: 'Rol no válido'});
  }

  try {
    const usuario = await prisma.usuario.findUnique({where: {id}});
    if (!usuario) {
      return res.status(404).json({mensaje: 'Usuario no encontrado'});
    }

    const actualizado = await prisma.usuario.update({
      where: {id},
      data: {rol},
      select: {id: true, nombre: true, email: true, rol: true},
    });

    return res.json({
      mensaje: 'Rol actualizado correctamente',
      usuario: actualizado,
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {getUsuarios, cambiarRol};
