import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import sharp from 'sharp';
import { preparePostImages } from '@/lib/post-image-conversion';

describe('post image conversion', () => {
  it('creates generated WebP files without modifying source images', async () => {
    const workspace = await fs.mkdtemp(
      path.join(os.tmpdir(), 'merlog-images-')
    );
    const publicDir = path.join(workspace, 'public');
    const postDirectory = path.join(publicDir, 'posts', 'example');
    const sourcePath = path.join(postDirectory, 'nested', 'cover.png');

    try {
      await fs.mkdir(path.dirname(sourcePath), { recursive: true });
      await sharp({
        create: {
          width: 32,
          height: 18,
          channels: 3,
          background: '#4567c5',
        },
      })
        .png()
        .toFile(sourcePath);

      const result = await preparePostImages({ publicDir });
      const outputPath = path.join(
        publicDir,
        'generated-post-images',
        'example',
        'nested',
        'cover.webp'
      );
      const [sourceStat, output] = await Promise.all([
        fs.stat(sourcePath),
        fs.readFile(outputPath),
      ]);
      const outputMetadata = await sharp(output).metadata();

      assert.equal(result.converted, 1);
      assert.equal(sourceStat.isFile(), true);
      assert.equal(outputMetadata.format, 'webp');
      assert.equal(outputMetadata.width, 32);
      assert.equal(outputMetadata.height, 18);
    } finally {
      await fs.rm(workspace, { force: true, recursive: true });
    }
  });
});
