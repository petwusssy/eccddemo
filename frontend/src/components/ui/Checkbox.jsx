import React from 'react';

/**
 * ECCD CARE - Checkbox Component
 */
export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  description,
  name,
  value,
  className = '',
  ...props
}) {
  const checkboxId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label htmlFor={checkboxId} className={`checkbox-label ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="visually-hidden"
        {...props}
      />
      <span className="checkbox-custom" aria-hidden="true" />
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span>{label}</span>
        {description && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );
}

/**
 * ECCD CARE - Radio Component
 */
export function Radio({
  id,
  label,
  name,
  value,
  checked,
  onChange,
  disabled = false,
  description,
  className = '',
  ...props
}) {
  const radioId = id || `radio-${name}-${value}`;

  return (
    <label htmlFor={radioId} className={`radio-label ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="visually-hidden"
        {...props}
      />
      <span className="radio-custom" aria-hidden="true" />
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span>{label}</span>
        {description && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );
}

/**
 * ECCD CARE - Switch (Toggle) Component
 */
export function Switch({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className = '',
  ...props
}) {
  const switchId = id || (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label htmlFor={switchId} className={`switch-wrapper ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        id={switchId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className="visually-hidden"
        {...props}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{label}</span>
        {description && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );
}
