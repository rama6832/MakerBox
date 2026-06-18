const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const proyectosRoutes = require('./routes/proyectos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const cursosRoutes = require('./routes/cursos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: '*'}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cursos', cursosRoutes);

app.get('/', (req, res) => {
  res.json({ok: true, mensaje: 'Backend funcionando'});
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
