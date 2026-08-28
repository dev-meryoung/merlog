import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  extractPostImageReferences,
  isMeaninglessImageAlt,
  resolvePostImage,
  resolvePostImagePath,
  validatePostImageReference,
} from '@/lib/post-images';

const postsDir = path.join(process.cwd(), 'public', 'posts');

describe('post image policy', () => {
  it('allows local WebP references in the corresponding post directory', () => {
    assert.equal(
      resolvePostImagePath({
        postsDir,
        slug: 'blog-init',
        source: '/posts/blog-init/0.webp',
      }),
      path.join(postsDir, 'blog-init', '0.webp')
    );
    assert.equal(
      resolvePostImagePath({
        postsDir,
        slug: 'blog-init',
        source: './1.webp?width=800#preview',
      }),
      path.join(postsDir, 'blog-init', '1.webp')
    );
  });

  it('maps convertible image references to generated WebP files', () => {
    const resolved = resolvePostImage({
      postsDir,
      slug: 'blog-init',
      source: '/posts/blog-init/diagram.png',
    });

    assert.equal(
      resolved.sourceFilePath,
      path.join(postsDir, 'blog-init', 'diagram.png')
    );
    assert.equal(
      resolved.outputFilePath,
      path.join(
        process.cwd(),
        'public',
        'generated-post-images',
        'blog-init',
        'diagram.webp'
      )
    );
    assert.equal(
      resolved.publicSource,
      '/generated-post-images/blog-init/diagram.webp'
    );
    assert.equal(resolved.requiresConversion, true);
  });

  it('rejects external and protocol-relative URLs', () => {
    for (const source of [
      'https://example.com/image.webp',
      '//cdn.example.com/image.webp',
    ]) {
      assert.throws(
        () => resolvePostImagePath({ postsDir, slug: 'blog-init', source }),
        /external or protocol-relative/
      );
    }
  });

  it('rejects paths outside the post and unsupported formats', () => {
    assert.throws(
      () =>
        resolvePostImagePath({
          postsDir,
          slug: 'blog-init',
          source: '/posts/blog-dev-process-1/0.webp',
        }),
      /corresponding public\/posts\/<slug>\/ directory/
    );
    assert.throws(
      () =>
        resolvePostImagePath({
          postsDir,
          slug: 'blog-init',
          source: '../blog-dev-process-1/0.webp',
        }),
      /corresponding public\/posts\/<slug>\/ directory/
    );
    assert.throws(
      () =>
        resolvePostImagePath({
          postsDir,
          slug: 'blog-init',
          source: '/posts/blog-init/0.gif',
        }),
      /cannot|convertible format/
    );
  });

  it('rejects missing sources and meaningless alt text', () => {
    const result = validatePostImageReference({
      postsDir,
      slug: 'blog-init',
      reference: {
        kind: 'markdown',
        source: '',
        alt: 'image',
        line: 1,
      },
    });

    assert.match(result.issues.join(', '), /image path is missing/);
    assert.match(result.issues.join(', '), /alt text must be descriptive/);
    assert.equal(isMeaninglessImageAlt(''), true);
    assert.equal(isMeaninglessImageAlt('An image'), true);
    assert.equal(isMeaninglessImageAlt('**image**'), true);
    assert.equal(isMeaninglessImageAlt('Commitlint rule'), false);
  });

  it('extracts Markdown and MDX image references but ignores fenced examples', () => {
    const references = extractPostImageReferences(
      [
        '',
        '![Markdown alt](/posts/blog-init/1.webp)',
        '',
        '<Image src="./0.webp" alt="Thumbnail illustration" />',
        '',
        '```md',
        '![not an image](https://example.com/ignored.webp)',
        '```',
      ].join('\n')
    );

    assert.deepEqual(
      references.map(({ kind, source, alt }) => ({ kind, source, alt })),
      [
        {
          kind: 'markdown',
          source: '/posts/blog-init/1.webp',
          alt: 'Markdown alt',
        },
        { kind: 'mdx', source: './0.webp', alt: 'Thumbnail illustration' },
      ]
    );
  });
});
