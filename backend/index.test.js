const validarEmail = require('./utils/validarEmail');

describe('validarEmail', () => {
  test('retorna true para un email válido', () => {
    expect(validarEmail('usuario@correo.com')).toBe(true);
  });

  test('retorna false si no tiene @', () => {
    expect(validarEmail('usuariocorreo.com')).toBe(false);
  });


  test('retorna false si está vacío', () => {
    expect(validarEmail('')).toBe(false);
  });

  test('retorna false si es null', () => {
    expect(validarEmail(null)).toBe(false);
  });
});

const validarPassword = require('./utils/validarPassword');

describe('validarPassword', () => {
  test('retorna true para una contraseña válida', () => {
    expect(validarPassword('segura123')).toBe(true);
  });

  test('retorna false si tiene menos de 6 caracteres', () => {
    expect(validarPassword('abc')).toBe(false);
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
