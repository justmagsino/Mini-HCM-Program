import { Button } from './Button.jsx';

/**
 * @param {{
 *   pageRowCount: number;
 *   total: number;
 *   page: number;
 *   totalPages: number;
 *   onPageChange: (page: number) => void;
 *   loading?: boolean;
 *   ariaLabel?: string;
 * }} props
 */
export function TablePaginationFooter({
  pageRowCount,
  total,
  page,
  totalPages,
  onPageChange,
  loading = false,
  ariaLabel = 'Table pagination',
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      className="table-pagination"
      aria-label={ariaLabel}
    >
      <span>
        Showing {pageRowCount} of {total} · Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canPrev || loading}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canNext || loading}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
