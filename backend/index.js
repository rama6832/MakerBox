const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const proyectosRoutes = require('./routes/proyectos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
      ].filter(Boolean);

      if (
        !origin ||
        allowed.includes(origin) ||
        origin.endsWith('vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
  }),
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
