// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  cursoEstudiante: {findMany: jest.fn()},
}));

const prisma = require('./lib/prisma');
const {getMisCursosEstudiante} = require('./controllers/cursos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getMisCursosEstudiante', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna cursos con el grupo correspondiente al estudiante', async () => {
    const req = {usuario: {id: 'est-1'}};
    const res = mockRes();

    prisma.cursoEstudiante.findMany.mockResolvedValue([
      {
        curso: {
          id: 'curso-1',
          nombre: 'Diseño 3D',
          semestre: '2025-1',
          grupos: [
            {id: 'grupo-1', nombre: 'Grupo 1', estudiantes: [{grupoId: 'grupo-1'}]},
            {id: 'grupo-2', nombre: 'Grupo 2', estudiantes: []},
          ],
        },
      },
    ]);

    await getMisCursosEstudiante(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        nombre: 'Diseño 3D',
        grupo: expect.objectContaining({nombre: 'Grupo 1'}),
      }),
    ]);
  });

  test('retorna grupo null si el estudiante no está en ningún grupo', async () => {
    const req = {usuario: {id: 'est-1'}};
    const res = mockRes();

    prisma.cursoEstudiante.findMany.mockResolvedValue([
      {
        curso: {
          id: 'curso-1', nombre: 'Diseño 3D', semestre: '2025-1',
          grupos: [{id: 'grupo-1', nombre: 'Grupo 1', estudiantes: []}],
        },
      },
    ]);

    await getMisCursosEstudiante(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({grupo: null}),
    ]);
  });

  test('retorna arreglo vacío si el estudiante no tiene cursos', async () => {
    const req = {usuario: {id: 'est-1'}};
    const res = mockRes();

    prisma.cursoEstudiante.findMany.mockResolvedValue([]);

    await getMisCursosEstudiante(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'est-1'}};
    const res = mockRes();

    prisma.cursoEstudiante.findMany.mockRejectedValue(new Error('DB error'));

    await getMisCursosEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
