import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getTagPagePath,
  getTagPath,
  normalizeTagParam,
  parsePageParam,
} from '@/lib/routing';

describe('routing utilities', () => {
  it('accepts only canonical positive integer page parameters', () => {
    assert.equal(parsePageParam('2', 2), 2);
    assert.equal(parsePageParam('02', 2), null);
    assert.equal(parsePageParam('2.0', 2), null);
    assert.equal(parsePageParam('1', 2), null);
    assert.equal(parsePageParam('9007199254740992'), null);
  });

  it('encodes tag path segments exactly once', () => {
    assert.equal(getTagPath('Next.js'), '/tags/Next.js');
    assert.equal(getTagPath('%'), '/tags/%25');
    assert.equal(
      getTagPagePath('프론트엔드', 2),
      '/tags/%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C/page/2'
    );
  });

  it('normalizes encoded route params exactly once', () => {
    assert.equal(normalizeTagParam('블로그'), '블로그');
    assert.equal(normalizeTagParam('%EB%B8%94%EB%A1%9C%EA%B7%B8'), '블로그');
    assert.equal(
      getTagPath(normalizeTagParam('%EB%B8%94%EB%A1%9C%EA%B7%B8')!),
      '/tags/%EB%B8%94%EB%A1%9C%EA%B7%B8'
    );
    assert.equal(normalizeTagParam('%25'), null);
    assert.equal(normalizeTagParam('%25EB%B8%94%EB%A1%9C%EA%B7%B8'), null);
    assert.equal(normalizeTagParam('%E0%A4%A'), null);
  });
});
