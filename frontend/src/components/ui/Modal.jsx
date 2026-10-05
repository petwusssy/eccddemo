import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ECCD CARE - Accessible Modal Dialog Component
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'md' | 'lg'
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    '2xl': 'modal-2xl',
    full: 'modal-full',
  };
  const sizeClass = sizeClasses[size] || (size ? `modal-${size}` : 'modal-md');
  const hasHeader = Boolean(title || subtitle);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={hasHeader ? 'modal-title' : undefined}
    >
      <div className={`modal-container ${sizeClass} ${className}`}>
        {hasHeader ? (
          <div className="modal-header">
            <div>
              {title && (
                <h3 id="modal-title" className="modal-title">
                  {title}
                </h3>
              )}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="btn-ghost btn-sm btn-icon-only modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="modal-floating-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * ECCD CARE - Slide-over Drawer Component
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className={`drawer-panel ${className}`} role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm btn-icon-only"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">{children}</div>

        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </>
  );
}

export default Modal;
