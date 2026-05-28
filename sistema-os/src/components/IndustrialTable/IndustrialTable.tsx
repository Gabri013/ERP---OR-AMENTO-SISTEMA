// src/components/IndustrialTable/IndustrialTable.tsx
import React, { useState } from 'react';
import './IndustrialTable.css';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface IndustrialTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: any[];
  onSelectChange?: (selectedIds: any[]) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  searchFilters?: React.ReactNode;
}

export function IndustrialTable<T extends { id?: number | string }>({
  columns,
  data,
  title,
  actions,
  onRowClick,
  selectable,
  selectedRows = [],
  onSelectChange,
  loading,
  pagination,
  searchFilters
}: IndustrialTableProps<T>) {
  const [sortCol, setSortCol] = useState<string>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<any>();

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  const toggleRow = (id: any) => {
    if (onSelectChange) {
      onSelectChange(
        selectedRows.includes(id)
          ? selectedRows.filter(rid => rid !== id)
          : [...selectedRows, id]
      );
    }
  };

  const toggleAll = () => {
    if (onSelectChange) {
      onSelectChange(
        selectedRows.length === data.length
          ? []
          : data.map((row: any) => row.id)
      );
    }
  };

  return (
    <div className="industrial-table-container">
      {/* HEADER DA TABELA */}
      {(title || searchFilters) && (
        <div className="table-header">
          {title && <h2 className="table-title">{title}</h2>}
          {searchFilters && <div className="table-filters">{searchFilters}</div>}
        </div>
      )}

      {/* TABELA */}
      <div className="table-wrapper">
        <table className="industrial-table">
          {/* HEAD */}
          <thead>
            <tr>
              {selectable && (
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? 'sortable' : ''}
                >
                  <div className="th-content">
                    {col.label}
                    {col.sortable && sortCol === col.key && (
                      <span className="sort-icon">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="col-actions">Ações</th>}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="loading">⏳ Carregando...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="empty">📭 Nenhum registro encontrado</div>
                </td>
              </tr>
            ) : (
              data.map((row: any, idx) => (
                <tr
                  key={row.id || idx}
                  className={`
                    ${hoveredRow === row.id ? 'hovered' : ''}
                    ${selectedRows.includes(row.id) ? 'selected' : ''}
                  `}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(undefined)}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align }}
                      className="cell"
                    >
                      {col.render
                        ? col.render((row as any)[col.key], row)
                        : (row as any)[col.key] || '—'}
                    </td>
                  ))}
                  {actions && (
                    <td className="col-actions">
                      <div onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {pagination && (
        <div className="table-footer">
          <div className="pagination-info">
            Exibindo {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            <strong>{pagination.total}</strong> resultados
          </div>
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="page-btn"
            >
              ← Anterior
            </button>

            {Array.from({
              length: Math.ceil(pagination.total / pagination.limit)
            }).map((_, idx) => {
              const pageNum = idx + 1;
              // Mostrar apenas 5 páginas ao redor da página atual
              if (
                pageNum < pagination.page - 2 ||
                pageNum > pagination.page + 2
              ) {
                if (pageNum !== 1 && pageNum !== Math.ceil(pagination.total / pagination.limit)) {
                  return null;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={pagination.page === Math.ceil(pagination.total / pagination.limit)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="page-btn"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
