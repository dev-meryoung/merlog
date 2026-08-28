import { PostInfo } from '@/types/post';
import Pagination from './Pagination';
import PostCard from './PostCard';

interface PostListProps {
  posts: PostInfo[];
  currentPage: number;
  totalPages: number;
  basePath?: string;
  getPageHref?: (page: number) => string;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  currentPage,
  totalPages,
  basePath = '',
  getPageHref,
}) => (
  <div className='py-2 md:py-5'>
    <h2 className='inline font-recipekorea text-2xl md:text-3xl font-bold dark:text-text-dark'>
      POSTS
    </h2>
    {posts.length > 0 ? (
      <div className='flex py-4 gap-8 flex-wrap'>
        {posts.map((post, index) => (
          <div key={post.slug} className='w-full'>
            <PostCard post={post} priority={index < 2} />
          </div>
        ))}
      </div>
    ) : (
      <div className='flex justify-center my-4 p-12 text-sm md:text-[16px] md:p-20 shadow-md bg-white rounded-lg dark:bg-darkActive dark:text-text-dark'>
        게시글이 없습니다.
      </div>
    )}

    {totalPages > 1 && (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
        getPageHref={getPageHref}
      />
    )}
  </div>
);

export default PostList;
