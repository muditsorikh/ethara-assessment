import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import './Toast.css';

function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`toast toast-${type} ${!isVisible ? 'toast-exit' : ''}`}>
      <Icon size={20} />
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
