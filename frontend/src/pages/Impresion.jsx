import Navbar from '../components/Navbar';
import './Placeholder.css';

export default function Impresion() {
  return (
    <div className="placeholder-root">
      <Navbar />
      <div className="placeholder-body">
        <p className="placeholder-tag">Impresión 3D</p>
        <h1 className="placeholder-title">Próximamente</h1>
        <p className="placeholder-desc">
          Aquí podrás solicitar impresiones 3D y hacer seguimiento de tus pedidos.
        </p>
      </div>
    </div>
  );
}
