import {useEffect} from 'react';
import './Toast.css';

export default function Toast({mensaje, tipo = 'success', onClose}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast--${tipo}`}>
      <span className="toast-icon">{tipo === 'success' ? '✓' : '⚠'}</span>
      <span className="toast-mensaje">{mensaje}</span>
    </div>
  );
}
