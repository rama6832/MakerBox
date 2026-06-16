// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  pedido: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  proyecto: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('./lib/prisma');
const {
  crearPedido,
  getMisPedidos,
  getTodosPedidos,
  cambiarEstado,
} = require('./controllers/pedidos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Pruebas unitarias: crearPedido ───────────────────────────────────────────

describe('crearPedido', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un pedido correctamente y retorna 201', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});
    prisma.pedido.create.mockResolvedValue({
      id: 'ped-1',
      proyectoId: 'proj-1',
      usuarioId: 'user-1',
      material: 'PLA',
      archivoStl: 'modelo.stl',
      estado: 'PENDIENTE',
      proyecto: {titulo: 'Robot 3D'},
    });

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.pedido.create).toHaveBeenCalled();
  });

  test('retorna 400 si faltan campos obligatorios', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Proyecto, material y archivo STL son obligatorios'}),
    );
  });

  test('retorna 404 si el proyecto no existe', async () => {
    const req = {
      body: {proyectoId: 'proj-999', material: 'PLA', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue(null);

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Proyecto no encontrado'}),
    );
  });

  test('retorna 403 si el proyecto pertenece a otro usuario', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-2'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'user-1'});

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      body: {proyectoId: 'proj-1', material: 'PLA', archivoStl: 'modelo.stl'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.findUnique.mockRejectedValue(new Error('DB error'));

    await crearPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── Pruebas unitarias: getMisPedidos ─────────────────────────────────────────

describe('getMisPedidos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna los pedidos del usuario', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.pedido.findMany.mockResolvedValue([
      {id: 'ped-1', material: 'PLA', estado: 'PENDIENTE', proyecto: {titulo: 'Robot 3D'}},
    ]);

    await getMisPedidos(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({material: 'PLA'}),
    ]));
  });

  test('retorna arreglo vacío si no hay pedidos', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.pedido.findMany.mockResolvedValue([]);

    await getMisPedidos(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});

// ─── Pruebas unitarias: getTodosPedidos ───────────────────────────────────────

describe('getTodosPedidos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna todos los pedidos para el ayudante', async () => {
    const req = {usuario: {id: 'ayudante-1', rol: 'AYUDANTE'}};
    const res = mockRes();

    prisma.pedido.findMany.mockResolvedValue([
      {id: 'ped-1', estado: 'PENDIENTE', usuario: {nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'}, proyecto: {titulo: 'Robot 3D'}},
      {id: 'ped-2', estado: 'APROBADO', usuario: {nombre: 'Ana', apellido: 'López', email: 'ana@correo.com'}, proyecto: {titulo: 'Casa modelo'}},
    ]);

    await getTodosPedidos(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({id: 'ped-1'}),
      expect.objectContaining({id: 'ped-2'}),
    ]));
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'ayudante-1', rol: 'AYUDANTE'}};
    const res = mockRes();

    prisma.pedido.findMany.mockRejectedValue(new Error('DB error'));

    await getTodosPedidos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── Pruebas unitarias: cambiarEstado ─────────────────────────────────────────

describe('cambiarEstado', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cambia el estado correctamente', async () => {
    const req = {
      params: {id: 'ped-1'},
      body: {estado: 'APROBADO', observacionAyudante: 'Se ve bien'},
      usuario: {id: 'ayudante-1'},
    };
    const res = mockRes();

    prisma.pedido.findUnique.mockResolvedValue({id: 'ped-1', estado: 'PENDIENTE'});
    prisma.pedido.update.mockResolvedValue({
      id: 'ped-1',
      estado: 'APROBADO',
      usuario: {nombre: 'Juan', email: 'juan@correo.com'},
      proyecto: {titulo: 'Robot 3D'},
    });

    await cambiarEstado(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Estado actualizado correctamente'}),
    );
    expect(prisma.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({where: {id: 'ped-1'}, data: expect.objectContaining({estado: 'APROBADO'})}),
    );
  });

  test('retorna 400 si el estado no es válido', async () => {
    const req = {
      params: {id: 'ped-1'},
      body: {estado: 'ESTADO_INVALIDO'},
      usuario: {id: 'ayudante-1'},
    };
    const res = mockRes();

    await cambiarEstado(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Estado no válido'}),
    );
  });

  test('retorna 404 si el pedido no existe', async () => {
    const req = {
      params: {id: 'ped-999'},
      body: {estado: 'APROBADO'},
      usuario: {id: 'ayudante-1'},
    };
    const res = mockRes();

    prisma.pedido.findUnique.mockResolvedValue(null);

    await cambiarEstado(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Pedido no encontrado'}),
    );
  });

  test('guarda motivo de rechazo cuando el estado es RECHAZADO', async () => {
    const req = {
      params: {id: 'ped-1'},
      body: {estado: 'RECHAZADO', motivoRechazo: 'Archivo mal exportado'},
      usuario: {id: 'ayudante-1'},
    };
    const res = mockRes();

    prisma.pedido.findUnique.mockResolvedValue({id: 'ped-1', estado: 'PENDIENTE'});
    prisma.pedido.update.mockResolvedValue({
      id: 'ped-1',
      estado: 'RECHAZADO',
      motivoRechazo: 'Archivo mal exportado',
      usuario: {nombre: 'Juan', email: 'juan@correo.com'},
      proyecto: {titulo: 'Robot 3D'},
    });

    await cambiarEstado(req, res);

    expect(prisma.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({motivoRechazo: 'Archivo mal exportado'}),
      }),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      params: {id: 'ped-1'},
      body: {estado: 'APROBADO'},
      usuario: {id: 'ayudante-1'},
    };
    const res = mockRes();

    prisma.pedido.findUnique.mockRejectedValue(new Error('DB error'));

    await cambiarEstado(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
