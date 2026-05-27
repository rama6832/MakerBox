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