import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ECCD CARE - Button Component
 * Variants: primary, secondary, accent, outline, ghost, danger, danger-outline, success
 * Sizes: sm, md, lg
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="spinner spinner-sm" style={{ border: 'none', animation: 'spin 0.8s linear infinite' }} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
      
      {children && <span>{children}</span>}

      {!isLoading && IconRight && (
        <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}
    </button>
  );
}

export default Button;
