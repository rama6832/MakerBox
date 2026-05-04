import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

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
          <Link to="/login" className="nav-link nav-btn-login">
            Iniciar sesión
          </Link>
        </li>
      </ul>
    </nav>
  );
}
