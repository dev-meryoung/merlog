import Image from 'next/image';
import Link from 'next/link';
import { PostInfo } from '@/types/post';
import { formatDate } from '@/utils/dateUtils';

interface PostCardProps {
  post: PostInfo;
  priority?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, priority = false }) => {
  const { title, description, thumbnail, blurDataURL, date, slug } = post;

  return (
    <Link
      href={`/post/${slug}`}
      className='group flex flex-col md:flex-row w-full rounded-lg shadow-md bg-white overflow-hidden dark:bg-darkActive min-h-[370px] md:min-h-[196px]'
    >
      <div className='relative w-full md:w-1/3 aspect-video overflow-hidden'>
        <Image
          src={thumbnail}
          alt={title}
          className='w-full h-full object-cover transition-all duration-300 group-hover:scale-105'
          width={400}
          height={225}
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          placeholder='blur'
          blurDataURL={blurDataURL}
          priority={priority}
        />
      </div>
      <div className='relative flex flex-col w-full min-h-[164px] p-4 md:min-h-[188px] md:w-2/3 md:px-8 md:py-6 gap-2 flex-grow'>
        <h2 className='font-bold text-lg md:text-xl lg:text-2xl line-clamp-2 group-hover:text-accent dark:group-hover:text-accent-contrastHover dark:text-text-dark relative z-0'>
          {title}
        </h2>
        <p className='line-clamp-2 text-sm md:text-[16px] text-gray-600 dark:text-gray-300 relative z-0'>
          {description}
        </p>
        <p className='mt-auto text-xs md:text-sm text-gray-600 dark:text-gray-400 relative z-0'>
          {formatDate(date)}
        </p>
      </div>
    </Link>
  );
};

export default PostCard;
