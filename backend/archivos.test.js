// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./lib/supabase', () => ({
  storage: {
    from: jest.fn(),
  },
}));

const supabase = require('./lib/supabase');
const {subirArchivo} = require('./controllers/archivos.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('subirArchivo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sube el archivo correctamente y retorna 201', async () => {
    const req = {
      file: {
        originalname: 'modelo.stl',
        buffer: Buffer.from('contenido falso'),
        mimetype: 'application/octet-stream',
        size: 1024, 
      },
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    const uploadMock = jest.fn().mockResolvedValue({error: null});
    const getPublicUrlMock = jest.fn().mockReturnValue({
      data: {publicUrl: 'https://storage.supabase.co/archivos-stl/user-1/123.stl'},
    });
    supabase.storage.from.mockReturnValue({upload: uploadMock, getPublicUrl: getPublicUrlMock});

    await subirArchivo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: 'Archivo subido correctamente',
        archivoStl: 'modelo.stl',
      }),
    );
  });

  test('retorna 400 si no se envía ningún archivo', async () => {
    const req = {file: undefined, usuario: {id: 'user-1'}, size: 1024};
    const res = mockRes();

    await subirArchivo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'No se recibió ningún archivo'}),
    );
  });

  test('retorna 500 si Supabase Storage falla al subir', async () => {
    const req = {
      file: {originalname: 'modelo.stl', buffer: Buffer.from('x'), mimetype: 'application/octet-stream', size: 1024},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    const uploadMock = jest.fn().mockResolvedValue({error: {message: 'Bucket error'}});
    supabase.storage.from.mockReturnValue({upload: uploadMock, getPublicUrl: jest.fn()});

    await subirArchivo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({mensaje: 'Error al subir el archivo'}),
    );
  });

  test('retorna 500 si ocurre una excepción inesperada', async () => {
    const req = {
      file: {originalname: 'modelo.stl', buffer: Buffer.from('x'), mimetype: 'application/octet-stream', size: 1024},
      usuario: {id: 'user-1'},
    };
    const res = mockRes();

    supabase.storage.from.mockImplementation(() => {
      throw new Error('Conexión perdida');
    });

    await subirArchivo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
