import React from 'react';
import { TrendingUp, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';

/**
 * ECCD CARE - Standard Card Components
 */
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, subtitle, className = '', ...props }) {
  return (
    <div className="page-title-group">
      <h3 className={`card-title ${className}`} {...props}>
        {children}
      </h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * ECCD CARE - Metric / KPI Summary Card
 */
export function MetricCard({
  label,
  value,
  delta,
  trend = 'neutral',
  icon: Icon,
  color = 'primary',
  className = '',
  onClick,
}) {
  const colorStyles = {
    primary: { bg: 'var(--color-primary-50)', color: 'var(--color-primary-800)', border: 'var(--color-primary-100)' },
    accent: { bg: 'var(--color-accent-50)', color: 'var(--color-accent-700)', border: 'var(--color-accent-100)' },
    warning: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-primary)', border: 'var(--color-warning-border)' },
    danger: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger-primary)', border: 'var(--color-danger-border)' },
  };

  const currentStyle = colorStyles[color] || colorStyles.primary;

  return (
    <div
      className={`metric-card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="metric-card-top">
        <span className="metric-card-label">{label}</span>
        {Icon && (
          <div
            className="metric-card-icon"
            style={{
              backgroundColor: currentStyle.bg,
              color: currentStyle.color,
              border: `1px solid ${currentStyle.border}`,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="metric-card-value">{value}</div>

      {delta && (
        <div className="metric-card-footer">
          {trend === 'up' && <TrendingUp size={14} style={{ color: 'var(--color-success-primary)' }} />}
          {trend === 'warning' && <AlertTriangle size={14} style={{ color: 'var(--color-warning-primary)' }} />}
          {trend === 'urgent' && <AlertCircle size={14} style={{ color: 'var(--color-danger-primary)' }} />}
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}

export default Card;
