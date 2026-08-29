import path from 'node:path';
import type { Definition, Html, Image, ImageReference, Root } from 'mdast';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

export const REQUIRED_IMAGE_EXTENSION = '.webp';
export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_SIZE_KB = 3 * 1024;
export const POST_IMAGE_QUALITY = 90;
export const POST_IMAGE_SIZES =
  '(max-width: 767px) calc(100vw - 4.5rem), (max-width: 799px) calc(100vw - 7rem), (max-width: 1023px) calc(800px - 7rem), calc(1024px - 7rem)';
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

type MdxAttributeValueExpression = {
  type: 'mdxJsxAttributeValueExpression';
  data?: {
    estree?: {
      body?: Array<{
        type?: string;
        expression?: {
          type?: string;
          value?: unknown;
          expressions?: unknown[];
          quasis?: Array<{
            value?: { cooked?: string | null; raw?: string };
          }>;
        };
      }>;
    } | null;
  };
};

type MdxAttribute = {
  type: string;
  name?: string;
  value?: string | null | MdxAttributeValueExpression;
};

type MdxImageElement = {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name?: string | null;
  attributes?: MdxAttribute[];
  position?: {
    start: { line?: number };
  };
};

const markdownParser = remark();
const mdxParser = remark().use(remarkMdx);

const getNodeLine = (node: {
  position?: { start: { line?: number } };
}): number => node.position?.start.line ?? 1;

const maskHtmlComments = (source: string): string => {
  const markdownTree = markdownParser.parse(source) as Root;
  const maskedSource = source.split('');

  visit(markdownTree, 'html', (node: Html) => {
    if (!node.value.trimStart().startsWith('<!--')) {
      return;
    }

    const start = node.position?.start.offset;
    const end = node.position?.end.offset;

    if (start === undefined || end === undefined) {
      return;
    }

    for (let index = start; index < end; index += 1) {
      if (maskedSource[index] !== '\n' && maskedSource[index] !== '\r') {
        maskedSource[index] = ' ';
      }
    }
  });

  return maskedSource.join('');
};

const getExpressionString = (
  expressionValue: MdxAttributeValueExpression
): string => {
  const body = expressionValue.data?.estree?.body;

  if (body?.length !== 1 || body[0].type !== 'ExpressionStatement') {
    return '';
  }

  const { expression } = body[0];

  if (expression?.type === 'Literal' && typeof expression.value === 'string') {
    return expression.value;
  }

  if (
    expression?.type === 'TemplateLiteral' &&
    expression.expressions?.length === 0 &&
    expression.quasis?.length === 1
  ) {
    return (
      expression.quasis[0].value?.cooked ??
      expression.quasis[0].value?.raw ??
      ''
    );
  }

  return '';
};

const getMdxAttribute = (
  node: MdxImageElement,
  attributeName: 'src' | 'alt'
): string => {
  const attribute = node.attributes?.find(
    (candidate) =>
      candidate.type === 'mdxJsxAttribute' && candidate.name === attributeName
  );

  if (typeof attribute?.value === 'string') {
    return attribute.value;
  }

  if (attribute?.value?.type === 'mdxJsxAttributeValueExpression') {
    return getExpressionString(attribute.value);
  }

  return '';
};

export const extractPostImageReferences = (
  source: string
): PostImageReference[] => {
  const tree = mdxParser.parse(maskHtmlComments(source)) as Root;
  const definitions = new Map<string, Definition>();
  const references: PostImageReference[] = [];

  visit(tree, 'definition', (node: Definition) => {
    if (!definitions.has(node.identifier)) {
      definitions.set(node.identifier, node);
    }
  });

  visit(tree, (node) => {
    if (node.type === 'image') {
      const image = node as Image;

      references.push({
        kind: 'markdown',
        source: image.url.trim(),
        alt: image.alt ?? '',
        line: getNodeLine(image),
      });
      return;
    }

    if (node.type === 'imageReference') {
      const image = node as ImageReference;

      references.push({
        kind: 'markdown',
        source: definitions.get(image.identifier)?.url.trim() ?? '',
        alt: image.alt ?? '',
        line: getNodeLine(image),
      });
      return;
    }

    if (
      node.type === 'mdxJsxFlowElement' ||
      node.type === 'mdxJsxTextElement'
    ) {
      const image = node as MdxImageElement;

      if (image.name !== 'img' && image.name !== 'Image') {
        return;
      }

      references.push({
        kind: 'mdx',
        source: getMdxAttribute(image, 'src').trim(),
        alt: getMdxAttribute(image, 'alt'),
        line: getNodeLine(image),
      });
    }
  });

  return references.sort((a, b) => a.line - b.line);
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
