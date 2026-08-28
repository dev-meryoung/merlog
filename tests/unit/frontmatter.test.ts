import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseMdxFrontmatter } from '@/lib/frontmatter';

describe('parseMdxFrontmatter', () => {
  it('parses YAML frontmatter and preserves the body', () => {
    const source = [
      '---',
      'title: 첫 번째 글',
      'tags:',
      '  - Next.js',
      '  - TypeScript',
      '---',
      '# 본문',
    ].join('\n');

    const result = parseMdxFrontmatter(source);

    assert.deepEqual(result.data, {
      title: '첫 번째 글',
      tags: ['Next.js', 'TypeScript'],
    });
    assert.equal(result.content, '# 본문');
  });

  it('supports CRLF line endings and trailing delimiter whitespace', () => {
    const source = '---\r\ntitle: 테스트\r\n---  \r\n본문';

    assert.deepEqual(parseMdxFrontmatter(source), {
      data: { title: '테스트' },
      content: '본문',
    });
  });

  it('returns the source unchanged when frontmatter is absent', () => {
    const source = '# frontmatter 없는 글';

    assert.deepEqual(parseMdxFrontmatter(source), {
      data: {},
      content: source,
    });
  });

  it('reports malformed YAML', () => {
    const source = '---\ntags: [닫히지 않은 배열\n---\n본문';

    assert.throws(() => parseMdxFrontmatter(source));
  });
});
