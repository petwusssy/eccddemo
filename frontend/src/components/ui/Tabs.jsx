import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * ECCD CARE - Tabs Component
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pills'
  className = '',
}) {
  const isPills = variant === 'pills';

  return (
    <nav className={`${isPills ? 'tabs-pills' : 'tabs-nav'} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${isPills ? 'tab-pill-btn' : 'tab-btn'} ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={15} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'var(--color-primary-100)' : 'var(--bg-subtle)',
                  color: isActive ? 'var(--color-primary-900)' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * ECCD CARE - Breadcrumb Component
 */
export function Breadcrumb({ items = [], className = '' }) {
  return (
    <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
      <span className="breadcrumb-item">
        <Home size={13} style={{ marginTop: '-1px' }} />
      </span>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={13} />
            </span>

            {isLast ? (
              <span className="breadcrumb-item is-current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                className="breadcrumb-item"
                onClick={item.onClick}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
