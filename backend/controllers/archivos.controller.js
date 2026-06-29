const supabase = require('../lib/supabase');
const validartamañoArchivo = require('../utils/validartamañoArchivo');

const BUCKET = 'archivos-stl';

// POST /api/archivos/stl
const subirArchivo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({mensaje: 'No se recibió ningún archivo'});
  }
  if (!validartamañoArchivo(req.file.size)) {
    return res.status(400).json({mensaje: 'El archivo excede el tamaño máximo permitido de 50 MB'});
  }

  const usuarioId = req.usuario.id;
  const nombreOriginal = req.file.originalname;
  const extension = nombreOriginal.slice(nombreOriginal.lastIndexOf('.'));
  const nombreUnico = `${usuarioId}/${Date.now()}${extension}`;

  try {
    const {error} = await supabase.storage
      .from(BUCKET)
      .upload(nombreUnico, req.file.buffer, {
        contentType: req.file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Error al subir a Supabase Storage:', error);
      return res.status(500).json({mensaje: 'Error al subir el archivo'});
    }

    const {data} = supabase.storage.from(BUCKET).getPublicUrl(nombreUnico);

    return res.status(201).json({
      mensaje: 'Archivo subido correctamente',
      archivoStl: nombreOriginal,
      archivoStlUrl: data.publicUrl,
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    return res.status(500).json({mensaje: 'Error interno del servidor'});
  }
};

module.exports = {subirArchivo};
