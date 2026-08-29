import { load } from 'js-yaml';
import { isRoutableTag } from './routing';

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const POST_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  thumbnail: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

export const isValidPostDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !POST_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
};

export const normalizePostFrontmatter = (
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

  if (!isValidPostDate(date)) {
    throw new Error(
      `${folderName}: frontmatter.date must be a real calendar date in YYYY-MM-DD format`
    );
  }

  if (
    tags !== undefined &&
    (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string'))
  ) {
    throw new Error(
      `${folderName}: frontmatter.tags must be an array of strings`
    );
  }

  const normalizedTags = (tags ?? []).map((tag) =>
    (tag as string).trim().normalize('NFC')
  );
  const invalidTag = normalizedTags.find((tag) => !isRoutableTag(tag));

  if (invalidTag !== undefined) {
    throw new Error(
      `${folderName}: frontmatter tag ${JSON.stringify(invalidTag)} cannot be used as a tag route`
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
    date,
    tags: Array.from(new Set(normalizedTags)),
    thumbnail: thumbnail.trim(),
  };
};

export const parseMdxFrontmatter = (
  source: string
): { data: unknown; content: string } => {
  const match = source.match(FRONTMATTER_PATTERN);

  if (!match) {
    return {
      data: {},
      content: source,
    };
  }

  return {
    data: load(match[1]) ?? {},
    content: source.slice(match[0].length),
  };
};
