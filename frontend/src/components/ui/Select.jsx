import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ECCD CARE - Select Component
 */
export function Select({
  id,
  label,
  options = [],
  value,
  onChange,
  required = false,
  error,
  helper,
  disabled = false,
  placeholder = 'Select an option...',
  className = '',
  ...props
}) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="form-control-wrapper">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`select ${error ? 'is-invalid' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      </div>

      {error ? (
        <span className="form-error-msg" role="alert">
          <AlertCircle size={13} />
          {error}
        </span>
      ) : helper ? (
        <span className="form-helper">{helper}</span>
      ) : null}
    </div>
  );
}

export default Select;
