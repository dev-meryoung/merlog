import { PostInfo } from '@/types/post';
import PostList from './PostList';
import TagList from './TagList';

interface HomeWrapperProps {
  allTags: string[];
  posts: PostInfo[];
  totalPages: number;
  currentPage: number;
  selectedTag?: string;
  basePath?: string;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({
  allTags,
  posts,
  totalPages,
  currentPage,
  selectedTag,
  basePath,
}) => (
  <div className='w-full'>
    <h1 className='sr-only'>
      {selectedTag ? `${selectedTag} 태그 포스트` : 'merlog 포스트 목록'}
    </h1>
    <TagList allTags={allTags} selectedTag={selectedTag} />
    <PostList
      posts={posts}
      currentPage={currentPage}
      totalPages={totalPages}
      basePath={basePath}
    />
  </div>
);

export default HomeWrapper;
