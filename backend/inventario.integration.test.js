const request = require('supertest');
const express = require('express');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  articulo: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  usuario: {findMany: jest.fn()},
  notificacion: {create: jest.fn()},
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const prisma = require('./lib/prisma');
const jwt = require('jsonwebtoken');

// ─── App de prueba ────────────────────────────────────────────────────────────

const inventarioRoutes = require('./routes/inventario.routes');

const app = express();
app.use(express.json());
app.use('/api/inventario', inventarioRoutes);

describe('GET /api/inventario', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna el inventario si el usuario es ayudante', async () => {
    jwt.verify.mockReturnValue({id: 'ayudante-1', rol: 'AYUDANTE'});
    prisma.articulo.findMany.mockResolvedValue([{id: 'a1', nombre: 'PLA Blanco', stockActual: 10}]);

    const res = await request(app)
      .get('/api/inventario')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({nombre: 'PLA Blanco'}),
    ]));
  });

  test('retorna 403 si el usuario no es ayudante ni admin', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});

    const res = await request(app)
      .get('/api/inventario')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(403);
  });
});

describe('GET /api/inventario/disponibles', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cualquier usuario autenticado puede ver los materiales disponibles', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});
    prisma.articulo.findMany.mockResolvedValue([{id: 'a1', nombre: 'PLA Blanco', stockActual: 10, unidadMedida: 'unidad'}]);

    const res = await request(app)
      .get('/api/inventario/disponibles')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
  });
});

describe('POST /api/inventario', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un artículo correctamente como ayudante', async () => {
    jwt.verify.mockReturnValue({id: 'ayudante-1', rol: 'AYUDANTE'});
    prisma.articulo.create.mockResolvedValue({id: 'a1', nombre: 'Resina'});

    const res = await request(app)
      .post('/api/inventario')
      .set('Authorization', 'Bearer token_valido')
      .send({nombre: 'Resina', stockActual: 5, stockMinimo: 2});

    expect(res.status).toBe(201);
  });

  test('retorna 403 si el estudiante intenta crear un artículo', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});

    const res = await request(app)
      .post('/api/inventario')
      .set('Authorization', 'Bearer token_valido')
      .send({nombre: 'Resina'});

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/inventario/:id/stock', () => {
  beforeEach(() => jest.clearAllMocks());

  test('actualiza el stock correctamente', async () => {
    jwt.verify.mockReturnValue({id: 'ayudante-1', rol: 'AYUDANTE'});
    prisma.articulo.findUnique.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 10, stockMinimo: 5});
    prisma.articulo.update.mockResolvedValue({id: 'a1', nombre: 'PLA', stockActual: 8, stockMinimo: 5, unidadMedida: 'unidad'});

    const res = await request(app)
      .patch('/api/inventario/a1/stock')
      .set('Authorization', 'Bearer token_valido')
      .send({stockActual: 8});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stockActual', 8);
  });
});
