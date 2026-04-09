import { useState } from 'react';
import './app.css'; // Importamos los estilos

export default function Login() {
  // Estados visuales (solo para la interfaz)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Función que simula el envío visualmente
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Simulando envío de:", { email, password });
    // En el futuro, aquí pondremos la petición a tu API de Express
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        <p className="login-subtitle">Bienvenido de vuelta a MakerBox</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo de Correo */}
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

          {/* Campo de Contraseña */}
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
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
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Botón Principal */}
          <button type="submit" className="btn-submit">
            Ingresar
          </button>
        </form>

        {/* Enlaces secundarios */}
        <div className="login-footer">
          <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
          <p className="register-text">
            ¿No tienes cuenta? <a href="#" className="register-link">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  );
}