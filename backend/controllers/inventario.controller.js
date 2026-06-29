const prisma = require('../lib/prisma');
const {crearNotificacion} = require('./notificaciones.controller');

// GET /api/inventario
const getArticulos = async (req, res) => {
  try {
    const articulos = await prisma.articulo.findMany({
      orderBy: {nombre: 'asc'},
    });
    return res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// GET /api/inventario/disponibles (cualquier usuario autenticado, solo con stock > 0)
const getArticulosDisponibles = async (req, res) => {
  try {
    const articulos = await prisma.articulo.findMany({
      where: {stockActual: {gt: 0}},
      select: {id: true, nombre: true, stockActual: true, unidadMedida: true},
      orderBy: {nombre: 'asc'},
    });
    return res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos disponibles:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// POST /api/inventario
const crearArticulo = async (req, res) => {
  const {nombre, stockActual, stockMinimo, unidadMedida} = req.body;

  if (!nombre) {
    return res.status(400).json({mensaje: 'El nombre del artículo es obligatorio'});
  }

  try {
    const articulo = await prisma.articulo.create({
      data: {
        nombre,
        stockActual: stockActual ?? 0,
        stockMinimo: stockMinimo ?? 5,
        unidadMedida: unidadMedida || 'unidad',
      },
    });
    return res.status(201).json(articulo);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// PATCH /api/inventario/:id/stock
const actualizarStock = async (req, res) => {
  const {id} = req.params;
  const {stockActual} = req.body;

  if (stockActual === undefined || stockActual < 0) {
    return res.status(400).json({mensaje: 'El stock debe ser un número válido mayor o igual a 0'});
  }

  try {
    const articulo = await prisma.articulo.findUnique({where: {id}});
    if (!articulo) {
      return res.status(404).json({mensaje: 'Artículo no encontrado'});
    }

    const actualizado = await prisma.articulo.update({
      where: {id},
      data: {stockActual},
    });

    // Si el stock cruza hacia abajo del mínimo, notificar a ayudantes y admins
    const cruzaHaciaAbajo = articulo.stockActual >= articulo.stockMinimo && actualizado.stockActual < actualizado.stockMinimo;
    if (cruzaHaciaAbajo) {
      const responsables = await prisma.usuario.findMany({
        where: {rol: {in: ['AYUDANTE', 'ADMINISTRADOR']}},
        select: {id: true},
      });
      const mensaje = `Stock bajo: "${actualizado.nombre}" tiene ${actualizado.stockActual} ${actualizado.unidadMedida} (mínimo: ${actualizado.stockMinimo})`;
      await Promise.all(responsables.map(u => crearNotificacion(u.id, mensaje)));
    }

    return res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

// DELETE /api/inventario/:id
const eliminarArticulo = async (req, res) => {
  const {id} = req.params;
  try {
    const articulo = await prisma.articulo.findUnique({where: {id}});
    if (!articulo) {
      return res.status(404).json({mensaje: 'Artículo no encontrado'});
    }
    await prisma.articulo.delete({where: {id}});
    return res.json({mensaje: 'Artículo eliminado correctamente'});
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {getArticulos, getArticulosDisponibles, crearArticulo, actualizarStock, eliminarArticulo};