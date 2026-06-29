import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MisSolicitudes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ESTADO_INFO = {
  PENDIENTE: {label: 'Pendiente', color: '#854f0b', bg: '#faeeda'},
  APROBADO: {label: 'Aprobado', color: '#0f6e56', bg: '#e1f5ee'},
  RECHAZADO: {label: 'Rechazado', color: '#c0357a', bg: 'rgba(192,53,122,0.1)'},
  EN_PROCESO: {label: 'En proceso', color: '#185fa5', bg: 'rgba(24,95,165,0.1)'},
  FINALIZADO: {label: 'Finalizado', color: '#5c35b8', bg: 'rgba(92,53,184,0.1)'},
};

export default function MisSolicitudes() {
  const [tab, setTab] = useState('pedidos');
  const [proyectos, setProyectos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormProyecto, setShowFormProyecto] = useState(false);
  const [showFormPedido, setShowFormPedido] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Form proyecto
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');

  // Form pedido
  const [proyectoId, setProyectoId] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [calidad, setCalidad] = useState('');
  const [archivoFile, setArchivoFile] = useState(null);
  const [comentario, setComentario] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [cursosEstudiante, setCursosEstudiante] = useState([]);
  const [materialesDisponibles, setMaterialesDisponibles] = useState([]);
  const [materialPersonalizado, setMaterialPersonalizado] = useState('');

  useEffect(() => {
    if (!token) {navigate('/login'); return;}
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProyectos, resPedidos, resCursos, resMateriales] = await Promise.all([
        fetch(`${API_URL}/api/proyectos/mis-proyectos`, {headers: {Authorization: `Bearer ${token}`}}),
        fetch(`${API_URL}/api/pedidos/mis-pedidos`, {headers: {Authorization: `Bearer ${token}`}}),
        fetch(`${API_URL}/api/cursos/mis-cursos-estudiante`, {headers: {Authorization: `Bearer ${token}`}}),
        fetch(`${API_URL}/api/inventario/disponibles`, {headers: {Authorization: `Bearer ${token}`}}),
      ]);
      setProyectos(await resProyectos.json());
      setPedidos(await resPedidos.json());
      setCursosEstudiante(await resCursos.json());
      setMaterialesDisponibles(await resMateriales.json());
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/proyectos`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({titulo, descripcion, categoria}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setProyectos(prev => [data, ...prev]);
      setSuccess('Proyecto creado correctamente');
      setTitulo(''); setDescripcion(''); setCategoria('');
      setShowFormProyecto(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearPedido = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!archivoFile) {
      setError('Debes seleccionar un archivo STL');
      return;
    }

    const materialFinal = material === '__otro__' ? materialPersonalizado.trim() : material;
    if (!materialFinal) {
      setError('Debes indicar el material a usar');
      return;
    }

    try {
      // 1. Subir el archivo primero
      setSubiendoArchivo(true);
      const formData = new FormData();
      formData.append('archivo', archivoFile);

      const resUpload = await fetch(`${API_URL}/api/archivos/stl`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
        body: formData,
      });
      const dataUpload = await resUpload.json();
      if (!resUpload.ok) throw new Error(dataUpload.mensaje || 'Error al subir el archivo');
      setSubiendoArchivo(false);

      // 2. Crear el pedido con la URL del archivo subido
      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          proyectoId, material: materialFinal, color, calidad,
          archivoStl: dataUpload.archivoStl,
          archivoStlUrl: dataUpload.archivoStlUrl,
          comentario,
          cursoId: cursoId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      setPedidos(prev => [data, ...prev]);
      setSuccess('Solicitud enviada correctamente');
      setProyectoId(''); setMaterial(''); setColor('');
      setCalidad(''); setArchivoFile(null); setComentario(''); setCursoId(''); setMaterialPersonalizado('');
      setShowFormPedido(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  };

  if (loading) return <div className="mis-root"><Navbar /><div className="mis-loading">Cargando...</div></div>;

  return (
    <div className="mis-root">
      <Navbar />
      <div className="mis-container">

        <div className="mis-header">
          <h1 className="mis-title">Mi espacio</h1>
          <div className="mis-actions">
            <button className="btn-secondary" onClick={() => {setShowFormProyecto(true); setShowFormPedido(false);}}>
              + Nuevo proyecto
            </button>
            <button className="btn-primary" onClick={() => {setShowFormPedido(true); setShowFormProyecto(false);}}>
              + Solicitar impresión
            </button>
          </div>
        </div>

        {error && <p className="msg-error">{error}</p>}
        {success && <p className="msg-success">{success}</p>}

        {/* FORM PROYECTO */}
        {showFormProyecto && (
          <div className="form-card">
            <h3>Nuevo proyecto</h3>
            <form onSubmit={handleCrearProyecto} className="mis-form">
              <div className="input-group">
                <label>Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nombre del proyecto" required />
              </div>
              <div className="input-group">
                <label>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe tu proyecto" required rows={3} />
              </div>
              <div className="input-group">
                <label>Categoría</label>
                <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej: Mecánica, Arquitectura..." required />
              </div>
              <div className="form-btns">
                <button type="button" className="btn-cancel" onClick={() => setShowFormProyecto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear proyecto</button>
              </div>
            </form>
          </div>
        )}

        {/* FORM PEDIDO */}
        {showFormPedido && (
          <div className="form-card">
            <h3>Nueva solicitud de impresión</h3>
            <form onSubmit={handleCrearPedido} className="mis-form">
              <div className="input-group">
                <label>Proyecto</label>
                <select value={proyectoId} onChange={e => setProyectoId(e.target.value)} required>
                  <option value="">Selecciona un proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Curso (opcional)</label>
                <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
                  <option value="">Impresión personal (sin curso)</option>
                  {cursosEstudiante.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.grupo ? `· ${c.grupo.nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Material</label>
                  <select value={material} onChange={e => setMaterial(e.target.value)} required>
                    <option value="">Selecciona un material</option>
                    {materialesDisponibles.map(m => (
                      <option key={m.id} value={m.nombre}>
                        {m.nombre} (disponible: {m.stockActual} {m.unidadMedida})
                      </option>
                    ))}
                    <option value="__otro__">Otro (especificar)</option>
                  </select>
                  {material === '__otro__' && (
                    <input
                      value={materialPersonalizado}
                      onChange={e => setMaterialPersonalizado(e.target.value)}
                      placeholder="Escribe el material que necesitas"
                      style={{marginTop: '8px'}}
                      required
                    />
                  )}
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <input value={color} onChange={e => setColor(e.target.value)} placeholder="Ej: Blanco" />
                </div>
              </div>
              <div className="input-group">
                <label>Calidad</label>
                <select value={calidad} onChange={e => setCalidad(e.target.value)}>
                  <option value="">Selecciona calidad</option>
                  <option value="baja">Baja (rápida)</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta (detallada)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Archivo del modelo (.stl, .obj, .3mf)</label>
                <input
                  type="file"
                  accept=".stl,.obj,.3mf"
                  onChange={e => setArchivoFile(e.target.files[0])}
                  required
                />
                {archivoFile && <p className="archivo-seleccionado">📎 {archivoFile.name}</p>}
              </div>
              <div className="input-group">
                <label>Comentario (opcional)</label>
                <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Indicaciones adicionales..." rows={2} />
              </div>
              <div className="form-btns">
                <button type="button" className="btn-cancel" onClick={() => setShowFormPedido(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={subiendoArchivo}>
                  {subiendoArchivo ? 'Subiendo archivo...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABS */}
        <div className="mis-tabs">
          <button className={`mis-tab ${tab === 'pedidos' ? 'mis-tab--active' : ''}`} onClick={() => setTab('pedidos')}>
            Mis solicitudes ({pedidos.length})
          </button>
          <button className={`mis-tab ${tab === 'proyectos' ? 'mis-tab--active' : ''}`} onClick={() => setTab('proyectos')}>
            Mis proyectos ({proyectos.length})
          </button>
        </div>

        {/* PEDIDOS */}
        {tab === 'pedidos' && (
          <div className="mis-lista">
            {pedidos.length === 0 ? (
              <div className="mis-empty">No tienes solicitudes de impresión aún.</div>
            ) : pedidos.map(p => {
              const info = ESTADO_INFO[p.estado] || ESTADO_INFO.PENDIENTE;
              return (
                <div key={p.id} className="pedido-card">
                  <div className="pedido-top">
                    <div>
                      <p className="pedido-proyecto">{p.proyecto?.titulo}</p>
                      {p.curso && <p className="pedido-curso">📚 {p.curso.nombre}</p>}
                      <p className="pedido-material">{p.material} {p.color ? `· ${p.color}` : ''} {p.calidad ? `· ${p.calidad}` : ''}</p>
                      {p.archivoStlUrl ? (
                        <a href={p.archivoStlUrl} target="_blank" rel="noopener noreferrer" className="pedido-archivo-link">
                          📎 {p.archivoStl}
                        </a>
                      ) : (
                        <p className="pedido-archivo">📎 {p.archivoStl}</p>
                      )}
                    </div>
                    <span className="estado-badge" style={{color: info.color, background: info.bg}}>
                      {info.label}
                    </span>
                  </div>
                  {p.observacionAyudante && (
                    <p className="pedido-obs">💬 {p.observacionAyudante}</p>
                  )}
                  {p.motivoRechazo && (
                    <p className="pedido-rechazo">❌ {p.motivoRechazo}</p>
                  )}
                  <p className="pedido-fecha">{new Date(p.creadoEn).toLocaleDateString('es-CL')}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* PROYECTOS */}
        {tab === 'proyectos' && (
          <div className="mis-lista">
            {proyectos.length === 0 ? (
              <div className="mis-empty">No tienes proyectos aún.</div>
            ) : proyectos.map(p => (
              <div key={p.id} className="proyecto-card">
                <p className="proyecto-titulo">{p.titulo}</p>
                <p className="proyecto-categoria">{p.categoria}</p>
                <p className="proyecto-desc">{p.descripcion}</p>
                <p className="pedido-fecha">{new Date(p.creadoEn).toLocaleDateString('es-CL')}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
