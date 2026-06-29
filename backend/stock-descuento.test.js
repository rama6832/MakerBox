// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  proyecto: {findUnique: jest.fn()},
  cursoEstudiante: {findUnique: jest.fn()},
  pedido: {create: jest.fn()},
  articulo: {findFirst: jest.fn(), update: jest.fn()},
  usuario: {findMany: jest.fn()},
  notificacion: {create: jest.fn()},
}));

const prisma = require('./lib/prisma');
const {crearPedido} = require('./controllers/pedidos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('crearPedido - descuento automático de stock', () => {
  beforeEach(() => jest.clearAllMocks());

  test('descuenta 1 unidad del material si existe en inventario', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA Blanco', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.pedido.create.mockResolvedValue({id: 'ped-1', proyecto: {titulo: 'Robot'}, curso: null});
    prisma.articulo.findFirst.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco', stockActual: 10, stockMinimo: 5, unidadMedida: 'unidad'});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco', stockActual: 9, stockMinimo: 5, unidadMedida: 'unidad'});

    await crearPedido(req, res);

    expect(prisma.articulo.update).toHaveBeenCalledWith(
      expect.objectContaining({where: {id: 'a1'}, data: {stockActual: 9}}),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('no descuenta stock si el material no existe en inventario (Otro)', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'Madera reciclada', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.pedido.create.mockResolvedValue({id: 'ped-1', proyecto: {titulo: 'Robot'}, curso: null});
    prisma.articulo.findFirst.mockResolvedValue(null);

    await crearPedido(req, res);

    expect(prisma.articulo.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('crea notificación cuando el descuento cruza el stock mínimo', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA Blanco', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.pedido.create.mockResolvedValue({id: 'ped-1', proyecto: {titulo: 'Robot'}, curso: null});
    prisma.articulo.findFirst.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco', stockActual: 5, stockMinimo: 5, unidadMedida: 'unidad'});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco', stockActual: 4, stockMinimo: 5, unidadMedida: 'unidad'});
    prisma.usuario.findMany.mockResolvedValue([{id: 'ayudante-1'}]);
    prisma.notificacion.create.mockResolvedValue({});

    await crearPedido(req, res);

    expect(prisma.notificacion.create).toHaveBeenCalled();
  });

  test('no descuenta si el artículo ya tiene stock 0', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA Blanco', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.pedido.create.mockResolvedValue({id: 'ped-1', proyecto: {titulo: 'Robot'}, curso: null});
    prisma.articulo.findFirst.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco', stockActual: 0, stockMinimo: 5});

    await crearPedido(req, res);

    expect(prisma.articulo.update).not.toHaveBeenCalled();
  });

  test('valida que el estudiante esté inscrito si se especifica curso', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA', archivoStl: 'modelo.stl', cursoId: 'curso-1'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.cursoEstudiante.findUnique.mockResolvedValue(null);

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'No estás inscrito en ese curso'}),
    );
  });
});
