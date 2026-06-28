import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Finalizadas.css';

const API_URL = 'http://localhost:3000';

export default function Finalizadas() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {navigate('/login'); return;}

    const fetchFinalizadas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pedidos/finalizados`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        if (!res.ok) throw new Error();
        setPedidos(await res.json());
      } catch {
        setError('Error al cargar las impresiones finalizadas');
      } finally {
        setLoading(false);
      }
    };

    fetchFinalizadas();
  }, [token, navigate]);

  const categorias = ['TODAS', ...new Set(pedidos.map(p => p.proyecto?.categoria).filter(Boolean))];

  const pedidosFiltrados = filtroCategoria === 'TODAS'
    ? pedidos
    : pedidos.filter(p => p.proyecto?.categoria === filtroCategoria);

  if (loading) return <div className="fin-root"><Navbar /><div className="fin-loading">Cargando galería...</div></div>;

  return (
    <div className="fin-root">
      <Navbar />
      <div className="fin-container">

        <div className="fin-header">
          <h1 className="fin-title">Galería de impresiones finalizadas</h1>
          <p className="fin-subtitle">Proyectos completados por la comunidad MakerBox</p>
        </div>

        {error && <p className="msg-error">{error}</p>}

        {categorias.length > 1 && (
          <div className="fin-filtros">
            {categorias.map(c => (
              <button
                key={c}
                className={`filtro-btn ${filtroCategoria === c ? 'filtro-btn--active' : ''}`}
                onClick={() => setFiltroCategoria(c)}
              >
                {c === 'TODAS' ? 'Todas' : c}
              </button>
            ))}
          </div>
        )}

        {pedidosFiltrados.length === 0 ? (
          <div className="fin-empty">Aún no hay impresiones finalizadas para mostrar.</div>
        ) : (
          <div className="fin-grid">
            {pedidosFiltrados.map(p => (
              <div key={p.id} className="fin-card">
                <div className="fin-card-imagen">
                  {p.proyecto?.imagenUrl ? (
                    <img src={p.proyecto.imagenUrl} alt={p.proyecto.titulo} />
                  ) : (
                    <div className="fin-card-placeholder">🖨️</div>
                  )}
                </div>
                <div className="fin-card-body">
                  <p className="fin-card-categoria">{p.proyecto?.categoria}</p>
                  <p className="fin-card-titulo">{p.proyecto?.titulo}</p>
                  <p className="fin-card-desc">{p.proyecto?.descripcion}</p>
                  <div className="fin-card-footer">
                    <span className="fin-card-autor">
                      {p.usuario?.nombre} {p.usuario?.apellido}
                    </span>
                    <span className="fin-card-material">{p.material}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
