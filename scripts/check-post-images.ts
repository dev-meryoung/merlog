import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseMdxFrontmatter } from '@/lib/frontmatter';
import {
  CONVERTIBLE_IMAGE_EXTENSIONS,
  extractPostImageReferences,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_KB,
  REQUIRED_IMAGE_EXTENSION,
  validatePostImageReference,
  type PostImageReference,
} from '@/lib/post-images';

type ImageIssue = {
  filePath: string;
  sizeKb: number;
  width?: number;
  height?: number;
  issues: string[];
};

type ReferenceIssue = {
  filePath: string;
  kind: PostImageReference['kind'];
  source: string;
  line: number;
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
const CONVERTIBLE_EXTENSIONS = new Set<string>(CONVERTIBLE_IMAGE_EXTENSIONS);
const isStrictMode = process.argv.includes('--strict');

const formatRelativePath = (filePath: string): string =>
  path.relative(process.cwd(), filePath).replace(/\\/g, '/');

const isInsideDirectory = (directory: string, candidate: string): boolean => {
  const relativePath = path.relative(directory, candidate);

  return (
    relativePath !== '' &&
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  );
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

const inspectImage = async (
  filePath: string,
  postsRoot: string
): Promise<ImageIssue> => {
  const issues: string[] = [];
  const extension = path.extname(filePath).toLowerCase();
  let sizeKb = 0;
  let width: number | undefined;
  let height: number | undefined;

  try {
    const fileLinkStat = await fs.lstat(filePath);

    if (fileLinkStat.isSymbolicLink()) {
      issues.push('symbolic links are not allowed');
    }

    const realFilePath = await fs.realpath(filePath);
    const realPostsRoot = await fs.realpath(postsRoot);

    if (!isInsideDirectory(realPostsRoot, realFilePath)) {
      issues.push('image must stay inside public/posts/');
    }

    const relativePath = path.relative(realPostsRoot, realFilePath);
    if (relativePath.split(path.sep).length < 2) {
      issues.push('image must be inside a public/posts/<slug>/ directory');
    }

    const [fileStat, fileBuffer] = await Promise.all([
      fs.stat(filePath),
      fs.readFile(filePath),
    ]);
    sizeKb = Math.round(fileStat.size / 1024);

    if (fileStat.size > MAX_IMAGE_SIZE_BYTES) {
      issues.push(`size ${sizeKb}KB > ${MAX_IMAGE_SIZE_KB}KB`);
    }

    try {
      const dimensions = await sharp(fileBuffer).metadata();
      ({ width, height } = dimensions);

      if (
        extension === REQUIRED_IMAGE_EXTENSION &&
        dimensions.format !== 'webp'
      ) {
        issues.push(
          `actual format ${dimensions.format ?? 'unknown'} must match ${REQUIRED_IMAGE_EXTENSION}`
        );
      }
    } catch {
      issues.push('file is not a readable image');
    }
  } catch (error) {
    issues.push(
      error instanceof Error
        ? `cannot read image: ${error.message}`
        : String(error)
    );
  }

  if (
    extension !== REQUIRED_IMAGE_EXTENSION &&
    !CONVERTIBLE_EXTENSIONS.has(extension)
  ) {
    issues.push(
      `format ${extension || '(none)'} cannot be converted to ${REQUIRED_IMAGE_EXTENSION}`
    );
  }

  return {
    filePath,
    sizeKb,
    width,
    height,
    issues,
  };
};

const getPostFolders = async (): Promise<string[]> => {
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

const getReferenceIssues = async (
  slug: string,
  inspectedImages: Map<string, ImageIssue>
): Promise<ReferenceIssue[]> => {
  const filePath = path.join(POSTS_DIR, slug, 'index.mdx');
  const source = await fs.readFile(filePath, 'utf8');
  const parsed = parseMdxFrontmatter(source);
  const frontmatter =
    typeof parsed.data === 'object' &&
    parsed.data !== null &&
    !Array.isArray(parsed.data)
      ? (parsed.data as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const thumbnail =
    typeof frontmatter.thumbnail === 'string' ? frontmatter.thumbnail : '';
  const references: PostImageReference[] = [
    {
      kind: 'thumbnail',
      source: thumbnail,
      line: 1,
    },
    ...extractPostImageReferences(parsed.content),
  ];
  const issues: ReferenceIssue[] = [];

  for (const reference of references) {
    const validation = validatePostImageReference({
      postsDir: POSTS_DIR,
      slug,
      reference,
    });
    const referenceIssues = [...validation.issues];

    if (validation.filePath && !inspectedImages.has(validation.filePath)) {
      const fileExists = await fs
        .access(validation.filePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        referenceIssues.push('file does not exist');
      }
    }

    if (referenceIssues.length > 0) {
      issues.push({
        filePath,
        kind: reference.kind,
        source: reference.source || '(missing)',
        line: reference.line,
        issues: referenceIssues,
      });
    }
  }

  return issues;
};

const main = async () => {
  const imageFiles = await getImageFiles(POSTS_DIR);
  const postsRoot = await fs.realpath(POSTS_DIR);
  const imageResults = await Promise.all(
    imageFiles.map((filePath) => inspectImage(filePath, postsRoot))
  );
  const imageIssues = imageResults.filter((result) => result.issues.length > 0);
  const inspectedImages = new Map(
    imageResults.map((result) => [path.resolve(result.filePath), result])
  );
  const postFolders = await getPostFolders();
  const referenceResults = await Promise.all(
    postFolders.map((slug) => getReferenceIssues(slug, inspectedImages))
  );
  const referenceIssues = referenceResults.flat();

  if (imageIssues.length === 0 && referenceIssues.length === 0) {
    console.warn(
      `Checked ${imageFiles.length} post image(s) and ${postFolders.length} post(s). No issues found.`
    );
    return;
  }

  console.warn(
    `Checked ${imageFiles.length} post image(s) and ${postFolders.length} post(s). ` +
      `${imageIssues.length} file issue(s), ${referenceIssues.length} reference issue(s).`
  );

  imageIssues.forEach((issue) => {
    const dimensions =
      issue.width && issue.height
        ? `${issue.width}x${issue.height}`
        : 'unknown';

    console.warn(
      `- ${formatRelativePath(issue.filePath)} (${issue.sizeKb}KB, ${dimensions}): ${issue.issues.join(', ')}`
    );
  });

  referenceIssues.forEach((issue) => {
    console.warn(
      `- ${formatRelativePath(issue.filePath)}:${issue.line} ${issue.kind} ${JSON.stringify(issue.source)}: ${issue.issues.join(', ')}`
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
