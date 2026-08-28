import Link from 'next/link';
import { getPaginationGroup } from '@/utils/paginationUtils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  getPageHref?: (page: number) => string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  basePath,
  getPageHref,
}) => {
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const paginationGroup = getPaginationGroup(safeCurrentPage, totalPages);
  const currentGroupStart = paginationGroup[0] ?? 1;
  const currentGroupEnd =
    paginationGroup[paginationGroup.length - 1] ?? totalPages;

  const baseLinkClasses =
    'px-2.5 py-1 text-sm md:text-[16px] md:px-3 md:py-1 border border-gray-300 rounded dark:border-gray-500';
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const activeClasses =
    'bg-accent text-text-dark dark:bg-accent-contrastSurface dark:text-text-dark';

  const getPageLink = (page: number) => {
    if (getPageHref) {
      return getPageHref(page);
    }

    const cleanBasePath = basePath.replace(/\/$/, '');
    return page === 1 ? cleanBasePath || '/' : `${cleanBasePath}/page/${page}`;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className='my-4 flex justify-center items-center space-x-2 dark:text-text-dark'
      aria-label='페이지네이션'
    >
      {safeCurrentPage > 1 ? (
        <Link
          href={getPageLink(1)}
          className={`${baseLinkClasses} ${safeCurrentPage === 1 ? disabledClasses : ''}`}
        >
          처음
        </Link>
      ) : (
        <span className={`${baseLinkClasses} ${disabledClasses}`} aria-disabled>
          처음
        </span>
      )}

      {currentGroupStart > 1 ? (
        <Link
          href={getPageLink(currentGroupStart - 1)}
          className={baseLinkClasses}
        >
          이전
        </Link>
      ) : (
        <span className={`${baseLinkClasses} ${disabledClasses}`} aria-disabled>
          이전
        </span>
      )}

      {paginationGroup.map((page) =>
        page === safeCurrentPage ? (
          <span
            key={page}
            className={`${baseLinkClasses} ${activeClasses}`}
            aria-current='page'
          >
            {page}
          </span>
        ) : (
          <Link key={page} href={getPageLink(page)} className={baseLinkClasses}>
            {page}
          </Link>
        )
      )}

      {currentGroupEnd < totalPages ? (
        <Link
          href={getPageLink(currentGroupEnd + 1)}
          className={baseLinkClasses}
        >
          다음
        </Link>
      ) : (
        <span className={`${baseLinkClasses} ${disabledClasses}`} aria-disabled>
          다음
        </span>
      )}

      {safeCurrentPage < totalPages ? (
        <Link
          href={getPageLink(totalPages)}
          className={`${baseLinkClasses} ${safeCurrentPage === totalPages ? disabledClasses : ''}`}
        >
          끝
        </Link>
      ) : (
        <span className={`${baseLinkClasses} ${disabledClasses}`} aria-disabled>
          끝
        </span>
      )}
    </nav>
  );
};

export default Pagination;
