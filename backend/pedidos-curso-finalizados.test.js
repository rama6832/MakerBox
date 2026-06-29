// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  curso: {findUnique: jest.fn()},
  pedido: {findMany: jest.fn()},
}));

const prisma = require('./lib/prisma');
const {getPedidosPorCurso, getPedidosFinalizados} = require('./controllers/pedidos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── getPedidosPorCurso ─────────────────────────────────────────────────────────

describe('getPedidosPorCurso', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna los pedidos del curso si el profesor es el dueño', async () => {
    const req = {params: {cursoId: 'curso-1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.pedido.findMany.mockResolvedValue([
      {id: 'ped-1', estado: 'PENDIENTE', usuario: {nombre: 'Juan'}, proyecto: {titulo: 'Robot'}},
    ]);

    await getPedidosPorCurso(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({id: 'ped-1'}),
    ]));
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {params: {cursoId: 'curso-1'}, usuario: {id: 'prof-2'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await getPedidosPorCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 404 si el curso no existe', async () => {
    const req = {params: {cursoId: 'curso-999'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue(null);

    await getPedidosPorCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {params: {cursoId: 'curso-1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockRejectedValue(new Error('DB error'));

    await getPedidosPorCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getPedidosFinalizados ──────────────────────────────────────────────────────

describe('getPedidosFinalizados', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna solo los pedidos finalizados', async () => {
    const req = {};
    const res = mockRes();

    prisma.pedido.findMany.mockResolvedValue([
      {id: 'ped-1', estado: 'FINALIZADO', proyecto: {titulo: 'Robot'}, usuario: {nombre: 'Juan'}},
    ]);

    await getPedidosFinalizados(req, res);

    expect(prisma.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {estado: 'FINALIZADO'}}),
    );
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({estado: 'FINALIZADO'}),
    ]));
  });

  test('retorna arreglo vacío si no hay pedidos finalizados', async () => {
    const req = {};
    const res = mockRes();

    prisma.pedido.findMany.mockResolvedValue([]);

    await getPedidosFinalizados(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {};
    const res = mockRes();

    prisma.pedido.findMany.mockRejectedValue(new Error('DB error'));

    await getPedidosFinalizados(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
