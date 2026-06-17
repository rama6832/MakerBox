// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/prisma', () => ({
  curso: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
  cursoEstudiante: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

const prisma = require('./lib/prisma');
const {
  crearCurso,
  getMisCursos,
  getEstudiantesDisponibles,
  agregarEstudiante,
  eliminarEstudiante,
} = require('./controllers/cursos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── crearCurso ───────────────────────────────────────────────────────────────

describe('crearCurso', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea un curso correctamente y retorna 201', async () => {
    const req = {
      body: {nombre: 'Diseño 3D', descripcion: 'Curso básico', semestre: '2025-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.create.mockResolvedValue({
      id: 'curso-1',
      nombre: 'Diseño 3D',
      semestre: '2025-1',
      profesorId: 'prof-1',
    });

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.curso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({nombre: 'Diseño 3D', profesorId: 'prof-1'}),
      }),
    );
  });

  test('retorna 400 si falta el nombre', async () => {
    const req = {
      body: {semestre: '2025-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Nombre y semestre son obligatorios'}),
    );
  });

  test('retorna 400 si falta el semestre', async () => {
    const req = {
      body: {nombre: 'Diseño 3D'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      body: {nombre: 'Diseño 3D', semestre: '2025-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.create.mockRejectedValue(new Error('DB error'));

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getMisCursos ─────────────────────────────────────────────────────────────

describe('getMisCursos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna los cursos del profesor', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findMany.mockResolvedValue([
      {id: 'curso-1', nombre: 'Diseño 3D', semestre: '2025-1', estudiantes: []},
      {id: 'curso-2', nombre: 'Impresión Avanzada', semestre: '2025-1', estudiantes: []},
    ]);

    await getMisCursos(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({nombre: 'Diseño 3D'}),
    ]));
    expect(prisma.curso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {profesorId: 'prof-1'}}),
    );
  });

  test('retorna arreglo vacío si no hay cursos', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findMany.mockResolvedValue([]);

    await getMisCursos(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.curso.findMany.mockRejectedValue(new Error('DB error'));

    await getMisCursos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getEstudiantesDisponibles ────────────────────────────────────────────────

describe('getEstudiantesDisponibles', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna lista de estudiantes activos', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.usuario.findMany.mockResolvedValue([
      {id: 'est-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'},
      {id: 'est-2', nombre: 'Ana', apellido: 'López', email: 'ana@correo.com'},
    ]);

    await getEstudiantesDisponibles(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({nombre: 'Juan'}),
    ]));
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({where: {rol: 'ESTUDIANTE', estado: true}}),
    );
  });

  test('retorna arreglo vacío si no hay estudiantes', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.usuario.findMany.mockResolvedValue([]);

    await getEstudiantesDisponibles(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {usuario: {id: 'prof-1'}};
    const res = mockRes();

    prisma.usuario.findMany.mockRejectedValue(new Error('DB error'));

    await getEstudiantesDisponibles(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── agregarEstudiante ────────────────────────────────────────────────────────

describe('agregarEstudiante', () => {
  beforeEach(() => jest.clearAllMocks());

  test('agrega un estudiante correctamente y retorna 201', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.cursoEstudiante.create.mockResolvedValue({
      id: 'rel-1',
      cursoId: 'curso-1',
      estudianteId: 'est-1',
      estudiante: {id: 'est-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@correo.com'},
    });

    await agregarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.cursoEstudiante.create).toHaveBeenCalled();
  });

  test('retorna 400 si falta el estudianteId', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    await agregarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'El ID del estudiante es obligatorio'}),
    );
  });

  test('retorna 404 si el curso no existe', async () => {
    const req = {
      params: {id: 'curso-999'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue(null);

    await agregarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Curso no encontrado'}),
    );
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-2'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await agregarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 400 si el estudiante ya está en el curso', async () => {
    const req = {
      params: {id: 'curso-1'},
      body: {estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.cursoEstudiante.create.mockRejectedValue({code: 'P2002'});

    await agregarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'El estudiante ya está en este curso'}),
    );
  });
});

// ─── eliminarEstudiante ───────────────────────────────────────────────────────

describe('eliminarEstudiante', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina un estudiante correctamente', async () => {
    const req = {
      params: {id: 'curso-1', estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});
    prisma.cursoEstudiante.deleteMany.mockResolvedValue({count: 1});

    await eliminarEstudiante(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Estudiante eliminado del curso'}),
    );
  });

  test('retorna 404 si el curso no existe', async () => {
    const req = {
      params: {id: 'curso-999', estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue(null);

    await eliminarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 403 si el curso pertenece a otro profesor', async () => {
    const req = {
      params: {id: 'curso-1', estudianteId: 'est-1'},
      usuario: {id: 'prof-2'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockResolvedValue({id: 'curso-1', profesorId: 'prof-1'});

    await eliminarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 500 si ocurre un error inesperado', async () => {
    const req = {
      params: {id: 'curso-1', estudianteId: 'est-1'},
      usuario: {id: 'prof-1'},
    };
    const res = mockRes();

    prisma.curso.findUnique.mockRejectedValue(new Error('DB error'));

    await eliminarEstudiante(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});