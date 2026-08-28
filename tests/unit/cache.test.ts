import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'merlog');

describe('generated post cache', () => {
  it('keeps public list data separate from internal build data', async () => {
    const listCache = JSON.parse(
      await fs.readFile(path.join(CACHE_DIR, 'post-cache.json'), 'utf8')
    ) as Array<Record<string, unknown>>;
    const internalCache = JSON.parse(
      await fs.readFile(path.join(CACHE_DIR, 'internal-cache.json'), 'utf8')
    ) as { version: number; posts: Array<Record<string, unknown>> };

    assert.equal(internalCache.version, 2);
    assert.ok(listCache.length > 0);
    assert.ok(internalCache.posts.length > 0);

    listCache.forEach((post) => {
      assert.deepEqual(Object.keys(post).sort(), [
        'blurDataURL',
        'date',
        'description',
        'slug',
        'tags',
        'thumbnail',
        'title',
      ]);
    });

    assert.equal(
      await fs
        .access(path.join(process.cwd(), 'public', 'data'))
        .then(() => true)
        .catch(() => false),
      false
    );
  });
});
