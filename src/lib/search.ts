import type { PostSearchData } from '@/types/post';
import { parsePageParam } from './routing';

export type SearchQuery = {
  [key: string]: string | string[] | undefined;
};

export type SearchRequest = {
  keyword: string;
  page: number;
  redirectTo?: string;
};

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const normalizeSearchKeyword = (value: string): string =>
  value.normalize('NFC').replace(/\s+/g, ' ').trim();

export const normalizeSearchText = (value: string): string =>
  normalizeSearchKeyword(value).toLocaleLowerCase('ko-KR');

export const getSearchPath = (keyword: string, page = 1): string => {
  const params = new URLSearchParams();

  if (keyword) {
    params.set('keyword', keyword);
  }

  if (page > 1) {
    params.set('page', page.toString());
  }

  const query = params.toString();
  return query ? `/search?${query}` : '/search';
};

export const parseSearchRequest = (query: SearchQuery): SearchRequest => {
  const rawKeyword = getFirstValue(query.keyword);
  const keyword = rawKeyword ? normalizeSearchKeyword(rawKeyword) : '';

  if (!keyword) {
    const shouldRedirect =
      query.keyword !== undefined || query.page !== undefined;

    return {
      keyword: '',
      page: 1,
      ...(shouldRedirect ? { redirectTo: '/search' } : {}),
    };
  }

  const rawPage = getFirstValue(query.page);
  const page = rawPage === undefined ? 1 : parsePageParam(rawPage);
  const canonicalPath = getSearchPath(keyword, page || 1);
  const hasNonCanonicalQuery =
    rawKeyword !== keyword ||
    Array.isArray(query.keyword) ||
    Array.isArray(query.page) ||
    page === null ||
    rawPage === '1';

  return {
    keyword,
    page: page || 1,
    redirectTo: hasNonCanonicalQuery ? canonicalPath : undefined,
  };
};

export const matchesSearchKeyword = (
  post: PostSearchData,
  keyword: string
): boolean => {
  const normalizedKeyword = normalizeSearchText(keyword);
  const searchableValues = [
    post.title,
    post.description,
    post.content,
    ...post.tags,
  ];

  return searchableValues.some((value) =>
    normalizeSearchText(value).includes(normalizedKeyword)
  );
};
