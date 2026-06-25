// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  proyecto: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}));

const prisma = require('./lib/prisma');
const {crearProyecto, getMisProyectos} = require('./controllers/proyectos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Pruebas unitarias: crearProyecto ─────────────────────────────────────────

describe('crearProyecto', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un proyecto correctamente y retorna 201', async () => {
    const req = {
      body: {titulo: 'Robot 3D', descripcion: 'Prototipo de robot', categoria: 'Mecánico'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.create.mockResolvedValue({
      id: 'proj-1',
      titulo: 'Robot 3D',
      descripcion: 'Prototipo de robot',
      categoria: 'Mecánica',
      autorId: 'user-1',
    });

    await crearProyecto(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.proyecto.create).toHaveBeenCalledWith(
      expect.objectContaining({data: expect.objectContaining({titulo: 'Robot 3D', autorId: 'user-1'})}),
    );
  });

  test('retorna 400 si faltan campos obligatorios', async () => {
    const req = {
      body: {titulo: 'Robot 3D'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    await crearProyecto(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Todos los campos son obligatorios'}),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      body: {titulo: 'Robot 3D', descripcion: 'Desc', categoria: 'Mecánica'},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    prisma.proyecto.create.mockRejectedValue(new Error('DB error'));

    await crearProyecto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── Pruebas unitarias: getMisProyectos ───────────────────────────────────────

describe('getMisProyectos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna los proyectos del usuario', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.proyecto.findMany.mockResolvedValue([
      {id: 'proj-1', titulo: 'Robot 3D', autorId: 'user-1'},
      {id: 'proj-2', titulo: 'Casa modelo', autorId: 'user-1'},
    ]);

    await getMisProyectos(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({titulo: 'Robot 3D'}),
    ]));
    expect(prisma.proyecto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {autorId: 'user-1'}}),
    );
  });

  test('retorna arreglo vacío si no hay proyectos', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.proyecto.findMany.mockResolvedValue([]);

    await getMisProyectos(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.proyecto.findMany.mockRejectedValue(new Error('DB error'));

    await getMisProyectos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
