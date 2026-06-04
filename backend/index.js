const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: 'http://localhost:5173'}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
