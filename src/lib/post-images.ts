import path from 'node:path';

export const REQUIRED_IMAGE_EXTENSION = '.webp';
export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_SIZE_KB = 3 * 1024;
export const GENERATED_POST_IMAGES_DIRECTORY = 'generated-post-images';
export const CONVERTIBLE_IMAGE_EXTENSIONS = [
  '.avif',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
] as const;

const SUPPORTED_IMAGE_EXTENSIONS = new Set<string>([
  REQUIRED_IMAGE_EXTENSION,
  ...CONVERTIBLE_IMAGE_EXTENSIONS,
]);

export type PostImageReferenceKind = 'thumbnail' | 'markdown' | 'mdx';

export type PostImageReference = {
  kind: PostImageReferenceKind;
  source: string;
  alt?: string;
  line: number;
};

export type PostImagePathInput = {
  postsDir: string;
  slug: string;
  source: string;
};

export type PostImageReferenceValidation = {
  filePath?: string;
  outputFilePath?: string;
  publicSource?: string;
  issues: string[];
};

export type ResolvedPostImage = {
  sourceFilePath: string;
  outputFilePath: string;
  publicSource: string;
  requiresConversion: boolean;
};

const PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const MEANINGLESS_ALT_PATTERN =
  /^(?:an?\s+)?(?:image|img|photo|picture|thumbnail)$/i;

const isInsideDirectory = (directory: string, candidate: string): boolean => {
  const relativePath = path.relative(directory, candidate);

  return (
    relativePath !== '' &&
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  );
};

const stripUrlSuffix = (source: string): string =>
  source.split(/[?#]/, 1)[0] ?? '';

const toUrlPath = (filePath: string): string =>
  filePath.split(path.sep).join('/');

const replaceExtension = (filePath: string, extension: string): string =>
  `${filePath.slice(0, -path.extname(filePath).length)}${extension}`;

const getLineNumber = (source: string, offset: number): number =>
  source.slice(0, offset).split('\n').length;

const stripFencedCodeBlocks = (source: string): string => {
  const lines = source.split('\n');
  let inFence = false;
  let fenceMarker = '';

  return lines
    .map((line) => {
      const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);

      if (fenceMatch) {
        if (!inFence) {
          inFence = true;
          fenceMarker = fenceMatch[1][0];
        } else if (fenceMatch[1][0] === fenceMarker) {
          inFence = false;
          fenceMarker = '';
        }

        return '';
      }

      return inFence ? '' : line;
    })
    .join('\n');
};

const extractMarkdownReferences = (source: string): PostImageReference[] => {
  const references: PostImageReference[] = [];
  const addReference = (
    kind: 'markdown',
    alt: string,
    imageSource: string,
    offset: number
  ) => {
    references.push({
      kind,
      source: imageSource.trim(),
      alt,
      line: getLineNumber(source, offset),
    });
  };

  const inlinePattern = /!\[([^\]]*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))[^)]*\)/g;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(source)) !== null) {
    addReference('markdown', match[1], match[2] ?? match[3] ?? '', match.index);
  }

  const definitions = new Map<string, { source: string; offset: number }>();
  const definitionPattern = /^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>\n]+)>|(\S+))/gm;

  while ((match = definitionPattern.exec(source)) !== null) {
    definitions.set(match[1].trim().toLowerCase(), {
      source: match[2] ?? match[3] ?? '',
      offset: match.index,
    });
  }

  const referencePattern = /!\[([^\]]*)\]\s*\[([^\]]*)\]/g;

  while ((match = referencePattern.exec(source)) !== null) {
    const referenceName = (match[2] || match[1]).trim().toLowerCase();
    const definition = definitions.get(referenceName);

    if (definition) {
      addReference('markdown', match[1], definition.source, match.index);
    } else {
      addReference('markdown', match[1], '', match.index);
    }
  }

  return references;
};

const extractMdxReferences = (source: string): PostImageReference[] => {
  const references: PostImageReference[] = [];
  const imageTagPattern = /<(?:img|Image)\b[^>]*>/gi;
  const sourcePattern =
    /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/i;
  const altPattern =
    /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/i;
  let match: RegExpExecArray | null;

  while ((match = imageTagPattern.exec(source)) !== null) {
    const sourceMatch = match[0].match(sourcePattern);
    const altMatch = match[0].match(altPattern);

    references.push({
      kind: 'mdx',
      source: sourceMatch?.[1] ?? sourceMatch?.[2] ?? sourceMatch?.[3] ?? '',
      alt: altMatch?.[1] ?? altMatch?.[2] ?? altMatch?.[3] ?? '',
      line: getLineNumber(source, match.index),
    });
  }

  return references;
};

