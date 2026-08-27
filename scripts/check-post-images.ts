import fs from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';

type ImageIssue = {
  filePath: string;
  sizeKb: number;
  width?: number;
  height?: number;
  issues: string[];
};

const POSTS_DIR = path.join(process.cwd(), 'public', 'posts');
const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);
const REQUIRED_IMAGE_EXTENSION = '.webp';
const MAX_IMAGE_SIZE_KB = 3 * 1024;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024;
const isStrictMode = process.argv.includes('--strict');

const formatRelativePath = (filePath: string): string =>
  path.relative(process.cwd(), filePath).replace(/\\/g, '/');

const assertInsideDirectory = (rootPath: string, filePath: string): void => {
  const relativePath = path.relative(rootPath, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to inspect file outside posts root: ${filePath}`);
  }
};

const getImageFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return getImageFiles(entryPath);
      }

      if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        return [entryPath];
      }

      return [];
    })
  );

  return nestedFiles.flat();
};

const inspectImage = async (filePath: string): Promise<ImageIssue | null> => {
  const [postsRoot, realFilePath, fileLinkStat] = await Promise.all([
    fs.realpath(POSTS_DIR),
    fs.realpath(filePath),
    fs.lstat(filePath),
  ]);

  if (fileLinkStat.isSymbolicLink()) {
    throw new Error(`Refusing to inspect symbolic link: ${filePath}`);
  }

  assertInsideDirectory(postsRoot, realFilePath);

  const [fileStat, fileBuffer] = await Promise.all([
    fs.stat(filePath),
    fs.readFile(filePath),
  ]);
  const dimensions = imageSize(fileBuffer);
  const issues: string[] = [];
  const extension = path.extname(filePath).toLowerCase();

  if (extension !== REQUIRED_IMAGE_EXTENSION) {
    issues.push(`format ${extension} must be ${REQUIRED_IMAGE_EXTENSION}`);
  }

  if (fileStat.size > MAX_IMAGE_SIZE_BYTES) {
    issues.push(
      `size ${Math.round(fileStat.size / 1024)}KB > ${MAX_IMAGE_SIZE_KB}KB`
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    filePath,
    sizeKb: Math.round(fileStat.size / 1024),
    width: dimensions.width,
    height: dimensions.height,
    issues,
  };
};

const main = async () => {
  const imageFiles = await getImageFiles(POSTS_DIR);
  const results = await Promise.all(imageFiles.map(inspectImage));
  const issues = results.filter(
    (result): result is ImageIssue => result !== null
  );

  if (issues.length === 0) {
    console.warn(
      `Checked ${imageFiles.length} post image(s). No issues found.`
    );
    return;
  }

  console.warn(
    `Checked ${imageFiles.length} post image(s). ${issues.length} image(s) do not meet the requirements.`
  );

  issues.forEach((issue) => {
    const dimensions =
      issue.width && issue.height
        ? `${issue.width}x${issue.height}`
        : 'unknown';

    console.warn(
      `- ${formatRelativePath(issue.filePath)} (${issue.sizeKb}KB, ${dimensions}): ${issue.issues.join(', ')}`
    );
  });

  if (isStrictMode) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Image check failed:', error);
  process.exit(1);
});
