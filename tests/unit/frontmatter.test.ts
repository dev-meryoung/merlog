import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isValidPostDate,
  normalizePostFrontmatter,
  parseMdxFrontmatter,
} from '@/lib/frontmatter';

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

  it('accepts only real calendar dates in YYYY-MM-DD format', () => {
    assert.equal(isValidPostDate('2024-02-29'), true);

    for (const date of [
      '2025-02-29',
      '2025-02-30',
      '2025-1-01',
      '2025-01-1',
      ' 2025-01-01',
      '123',
    ]) {
      assert.equal(isValidPostDate(date), false, date);
    }

    assert.throws(
      () =>
        normalizePostFrontmatter('example-post', {
          title: '제목',
          description: '설명',
          date: '2025-02-30',
          thumbnail: '0.webp',
        }),
      /real calendar date in YYYY-MM-DD format/
    );
  });

  it('normalizes tags before removing duplicates', () => {
    const decomposedTag = '블로그'.normalize('NFD');
    const result = normalizePostFrontmatter('example-post', {
      title: ' 제목 ',
      description: ' 설명 ',
      date: '2025-03-10',
      thumbnail: ' 0.webp ',
      tags: [' Next.js ', decomposedTag, '블로그'],
    });

    assert.deepEqual(result, {
      title: '제목',
      description: '설명',
      date: '2025-03-10',
      thumbnail: '0.webp',
      tags: ['Next.js', '블로그'],
    });
  });

  it('rejects tags that cannot round-trip through a tag route', () => {
    const frontmatter = {
      title: '제목',
      description: '설명',
      date: '2025-03-10',
      thumbnail: '0.webp',
    };

    for (const tag of ['CI/CD', '100%', '..', '   ']) {
      assert.throws(
        () =>
          normalizePostFrontmatter('example-post', {
            ...frontmatter,
            tags: [tag],
          }),
        /cannot be used as a tag route/
      );
    }
  });
});
