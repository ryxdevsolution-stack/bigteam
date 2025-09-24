import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  actions?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  actions = true,
  pagination = true,
  itemsPerPage = 10,
}) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;

    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl sm:rounded-2xl bg-white dark:bg-dark-800/95 backdrop-blur-xl border-2 border-light-300 dark:border-dark-600 shadow-2xl overflow-hidden"
    >
      {title && (
        <div className="p-4 sm:p-6 border-b-2 border-light-300 dark:border-dark-600 bg-gradient-to-r from-accent-bitcoin/5 to-accent-orange/5 dark:from-accent-bitcoin/10 dark:to-accent-orange/10">
          <h3 className="text-base sm:text-lg font-black text-dark-950 dark:text-white">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-light-400 dark:border-dark-600 bg-gradient-to-r from-accent-bitcoin/10 to-accent-orange/10 dark:from-dark-900 dark:to-dark-900">
              <th className="p-4 text-left">
                <label className="sr-only">Select all rows</label>
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={toggleAllSelection}
                  aria-label="Select all rows"
                  className="rounded border-light-400 dark:border-dark-600 bg-white dark:bg-dark-700 text-accent-bitcoin dark:text-accent-gold focus:ring-accent-bitcoin accent-accent-bitcoin"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`p-3 sm:p-4 text-left text-xs sm:text-sm font-black text-dark-900 dark:text-white uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:text-accent-bitcoin dark:hover:text-accent-gold transition-colors' : ''
                  }`}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="text-accent-bitcoin dark:text-accent-gold font-black">
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-black text-dark-900 dark:text-white uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rowIndex * 0.05 }}
                className="border-b border-light-200 dark:border-dark-700 bg-white dark:bg-dark-800/60 hover:bg-gradient-to-r hover:from-accent-bitcoin/5 hover:to-accent-orange/5 dark:hover:from-accent-bitcoin/10 dark:hover:to-accent-orange/10 transition-all duration-200"
              >
                <td className="p-2 sm:p-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    aria-label={`Select row ${rowIndex + 1}`}
                    className="rounded border-light-400 dark:border-dark-600 bg-white dark:bg-dark-700 text-accent-bitcoin dark:text-accent-gold focus:ring-accent-bitcoin accent-accent-bitcoin"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="p-2 sm:p-4 text-xs sm:text-sm font-bold text-dark-950 dark:text-white">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="p-2 sm:p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        aria-label="View details"
                        title="View details"
                        className="p-1 sm:p-1.5 rounded-lg hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20 transition-colors duration-200">
                        <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-dark-700 dark:text-dark-200" />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit item"
                        title="Edit item"
                        className="p-1 sm:p-1.5 rounded-lg hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20 transition-colors duration-200">
                        <Edit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-dark-700 dark:text-dark-200" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete item"
                        title="Delete item"
                        className="p-1 sm:p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200">
                        <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between border-t-2 border-light-300 dark:border-dark-600 bg-gradient-to-r from-accent-bitcoin/5 to-accent-orange/5 dark:from-dark-900/50 dark:to-dark-900/50 gap-3">
          <div className="text-xs sm:text-sm font-bold text-dark-900 dark:text-white">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              title="Previous page"
              className="p-1.5 sm:p-2 rounded-lg hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-dark-900 dark:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 5) return true;
                if (page === 1 || page === totalPages) return true;
                return Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] < page - 1 && (
                    <span className="px-1 sm:px-2 text-dark-900 dark:text-white font-black">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 text-xs sm:text-sm font-black ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white shadow-lg scale-110'
                        : 'hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20 text-dark-900 dark:text-white hover:scale-105'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              title="Next page"
              className="p-1.5 sm:p-2 rounded-lg hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-dark-900 dark:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataTable;