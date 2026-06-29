const request = require('supertest');
const express = require('express');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  curso: {create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn()},
  cursoEstudiante: {findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn()},
  usuario: {findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn()},
  grupo: {create: jest.fn(), delete: jest.fn(), findMany: jest.fn()},
  grupoEstudiante: {create: jest.fn(), deleteMany: jest.fn()},
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const prisma = require('./lib/prisma');
const jwt = require('jsonwebtoken');

// ─── App de prueba ────────────────────────────────────────────────────────────

const cursosRoutes = require('./routes/cursos.routes');

const app = express();
app.use(express.json());
app.use('/api/cursos', cursosRoutes);

describe('POST /api/cursos/:id/grupos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un grupo correctamente como profesor dueño del curso', async () => {
    jwt.verify.mockReturnValue({id: 'prof-1', rol: 'PROFESOR'});
    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.grupo.create.mockResolvedValue({id: 'grupo-1', nombre: 'Grupo 1', cursoId: 'curso-1'});

    const res = await request(app)
      .post('/api/cursos/curso-1/grupos')
      .set('Authorization', 'Bearer token_valido')
      .send({nombre: 'Grupo 1'});

    expect(res.status).toBe(201);
  });

  test('retorna 403 si un estudiante intenta crear un grupo', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});

    const res = await request(app)
      .post('/api/cursos/curso-1/grupos')
      .set('Authorization', 'Bearer token_valido')
      .send({nombre: 'Grupo 1'});

    expect(res.status).toBe(403);
  });
});

describe('GET /api/cursos/mis-cursos-estudiante', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cualquier usuario autenticado puede ver sus cursos', async () => {
    jwt.verify.mockReturnValue({id: 'est-1', rol: 'ESTUDIANTE'});
    prisma.cursoEstudiante.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/cursos/mis-cursos-estudiante')
      .set('Authorization', 'Bearer token_valido');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/cursos/:id/estudiantes-csv', () => {
  beforeEach(() => jest.clearAllMocks());

  test('procesa la carga masiva correctamente', async () => {
    jwt.verify.mockReturnValue({id: 'prof-1', rol: 'PROFESOR'});
    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.usuario.findUnique.mockResolvedValue({id: 'user-1', email: 'juan@correo.com'});
    prisma.cursoEstudiante.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/cursos/curso-1/estudiantes-csv')
      .set('Authorization', 'Bearer token_valido')
      .send({estudiantes: [{nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'}]});

    expect(res.status).toBe(201);
    expect(res.body.resultados.agregados).toBe(1);
  });

  test('retorna 400 si no se envía el arreglo de estudiantes', async () => {
    jwt.verify.mockReturnValue({id: 'prof-1', rol: 'PROFESOR'});

    const res = await request(app)
      .post('/api/cursos/curso-1/estudiantes-csv')
      .set('Authorization', 'Bearer token_valido')
      .send({});

    expect(res.status).toBe(400);
  });
});
