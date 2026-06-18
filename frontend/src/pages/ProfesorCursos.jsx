import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './ProfesorCursos.css';

const API_URL = 'http://localhost:3000';

export default function ProfesorCursos() {
  const [cursos, setCursos] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursoActivo, setCursoActivo] = useState(null);
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

  useEffect(() => {
    if (!token) {navigate('/login'); return;}
    fetchData();
  }, []);

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
      setCursos(prev => [{...data, estudiantes: []}, ...prev]);
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
      setCursos(prev => prev.map(c => c.id === cursoId
        ? {...c, estudiantes: [...c.estudiantes, data]}
        : c
      ));
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

  const estudiantesEnCurso = (curso) => curso.estudiantes.map(e => e.estudianteId);

  const estudiantesNoEnCurso = (curso) =>
    estudiantesDisponibles.filter(e => !estudiantesEnCurso(curso).includes(e.id));

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

        {/* FORM CURSO */}
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

        {/* LISTA DE CURSOS */}
        {cursos.length === 0 ? (
          <div className="prof-empty">No tienes cursos creados aún.</div>
        ) : (
          <div className="cursos-lista">
            {cursos.map(curso => (
              <div key={curso.id} className="curso-card">
                <div className="curso-card-header" onClick={() => setCursoActivo(cursoActivo === curso.id ? null : curso.id)}>
                  <div>
                    <p className="curso-nombre">{curso.nombre}</p>
                    <p className="curso-meta">{curso.semestre} · {curso.estudiantes.length} estudiantes</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{transition: 'transform 0.2s', transform: cursoActivo === curso.id ? 'rotate(180deg)' : 'rotate(0)'}}>
                    <path d="M4 6l4 4 4-4" stroke="#5c35b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {cursoActivo === curso.id && (
                  <div className="curso-detalle">
                    {curso.descripcion && <p className="curso-desc">{curso.descripcion}</p>}

                    {/* Agregar estudiante */}
                    <div className="agregar-estudiante">
                      <select
                        value={estudianteSeleccionado}
                        onChange={e => setEstudianteSeleccionado(e.target.value)}
                        className="est-select"
                      >
                        <option value="">Selecciona un estudiante para agregar</option>
                        {estudiantesNoEnCurso(curso).map(e => (
                          <option key={e.id} value={e.id}>{e.nombre} {e.apellido} — {e.email}</option>
                        ))}
                      </select>
                      <button
                        className="btn-agregar"
                        onClick={() => handleAgregarEstudiante(curso.id)}
                        disabled={!estudianteSeleccionado}
                      >
                        Agregar
                      </button>
                    </div>

                    {/* Lista estudiantes */}
                    <div className="estudiantes-lista">
                      {curso.estudiantes.length === 0 ? (
                        <p className="est-empty">No hay estudiantes en este curso.</p>
                      ) : curso.estudiantes.map(rel => (
                        <div key={rel.id} className="estudiante-row">
                          <div className="est-avatar">
                            {rel.estudiante.nombre[0]}{rel.estudiante.apellido[0]}
                          </div>
                          <div className="est-info">
                            <p className="est-nombre">{rel.estudiante.nombre} {rel.estudiante.apellido}</p>
                            <p className="est-email">{rel.estudiante.email}</p>
                          </div>
                          <button
                            className="btn-eliminar"
                            onClick={() => handleEliminarEstudiante(curso.id, rel.estudianteId)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
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
