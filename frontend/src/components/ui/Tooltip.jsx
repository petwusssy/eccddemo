import React, { useState } from 'react';

/**
 * ECCD CARE - Lightweight Tooltip Component
 */
export function Tooltip({ text, children, position = 'top', className = '' }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`tooltip-container ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <span className="tooltip-box" role="tooltip">
          {text}
        </span>
      )}
    </div>
  );
}

export default Tooltip;
