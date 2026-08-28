import { redirect } from 'next/navigation';
import SearchResults from '@/components/SearchResults';
import { getAllPosts, getAllSearchPosts } from '@/lib/posts';
import {
  getSearchPath,
  matchesSearchKeyword,
  parseSearchRequest,
  type SearchQuery,
} from '@/lib/search';
import { getPaginatedPosts, getTotalPages } from '@/utils/paginationUtils';

interface SearchResultsWrapperProps {
  searchParams: Promise<SearchQuery>;
}

export type SearchResultsData = {
  filteredPosts: Awaited<ReturnType<typeof getAllPosts>>;
  keyword: string;
  currentPage: number;
  totalPages: number;
  totalResults: number;
};

export const getSearchResultsData = async (
  searchParams: SearchResultsWrapperProps['searchParams']
): Promise<SearchResultsData> => {
  const request = parseSearchRequest(await searchParams);

  if (request.redirectTo) {
    redirect(request.redirectTo);
  }

  if (!request.keyword) {
    return {
      filteredPosts: [],
      keyword: '',
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const [searchPosts, allPosts] = await Promise.all([
    getAllSearchPosts(),
    getAllPosts(),
  ]);

  const matchedSlugs = new Set(
    searchPosts
      .filter((post) => matchesSearchKeyword(post, request.keyword))
      .map((post) => post.slug)
  );

  const matchedPosts = allPosts.filter((post) => matchedSlugs.has(post.slug));
  const totalPages = getTotalPages(matchedPosts.length);

  if (
    (totalPages === 0 && request.page > 1) ||
    (totalPages > 0 && request.page > totalPages)
  ) {
    redirect(getSearchPath(request.keyword));
  }

  return {
    filteredPosts: getPaginatedPosts(matchedPosts, request.page),
    keyword: request.keyword,
    currentPage: request.page,
    totalPages,
    totalResults: matchedPosts.length,
  };
};

const SearchResultsWrapper = async ({
  searchParams,
}: SearchResultsWrapperProps) => {
  const { filteredPosts, keyword, currentPage, totalPages, totalResults } =
    await getSearchResultsData(searchParams);

  return (
    <SearchResults
      posts={filteredPosts}
      keyword={keyword}
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalResults}
    />
  );
};

export default SearchResultsWrapper;
