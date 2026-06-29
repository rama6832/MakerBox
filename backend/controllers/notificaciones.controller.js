const prisma = require('../lib/prisma');

// GET /api/notificaciones
const getMisNotificaciones = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: {usuarioId},
      orderBy: {creadoEn: 'desc'},
      take: 30,
    });
    const noLeidas = await prisma.notificacion.count({
      where: {usuarioId, leida: false},
    });
    return res.json({notificaciones, noLeidas});
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// PATCH /api/notificaciones/:id/leida
const marcarLeida = async (req, res) => {
  const {id} = req.params;
  const usuarioId = req.usuario.id;
  try {
    const notificacion = await prisma.notificacion.findUnique({where: {id}});
    if (!notificacion || notificacion.usuarioId !== usuarioId) {
      return res.status(404).json({mensaje: 'Notificación no encontrada'});
    }
    await prisma.notificacion.update({where: {id}, data: {leida: true}});
    return res.json({mensaje: 'Notificación marcada como leída'});
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// PATCH /api/notificaciones/marcar-todas
const marcarTodasLeidas = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    await prisma.notificacion.updateMany({
      where: {usuarioId, leida: false},
      data: {leida: true},
    });
    return res.json({mensaje: 'Todas las notificaciones marcadas como leídas'});
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// Helper interno para crear notificaciones desde otros controllers
const crearNotificacion = async (usuarioId, mensaje) => {
  try {
    await prisma.notificacion.create({data: {usuarioId, mensaje}});
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

module.exports = {getMisNotificaciones, marcarLeida, marcarTodasLeidas, crearNotificacion};
