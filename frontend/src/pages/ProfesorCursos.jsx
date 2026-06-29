import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './ProfesorCursos.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ESTADO_INFO = {
  PENDIENTE: {label: 'Pendiente', color: '#854f0b', bg: '#faeeda'},
  APROBADO: {label: 'Aprobado', color: '#0f6e56', bg: '#e1f5ee'},
  RECHAZADO: {label: 'Rechazado', color: '#c0357a', bg: 'rgba(192,53,122,0.1)'},
  EN_PROCESO: {label: 'En proceso', color: '#185fa5', bg: 'rgba(24,95,165,0.1)'},
  FINALIZADO: {label: 'Finalizado', color: '#5c35b8', bg: 'rgba(92,53,184,0.1)'},
};

export default function ProfesorCursos() {
  const [cursos, setCursos] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('estudiantes'); // estudiantes | grupos | solicitudes
  const [showFormCurso, setShowFormCurso] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Form curso
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [semestre, setSemestre] = useState('');

  // Agregar estudiante
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');

  // Grupos
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [showFormGrupo, setShowFormGrupo] = useState(false);
  const [asignacionGrupo, setAsignacionGrupo] = useState({}); // {grupoId: estudianteId}

  // CSV
  const [csvFile, setCsvFile] = useState(null);
  const [subiendoCsv, setSubiendoCsv] = useState(false);
  const [resultadoCsv, setResultadoCsv] = useState(null);

  // Solicitudes por curso
  const [pedidosPorCurso, setPedidosPorCurso] = useState({});

  const fetchData = async () => {
    try {
      const [resCursos, resEst] = await Promise.all([
        fetch(`${API_URL}/api/cursos/mis-cursos`, {headers: {Authorization: `Bearer ${token}`}}),
        fetch(`${API_URL}/api/cursos/estudiantes-disponibles`, {headers: {Authorization: `Bearer ${token}`}}),
      ]);
      if (resCursos.status === 403) {navigate('/'); return;}
      setCursos(await resCursos.json());
      setEstudiantesDisponibles(await resEst.json());
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {navigate('/login'); return;}
    fetchData();
  }, []);

  const fetchPedidosDelCurso = async (cursoId) => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos/curso/${cursoId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = await res.json();
      setPedidosPorCurso(prev => ({...prev, [cursoId]: data}));
    } catch {
      setError('Error al cargar solicitudes del curso');
    }
  };

  const handleAbrirCurso = (cursoId) => {
    const abrir = cursoActivo !== cursoId;
    setCursoActivo(abrir ? cursoId : null);
    setVistaActiva('estudiantes');
    if (abrir && !pedidosPorCurso[cursoId]) {
      fetchPedidosDelCurso(cursoId);
    }
  };

  const handleCrearCurso = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({nombre, descripcion, semestre}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setCursos(prev => [{...data, estudiantes: [], grupos: []}, ...prev]);
      setSuccess('Curso creado correctamente');
      setNombre(''); setDescripcion(''); setSemestre('');
      setShowFormCurso(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAgregarEstudiante = async (cursoId) => {
    if (!estudianteSeleccionado) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/estudiantes`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({estudianteId: estudianteSeleccionado}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setCursos(prev => prev.map(c => c.id === cursoId ? {...c, estudiantes: [...c.estudiantes, data]} : c));
      setSuccess('Estudiante agregado correctamente');
      setEstudianteSeleccionado('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarEstudiante = async (cursoId, estudianteId) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/estudiantes/${estudianteId}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error();
      setCursos(prev => prev.map(c => c.id === cursoId
        ? {...c, estudiantes: c.estudiantes.filter(e => e.estudianteId !== estudianteId)}
        : c
      ));
      setSuccess('Estudiante eliminado del curso');
    } catch {
      setError('Error al eliminar estudiante');
    }
  };

  const handleCrearGrupo = async (cursoId) => {
    if (!nombreGrupo.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/grupos`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({nombre: nombreGrupo}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setCursos(prev => prev.map(c => c.id === cursoId ? {...c, grupos: [...c.grupos, data]} : c));
      setSuccess('Grupo creado correctamente');
      setNombreGrupo('');
      setShowFormGrupo(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarGrupo = async (cursoId, grupoId) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/grupos/${grupoId}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error();
      setCursos(prev => prev.map(c => c.id === cursoId
        ? {...c, grupos: c.grupos.filter(g => g.id !== grupoId)}
        : c
      ));
      setSuccess('Grupo eliminado correctamente');
    } catch {
      setError('Error al eliminar grupo');
    }
  };

  const handleAsignarAGrupo = async (cursoId, grupoId) => {
    const estudianteId = asignacionGrupo[grupoId];
    if (!estudianteId) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/grupos/${grupoId}/estudiantes`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({estudianteId}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      setCursos(prev => prev.map(c => {
        if (c.id !== cursoId) return c;
        return {
          ...c,
          grupos: c.grupos.map(g => {
            // quitar al estudiante de cualquier otro grupo del mismo curso
            const filtrados = g.estudiantes.filter(e => e.estudianteId !== estudianteId);
            if (g.id === grupoId) return {...g, estudiantes: [...filtrados, data]};
            return {...g, estudiantes: filtrados};
          }),
        };
      }));
      setSuccess('Estudiante asignado al grupo');
      setAsignacionGrupo(prev => ({...prev, [grupoId]: ''}));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuitarDeGrupo = async (cursoId, grupoId, estudianteId) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/grupos/${grupoId}/estudiantes/${estudianteId}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error();
      setCursos(prev => prev.map(c => {
        if (c.id !== cursoId) return c;
        return {
          ...c,
          grupos: c.grupos.map(g => g.id === grupoId
            ? {...g, estudiantes: g.estudiantes.filter(e => e.estudianteId !== estudianteId)}
            : g
          ),
        };
      }));
      setSuccess('Estudiante quitado del grupo');
    } catch {
      setError('Error al quitar estudiante del grupo');
    }
  };

  const parsearCSV = (texto) => {
    const lineas = texto.trim().split('\n');
    const filas = lineas.slice(1); // omitir encabezado
    return filas.map(linea => {
      const [nombre, apellido, email] = linea.split(',').map(s => s.trim());
      return {nombre, apellido, email};
    }).filter(f => f.email);
  };

  const handleCargarCSV = async (cursoId) => {
    if (!csvFile) return;
    setSubiendoCsv(true);
    setError(''); setSuccess(''); setResultadoCsv(null);
    try {
      const texto = await csvFile.text();
      const estudiantes = parsearCSV(texto);

      if (estudiantes.length === 0) {
        throw new Error('El archivo CSV no contiene filas válidas');
      }

      const res = await fetch(`${API_URL}/api/cursos/${cursoId}/estudiantes-csv`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({estudiantes}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      setResultadoCsv(data.resultados);
      setSuccess('Carga masiva completada');
      setCsvFile(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoCsv(false);
    }
  };

  const estudiantesEnCurso = (curso) => curso.estudiantes.map(e => e.estudianteId);
  const estudiantesNoEnCurso = (curso) =>
    estudiantesDisponibles.filter(e => !estudiantesEnCurso(curso).includes(e.id));

  const estudianteEnAlgunGrupo = (curso, estudianteId) =>
    curso.grupos.some(g => g.estudiantes.some(e => e.estudianteId === estudianteId));

  if (loading) return <div className="prof-root"><Navbar /><div className="prof-loading">Cargando...</div></div>;

  return (
    <div className="prof-root">
      <Navbar />
      <div className="prof-container">

        <div className="prof-header">
          <h1 className="prof-title">Mis cursos</h1>
          <button className="btn-primary" onClick={() => setShowFormCurso(true)}>
            + Nuevo curso
          </button>
        </div>

        {error && <p className="msg-error">{error}</p>}
        {success && <p className="msg-success">{success}</p>}

        {showFormCurso && (
          <div className="form-card">
            <h3>Nuevo curso</h3>
            <form onSubmit={handleCrearCurso} className="prof-form">
              <div className="input-group">
                <label>Nombre del curso</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Diseño 3D Avanzado" required />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Semestre</label>
                  <input value={semestre} onChange={e => setSemestre(e.target.value)} placeholder="Ej: 2025-1" required />
                </div>
                <div className="input-group">
                  <label>Descripción (opcional)</label>
                  <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción breve" />
                </div>
              </div>
              <div className="form-btns">
                <button type="button" className="btn-cancel" onClick={() => setShowFormCurso(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear curso</button>
              </div>
            </form>
          </div>
        )}

        {cursos.length === 0 ? (
          <div className="prof-empty">No tienes cursos creados aún.</div>
        ) : (
          <div className="cursos-lista">
            {cursos.map(curso => (
              <div key={curso.id} className="curso-card">
                <div className="curso-card-header" onClick={() => handleAbrirCurso(curso.id)}>
                  <div>
                    <p className="curso-nombre">{curso.nombre}</p>
                    <p className="curso-meta">{curso.semestre} · {curso.estudiantes.length} estudiantes · {curso.grupos.length} grupos</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{transition: 'transform 0.2s', transform: cursoActivo === curso.id ? 'rotate(180deg)' : 'rotate(0)'}}>
                    <path d="M4 6l4 4 4-4" stroke="#5c35b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {cursoActivo === curso.id && (
                  <div className="curso-detalle">
                    {curso.descripcion && <p className="curso-desc">{curso.descripcion}</p>}

                    {/* Sub-tabs */}
                    <div className="sub-tabs">
                      <button className={`sub-tab ${vistaActiva === 'estudiantes' ? 'sub-tab--active' : ''}`} onClick={() => setVistaActiva('estudiantes')}>
                        Estudiantes
                      </button>
                      <button className={`sub-tab ${vistaActiva === 'grupos' ? 'sub-tab--active' : ''}`} onClick={() => setVistaActiva('grupos')}>
                        Grupos
                      </button>
                      <button className={`sub-tab ${vistaActiva === 'solicitudes' ? 'sub-tab--active' : ''}`} onClick={() => setVistaActiva('solicitudes')}>
                        Solicitudes
                      </button>
                    </div>

                    {/* VISTA ESTUDIANTES */}
                    {vistaActiva === 'estudiantes' && (
                      <>
                        <div className="agregar-estudiante">
                          <select value={estudianteSeleccionado} onChange={e => setEstudianteSeleccionado(e.target.value)} className="est-select">
                            <option value="">Selecciona un estudiante para agregar</option>
                            {estudiantesNoEnCurso(curso).map(e => (
                              <option key={e.id} value={e.id}>{e.nombre} {e.apellido} — {e.email}</option>
                            ))}
                          </select>
                          <button className="btn-agregar" onClick={() => handleAgregarEstudiante(curso.id)} disabled={!estudianteSeleccionado}>
                            Agregar
                          </button>
                        </div>

                        <div className="csv-upload">
                          <p className="csv-label">Carga masiva por CSV (columnas: nombre, apellido, email)</p>
                          <div className="csv-row">
                            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} />
                            <button className="btn-agregar" onClick={() => handleCargarCSV(curso.id)} disabled={!csvFile || subiendoCsv}>
                              {subiendoCsv ? 'Cargando...' : 'Cargar CSV'}
                            </button>
                          </div>
                          {resultadoCsv && (
                            <p className="csv-resultado">
                              ✅ {resultadoCsv.agregados} agregados · {resultadoCsv.creados} cuentas nuevas (contraseña: 1234)
                              {resultadoCsv.errores.length > 0 && ` · ⚠️ ${resultadoCsv.errores.length} errores`}
                            </p>
                          )}
                        </div>

                        <div className="estudiantes-lista">
                          {curso.estudiantes.length === 0 ? (
                            <p className="est-empty">No hay estudiantes en este curso.</p>
                          ) : curso.estudiantes.map(rel => (
                            <div key={rel.id} className="estudiante-row">
                              <div className="est-avatar">{rel.estudiante.nombre[0]}{rel.estudiante.apellido[0]}</div>
                              <div className="est-info">
                                <p className="est-nombre">{rel.estudiante.nombre} {rel.estudiante.apellido}</p>
                                <p className="est-email">{rel.estudiante.email}</p>
                              </div>
                              <button className="btn-eliminar" onClick={() => handleEliminarEstudiante(curso.id, rel.estudianteId)}>Quitar</button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* VISTA GRUPOS */}
                    {vistaActiva === 'grupos' && (
                      <>
                        {!showFormGrupo ? (
                          <button className="btn-secondary-small" onClick={() => setShowFormGrupo(true)}>+ Nuevo grupo</button>
                        ) : (
                          <div className="grupo-form-inline">
                            <input value={nombreGrupo} onChange={e => setNombreGrupo(e.target.value)} placeholder="Ej: Grupo 1" />
                            <button className="btn-agregar" onClick={() => handleCrearGrupo(curso.id)} disabled={!nombreGrupo.trim()}>Crear</button>
                            <button className="btn-cancel-small" onClick={() => {setShowFormGrupo(false); setNombreGrupo('');}}>Cancelar</button>
                          </div>
                        )}

                        {curso.grupos.length === 0 ? (
                          <p className="est-empty" style={{marginTop: '1rem'}}>No hay grupos creados aún.</p>
                        ) : (
                          <div className="grupos-lista">
                            {curso.grupos.map(grupo => (
                              <div key={grupo.id} className="grupo-card">
                                <div className="grupo-header">
                                  <p className="grupo-nombre">{grupo.nombre}</p>
                                  <button className="btn-eliminar" onClick={() => handleEliminarGrupo(curso.id, grupo.id)}>Eliminar grupo</button>
                                </div>

                                <div className="agregar-estudiante" style={{marginTop: '0.75rem'}}>
                                  <select
                                    value={asignacionGrupo[grupo.id] || ''}
                                    onChange={e => setAsignacionGrupo(prev => ({...prev, [grupo.id]: e.target.value}))}
                                    className="est-select"
                                  >
                                    <option value="">Selecciona estudiante del curso</option>
                                    {curso.estudiantes
                                      .filter(rel => !estudianteEnAlgunGrupo(curso, rel.estudianteId))
                                      .map(rel => (
                                        <option key={rel.estudianteId} value={rel.estudianteId}>
                                          {rel.estudiante.nombre} {rel.estudiante.apellido}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    className="btn-agregar"
                                    onClick={() => handleAsignarAGrupo(curso.id, grupo.id)}
                                    disabled={!asignacionGrupo[grupo.id]}
                                  >
                                    Asignar
                                  </button>
                                </div>

                                <div className="estudiantes-lista" style={{marginTop: '0.6rem'}}>
                                  {grupo.estudiantes.length === 0 ? (
                                    <p className="est-empty">Sin estudiantes asignados.</p>
                                  ) : grupo.estudiantes.map(rel => (
                                    <div key={rel.id} className="estudiante-row">
                                      <div className="est-avatar">{rel.estudiante.nombre[0]}{rel.estudiante.apellido[0]}</div>
                                      <div className="est-info">
                                        <p className="est-nombre">{rel.estudiante.nombre} {rel.estudiante.apellido}</p>
                                      </div>
                                      <button className="btn-eliminar" onClick={() => handleQuitarDeGrupo(curso.id, grupo.id, rel.estudianteId)}>Quitar</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* VISTA SOLICITUDES */}
                    {vistaActiva === 'solicitudes' && (
                      <div className="solicitudes-curso-lista">
                        {!pedidosPorCurso[curso.id] ? (
                          <p className="est-empty">Cargando solicitudes...</p>
                        ) : pedidosPorCurso[curso.id].length === 0 ? (
                          <p className="est-empty">No hay solicitudes de impresión para este curso.</p>
                        ) : pedidosPorCurso[curso.id].map(p => {
                          const info = ESTADO_INFO[p.estado] || ESTADO_INFO.PENDIENTE;
                          return (
                            <div key={p.id} className="solicitud-curso-card">
                              <div>
                                <p className="est-nombre">{p.usuario.nombre} {p.usuario.apellido}</p>
                                <p className="curso-meta">{p.proyecto.titulo} · {p.material}</p>
                              </div>
                              <span className="estado-badge" style={{color: info.color, background: info.bg}}>
                                {info.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
