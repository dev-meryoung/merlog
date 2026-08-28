import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PostInfo } from '@/types/post';
import { getPaginationGroup } from '@/utils/pageUtils';
import { getPaginatedPosts, getTotalPages } from '@/utils/paginationUtils';

const posts = Array.from({ length: 6 }, (_, index): PostInfo => ({
  title: `글 ${index + 1}`,
  description: '',
  date: '2026-01-01',
  tags: [],
  thumbnail: '/images/thumbnail.png',
  slug: `post-${index + 1}`,
  blurDataURL: '',
}));

describe('pagination utilities', () => {
  it('calculates total pages from the configured page size', () => {
    assert.equal(getTotalPages(0), 0);
    assert.equal(getTotalPages(1), 1);
    assert.equal(getTotalPages(5), 1);
    assert.equal(getTotalPages(6), 2);
  });

  it('returns posts for the requested page', () => {
    assert.deepEqual(
      getPaginatedPosts(posts, 1).map(({ slug }) => slug),
      ['post-1', 'post-2', 'post-3', 'post-4', 'post-5']
    );
    assert.deepEqual(
      getPaginatedPosts(posts, 2).map(({ slug }) => slug),
      ['post-6']
    );
    assert.deepEqual(getPaginatedPosts(posts, 3), []);
  });

  it('groups pagination controls without exceeding the last page', () => {
    assert.deepEqual(getPaginationGroup(1, 12), [1, 2, 3, 4, 5]);
    assert.deepEqual(getPaginationGroup(6, 12), [6, 7, 8, 9, 10]);
    assert.deepEqual(getPaginationGroup(11, 12), [11, 12]);
  });
});
