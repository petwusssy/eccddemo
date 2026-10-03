import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((firstArg, secondArg = 'info', maybeDuration = 4000) => {
    let type = 'info';
    let title = '';
    let message = '';
    let duration = 4000;

    if (firstArg && typeof firstArg === 'object' && !React.isValidElement(firstArg) && !(firstArg instanceof Error)) {
      // Called with config object: addToast({ type, title, message, duration })
      type = firstArg.type || firstArg.status || 'info';
      title = firstArg.title || '';
      message = firstArg.message || firstArg.description || firstArg.error || '';
      duration = firstArg.duration ?? 4000;
    } else {
      // Called as: addToast(message, type, duration)
      if (firstArg instanceof Error) {
        message = firstArg.message;
      } else if (typeof firstArg === 'string') {
        message = firstArg;
      } else if (firstArg !== null && typeof firstArg !== 'undefined') {
        message = firstArg.message || firstArg.error || String(firstArg);
      }
      type = typeof secondArg === 'string' ? secondArg : 'info';
      duration = typeof maybeDuration === 'number' ? maybeDuration : 4000;
    }

    // Map 'error' alias to 'danger' for CSS class .toast-danger
    if (type === 'error') type = 'danger';

    // Safely extract string if message was passed as an object
    if (typeof message === 'object' && message !== null) {
      message = message.message || message.error || JSON.stringify(message);
    }

    // Guard against undefined or empty string
    message = String(message || '').trim();
    if (!message && !title) {
      message = type === 'danger' ? 'An unexpected error occurred.' : 'Action completed successfully.';
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    error: AlertCircle,
    info: Info,
  };

  const iconColors = {
    success: 'var(--color-success-primary)',
    warning: 'var(--color-warning-primary)',
    danger: 'var(--color-danger-primary)',
    error: 'var(--color-danger-primary)',
    info: 'var(--color-info-primary)',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
              <span style={{ color: iconColors[toast.type] || 'inherit', flexShrink: 0, marginTop: '2px' }}>
                <Icon size={18} />
              </span>

              <div style={{ flexGrow: 1 }}>
                {toast.title && (
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {toast.title}
                  </div>
                )}
                {toast.message && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-ghost btn-sm btn-icon-only"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                style={{ padding: '2px', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
