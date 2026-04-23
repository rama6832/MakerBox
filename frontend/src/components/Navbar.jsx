import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="logo-dot" />
        MakerBox
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
