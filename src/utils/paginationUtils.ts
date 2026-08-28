import { POSTS_PER_PAGE } from '@/constants';
import type { PostInfo } from '@/types/post';

export const getPaginationGroup = (
  currentPage: number,
  totalPages: number,
  groupSize = 5
): number[] => {
  const start = Math.floor((currentPage - 1) / groupSize) * groupSize + 1;
  const end = Math.min(start + groupSize - 1, totalPages);
  const pages: number[] = [];

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  return pages;
};

export const getTotalPages = (totalPosts: number): number =>
  Math.ceil(totalPosts / POSTS_PER_PAGE);

export const getPaginatedPosts = (
  posts: PostInfo[],
  page: number
): PostInfo[] => {
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  return posts.slice(start, end);
};
