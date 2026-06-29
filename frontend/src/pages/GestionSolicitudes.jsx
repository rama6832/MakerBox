import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './GestionSolicitudes.css';

const API_URL = 'http://localhost:3000';

const ESTADOS = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_PROCESO', 'FINALIZADO'];

const ESTADO_INFO = {
  PENDIENTE: {label: 'Pendiente', color: '#854f0b', bg: '#faeeda'},
  APROBADO: {label: 'Aprobado', color: '#0f6e56', bg: '#e1f5ee'},
  RECHAZADO: {label: 'Rechazado', color: '#c0357a', bg: 'rgba(192,53,122,0.1)'},
  EN_PROCESO: {label: 'En proceso', color: '#185fa5', bg: 'rgba(24,95,165,0.1)'},
  FINALIZADO: {label: 'Finalizado', color: '#5c35b8', bg: 'rgba(92,53,184,0.1)'},
};

export default function GestionSolicitudes() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('TODOS');
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {navigate('/login'); return;}
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.status === 403) {navigate('/'); return;}
      setPedidos(await res.json());
    } catch {
      setError('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEstado) return;
    setCambiando(true);
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedidoActivo.id}/estado`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          estado: nuevoEstado,
          observacionAyudante: observacion,
          motivoRechazo: motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setPedidos(prev => prev.map(p => p.id === pedidoActivo.id ? {...p, estado: nuevoEstado, observacionAyudante: observacion, motivoRechazo: motivo} : p));
      setSuccess('Estado actualizado correctamente');
      setToast({mensaje: 'Estado actualizado correctamente', tipo: 'success'});
      setPedidoActivo(null);
      setNuevoEstado(''); setObservacion(''); setMotivo('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCambiando(false);
    }
  };

  const pedidosFiltrados = filtro === 'TODOS' ? pedidos : pedidos.filter(p => p.estado === filtro);

  if (loading) return <div className="gest-root"><Navbar /><div className="gest-loading">Cargando...</div></div>;

  return (
    <div className="gest-root">
      <Navbar />
      <div className="gest-container">

        <div className="gest-header">
          <h1 className="gest-title">Gestión de solicitudes</h1>
          <p className="gest-subtitle">{pedidos.length} solicitudes en total</p>
        </div>

        {error && <p className="msg-error">{error}</p>}
        {success && <p className="msg-success">{success}</p>}

        {/* Filtros */}
        <div className="gest-filtros">
          {['TODOS', ...ESTADOS].map(e => (
            <button
              key={e}
              className={`filtro-btn ${filtro === e ? 'filtro-btn--active' : ''}`}
              onClick={() => setFiltro(e)}
            >
              {e === 'TODOS' ? 'Todos' : ESTADO_INFO[e].label}
              <span className="filtro-count">
                {e === 'TODOS' ? pedidos.length : pedidos.filter(p => p.estado === e).length}
              </span>
            </button>
          ))}
        </div>

        {/* Modal cambio estado */}
        {pedidoActivo && (
          <div className="modal-overlay" onClick={() => setPedidoActivo(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3>Cambiar estado</h3>
              <p className="modal-info">
                <strong>{pedidoActivo.usuario?.nombre} {pedidoActivo.usuario?.apellido}</strong>
                {' · '}{pedidoActivo.proyecto?.titulo}
              </p>
              <form onSubmit={handleCambiarEstado} className="modal-form">
                <div className="input-group">
                  <label>Nuevo estado</label>
                  <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} required>
                    <option value="">Selecciona estado</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_INFO[e].label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Observación (opcional)</label>
                  <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Comentario para el estudiante..." rows={2} />
                </div>
                {nuevoEstado === 'RECHAZADO' && (
                  <div className="input-group">
                    <label>Motivo de rechazo</label>
                    <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Explica por qué se rechaza..." rows={2} required />
                  </div>
                )}
                <div className="modal-btns">
                  <button type="button" className="btn-cancel" onClick={() => setPedidoActivo(null)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={cambiando}>
                    {cambiando ? 'Guardando...' : 'Guardar cambio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="gest-lista">
          {pedidosFiltrados.length === 0 ? (
            <div className="gest-empty">No hay solicitudes con este estado.</div>
          ) : pedidosFiltrados.map(p => {
            const info = ESTADO_INFO[p.estado] || ESTADO_INFO.PENDIENTE;
            return (
              <div key={p.id} className="gest-card">
                <div className="gest-card-top">
                  <div>
                    <p className="gest-estudiante">{p.usuario?.nombre} {p.usuario?.apellido}</p>
                    <p className="gest-email">{p.usuario?.email}</p>
                    <p className="gest-proyecto">{p.proyecto?.titulo}</p>
                    <p className="gest-detalle">{p.material} {p.color ? `· ${p.color}` : ''} {p.calidad ? `· ${p.calidad}` : ''}</p>
                    <p className="gest-archivo">📎 {p.archivoStl}</p>
                  </div>
                  <div className="gest-card-right">
                    <span className="estado-badge" style={{color: info.color, background: info.bg}}>
                      {info.label}
                    </span>
                    <button
                      className="btn-cambiar"
                      onClick={() => {setPedidoActivo(p); setNuevoEstado(p.estado); setObservacion(p.observacionAyudante || ''); setMotivo(p.motivoRechazo || '');}}
                    >
                      Cambiar estado
                    </button>
                  </div>
                </div>
                {p.comentario && <p className="gest-comentario">💬 {p.comentario}</p>}
                <p className="gest-fecha">{new Date(p.creadoEn).toLocaleDateString('es-CL')}</p>
              </div>
            );
          })}
        </div>
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
