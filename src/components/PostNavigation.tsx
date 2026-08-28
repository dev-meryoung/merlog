import Link from 'next/link';
import { PostInfo } from '@/types/post';

interface PostNavigationProps {
  previousPost: PostInfo | null | undefined;
  nextPost: PostInfo | null | undefined;
}

const PostNavigation = ({ previousPost, nextPost }: PostNavigationProps) => (
  <nav className='flex gap-4' aria-label='이전 및 다음 포스트'>
    <div className='flex w-full justify-center mx-auto rounded-lg bg-white shadow-md mt-4 dark:bg-darkActive'>
      {previousPost ? (
        <Link
          href={`/post/${previousPost.slug}`}
          className='w-full flex flex-col gap-1.5 p-4 md:p-5 hover:text-accent dark:text-text-dark dark:hover:text-accent-contrastHover'
        >
          <p className='text-base md:text-lg font-bold'>← 이전 글</p>
          <p className='text-sm md:text-base'>{previousPost.title}</p>
        </Link>
      ) : (
        <div className='w-full flex flex-col gap-1.5 p-4 md:p-5'>
          <p className='text-base md:text-lg font-bold text-gray-400 dark:text-gray-400'>
            ← 이전 글
          </p>
          <p className='text-sm md:text-base text-gray-400 dark:text-gray-400'>
            -
          </p>
        </div>
      )}
    </div>
    <div className='flex w-full justify-center mx-auto rounded-lg bg-white shadow-md mt-4 dark:bg-darkActive'>
      {nextPost ? (
        <Link
          href={`/post/${nextPost.slug}`}
          className='w-full grid grid-rows-[auto_1fr] gap-1.5 p-4 md:p-5 text-right hover:text-accent dark:text-text-dark dark:hover:text-accent-contrastHover'
        >
          <p className='text-base md:text-lg font-bold'>다음 글 →</p>
          <p className='text-sm md:text-base'>{nextPost.title}</p>
        </Link>
      ) : (
        <div className='w-full flex flex-col gap-1.5 p-4 md:p-5 text-right'>
          <p className='text-base md:text-lg font-bold text-gray-400 dark:text-gray-400'>
            다음 글 →
          </p>
          <p className='text-sm md:text-base text-gray-400 dark:text-gray-400'>
            -
          </p>
        </div>
      )}
    </div>
  </nav>
);

export default PostNavigation;
