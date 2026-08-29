const PAGE_PARAM_PATTERN = /^[1-9]\d*$/;

/**
 * Decode a dynamic tag segment once, at the route boundary.
 *
 * Next may pass an encoded pathname segment (for example, `%EB%B8%94...`)
 * to the page. Keeping this operation in one helper prevents individual
 * consumers from decoding at different times or accidentally decoding twice.
 */
export const normalizeTagParam = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);

    // A remaining escape marker means the caller supplied a nested or
    // incomplete encoding. It must not be decoded a second time.
    if (
      decoded.includes('%') ||
      decoded.includes('/') ||
      decoded.includes('\\')
    ) {
      return null;
    }

    return decoded.normalize('NFC');
  } catch {
    return null;
  }
};

export const isRoutableTag = (tag: string): boolean => {
  if (
    tag === '' ||
    tag !== tag.normalize('NFC') ||
    tag === '.' ||
    tag === '..'
  ) {
    return false;
  }

  try {
    return normalizeTagParam(encodeURIComponent(tag)) === tag;
  } catch {
    return false;
  }
};

export const parsePageParam = (
  value: string | string[] | undefined,
  minimum = 1
): number | null => {
  const page = Array.isArray(value) ? value[0] : value;

  if (page === undefined || !PAGE_PARAM_PATTERN.test(page)) {
    return null;
  }

  const parsedPage = Number(page);

  return Number.isSafeInteger(parsedPage) && parsedPage >= minimum
    ? parsedPage
    : null;
};

export const getTagPath = (tag: string): string =>
  `/tags/${encodeURIComponent(tag)}`;

export const getTagPagePath = (tag: string, page: number): string =>
  page === 1 ? getTagPath(tag) : `${getTagPath(tag)}/page/${page}`;
