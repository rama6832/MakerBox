const validarTamañoArchivo = require('./utils/validartamañoArchivo');

describe('validarTamañoArchivo', () => {
    test('retorta true si el archivo pesa menos del limite',() => {
        expect(validarTamañoArchivo(10*1024*1024)).toBe(true);
    });

    test('retorta false si el archivo pesa mas del limite',() => {
        expect(validarTamañoArchivo(60*1024*1024)).toBe(false);
    });

    test('retorta true si el archivo pesa exactamente el limite',() => {
        expect(validarTamañoArchivo(50*1024*1024)).toBe(true);
    });
});
