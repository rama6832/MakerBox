import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Proyectos from './pages/Proyectos';
import Impresion from './pages/Impresion';
import AdminUsuarios from './pages/AdminUsuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/impresion" element={<Impresion />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      </Routes>
    </BrowserRouter>
  );
}
