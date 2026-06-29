import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Proyectos from './pages/Proyectos';
import Impresion from './pages/Impresion';
import AdminUsuarios from './pages/AdminUsuarios';
import MisSolicitudes from './pages/MisSolicitudes';
import GestionSolicitudes from './pages/GestionSolicitudes';
import ProfesorCursos from './pages/ProfesorCursos';
import GestionInventario from './pages/GestionInventario';
import Finalizadas from './pages/Finalizadas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/impresion" element={<Impresion />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
        <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
        <Route path="/ayudante/solicitudes" element={<GestionSolicitudes />} />
        <Route path="/profesor/cursos" element={<ProfesorCursos />} />
        <Route path="/gestion-inventario" element={<GestionInventario />} />
        <Route path="/finalizadas" element={<Finalizadas />} />
      </Routes>
    </BrowserRouter>
  );
}