export const extractPostImageReferences = (
  source: string
): PostImageReference[] => {
  const body = stripFencedCodeBlocks(source);

  return [
    ...extractMarkdownReferences(body),
    ...extractMdxReferences(body),
  ].sort((a, b) => a.line - b.line);
};

export const isMeaninglessImageAlt = (alt: string | undefined): boolean => {
  const normalizedAlt =
    alt
      ?.trim()
      .replace(/[\\*_`~]/g, '')
      .replace(/\s+/g, ' ') ?? '';

  return normalizedAlt === '' || MEANINGLESS_ALT_PATTERN.test(normalizedAlt);
};

const resolvePostImageCandidatePath = ({
  postsDir,
  slug,
  source,
}: PostImagePathInput): string => {
  const postsRoot = path.resolve(postsDir);
  const postDirectory = path.resolve(postsRoot, slug);
  const normalizedSource = source.trim();

  if (!isInsideDirectory(postsRoot, postDirectory)) {
    throw new Error('post slug must stay inside public/posts/');
  }

  if (normalizedSource === '') {
    throw new Error('image path is missing');
  }

  if (
    normalizedSource.startsWith('//') ||
    PROTOCOL_PATTERN.test(normalizedSource)
  ) {
    throw new Error('external or protocol-relative image URL is not allowed');
  }

  if (normalizedSource.includes('\\')) {
    throw new Error('image path must use URL separators');
  }

  const sourcePath = stripUrlSuffix(normalizedSource);

  if (sourcePath === '') {
    throw new Error('image path is missing');
  }

  const resolvedPath = sourcePath.startsWith('/')
    ? sourcePath.startsWith('/posts/')
      ? path.resolve(
          postsRoot,
          ...sourcePath.slice('/posts/'.length).split('/')
        )
      : path.resolve(postsRoot, '..', sourcePath)
    : path.resolve(postDirectory, ...sourcePath.split('/'));

  if (!isInsideDirectory(postDirectory, resolvedPath)) {
    throw new Error(
      'image path must stay inside the corresponding public/posts/<slug>/ directory'
    );
  }

  return resolvedPath;
};

export const resolvePostImage = (
  input: PostImagePathInput
): ResolvedPostImage => {
  const sourceFilePath = resolvePostImageCandidatePath(input);
  const extension = path.extname(sourceFilePath).toLowerCase();

  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(
      `image format must be ${REQUIRED_IMAGE_EXTENSION} or a convertible format (${CONVERTIBLE_IMAGE_EXTENSIONS.join(', ')})`
    );
  }

  const postsRoot = path.resolve(input.postsDir);
  const postDirectory = path.resolve(postsRoot, input.slug);
  const relativeSourcePath = path.relative(postDirectory, sourceFilePath);
  const requiresConversion = extension !== REQUIRED_IMAGE_EXTENSION;
  const relativeOutputPath = requiresConversion
    ? replaceExtension(relativeSourcePath, REQUIRED_IMAGE_EXTENSION)
    : relativeSourcePath;
  const outputFilePath = requiresConversion
    ? path.resolve(
        path.dirname(postsRoot),
        GENERATED_POST_IMAGES_DIRECTORY,
        input.slug,
        relativeOutputPath
      )
    : sourceFilePath;
  const publicSource = requiresConversion
    ? `/${GENERATED_POST_IMAGES_DIRECTORY}/${input.slug}/${toUrlPath(relativeOutputPath)}`
    : `/posts/${input.slug}/${toUrlPath(relativeOutputPath)}`;

  return {
    sourceFilePath,
    outputFilePath,
    publicSource,
    requiresConversion,
  };
};

export const resolvePostImagePath = (input: PostImagePathInput): string =>
  resolvePostImage(input).outputFilePath;

export const validatePostImageReference = ({
  postsDir,
  slug,
  reference,
}: Pick<PostImagePathInput, 'postsDir' | 'slug'> & {
  reference: PostImageReference;
}): PostImageReferenceValidation => {
  const issues: string[] = [];
  let filePath: string | undefined;
  let outputFilePath: string | undefined;
  let publicSource: string | undefined;

  try {
    ({
      sourceFilePath: filePath,
      outputFilePath,
      publicSource,
    } = resolvePostImage({
      postsDir,
      slug,
      source: reference.source,
    }));
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  if (reference.kind !== 'thumbnail' && isMeaninglessImageAlt(reference.alt)) {
    issues.push('alt text must be descriptive and non-empty');
  }

  return { filePath, outputFilePath, publicSource, issues };
};
