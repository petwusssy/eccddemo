import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * ECCD CARE - Government Data Table Component
 */
export function Table({ children, className = '', ...props }) {
  return (
    <div className="table-container">
      <table className={`table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isSelected = false, ...props }) {
  return (
    <tr
      className={`${className} ${isSelected ? 'row-selected' : ''}`}
      style={isSelected ? { backgroundColor: 'var(--color-primary-50)' } : undefined}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  sortable = false,
  sortDirection, // 'asc' | 'desc' | null
  onSort,
  className = '',
  ...props
}) {
  return (
    <th
      className={`${sortable ? 'sortable' : ''} ${className}`}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
        <span>{children}</span>
        {sortable && (
          <span style={{ color: sortDirection ? 'var(--color-primary-800)' : 'var(--text-subtle)' }}>
            {sortDirection === 'asc' ? (
              <ChevronUp size={14} />
            ) : sortDirection === 'desc' ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronsUpDown size={14} />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

export default Table;
