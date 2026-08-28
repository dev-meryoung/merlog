import path from 'node:path';
import { preparePostImages } from '@/lib/post-image-conversion';

const main = async () => {
  const { converted, outputDirectory } = await preparePostImages();
  const relativeOutput = path
    .relative(process.cwd(), outputDirectory)
    .split(path.sep)
    .join('/');

  if (converted === 0) {
    console.warn('No post images required WebP conversion.');
    return;
  }

  console.warn(
    `Converted ${converted} post image(s) to WebP in ${relativeOutput}.`
  );
};

main().catch((error) => {
  console.error('Post image conversion failed:', error);
  process.exit(1);
});
