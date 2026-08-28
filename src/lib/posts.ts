import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';
import type { PostInfo, PostSearchData } from '@/types/post';

const DATA_DIR = path.join(process.cwd(), '.cache', 'merlog');
const POST_CACHE_PATH = path.join(DATA_DIR, 'post-cache.json');
const SEARCH_INDEX_PATH = path.join(DATA_DIR, 'search-index.json');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isPostInfo = (value: unknown): value is PostInfo => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, description, date, tags, thumbnail, slug, blurDataURL } =
    value;

  return (
    typeof title === 'string' &&
    typeof description === 'string' &&
    typeof date === 'string' &&
    isStringArray(tags) &&
    typeof thumbnail === 'string' &&
    typeof slug === 'string' &&
    typeof blurDataURL === 'string'
  );
};

const isPostSearchData = (value: unknown): value is PostSearchData => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, description, date, tags, slug, content } = value;

  return (
    typeof title === 'string' &&
    typeof description === 'string' &&
    typeof date === 'string' &&
    isStringArray(tags) &&
    typeof slug === 'string' &&
    typeof content === 'string'
  );
};

const readJsonArray = async <T>(
  filePath: string,
  label: string,
  validateItem: (value: unknown) => value is T
): Promise<T[]> => {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(fileContents);

    if (!Array.isArray(parsed) || !parsed.every(validateItem)) {
      throw new Error(`${label} has an invalid shape`);
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${label} from ${filePath}: ${message}`);
  }
};

export const getAllPosts = cache(async (): Promise<PostInfo[]> => {
  const posts = await readJsonArray(POST_CACHE_PATH, 'post cache', isPostInfo);
  return posts;
});

export const getAllSearchPosts = cache(async (): Promise<PostSearchData[]> => {
  const posts = await readJsonArray(
    SEARCH_INDEX_PATH,
    'search index',
    isPostSearchData
  );
  return posts;
});

export const getPostInfo = cache(
  async (slug: string): Promise<PostInfo | undefined> => {
    const posts = await getAllPosts();
    return posts.find((post) => post.slug === slug);
  }
);

export const getAllTags = (posts: PostInfo[]): string[] => {
  const tagFrequency = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagFrequency.keys()).sort((a, b) => {
    const frequencyDifference =
      (tagFrequency.get(b) || 0) - (tagFrequency.get(a) || 0);

    if (frequencyDifference !== 0) {
      return frequencyDifference;
    }

    return a.localeCompare(b);
  });
};
