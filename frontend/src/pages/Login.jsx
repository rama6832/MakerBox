import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Login.css';

export default function Login() {
  const [tab, setTab] = useState('login');
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: loginEmail, password: loginPassword}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');
      localStorage.setItem('token', data.token);
      localStorage.setItem('rol', data.usuario.rol);
      if (data.usuario.rol === 'ADMINISTRADOR') {
        navigate('/admin/usuarios');
      } else if (data.usuario.rol === 'AYUDANTE') {
        navigate('/ayudante/solicitudes');
      } else {
        navigate('/mis-solicitudes');
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (registerPassword !== confirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }
    if (registerPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al registrarse');
      setRegisterSuccess('¡Cuenta creada! Ya puedes iniciar sesión.');
      setNombre(''); setApellido(''); setRegisterEmail('');
      setRegisterPassword(''); setConfirmPassword('');
      setTimeout(() => setTab('login'), 1800);
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="login-root">
      <Navbar />
      <div className="login-container">
        <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <div className="login-dot" />
            <h2 className="login-title">
              {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className="login-subtitle">
              {tab === 'login'
                ? 'Bienvenido de vuelta a MakerBox'
                : 'Únete a la comunidad maker'}
            </p>
          </div>

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
              onClick={() => { setTab('login'); setLoginError(''); }}
            >
              Ingresar
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => { setTab('register'); setRegisterError(''); setRegisterSuccess(''); }}
            >
              Registrarse
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {loginError && <p className="form-error">{loginError}</p>}

              <button type="submit" className="btn-submit" disabled={loginLoading}>
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <div className="login-footer">
                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="login-form">
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    type="text"
                    id="apellido"
                    placeholder="Tu apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Correo electrónico</label>
                <input
                  type="email"
                  id="reg-email"
                  placeholder="tu@correo.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="reg-password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirm-password">Confirmar contraseña</label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  id="confirm-password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {registerError && <p className="form-error">{registerError}</p>}
              {registerSuccess && <p className="form-success">{registerSuccess}</p>}

              <button type="submit" className="btn-submit" disabled={registerLoading}>
                {registerLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
