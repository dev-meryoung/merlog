import { createHash } from 'crypto';
import fsPromises from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';
import { getPlaiceholder } from 'plaiceholder';
import { remark } from 'remark';
import sharp from 'sharp';
import strip from 'strip-markdown';
import { parseMdxFrontmatter } from '@/lib/frontmatter';
import { MAX_IMAGE_SIZE_BYTES, resolvePostImage } from '@/lib/post-images';
import type { PostMeta, PostSearchData } from '@/types/post';

type CachedPost = PostMeta & {
  __sourceHash: string;
  __content: string;
  __thumbnailHash: string;
};

type InternalCache = {
  version: number;
  posts: CachedPost[];
};

type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  thumbnail: string;
};

const POSTS_DIR = path.join(process.cwd(), 'public', 'posts');
const DATA_DIR = path.join(process.cwd(), '.cache', 'merlog');
const CACHE_FILE_PATH = path.join(DATA_DIR, 'post-cache.json');
const SEARCH_INDEX_PATH = path.join(DATA_DIR, 'search-index.json');
const INTERNAL_CACHE_PATH = path.join(DATA_DIR, 'internal-cache.json');
const CACHE_VERSION = 2;
const CONCURRENCY_LIMIT = 10;
const POST_SLUG_PATTERN = /^[a-z0-9-]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString);

const isCachedPost = (value: unknown): value is CachedPost => {
  if (!isRecord(value)) {
    return false;
  }

  const {
    title,
    description,
    date,
    tags,
    thumbnail,
    slug,
    blurDataURL,
    __sourceHash,
    __content,
    __thumbnailHash,
  } = value;

  return (
    isNonEmptyString(title) &&
    isNonEmptyString(description) &&
    isNonEmptyString(date) &&
    isStringArray(tags) &&
    isNonEmptyString(thumbnail) &&
    isNonEmptyString(slug) &&
    typeof blurDataURL === 'string' &&
    isNonEmptyString(__sourceHash) &&
    typeof __content === 'string' &&
    isNonEmptyString(__thumbnailHash)
  );
};

const normalizeText = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

