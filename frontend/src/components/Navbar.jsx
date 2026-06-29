import {useState, useRef, useEffect} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import './Navbar.css';

const API_URL = 'http://localhost:3000';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  const nombre = localStorage.getItem('nombre');

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) return;
    let activo = true;

    const cargar = async () => {
      const data = await fetchNotificaciones();
      if (activo && data) {
        setNotificaciones(data.notificaciones);
        setNoLeidas(data.noLeidas);
      }
    };

    cargar();
    const interval = setInterval(cargar, 30000);
    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [token]);

  const handleAbrirNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && noLeidas > 0) {
      fetch(`${API_URL}/api/notificaciones/marcar-todas`, {
        method: 'PATCH',
        headers: {Authorization: `Bearer ${token}`},
      }).then(() => setNoLeidas(0));
    }
  };

  const handleCerrarSesion = () => {
    localStorage.clear();
    setMenuOpen(false);
    navigate('/login');
  };

  const getLinkDashboard = () => {
    if (rol === 'ADMINISTRADOR') return '/admin/usuarios';
    if (rol === 'AYUDANTE') return '/ayudante/solicitudes';
    if (rol === 'PROFESOR') return '/profesor/cursos';
    return '/mis-solicitudes';
  };
  
  const tiempoRelativo = (fecha) => {
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <svg className="logo-icon" viewBox="0 0 26 26" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="2" fill="#5c35b8"/>
          <rect x="14" y="1" width="10" height="10" rx="2" fill="#c0357a"/>
          <rect x="1" y="14" width="10" height="10" rx="2" fill="#c0357a"/>
          <rect x="14" y="14" width="10" height="10" rx="2" fill="#5c35b8"/>
        </svg>
        <span className="logo-maker">Maker</span><span className="logo-box">Box</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/proyectos" className={isActive('/proyectos') ? 'nav-link nav-active' : 'nav-link'}>
            Ver proyectos
          </Link>
        </li>
        <li>
          <Link to="/impresion" className={isActive('/impresion') ? 'nav-link nav-active' : 'nav-link'}>
            Solicitar impresión 3D
          </Link>
        </li>
        <li>
          <Link to="/finalizadas" className={isActive('/finalizadas') ? 'nav-link nav-active' : 'nav-link'}>
            Galería finalizadas
          </Link>
        </li>
        {rol === 'AYUDANTE' && (
          <li>
            <Link to="/gestion-inventario" className={isActive('/gestion-inventario') ? 'nav-link nav-active' : 'nav-link'}>
              Inventario
            </Link>
          </li>
        )}

        {token && (
          <li className="nav-notif-wrapper" ref={notifRef}>
            <button className="nav-notif-btn" onClick={handleAbrirNotif}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C7.5 2 5.5 4 5.5 6.5v3c0 .8-.3 1.6-.9 2.2L3.5 13c-.5.5-.1 1.3.6 1.3h11.8c.7 0 1.1-.8.6-1.3l-1.1-1.3c-.6-.6-.9-1.4-.9-2.2v-3C14.5 4 12.5 2 10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M8 16.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {noLeidas > 0 && <span className="nav-notif-dot">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </button>

            {notifOpen && (
              <div className="nav-notif-dropdown">
                <p className="notif-dropdown-title">Notificaciones</p>
                {notificaciones.length === 0 ? (
                  <p className="notif-empty">No tienes notificaciones aún.</p>
                ) : (
                  <div className="notif-list">
                    {notificaciones.map(n => (
                      <div key={n.id} className={`notif-item ${!n.leida ? 'notif-item--unread' : ''}`}>
                        <p className="notif-mensaje">{n.mensaje}</p>
                        <p className="notif-tiempo">{tiempoRelativo(n.creadoEn)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        )}

        {token ? (
          <li className="nav-user-wrapper" ref={menuRef}>
            <button className="nav-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="nav-user-avatar">{nombre?.[0] || '?'}</span>
              <span className="nav-user-name">{nombre}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)'}}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="nav-dropdown">
                <Link to={getLinkDashboard()} className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                  Mi panel
                </Link>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleCerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </li>
        ) : (
          <li>
            <Link to="/login" className="nav-link nav-btn-login">
              Iniciar sesión
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
