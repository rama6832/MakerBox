const request = require('supertest');
const express = require('express');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  notificacion: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const prisma = require('./lib/prisma');
const jwt = require('jsonwebtoken');

// ─── App de prueba ────────────────────────────────────────────────────────────

const notificacionesRoutes = require('./routes/notificaciones.routes');

const app = express();
app.use(express.json());
app.use('/api/notificaciones', notificacionesRoutes);

describe('GET /api/notificaciones', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna las notificaciones del usuario autenticado', async () => {
    jwt.verify.mockReturnValue({id: 'user-1', rol: 'ESTUDIANTE'});
    prisma.notificacion.findMany.mockResolvedValue([{id: 'n1', mensaje: 'Test', leida: false}]);
    prisma.notificacion.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('noLeidas', 1);
  });

  test('retorna 401 si no se envía token', async () => {
    const res = await request(app).get('/api/notificaciones');

    expect(res.status).toBe(401);
  });

  test('retorna 401 si el token es inválido', async () => {
    jwt.verify.mockImplementation(() => {throw new Error('invalid token');});

    const res = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', 'Bearer token_invalido');

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notificaciones/marcar-todas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('marca todas las notificaciones como leídas', async () => {
    jwt.verify.mockReturnValue({id: 'user-1', rol: 'ESTUDIANTE'});
    prisma.notificacion.updateMany.mockResolvedValue({count: 3});

    const res = await request(app)
      .patch('/api/notificaciones/marcar-todas')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensaje', 'Todas las notificaciones marcadas como leídas');
  });
});
