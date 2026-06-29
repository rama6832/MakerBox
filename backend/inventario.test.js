// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  articulo: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
  notificacion: {
    create: jest.fn(),
  },
}));

const prisma = require('./lib/prisma');
const {
  getArticulos,
  getArticulosDisponibles,
  crearArticulo,
  actualizarStock,
  eliminarArticulo,
} = require('./controllers/inventario.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── getArticulos ───────────────────────────────────────────────────────────────

describe('getArticulos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna la lista de artículos', async () => {
    const req = {};
    const res = mockRes();

    prisma.articulo.findMany.mockResolvedValue([
      {id: 'a1', nombre: 'PLA Blanco', stockActual: 10, stockMinimo: 5},
    ]);

    await getArticulos(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({nombre: 'PLA Blanco'}),
    ]));
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {};
    const res = mockRes();

    prisma.articulo.findMany.mockRejectedValue(new Error('DB error'));

    await getArticulos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getArticulosDisponibles ────────────────────────────────────────────────────

describe('getArticulosDisponibles', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna solo artículos con stock mayor a 0', async () => {
    const req = {};
    const res = mockRes();

    prisma.articulo.findMany.mockResolvedValue([
      {id: 'a1', nombre: 'PLA Blanco', stockActual: 10, unidadMedida: 'unidad'},
    ]);

    await getArticulosDisponibles(req, res);

    expect(prisma.articulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {stockActual: {gt: 0}}}),
    );
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({nombre: 'PLA Blanco'}),
    ]));
  });
});

// ─── crearArticulo ──────────────────────────────────────────────────────────────

describe('crearArticulo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un artículo correctamente y retorna 201', async () => {
    const req = {body: {nombre: 'PLA Blanco', stockActual: 10, stockMinimo: 5, unidadMedida: 'unidad'}};
    const res = mockRes();

    prisma.articulo.create.mockResolvedValue({id: 'a1', nombre: 'PLA Blanco'});

    await crearArticulo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('retorna 400 si falta el nombre', async () => {
    const req = {body: {stockActual: 10}};
    const res = mockRes();

    await crearArticulo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'El nombre del artículo es obligatorio'}),
    );
  });

  test('usa valores por defecto si no se especifican stock', async () => {
    const req = {body: {nombre: 'Resina'}};
    const res = mockRes();

    prisma.articulo.create.mockResolvedValue({id: 'a1', nombre: 'Resina'});

    await crearArticulo(req, res);

    expect(prisma.articulo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({stockActual: 0, stockMinimo: 5, unidadMedida: 'unidad'}),
      }),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {body: {nombre: 'PLA Blanco'}};
    const res = mockRes();

    prisma.articulo.create.mockRejectedValue(new Error('DB error'));

    await crearArticulo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── actualizarStock ────────────────────────────────────────────────────────────

describe('actualizarStock', () => {
  beforeEach(() => jest.clearAllMocks());

  test('actualiza el stock correctamente sin cruzar el mínimo', async () => {
    const req = {params: {id: 'a1'}, body: {stockActual: 8}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 10, stockMinimo: 5});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 8, stockMinimo: 5, unidadMedida: 'unidad'});

    await actualizarStock(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({stockActual: 8}));
    expect(prisma.notificacion.create).not.toHaveBeenCalled();
  });

  test('crea notificación cuando el stock cruza hacia abajo del mínimo', async () => {
    const req = {params: {id: 'a1'}, body: {stockActual: 3}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 10, stockMinimo: 5});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 3, stockMinimo: 5, unidadMedida: 'unidad'});
    prisma.usuario.findMany.mockResolvedValue([{id: 'ayudante-1'}, {id: 'admin-1'}]);
    prisma.notificacion.create.mockResolvedValue({});

    await actualizarStock(req, res);

    expect(prisma.notificacion.create).toHaveBeenCalledTimes(2);
  });

  test('no crea notificación si ya estaba bajo el mínimo (no cruza)', async () => {
    const req = {params: {id: 'a1'}, body: {stockActual: 2}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 3, stockMinimo: 5});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 2, stockMinimo: 5, unidadMedida: 'unidad'});

    await actualizarStock(req, res);

    expect(prisma.notificacion.create).not.toHaveBeenCalled();
  });

  test('retorna 400 si el stock es negativo', async () => {
    const req = {params: {id: 'a1'}, body: {stockActual: -1}};
    const res = mockRes();

    await actualizarStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 400 si no se envía stockActual', async () => {
    const req = {params: {id: 'a1'}, body: {}};
    const res = mockRes();

    await actualizarStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 404 si el artículo no existe', async () => {
    const req = {params: {id: 'a999'}, body: {stockActual: 5}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue(null);

    await actualizarStock(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {params: {id: 'a1'}, body: {stockActual: 5}};
    const res = mockRes();

    prisma.articulo.findUnique.mockRejectedValue(new Error('DB error'));

    await actualizarStock(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── eliminarArticulo ───────────────────────────────────────────────────────────

describe('eliminarArticulo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina el artículo correctamente', async () => {
    const req = {params: {id: 'a1'}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue({id: 'a1', nombre: 'PLA'});
    prisma.articulo.delete.mockResolvedValue({});

    await eliminarArticulo(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Artículo eliminado correctamente'}),
    );
  });

  test('retorna 404 si el artículo no existe', async () => {
    const req = {params: {id: 'a999'}};
    const res = mockRes();

    prisma.articulo.findUnique.mockResolvedValue(null);

    await eliminarArticulo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {params: {id: 'a1'}};
    const res = mockRes();

    prisma.articulo.findUnique.mockRejectedValue(new Error('DB error'));

    await eliminarArticulo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
