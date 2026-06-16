const prisma = require('../lib/prisma');

const ESTADOS_VALIDOS = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_PROCESO', 'FINALIZADO'];

// POST /api/pedidos
const crearPedido = async (req, res) => {
  const {proyectoId, material, color, calidad, archivoStl, comentario} = req.body;
  const usuarioId = req.usuario.id;

  if (!proyectoId || !material || !archivoStl) {
    return res.status(400).json({mensaje: 'Proyecto, material y archivo STL son obligatorios'});
  }

  try {
    const proyecto = await prisma.proyecto.findUnique({where: {id: proyectoId}});
    if (!proyecto) {
      return res.status(404).json({mensaje: 'Proyecto no encontrado'});
    }
    if (proyecto.autorId !== usuarioId) {
      return res.status(403).json({mensaje: 'No puedes crear pedidos en proyectos de otros usuarios'});
    }

    const pedido = await prisma.pedido.create({
      data: {proyectoId, usuarioId, material, color, calidad, archivoStl, comentario},
      include: {proyecto: {select: {titulo: true}}},
    });
    return res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/pedidos/mis-pedidos
const getMisPedidos = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {usuarioId},
      include: {proyecto: {select: {titulo: true}}},
      orderBy: {creadoEn: 'desc'},
    });
    return res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/pedidos (solo ayudante)
const getTodosPedidos = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        proyecto: {select: {titulo: true}},
        usuario: {select: {nombre: true, apellido: true, email: true}},
      },
      orderBy: {creadoEn: 'desc'},
    });
    return res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// PATCH /api/pedidos/:id/estado (solo ayudante)
const cambiarEstado = async (req, res) => {
  const {id} = req.params;
  const {estado, observacionAyudante, motivoRechazo} = req.body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({mensaje: 'Estado no válido'});
  }

  try {
    const pedido = await prisma.pedido.findUnique({where: {id}});
    if (!pedido) {
      return res.status(404).json({mensaje: 'Pedido no encontrado'});
    }

    const actualizado = await prisma.pedido.update({
      where: {id},
      data: {
        estado,
        observacionAyudante: observacionAyudante || pedido.observacionAyudante,
        motivoRechazo: estado === 'RECHAZADO' ? motivoRechazo : null,
      },
      include: {
        usuario: {select: {nombre: true, email: true}},
        proyecto: {select: {titulo: true}},
      },
    });

    return res.json({
      mensaje: 'Estado actualizado correctamente',
      pedido: actualizado,
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {crearPedido, getMisPedidos, getTodosPedidos, cambiarEstado};
