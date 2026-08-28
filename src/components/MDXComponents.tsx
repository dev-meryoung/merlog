import path from 'node:path';
import Image from 'next/image';
import { getImageData } from '@/lib/images';
import {
  POST_IMAGE_QUALITY,
  POST_IMAGE_SIZES,
  resolvePostImage,
} from '@/lib/post-images';

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
      sizes={POST_IMAGE_SIZES}
      quality={POST_IMAGE_QUALITY}
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
