import React from 'react';
import { Inbox, FileSearch, AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * ECCD CARE - Empty State Component
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active records in this section at the moment.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon-wrapper">
        <Icon size={28} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ECCD CARE - Spinner & Full Loading State
 */
export function Spinner({ size = 'md', className = '', color = 'currentColor' }) {
  const sizeMap = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
  };

  return (
    <span
      className={`spinner ${sizeMap[size] || 'spinner-md'} ${className}`}
      style={{ borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingOverlay({ text = 'Retrieving ECCD records from CSWDO central database...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        gap: '0.75rem',
        color: 'var(--text-secondary)',
      }}
    >
      <Spinner size="lg" color="var(--color-primary-800)" />
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{text}</span>
    </div>
  );
}

/**
 * ECCD CARE - Skeleton Loaders
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton skeleton-text"
          style={{ width: idx === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem' }} aria-busy="true">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="skeleton skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
        <div style={{ flexGrow: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: 14 }} />
          <div className="skeleton skeleton-text" style={{ width: '70%', height: 10, margin: 0 }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" style={{ width: '100%', height: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '85%', height: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 12, margin: 0 }} />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '0.875rem 1rem' }}>
              <div
                className="skeleton skeleton-text"
                style={{
                  height: 14,
                  width: cIdx === 0 ? '40%' : cIdx === 1 ? '75%' : '60%',
                  margin: 0,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * ECCD CARE - Error State with Retry
 */
export function ErrorState({
  title = 'Unable to Load Records',
  message = 'A server connection timeout occurred while connecting to the CSWDO data registry. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`} style={{ borderColor: 'var(--color-danger-border)' }}>
      <div
        className="empty-state-icon-wrapper"
        style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-primary)' }}
      >
        <AlertCircle size={28} />
      </div>
      <h4 className="empty-state-title" style={{ color: 'var(--color-danger-primary)' }}>
        {title}
      </h4>
      <p className="empty-state-description">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}
