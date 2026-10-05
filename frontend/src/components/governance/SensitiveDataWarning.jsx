import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, AlertCircle } from 'lucide-react';

export function SensitiveDataWarning({
  label = 'PhilSys Card & PSA Civil Registry Data',
  maskedValue = '••••-••••-••••-8912',
  actualValue = '9412-4019-2041-8912',
  onLogAccess,
}) {
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleReveal = () => {
    const next = !isRevealed;
    setIsRevealed(next);
    if (next && onLogAccess) {
      onLogAccess('Unmasked Sensitive Record: ' + label);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <div className="sensitive-data-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={16} />
          <span>
            <strong>SENSITIVE DATA WARNING:</strong> Access to PhilSys and PSA Registry identifiers is logged in the permanent audit trail.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7e191b', fontSize: '0.9rem' }}>
            {isRevealed ? actualValue : maskedValue}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleReveal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '0.3rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isRevealed ? 'Mask' : 'Reveal'}</span>
        </button>
      </div>
    </div>
  );
}

export default SensitiveDataWarning;
