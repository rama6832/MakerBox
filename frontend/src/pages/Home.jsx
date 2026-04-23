import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const projects = [
  {
    tag: 'Robótica',
    title: 'Brazo robótico articulado',
    desc: '6 grados de libertad, impreso en PLA con servos SG90. Incluye archivos STL y código Arduino.',
    colorClass: 'card-img-orange',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="12" fill="rgba(232,98,42,0.15)" />
        <path d="M18 38 L28 18 L38 38 Z" stroke="#e8622a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <path d="M21 32 L35 32" stroke="#e8622a" strokeWidth="1.5" />
        <rect x="24" y="22" width="8" height="6" rx="1" fill="rgba(232,98,42,0.3)" />
      </svg>
    ),
  },
  {
    tag: 'Electrónica',
    title: 'Carcasa para ESP32',
    desc: 'Enclosure modular para proyectos IoT. Ventilación integrada y soporte para pantalla OLED.',
    colorClass: 'card-img-blue',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="12" fill="rgba(55,138,221,0.15)" />
        <circle cx="28" cy="28" r="10" stroke="#378add" strokeWidth="1.5" fill="none" />
        <circle cx="28" cy="28" r="4" fill="rgba(55,138,221,0.4)" />
        <path d="M28 14 L28 18 M28 38 L28 42 M14 28 L18 28 M38 28 L42 28" stroke="#378add" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tag: 'Sustentabilidad',
    title: 'Maceteros modulares',
    desc: 'Sistema de maceteros apilables impresos en PET reciclado. Diseño paramétrico editable.',
    colorClass: 'card-img-green',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="12" fill="rgba(97,153,34,0.15)" />
        <path d="M20 36 Q20 26 28 22 Q36 26 36 36" stroke="#639922" strokeWidth="1.5" fill="rgba(97,153,34,0.15)" strokeLinejoin="round" />
        <path d="M24 36 Q24 30 28 28 Q32 30 32 36" fill="rgba(97,153,34,0.3)" />
        <line x1="28" y1="36" x2="28" y2="42" stroke="#639922" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-badge">Plataforma maker · Chile</div>
        <h1>Crea, imprime y<br /><span>comparte</span> proyectos</h1>
        <p className="hero-sub">
          MakerBox es tu comunidad de fabricación digital. Explora proyectos,
          solicita impresiones 3D y conecta con makers.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/proyectos')}>
            Explorar proyectos
          </button>
          <button className="btn-secondary" onClick={() => navigate('/impresion')}>
            Solicitar impresión 3D
          </button>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="section">
        <p className="section-tag">Proyectos destacados</p>
        <h2 className="section-title">Explora lo que la<br />comunidad está creando</h2>
        <p className="section-desc">
          Desde prototipos funcionales hasta diseños artísticos. Descubre, guarda y replica proyectos de otros makers.
        </p>
        <div className="projects-grid">
          {projects.map((p) => (
            <div key={p.title} className="project-card" onClick={() => navigate('/proyectos')}>
              <div className={`card-img ${p.colorClass}`}>{p.icon}</div>
              <div className="card-body">
                <p className="card-tag">{p.tag}</p>
                <p className="card-title">{p.title}</p>
                <p className="card-desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3D PRINT */}
      <div className="print-section">
        <div className="print-inner">
          <div>
            <p className="section-tag">Impresión 3D</p>
            <h2 className="section-title">Haz realidad<br />tu diseño</h2>
            <p className="section-desc">Sube tu archivo, elige el material y recibe tu pieza impresa en casa.</p>
            <div className="print-steps">
              {[
                { n: '1', title: 'Sube tu archivo STL o 3MF', desc: 'Arrastra o selecciona tu modelo 3D desde el formulario de solicitud.' },
                { n: '2', title: 'Elige material y calidad', desc: 'PLA, PETG, ABS y más. Selecciona el relleno y la resolución de capa.' },
                { n: '3', title: 'Recibe tu cotización', desc: 'Te enviamos precio y plazo de entrega en menos de 2 horas.' },
              ].map((s) => (
                <div key={s.n} className="step">
                  <div className="step-num">{s.n}</div>
                  <div className="step-text">
                    <strong>{s.title}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/impresion')}>
              Solicitar impresión
            </button>
          </div>
          <div className="print-visual">
            <div className="print-box">
              <div className="print-icon-ring">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 6 L30 12 L30 24 L18 30 L6 24 L6 12 Z" stroke="#e8622a" strokeWidth="1.5" fill="rgba(232,98,42,0.1)" strokeLinejoin="round" />
                  <path d="M18 6 L18 30 M6 12 L30 12 M6 24 L30 24" stroke="rgba(232,98,42,0.3)" strokeWidth="1" />
                </svg>
              </div>
              <div className="print-box-label">
                <strong>Impresión bajo demanda</strong>
                Materiales premium · Entrega a domicilio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">MakerBox</div>
        <div className="footer-copy">© 2025 MakerBox · Chile</div>
      </footer>
    </div>
  );
}
