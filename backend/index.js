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

// Manejo manual del preflight
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});
app.use(cors({origin: '*'}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cursos', cursosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
