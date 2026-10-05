import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

export function ConfirmationDialog({
  isOpen,
  title = 'Confirm Sensitive Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger', // danger | warning | primary
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="res-modal-overlay" onClick={onCancel}>
      <div className="res-modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="res-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: variant === 'danger' ? '#be123c' : '#7e191b' }}>
            <AlertTriangle size={20} />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="res-modal-body" style={{ gap: '0.875rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>

          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b' }}>
            <strong>Governance Note:</strong> This action will be recorded in the immutable system audit log with your user timestamp and IP address.
          </div>
        </div>

        <div className="res-modal-footer">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
