import React, { useState } from 'react';
import { Lock, Clock, LogOut, KeyRound } from 'lucide-react';
import Button from '../ui/Button';

export function SessionExpiryModal({
  user,
  roleLabel,
  onUnlock,
  onSignOut,
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password to unlock the session.');
      return;
    }
    // Accept demo password or any entry in prototype mode
    onUnlock();
  };

  return (
    <div className="session-modal-overlay">
      <div className="session-lock-card">
        <div className="session-lock-icon">
          <Clock size={32} />
        </div>

        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e191b' }}>
            Session Expired
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            CSWDO Prototype Security & Governance Policy Timeout
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem', width: '100%' }}>
          <div style={{ fontWeight: 700, color: '#1e1112' }}>{user?.name || 'Authorized Staff'}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{roleLabel || user?.role}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              Confirm Password to Re-authenticate
            </label>
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: error ? '1px solid #e11d48' : '1px solid #cbd5e1',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                outline: 'none',
              }}
            />
            {error && (
              <div style={{ fontSize: '0.75rem', color: '#e11d48', marginTop: '0.25rem' }}>
                {error}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={KeyRound}
            className="w-full"
          >
            Unlock Session
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={onSignOut}
            className="w-full"
          >
            Sign Out & Switch Account
          </Button>
        </form>

        <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
          ECCD CARE Governance Control • Simulated Inactivity Lockout
        </div>
      </div>
    </div>
  );
}

export default SessionExpiryModal;
