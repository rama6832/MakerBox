// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  curso: {findUnique: jest.fn()},
  grupo: {create: jest.fn(), delete: jest.fn()},
  grupoEstudiante: {create: jest.fn(), deleteMany: jest.fn()},
  cursoEstudiante: {findUnique: jest.fn(), upsert: jest.fn()},
  usuario: {findUnique: jest.fn(), create: jest.fn()},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const prisma = require('./lib/prisma');
const bcrypt = require('bcrypt');
const {
  crearGrupo,
  eliminarGrupo,
  asignarEstudianteAGrupo,
  quitarEstudianteDeGrupo,
  cargarEstudiantesCSV,
} = require('./controllers/cursos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── crearGrupo ─────────────────────────────────────────────────────────────────

describe('crearGrupo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un grupo correctamente y retorna 201', async () => {
    const req = {params: {id: 'curso-1'}, body: {nombre: 'Grupo 1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.grupo.create.mockResolvedValue({id: 'grupo-1', nombre: 'Grupo 1', cursoId: 'curso-1'});

    await crearGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('retorna 400 si falta el nombre', async () => {
    const req = {params: {id: 'curso-1'}, body: {}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    await crearGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {params: {id: 'curso-1'}, body: {nombre: 'Grupo 1'}, usuario: {id: 'prof-2'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await crearGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 404 si el curso no existe', async () => {
    const req = {params: {id: 'curso-999'}, body: {nombre: 'Grupo 1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue(null);

    await crearGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─── eliminarGrupo ──────────────────────────────────────────────────────────────

describe('eliminarGrupo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina el grupo correctamente', async () => {
    const req = {params: {id: 'curso-1', grupoId: 'grupo-1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.grupoEstudiante.deleteMany.mockResolvedValue({count: 2});
    prisma.grupo.delete.mockResolvedValue({});

    await eliminarGrupo(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Grupo eliminado correctamente'}),
    );
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {params: {id: 'curso-1', grupoId: 'grupo-1'}, usuario: {id: 'prof-2'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await eliminarGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─── asignarEstudianteAGrupo ────────────────────────────────────────────────────

describe('asignarEstudianteAGrupo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('asigna un estudiante al grupo correctamente', async () => {
    const req = {
      params: {id: 'curso-1', grupoId: 'grupo-1'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.cursoEstudiante.findUnique.mockResolvedValue({id: 'rel-1'});
    prisma.grupo.findMany = jest.fn().mockResolvedValue([{id: 'grupo-1'}, {id: 'grupo-2'}]);
    prisma.grupoEstudiante.deleteMany.mockResolvedValue({count: 0});
    prisma.grupoEstudiante.create.mockResolvedValue({
      id: 'ge-1', grupoId: 'grupo-1', estudianteId: 'est-1',
      estudiante: {id: 'est-1', nombre: 'Juan', apellido: 'Pérez'},
    });

    await asignarEstudianteAGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('retorna 400 si el estudiante no está inscrito en el curso', async () => {
    const req = {
      params: {id: 'curso-1', grupoId: 'grupo-1'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.cursoEstudiante.findUnique.mockResolvedValue(null);

    await asignarEstudianteAGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'El estudiante debe estar inscrito en el curso primero'}),
    );
  });

  test('retorna 400 si falta el estudianteId', async () => {
    const req = {params: {id: 'curso-1', grupoId: 'grupo-1'}, body: {}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    await asignarEstudianteAGrupo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── quitarEstudianteDeGrupo ────────────────────────────────────────────────────

describe('quitarEstudianteDeGrupo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('quita al estudiante del grupo correctamente', async () => {
    const req = {params: {id: 'curso-1', grupoId: 'grupo-1', estudianteId: 'est-1'}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.grupoEstudiante.deleteMany.mockResolvedValue({count: 1});

    await quitarEstudianteDeGrupo(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Estudiante quitado del grupo'}),
    );
  });
});

// ─── cargarEstudiantesCSV ───────────────────────────────────────────────────────

describe('cargarEstudiantesCSV', () => {
  beforeEach(() => jest.clearAllMocks());

  test('agrega estudiantes existentes correctamente', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudiantes: [{nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'}]},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.usuario.findUnique.mockResolvedValue({id: 'user-1', email: 'juan@correo.com'});
    prisma.cursoEstudiante.upsert.mockResolvedValue({});

    await cargarEstudiantesCSV(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('crea cuenta nueva con contraseña 1234 si el estudiante no existe', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudiantes: [{nombre: 'Ana', apellido: 'López', email: 'ana@correo.com'}]},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.usuario.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash_1234');
    prisma.usuario.create.mockResolvedValue({id: 'user-2', email: 'ana@correo.com'});
    prisma.cursoEstudiante.upsert.mockResolvedValue({});

    await cargarEstudiantesCSV(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({data: expect.objectContaining({rol: 'ESTUDIANTE'})}),
    );
  });

  test('retorna 400 si no se envían estudiantes', async () => {
    const req = {params: {id: 'curso-1'}, body: {estudiantes: []}, usuario: {id: 'prof-1'}};
    const res = mockRes();

    await cargarEstudiantesCSV(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudiantes: [{nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'}]},
      usuario: {id: 'prof-2'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await cargarEstudiantesCSV(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('registra error en filas inválidas sin detener el proceso', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudiantes: [{nombre: 'Juan'}, {nombre: 'Ana', apellido: 'López', email: 'ana@correo.com'}]},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.usuario.findUnique.mockResolvedValue({id: 'user-2', email: 'ana@correo.com'});
    prisma.cursoEstudiante.upsert.mockResolvedValue({});

    await cargarEstudiantesCSV(req, res);

    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.resultados.errores.length).toBeGreaterThan(0);
    expect(respuesta.resultados.agregados).toBe(1);
  });
});
