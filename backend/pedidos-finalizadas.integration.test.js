const request = require('supertest');
const express = require('express');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  proyecto: {findUnique: jest.fn()},
  cursoEstudiante: {findUnique: jest.fn()},
  pedido: {create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn()},
  curso: {findUnique: jest.fn()},
  articulo: {findFirst: jest.fn(), update: jest.fn()},
  usuario: {findMany: jest.fn()},
  notificacion: {create: jest.fn()},
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const prisma = require('./lib/prisma');
const jwt = require('jsonwebtoken');

// ─── App de prueba ────────────────────────────────────────────────────────────

const pedidosRoutes = require('./routes/pedidos.routes');

const app = express();
app.use(express.json());
app.use('/api/pedidos', pedidosRoutes);

describe('GET /api/pedidos/finalizados', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna las impresiones finalizadas para cualquier usuario autenticado', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});
    prisma.pedido.findMany.mockResolvedValue([
      {id: 'ped-1', estado: 'FINALIZADO', proyecto: {titulo: 'Robot'}, usuario: {nombre: 'Juan'}},
    ]);

    const res = await request(app)
      .get('/api/pedidos/finalizados')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({estado: 'FINALIZADO'}),
    ]));
  });

  test('retorna 401 si no hay token', async () => {
    const res = await request(app).get('/api/pedidos/finalizados');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/pedidos/curso/:cursoId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('el profesor puede ver los pedidos de su curso', async () => {
    jwt.verify.mockReturnValue({id: 'prof-1', rol: 'PROFESOR'});
    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.pedido.findMany.mockResolvedValue([{id: 'ped-1', estado: 'PENDIENTE'}]);

    const res = await request(app)
      .get('/api/pedidos/curso/curso-1')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
  });

  test('retorna 403 si un estudiante intenta acceder', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});

    const res = await request(app)
      .get('/api/pedidos/curso/curso-1')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(403);
  });
});

describe('POST /api/pedidos (con descuento de stock)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea el pedido y descuenta stock si el material existe', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});
    prisma.proyecto.findUnique.mockResolvedValue({id: 'proj-1', autorId: 'est-1'});
    prisma.pedido.create.mockResolvedValue({id: 'ped-1', proyecto: {titulo: 'Robot'}, curso: null});
    prisma.articulo.findFirst.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 10, stockMinimo: 5, unidadMedida: 'unidad'});
    prisma.articulo.update.mockResolvedValue({id: 'a1', stockActual: 9});

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', 'Bearer token_valido')
      .send({proyectoId: 'proj-1', material: 'PLA', archivoStl: 'modelo.stl'});

    expect(res.status).toBe(201);
    expect(prisma.articulo.update).toHaveBeenCalled();
  });
});
