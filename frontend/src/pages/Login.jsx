import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Simulando envío de:', { email, password });
    // Aquí irá la petición a tu API de Express
  };

  return (
    <div className="login-root">
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-dot" />
            <h2 className="login-title">Iniciar sesión</h2>
            <p className="login-subtitle">Bienvenido de vuelta a MakerBox</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Ingresar
            </button>
          </form>

          <div className="login-footer">
            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
            <p className="register-text">
              ¿No tienes cuenta?{' '}
              <Link to="/" className="register-link">Volver al inicio</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
