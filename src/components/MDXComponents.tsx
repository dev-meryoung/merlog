import path from 'node:path';
import Image from 'next/image';
import { getImageData } from '@/lib/images';
import { resolvePostImage } from '@/lib/post-images';

interface MDXImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

const POSTS_DIR = path.join(process.cwd(), 'public', 'posts');

const MDXImage = async ({
  src,
  alt = 'image',
  slug,
}: MDXImageProps & { slug: string }) => {
  const { publicSource } = resolvePostImage({
    postsDir: POSTS_DIR,
    slug,
    source: src,
  });
  const { width, height, blurDataURL } = await getImageData(publicSource);

  return (
    <Image
      src={publicSource}
      alt={alt}
      width={width}
      height={height}
      sizes='(max-width: 800px) calc(100vw - 72px), 720px'
      className='max-w-full h-auto object-cover rounded-lg'
      placeholder='blur'
      blurDataURL={blurDataURL}
    />
  );
};

const createMDXComponents = (slug: string) => {
  const PostImage = (props: MDXImageProps) => (
    <MDXImage {...props} slug={slug} />
  );

  return {
    img: PostImage,
    Image: PostImage,
  };
};

export default createMDXComponents;
