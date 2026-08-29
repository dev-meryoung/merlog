import React, { ReactElement } from 'react';
import Image from 'next/image';
import { MDXRemoteProps } from 'next-mdx-remote/rsc';
import { POST_IMAGE_QUALITY, POST_IMAGE_SIZES } from '@/lib/post-images';
import { PostInfo, Heading } from '@/types/post';
import { formatDate } from '@/utils/dateUtils';
import Comments from './Comments';
import IndexNavigation from './IndexNavigation';
import PostNavigation from './PostNavigation';
import Tag from './Tag';

interface PostWrapperProps {
  postInfo: PostInfo;
  mdxSource: ReactElement<MDXRemoteProps>;
  headings: Heading[];
  previousPost?: PostInfo | null;
  nextPost?: PostInfo | null;
}

const PostWrapper = ({
  postInfo,
  mdxSource,
  headings,
  previousPost,
  nextPost,
}: PostWrapperProps) => (
  <div>
    <article className='w-full mx-auto p-5 md:p-10 rounded-lg bg-white shadow-md dark:bg-darkActive'>
      <div className='relative'>
        <IndexNavigation headings={headings} />
        <div>
          <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-4 pl-0.5 dark:text-text-dark'>
            {postInfo.title}
          </h1>
          <time
            dateTime={postInfo.date}
            className='block text-sm md:text-[16px] text-gray-600 dark:text-gray-400 mb-4 pl-1'
          >
            {formatDate(postInfo.date)}
          </time>
          <ul className='pb-4 mb-4 border-b border-gray-200 dark:border-text-light'>
            {postInfo.tags.map((tag) => (
              <li key={tag} className='inline-block leading-9 mr-2'>
                <Tag label={tag} size='sm' />
              </li>
            ))}
          </ul>
        </div>
        <div className='relative w-full rounded-lg overflow-hidden aspect-video mb-8'>
          <Image
            src={postInfo.thumbnail || '/images/thumbnail.png'}
            alt=''
            className='w-full h-full object-cover'
            width={1280}
            height={720}
            sizes={POST_IMAGE_SIZES}
            quality={POST_IMAGE_QUALITY}
            placeholder='blur'
            blurDataURL={postInfo.blurDataURL}
            preload
          />
        </div>
        <div className='prose dark:prose-dark max-w-none'>{mdxSource}</div>
      </div>
    </article>
    <PostNavigation previousPost={previousPost} nextPost={nextPost} />
    <Comments />
  </div>
);

export default PostWrapper;
