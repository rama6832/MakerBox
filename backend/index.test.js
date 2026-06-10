const validarEmail = require('./utils/validarEmail');
const validarPassword = require('./utils/validarPassword');

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
}));

const prisma = require('./lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {registro, login} = require('./controllers/auth.controller');

// ─── Helper ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── validarEmail ─────────────────────────────────────────────────────────────

describe('validarEmail', () => {
  test('retorna true para un email válido', () => {
    expect(validarEmail('usuario@correo.com')).toBe(true);
  });

  test('retorna true para email con subdominio', () => {
    expect(validarEmail('usuario@mail.utalca.cl')).toBe(true);
  });

  test('retorna false si no tiene @', () => {
    expect(validarEmail('usuariocorreo.com')).toBe(false);
  });

  test('retorna false si no tiene dominio', () => {
    expect(validarEmail('usuario@')).toBe(false);
  });

  test('retorna false si está vacío', () => {
    expect(validarEmail('')).toBe(false);
  });

  test('retorna false si es null', () => {
    expect(validarEmail(null)).toBe(false);
  });

  test('retorna false si tiene espacios', () => {
    expect(validarEmail('usua rio@correo.com')).toBe(false);
  });
});

// ─── validarPassword ─────────────────────────────────────────────────────────

describe('validarPassword', () => {
  test('retorna true para una contraseña válida', () => {
    expect(validarPassword('segura123')).toBe(true);
  });

  test('retorna true para contraseña con caracteres especiales', () => {
    expect(validarPassword('S3gur@!')).toBe(true);
  });

  test('retorna false si tiene menos de 6 caracteres', () => {
    expect(validarPassword('abc')).toBe(false);
  });

  test('retorna false si supera los 100 caracteres', () => {
    expect(validarPassword('a'.repeat(101))).toBe(false);
  });

  test('retorna false si está vacía', () => {
    expect(validarPassword('')).toBe(false);
  });

  test('retorna false si es null', () => {
    expect(validarPassword(null)).toBe(false);
  });

  test('retorna false si tiene espacios', () => {
    expect(validarPassword('mi password')).toBe(false);
  });
});

// ─── registro ─────────────────────────────────────────────────────────────────

describe('registro', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un usuario correctamente y retorna 201', async () => {
    const req = {
      body: {nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com', password: 'segura123'},
    };
    const res = mockRes();

    prisma.usuario.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash_seguro');
    prisma.usuario.create.mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Juan',
      email: 'juan@correo.com',
    });

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Cuenta creada correctamente'}),
    );
  });

  test('retorna 400 si el correo ya está registrado', async () => {
    const req = {
      body: {nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com', password: 'segura123'},
    };
    const res = mockRes();

    prisma.usuario.findUnique.mockResolvedValue({id: 'uuid-1'});

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Ya existe una cuenta con ese correo'}),
    );
  });

  test('retorna 400 si faltan campos obligatorios', async () => {
    const req = {body: {nombre: 'Juan', email: 'juan@correo.com'}};
    const res = mockRes();

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Todos los campos son obligatorios'}),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      body: {nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com', password: 'segura123'},
    };
    const res = mockRes();

    prisma.usuario.findUnique.mockRejectedValue(new Error('DB error'));

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Error interno del servidor'}),
    );
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('inicia sesión correctamente y retorna token', async () => {
    const req = {body: {email: 'juan@correo.com', password: 'segura123'}};
    const res = mockRes();

    prisma.usuario.findUnique.mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@correo.com',
      password: 'hash_seguro',
      rol: 'INVITADO',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token_generado');

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({token: 'token_generado'}),
    );
  });

  test('retorna 401 si el usuario no existe', async () => {
    const req = {body: {email: 'noexiste@correo.com', password: 'segura123'}};
    const res = mockRes();

    prisma.usuario.findUnique.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Correo o contraseña incorrectos'}),
    );
  });

  test('retorna 401 si la contraseña es incorrecta', async () => {
    const req = {body: {email: 'juan@correo.com', password: 'wrongpass'}};
    const res = mockRes();

    prisma.usuario.findUnique.mockResolvedValue({
      id: 'uuid-1',
      email: 'juan@correo.com',
      password: 'hash_seguro',
    });
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Correo o contraseña incorrectos'}),
    );
  });

  test('retorna 400 si faltan campos', async () => {
    const req = {body: {email: 'juan@correo.com'}};
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Correo y contraseña son obligatorios'}),
    );
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {body: {email: 'juan@correo.com', password: 'segura123'}};
    const res = mockRes();

    prisma.usuario.findUnique.mockRejectedValue(new Error('DB error'));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Error interno del servidor'}),
    );
  });
});
