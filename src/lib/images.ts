import fs from 'fs/promises';
import path from 'path';
import { getPlaiceholder } from 'plaiceholder';
import sharp from 'sharp';

const DEFAULT_IMAGE_WIDTH = 1280;
const DEFAULT_IMAGE_HEIGHT = 720;

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const loadImageBuffer = async (src: string): Promise<Buffer> => {
  if (src.startsWith('/') && !src.startsWith('//')) {
    const fullPath = path.resolve(PUBLIC_DIR, `.${src}`);
    const relativePath = path.relative(PUBLIC_DIR, fullPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Image path must stay inside public/: ${src}`);
    }

    return fs.readFile(fullPath);
  }

  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Failed to load image: ${src}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

export const getImageData = async (src: string) => {
  const buffer = await loadImageBuffer(src);
  const [metadata, { base64 }] = await Promise.all([
    sharp(buffer).metadata(),
    getPlaiceholder(buffer, { size: 64 }),
  ]);

  return {
    width: metadata.width || DEFAULT_IMAGE_WIDTH,
    height: metadata.height || DEFAULT_IMAGE_HEIGHT,
    blurDataURL: base64,
  };
};
