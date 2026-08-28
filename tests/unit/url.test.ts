import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toAbsoluteUrl, toSameOriginUrl } from '@/lib/url';

describe('URL utilities', () => {
  it('resolves site-relative paths against the configured origin', () => {
    assert.equal(
      toAbsoluteUrl('/post/example'),
      'https://www.merlog.kr/post/example'
    );
    assert.equal(
      toSameOriginUrl('/search?keyword=Next.js'),
      'https://www.merlog.kr/search?keyword=Next.js'
    );
  });

  it('keeps valid external HTTP URLs', () => {
    assert.equal(
      toAbsoluteUrl('https://example.com/resource'),
      'https://example.com/resource'
    );
  });

  it('rejects protocol-relative and unsupported URLs', () => {
    assert.throws(() => toAbsoluteUrl('//example.com/resource'));
    assert.throws(() => toAbsoluteUrl('javascript:alert(1)'));
  });

  it('rejects paths outside the configured site origin', () => {
    assert.throws(() => toSameOriginUrl('https://example.com/resource'));
    assert.throws(() => toSameOriginUrl('//example.com/resource'));
    assert.throws(() => toSameOriginUrl('/\\example.com/resource'));
  });
});
