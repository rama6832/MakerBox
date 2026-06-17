import {useState, useRef, useEffect} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  const nombre = localStorage.getItem('nombre');

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCerrarSesion = () => {
    localStorage.clear();
    setMenuOpen(false);
    navigate('/login');
  };

  const getLinkDashboard = () => {
    if (rol === 'ADMINISTRADOR') return '/admin/usuarios';
    if (rol === 'AYUDANTE') return '/gestion-solicitudes';
    if (rol === 'PROFESOR') return '/profesor/cursos';
    return '/mis-solicitudes';
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
