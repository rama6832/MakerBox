import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './AdminUsuarios.css';

const ROLES = ['ESTUDIANTE', 'AYUDANTE', 'PROFESOR', 'ADMINISTRADOR'];

const ROL_BADGE = {
  ADMINISTRADOR: {label: 'Admin', color: '#5c35b8', bg: 'rgba(92,53,184,0.1)'},
  AYUDANTE: {label: 'Ayudante', color: '#c0357a', bg: 'rgba(192,53,122,0.1)'},
  PROFESOR: {label: 'Profesor', color: '#0f6e56', bg: 'rgba(15,110,86,0.1)'},
  ESTUDIANTE: {label: 'Estudiante', color: '#185fa5', bg: 'rgba(24,95,165,0.1)'},
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiando, setCambiando] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/usuarios`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.status === 403 || res.status === 401) {
        navigate('/');
        return;
      }
      const data = await res.json();
      setUsuarios(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const cambiarRol = async (id, nuevoRol) => {
    setCambiando(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/usuarios/${id}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({rol: nuevoRol}),
      });
      if (!res.ok) throw new Error();
      setUsuarios(prev =>
        prev.map(u => (u.id === id ? {...u, rol: nuevoRol} : u))
      );
    } catch {
      setError('Error al cambiar el rol');
    } finally {
      setCambiando(null);
    }
  };

  if (loading) return (
    <div className="admin-root">
      <Navbar />
      <div className="admin-loading">Cargando usuarios...</div>
    </div>
  );

  return (
    <div className="admin-root">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Gestión de usuarios</h1>
          <p className="admin-subtitle">{usuarios.length} usuarios registrados</p>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol actual</th>
                <th>Cambiar rol</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const badge = ROL_BADGE[u.rol] || ROL_BADGE.ESTUDIANTE;
                return (
                  <tr key={u.id}>
                    <td className="td-nombre">
                      <div className="usuario-avatar">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <span>{u.nombre} {u.apellido}</span>
                    </td>
                    <td className="td-email">{u.email}</td>
                    <td>
                      <span
                        className="rol-badge"
                        style={{color: badge.color, background: badge.bg}}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <select
                        className="rol-select"
                        value={u.rol}
                        disabled={cambiando === u.id}
                        onChange={e => cambiarRol(u.id, e.target.value)}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROL_BADGE[r]?.label || r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="td-fecha">
                      {new Date(u.creadoEn).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
