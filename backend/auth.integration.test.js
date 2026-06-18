const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  usuario: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const prisma = require('./lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ─── App de prueba ────────────────────────────────────────────────────────────

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// ─── Tests de integración: /api/auth/registro ─────────────────────────────────

describe('POST /api/auth/registro', () => {
  beforeEach(() => jest.clearAllMocks());

  test('registra un usuario y retorna 201', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash_seguro');
    prisma.usuario.create.mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Juan',
      email: 'juan@correo.com',
    });

    const res = await request(app)
      .post('/api/auth/registro')
      .send({nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com', password: 'segura123'});

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mensaje', 'Cuenta creada correctamente');
  });

  test('retorna 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({nombre: 'Juan', email: 'juan@correo.com'});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('mensaje', 'Todos los campos son obligatorios');
  });

  test('retorna 400 si el correo ya está registrado', async () => {
    prisma.usuario.findUnique.mockResolvedValue({id: 'uuid-1'});

    const res = await request(app)
      .post('/api/auth/registro')
      .send({nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com', password: 'segura123'});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('mensaje', 'Ya existe una cuenta con ese correo');
  });
});

// ─── Tests de integración: /api/auth/login ────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('inicia sesión y retorna token', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@correo.com',
      password: 'hash_seguro',
      rol: 'ESTUDIANTE',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token_generado');

    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'juan@correo.com', password: 'segura123'});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'token_generado');
    expect(res.body.usuario).toHaveProperty('email', 'juan@correo.com');
  });

  test('retorna 401 si el usuario no existe', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'noexiste@correo.com', password: 'segura123'});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('mensaje', 'Correo o contraseña incorrectos');
  });

  test('retorna 401 si la contraseña es incorrecta', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'uuid-1',
      email: 'juan@correo.com',
      password: 'hash_seguro',
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'juan@correo.com', password: 'wrongpass'});

    expect(res.status).toBe(401);
  });

  test('retorna 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'juan@correo.com'});

    expect(res.status).toBe(400);
  });
});
