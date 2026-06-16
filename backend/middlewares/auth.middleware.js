const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({mensaje: 'Token requerido'});
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({mensaje: 'Token inválido'});
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({mensaje: 'Acceso denegado'});
  }
  next();
};

module.exports = {verificarToken, soloAdmin};
