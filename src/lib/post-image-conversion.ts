import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  CONVERTIBLE_IMAGE_EXTENSIONS,
  GENERATED_POST_IMAGES_DIRECTORY,
  MAX_IMAGE_SIZE_BYTES,
  resolvePostImage,
} from './post-images';

const CONVERTIBLE_EXTENSIONS = new Set<string>(CONVERTIBLE_IMAGE_EXTENSIONS);
const WEBP_QUALITIES = [82, 74, 66, 58, 50];

export type PreparePostImagesResult = {
  converted: number;
  outputDirectory: string;
};

const getConvertibleFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${entryPath}`);
    }

    if (entry.isDirectory()) {
      files.push(...(await getConvertibleFiles(entryPath)));
      continue;
    }

    if (CONVERTIBLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
};

const convertToWebp = async (sourceFilePath: string): Promise<Buffer> => {
  const source = await fs.readFile(sourceFilePath);

  if (source.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Source image exceeds the 3MiB limit: ${sourceFilePath}`);
  }

  for (const quality of WEBP_QUALITIES) {
    const output = await sharp(source)
      .rotate()
      .webp({ effort: 4, quality, smartSubsample: true })
      .toBuffer();

    if (output.byteLength <= MAX_IMAGE_SIZE_BYTES) {
      return output;
    }
  }

  throw new Error(`Converted WebP exceeds the 3MiB limit: ${sourceFilePath}`);
};

export const preparePostImages = async ({
  publicDir = path.join(process.cwd(), 'public'),
}: {
  publicDir?: string;
} = {}): Promise<PreparePostImagesResult> => {
  const resolvedPublicDir = path.resolve(publicDir);
  const postsDir = path.join(resolvedPublicDir, 'posts');
  const outputDirectory = path.join(
    resolvedPublicDir,
    GENERATED_POST_IMAGES_DIRECTORY
  );

  if (path.dirname(outputDirectory) !== resolvedPublicDir) {
    throw new Error('Generated image directory must stay inside public/');
  }

  await fs.rm(outputDirectory, { force: true, recursive: true });

  const postEntries = await fs.readdir(postsDir, { withFileTypes: true });
  const outputTargets = new Set<string>();
  let converted = 0;

  for (const postEntry of postEntries) {
    if (postEntry.isSymbolicLink()) {
      throw new Error(
        `Post directories cannot be symbolic links: ${postEntry.name}`
      );
    }

    if (!postEntry.isDirectory()) {
      continue;
    }

    const slug = postEntry.name;
    const postDirectory = path.join(postsDir, slug);
    const sourceFiles = await getConvertibleFiles(postDirectory);

    for (const sourceFilePath of sourceFiles) {
      const relativeSource = path
        .relative(postDirectory, sourceFilePath)
        .split(path.sep)
        .join('/');
      const resolvedImage = resolvePostImage({
        postsDir,
        slug,
        source: relativeSource,
      });
      const targetKey = resolvedImage.outputFilePath.toLowerCase();

      if (outputTargets.has(targetKey)) {
        throw new Error(
          `Multiple source images resolve to the same WebP: ${resolvedImage.outputFilePath}`
        );
      }

      outputTargets.add(targetKey);
      const output = await convertToWebp(resolvedImage.sourceFilePath);

      await fs.mkdir(path.dirname(resolvedImage.outputFilePath), {
        recursive: true,
      });
      await fs.writeFile(resolvedImage.outputFilePath, output);
      converted += 1;
    }
  }

  return { converted, outputDirectory };
};
