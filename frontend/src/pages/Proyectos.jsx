import Navbar from '../components/Navbar';
import './Placeholder.css';

export default function Proyectos() {
  return (
    <div className="placeholder-root">
      <Navbar />
      <div className="placeholder-body">
        <p className="placeholder-tag">Proyectos</p>
        <h1 className="placeholder-title">Próximamente</h1>
        <p className="placeholder-desc">
          Aquí podrás explorar todos los proyectos de la comunidad MakerBox.
        </p>
      </div>
    </div>
  );
}
