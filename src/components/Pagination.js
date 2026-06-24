export default function Pagination({ page, totalPages, total, limit, onPage }) {
  if (!total || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  /* Build the page-number list with ellipsis */
  function pageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const nums = new Set([1, totalPages, page]);
    if (page > 1) nums.add(page - 1);
    if (page < totalPages) nums.add(page + 1);

    const sorted = [...nums].sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const n of sorted) {
      if (n - prev > 1) result.push('…');
      result.push(n);
      prev = n;
    }
    return result;
  }

  const btnBase =
    'h-8 min-w-[2rem] px-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[var(--color-np-border)]">
      {/* Count info */}
      <p className="text-xs text-[var(--color-np-muted)] order-2 sm:order-1">
        Showing <span className="font-semibold text-[var(--color-np-text)]">{from}–{to}</span> of{' '}
        <span className="font-semibold text-[var(--color-np-text)]">{total}</span>
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={`${btnBase} text-[var(--color-np-muted)] hover:bg-[var(--color-np-gray)] disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="h-8 px-1 flex items-center text-sm text-[var(--color-np-muted)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`${btnBase} ${
                p === page
                  ? 'bg-[var(--color-np-red)] text-white shadow-sm'
                  : 'text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)]'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} text-[var(--color-np-muted)] hover:bg-[var(--color-np-gray)] disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
