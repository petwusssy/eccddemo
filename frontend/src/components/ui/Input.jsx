import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * ECCD CARE - Input Component
 */
export function Input({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onClear,
  icon: Icon,
  leftIcon,
  rightIcon,
  required = false,
  error,
  helper,
  disabled = false,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const resolvedLeftIcon = leftIcon || (Icon ? <Icon size={16} /> : null);
  const hasLeftIcon = Boolean(resolvedLeftIcon);
  const hasRightIcon = Boolean((onClear && value) || rightIcon);

  const isPhone = type === 'tel' || type === 'phone' || props.isPhone || Boolean(label && /(contact|phone|telephone|mobile)/i.test(label));
  const isUppercase = props.uppercase || props.isUppercase || false;

  const resolvedType = isPhone ? 'tel' : type;
  const resolvedInputMode = props.inputMode || (isPhone ? 'numeric' : undefined);
  const resolvedPattern = props.pattern || (isPhone ? '[0-9]*' : undefined);

  const handleInputChange = (e) => {
    if (!onChange) return;
    if (isPhone) {
      // Automatic numeric keyboard + filter to digits only (0-9)
      const digitsOnly = e.target.value.replace(/\D/g, '');
      e.target.value = digitsOnly;
    } else if (isUppercase) {
      e.target.value = e.target.value.toUpperCase();
    }
    onChange(e);
  };

  const inputStyle = {
    ...(props.style || {}),
    ...(isUppercase ? { textTransform: 'uppercase' } : {}),
  };

  return (
    <div className={`form-group ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="form-control-wrapper">
        {resolvedLeftIcon && (
          <span className="input-icon-left">
            {resolvedLeftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          inputMode={resolvedInputMode}
          pattern={resolvedPattern}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          style={inputStyle}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          className={`input ${hasLeftIcon ? 'has-left-icon' : ''} ${hasRightIcon ? 'has-right-icon' : ''} ${error ? 'is-invalid' : ''} ${className}`}
          {...props}
        />

        {hasRightIcon && (
          <button
            type="button"
            className="input-icon-right"
            onClick={onClear}
            title="Clear text"
            aria-label="Clear text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-error`} className="form-error-msg" role="alert">
          <AlertCircle size={13} />
          {error}
        </span>
      ) : helper ? (
        <span id={`${inputId}-helper`} className="form-helper">
          {helper}
        </span>
      ) : null}
    </div>
  );
}

/**
 * ECCD CARE - Textarea Component
 */
export function Textarea({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  helper,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`textarea ${error ? 'is-invalid' : ''} ${className}`}
        {...props}
      />

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

export default Input;
