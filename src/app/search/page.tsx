import type { Metadata } from 'next';
import SearchResultsWrapper from '@/components/SearchResultsWrapper';
import { defaultMetadata } from '@/lib/metadata';
import { parseSearchRequest, type SearchQuery } from '@/lib/search';

interface SearchPageProps {
  searchParams: Promise<SearchQuery>;
}

export const generateMetadata = async ({
  searchParams,
}: SearchPageProps): Promise<Metadata> => {
  const { keyword } = parseSearchRequest(await searchParams);

  return defaultMetadata({
    title: keyword ? `'${keyword}' 검색 결과` : '검색',
    description: keyword
      ? `'${keyword}'에 대한 merlog 포스트 검색 결과`
      : 'merlog 포스트 검색',
    url: '/search',
    robots: { index: false, follow: true },
  });
};

const SearchPage = ({ searchParams }: SearchPageProps) => (
  <SearchResultsWrapper searchParams={searchParams} />
);

export default SearchPage;
