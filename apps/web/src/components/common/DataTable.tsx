import React from 'react';
import { Table, Pagination, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  total,
  page,
  limit,
  onPageChange,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  loading = false,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="bg-white rounded border overflow-hidden">
      {onSearchChange !== undefined && (
        <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white border-end-0">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          <small className="text-muted fw-semibold">
            Showing {data.length} of {total} records
          </small>
        </div>
      )}

      <div className="table-responsive">
        <Table hover className="mb-0 align-middle">
          <thead className="table-light text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width, color: '#4B5563', padding: '12px 16px' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} style={{ fontSize: '0.9rem' }}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} style={{ padding: '12px 16px' }}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? String(row[col.accessor] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <small className="text-muted">
            Page {page} of {totalPages}
          </small>
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            <Pagination.Next disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
          </Pagination>
        </div>
      )}
    </div>
  );
}
