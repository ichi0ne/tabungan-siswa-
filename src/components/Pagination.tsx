/**
 * Pagination Component
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 border-t border-slate-200 bg-white text-xs text-slate-600 rounded-b-2xl">
      <div>
        Menampilkan <span className="font-semibold text-slate-900">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> dari{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> data
      </div>

      <div className="flex items-center gap-1.5">
        <button
          id="btn-prev-page"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 3 + i;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
          }
          if (pageNum < 1 || pageNum > totalPages) return null;

          return (
            <button
              key={pageNum}
              id={`btn-page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          id="btn-next-page"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