const assertValidPostSlug = (slug: string): void => {
  if (!POST_SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid post slug "${slug}". Use lowercase letters, numbers, and hyphens only.`
    );
  }
};

const createContentHash = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex');

const normalizeFrontmatter = (
  folderName: string,
  data: unknown
): PostFrontmatter => {
  if (!isRecord(data)) {
    throw new Error(`${folderName}: frontmatter must be an object`);
  }

  const { title, description, date, thumbnail, tags } = data;

  if (!isNonEmptyString(title)) {
    throw new Error(
      `${folderName}: frontmatter.title must be a non-empty string`
    );
  }

  if (!isNonEmptyString(description)) {
    throw new Error(
      `${folderName}: frontmatter.description must be a non-empty string`
    );
  }

  if (!isNonEmptyString(date) || Number.isNaN(new Date(date).getTime())) {
    throw new Error(
      `${folderName}: frontmatter.date must be a valid date string`
    );
  }

  if (tags !== undefined && !isStringArray(tags)) {
    throw new Error(
      `${folderName}: frontmatter.tags must be an array of strings`
    );
  }

  if (!isNonEmptyString(thumbnail)) {
    throw new Error(
      `${folderName}: frontmatter.thumbnail must be a non-empty local image path`
    );
  }

  return {
    title: title.trim(),
    description: description.trim(),
    date: date.trim(),
    tags: Array.from(new Set((tags || []).map((tag) => tag.trim()))),
    thumbnail: thumbnail.trim(),
  };
};

const readAndValidateThumbnail = async (
  folderName: string,
  thumbnail: string
): Promise<{ path: string; buffer: Buffer; publicSource: string }> => {
  let thumbnailPath: string;
  let publicSource: string;

  try {
    ({ outputFilePath: thumbnailPath, publicSource } = resolvePostImage({
      postsDir: POSTS_DIR,
      slug: folderName,
      source: thumbnail,
    }));
  } catch (error) {
    throw new Error(
      `${folderName}: invalid thumbnail "${thumbnail}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  let thumbnailBuffer: Buffer;
  try {
    const thumbnailLinkStat = await fsPromises.lstat(thumbnailPath);

    if (thumbnailLinkStat.isSymbolicLink()) {
      throw new Error('symbolic links are not allowed');
    }

    thumbnailBuffer = await fsPromises.readFile(thumbnailPath);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'symbolic links are not allowed'
    ) {
      throw new Error(
        `${folderName}: thumbnail must be a regular local file: ${thumbnail}`
      );
    }

    throw new Error(
      `${folderName}: thumbnail file does not exist: ${thumbnail}`
    );
  }

  if (thumbnailBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `${folderName}: thumbnail exceeds the 3MiB limit: ${thumbnail}`
    );
  }

  try {
    const metadata = await sharp(thumbnailBuffer).metadata();

    if (metadata.format !== 'webp') {
      throw new Error(
        `${folderName}: thumbnail content must be WebP: ${thumbnail}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('thumbnail content')) {
      throw error;
    }

    throw new Error(
      `${folderName}: thumbnail is not a readable WebP image: ${thumbnail}`
    );
  }

  return { path: thumbnailPath, buffer: thumbnailBuffer, publicSource };
};

async function processPost(
  folderName: string,
  existingCache: Record<string, CachedPost>
): Promise<CachedPost> {
  assertValidPostSlug(folderName);

  const itemPath = path.join(POSTS_DIR, folderName);
  const stats = await fsPromises.stat(itemPath);

  if (!stats.isDirectory()) {
    throw new Error(`${folderName} is not a post directory`);
  }

  const filePath = path.join(itemPath, 'index.mdx');
  const cachedPost = existingCache[folderName];
  const fileContents = await fsPromises.readFile(filePath, 'utf8');
  const sourceHash = createContentHash(fileContents);
  const { data, content } = parseMdxFrontmatter(fileContents);
  const {
    title,
    description,
    date,
    tags,
    thumbnail: thumbnailReference,
  } = normalizeFrontmatter(folderName, data);
  const { buffer: thumbnailBuffer, publicSource: thumbnail } =
    await readAndValidateThumbnail(folderName, thumbnailReference);
  const thumbnailHash = createContentHash(thumbnailBuffer);

  if (
    cachedPost &&
    cachedPost.__sourceHash === sourceHash &&
    cachedPost.thumbnail === thumbnail &&
    cachedPost.__thumbnailHash === thumbnailHash
  ) {
    return {
      ...cachedPost,
      slug: folderName,
    };
  }

  const processedContent = await remark().use(strip).process(content);
  const plainText = processedContent.toString();

  let blurDataURL = '';
  if (
    cachedPost &&
    cachedPost.blurDataURL &&
    cachedPost.thumbnail === thumbnail &&
    cachedPost.__thumbnailHash === thumbnailHash
  ) {
    ({ blurDataURL } = cachedPost);
  } else {
    const { base64 } = await getPlaiceholder(thumbnailBuffer, { size: 32 });
    blurDataURL = base64;
  }

  return {
    title,
    description,
    date,
    tags,
    thumbnail,
    slug: folderName,
    blurDataURL,
    __sourceHash: sourceHash,
    __content: normalizeText(plainText),
    __thumbnailHash: thumbnailHash,
  };
}

async function readExistingCache(): Promise<Record<string, CachedPost>> {
  try {
    const cached = JSON.parse(
      await fsPromises.readFile(INTERNAL_CACHE_PATH, 'utf8')
    ) as unknown;

    if (
      !isRecord(cached) ||
      cached.version !== CACHE_VERSION ||
      !Array.isArray(cached.posts)
    ) {
      return {};
    }

    return cached.posts.reduce<Record<string, CachedPost>>(
      (accumulator, item) => {
        if (isCachedPost(item)) {
          accumulator[item.slug] = item;
        }

        return accumulator;
      },
      {}
    );
  } catch {
    return {};
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  const tempFilePath = `${filePath}.tmp`;
  const json = JSON.stringify(value, null, 2);

  await fsPromises.writeFile(tempFilePath, json);
  await fsPromises.rename(tempFilePath, filePath);
}

async function getPostFolders(): Promise<string[]> {
  const entries = await fsPromises.readdir(POSTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      assertValidPostSlug(entry.name);
      return entry.name;
    })
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  await fsPromises.mkdir(DATA_DIR, { recursive: true });

  const existingCache = await readExistingCache();
  const postFolders = await getPostFolders();
  const limit = pLimit(CONCURRENCY_LIMIT);

  const postResults = await Promise.allSettled(
    postFolders.map((folder) => limit(() => processPost(folder, existingCache)))
  );

  const failedPosts = postResults.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  const validPosts = postResults
    .filter(
      (result): result is PromiseFulfilledResult<CachedPost> =>
        result.status === 'fulfilled'
    )
    .map((result) => result.value);

  if (failedPosts.length > 0) {
    failedPosts.forEach((result) => {
      console.error(result.reason);
    });

    throw new Error(`Failed to process ${failedPosts.length} post(s).`);
  }

  validPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const searchIndex: PostSearchData[] = validPosts.map((post) => ({
    title: post.title,
    description: post.description,
    tags: post.tags,
    slug: post.slug,
    date: post.date,
    content: post.__content,
  }));

  const listCache = validPosts.map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    thumbnail: post.thumbnail,
    slug: post.slug,
    blurDataURL: post.blurDataURL,
  }));

  const internalCache: InternalCache = {
    version: CACHE_VERSION,
    posts: validPosts,
  };

  await Promise.all([
    writeJsonFile(CACHE_FILE_PATH, listCache),
    writeJsonFile(SEARCH_INDEX_PATH, searchIndex),
    writeJsonFile(INTERNAL_CACHE_PATH, internalCache),
  ]);
}

main().catch((error) => {
  console.error('Build script failed:', error);
  process.exit(1);
});
