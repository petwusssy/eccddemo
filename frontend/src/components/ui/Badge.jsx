import React from 'react';

/**
 * ECCD CARE - Badge / Status Pill Component
 * Variants: success, warning, danger, info, neutral, primary
 */
export function Badge({
  children,
  variant = 'neutral',
  dot = true,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
