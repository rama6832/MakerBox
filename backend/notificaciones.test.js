// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  notificacion: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
}));

const prisma = require('./lib/prisma');
const {
  getMisNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  crearNotificacion,
} = require('./controllers/notificaciones.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── getMisNotificaciones ──────────────────────────────────────────────────────

describe('getMisNotificaciones', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna notificaciones y conteo de no leídas', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.findMany.mockResolvedValue([
      {id: 'n1', mensaje: 'Test', leida: false},
    ]);
    prisma.notificacion.count.mockResolvedValue(1);

    await getMisNotificaciones(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({noLeidas: 1}),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.findMany.mockRejectedValue(new Error('DB error'));

    await getMisNotificaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── marcarLeida ────────────────────────────────────────────────────────────────

describe('marcarLeida', () => {
  beforeEach(() => jest.clearAllMocks());

  test('marca una notificación como leída', async () => {
    const req = {params: {id: 'n1'}, usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.findUnique.mockResolvedValue({id: 'n1', usuarioId: 'user-1'});
    prisma.notificacion.update.mockResolvedValue({});

    await marcarLeida(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Notificación marcada como leída'}),
    );
  });

  test('retorna 404 si la notificación no existe o no es del usuario', async () => {
    const req = {params: {id: 'n1'}, usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.findUnique.mockResolvedValue(null);

    await marcarLeida(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 404 si la notificación pertenece a otro usuario', async () => {
    const req = {params: {id: 'n1'}, usuario: {id: 'user-2'}};
    const res = mockRes();

    prisma.notificacion.findUnique.mockResolvedValue({id: 'n1', usuarioId: 'user-1'});

    await marcarLeida(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─── marcarTodasLeidas ──────────────────────────────────────────────────────────

describe('marcarTodasLeidas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('marca todas las notificaciones como leídas', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.updateMany.mockResolvedValue({count: 3});

    await marcarTodasLeidas(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Todas las notificaciones marcadas como leídas'}),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'user-1'}};
    const res = mockRes();

    prisma.notificacion.updateMany.mockRejectedValue(new Error('DB error'));

    await marcarTodasLeidas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── crearNotificacion (helper) ─────────────────────────────────────────────────

describe('crearNotificacion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea la notificación correctamente', async () => {
    prisma.notificacion.create.mockResolvedValue({id: 'n1'});

    await crearNotificacion('user-1', 'Mensaje de prueba');

    expect(prisma.notificacion.create).toHaveBeenCalledWith({
      data: {usuarioId: 'user-1', mensaje: 'Mensaje de prueba'},
    });
  });

  test('no lanza error si falla la creación', async () => {
    prisma.notificacion.create.mockRejectedValue(new Error('DB error'));

    await expect(crearNotificacion('user-1', 'Mensaje')).resolves.not.toThrow();
  });
});
