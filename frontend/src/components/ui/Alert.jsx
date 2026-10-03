import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';

/**
 * ECCD CARE - Alert / Banner Component
 */
export function Alert({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  className = '',
  ...props
}) {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertOctagon,
  };

  const IconComponent = icons[variant] || Info;

  return (
    <div className={`alert alert-${variant} ${className}`} role="alert" {...props}>
      <span className="alert-icon">
        <IconComponent size={18} />
      </span>

      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-description">{children}</div>
        {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
      </div>

      {onDismiss && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default Alert;
