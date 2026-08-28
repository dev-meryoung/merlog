import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchesSearchKeyword, parseSearchRequest } from '@/lib/search';
import type { PostSearchData } from '@/types/post';

const post: PostSearchData = {
  title: 'Next.js 블로그',
  description: '검색 테스트',
  content: '서버 컴포넌트에서 검색합니다.',
  tags: ['Next.js', '블로그'],
  slug: 'next-blog',
  date: '2026-01-01',
};

describe('search utilities', () => {
  it('normalizes keyword and page query parameters', () => {
    assert.deepEqual(parseSearchRequest({}), { keyword: '', page: 1 });
    assert.deepEqual(parseSearchRequest({ keyword: ' Next.js ' }), {
      keyword: 'Next.js',
      page: 1,
      redirectTo: '/search?keyword=Next.js',
    });
    assert.deepEqual(parseSearchRequest({ keyword: 'Next.js', page: '02' }), {
      keyword: 'Next.js',
      page: 1,
      redirectTo: '/search?keyword=Next.js',
    });
  });

  it('matches titles, descriptions, tags, and body content', () => {
    assert.equal(matchesSearchKeyword(post, 'next.JS'), true);
    assert.equal(matchesSearchKeyword(post, '서버 컴포넌트'), true);
    assert.equal(matchesSearchKeyword(post, '없는 검색어'), false);
  });
});
