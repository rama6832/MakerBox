import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import './GestionInventario.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function GestionInventario() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [edicionStock, setEdicionStock] = useState({}); // {articuloId: valorEditando}
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Form nuevo artículo
  const [nombre, setNombre] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('unidad');

  const fetchArticulos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventario`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.status === 403) {navigate('/'); return;}
      setArticulos(await res.json());
    } catch {
      setError('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {navigate('/login'); return;}
    fetchArticulos();
  }, []);

  const handleCrearArticulo = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/inventario`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          nombre,
          stockActual: Number(stockActual) || 0,
          stockMinimo: Number(stockMinimo) || 5,
          unidadMedida,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setArticulos(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSuccess('Artículo creado correctamente');
      setNombre(''); setStockActual(''); setStockMinimo(''); setUnidadMedida('unidad');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuardarStock = async (id) => {
    const nuevoValor = edicionStock[id];
    if (nuevoValor === undefined || nuevoValor === '') return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/inventario/${id}/stock`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({stockActual: Number(nuevoValor)}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      setArticulos(prev => prev.map(a => a.id === id ? data : a));
      setEdicionStock(prev => {
        const copia = {...prev};
        delete copia[id];
        return copia;
      });
      setSuccess('Stock actualizado correctamente');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async (id) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/inventario/${id}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error();
      setArticulos(prev => prev.filter(a => a.id !== id));
      setSuccess('Artículo eliminado');
    } catch {
      setError('Error al eliminar artículo');
    }
  };

  const bajoStock = articulos.filter(a => a.stockActual < a.stockMinimo);

  if (loading) return <div className="inv-root"><Navbar /><div className="inv-loading">Cargando...</div></div>;

  return (
    <div className="inv-root">
      <Navbar />
      <div className="inv-container">

        <div className="inv-header">
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-subtitle">{articulos.length} artículos · {bajoStock.length} con stock bajo</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuevo artículo</button>
        </div>

        {error && <p className="msg-error">{error}</p>}
        {success && <p className="msg-success">{success}</p>}

        {bajoStock.length > 0 && (
          <div className="alerta-bajo-stock">
            ⚠️ {bajoStock.length} artículo(s) con stock bajo: {bajoStock.map(a => a.nombre).join(', ')}
          </div>
        )}

        {showForm && (
          <div className="form-card">
            <h3>Nuevo artículo</h3>
            <form onSubmit={handleCrearArticulo} className="inv-form">
              <div className="input-group">
                <label>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Filamento PLA blanco" required />
              </div>
              <div className="form-row-3">
                <div className="input-group">
                  <label>Stock actual</label>
                  <input type="number" min="0" value={stockActual} onChange={e => setStockActual(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Stock mínimo</label>
                  <input type="number" min="0" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} placeholder="5" />
                </div>
                <div className="input-group">
                  <label>Unidad</label>
                  <select value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)}>
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="rollo">Rollo</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
              </div>
              <div className="form-btns">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear artículo</button>
              </div>
            </form>
          </div>
        )}

        {articulos.length === 0 ? (
          <div className="inv-empty">No hay artículos en el inventario aún.</div>
        ) : (
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Unidad</th>
                  <th>Actualizar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {articulos.map(a => {
                  const bajo = a.stockActual < a.stockMinimo;
                  return (
                    <tr key={a.id} className={bajo ? 'fila-bajo-stock' : ''}>
                      <td className="td-nombre">{a.nombre}</td>
                      <td>
                        <span className={bajo ? 'stock-bajo' : 'stock-ok'}>{a.stockActual}</span>
                      </td>
                      <td className="td-muted">{a.stockMinimo}</td>
                      <td className="td-muted">{a.unidadMedida}</td>
                      <td>
                        <div className="stock-edit">
                          <input
                            type="number"
                            min="0"
                            placeholder={String(a.stockActual)}
                            value={edicionStock[a.id] ?? ''}
                            onChange={e => setEdicionStock(prev => ({...prev, [a.id]: e.target.value}))}
                          />
                          <button
                            className="btn-guardar-stock"
                            onClick={() => handleGuardarStock(a.id)}
                            disabled={edicionStock[a.id] === undefined || edicionStock[a.id] === ''}
                          >
                            Guardar
                          </button>
                        </div>
                      </td>
                      <td>
                        <button className="btn-eliminar" onClick={() => handleEliminar(a.id)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
