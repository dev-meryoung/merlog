import { getSearchPath } from '@/lib/search';
import { PostInfo } from '@/types/post';
import PostList from './PostList';

interface SearchResultsProps {
  posts: PostInfo[];
  keyword: string;
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

const SearchResults = ({
  posts,
  keyword,
  currentPage,
  totalPages,
  totalResults,
}: SearchResultsProps) => {
  const getSearchPageHref = (page: number) => getSearchPath(keyword, page);

  if (!keyword) {
    return (
      <div className='py-40 text-center text-gray-500'>
        <h1 className='text-2xl md:text-3xl font-semibold my-4 md:my-8 text-gray-800 dark:text-gray-200'>
          검색
        </h1>
        <p className='text-sm md:text-lg'>
          검색어를 입력하면 관련 포스트를 찾을 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className='inline-block text-2xl md:text-3xl font-semibold my-4 md:my-8'>
        <span className='text-accent dark:text-accent-contrast'>{`🔍'${keyword}'`}</span>
        <span className='text-gray-800 dark:text-gray-200'>
          에 대한 검색 결과
        </span>
        <span className='text-lg md:text-xl ml-1 font-normal text-gray-500'>
          ({totalResults}개)
        </span>
      </h1>

      {posts.length > 0 ? (
        <PostList
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={getSearchPageHref}
        />
      ) : (
        <div className='py-40 text-center text-gray-500'>
          <p className='text-sm md:text-lg'>
            {`'${keyword}'에 대한 검색 결과가 없습니다.`}
          </p>
        </div>
      )}
    </>
  );
};

export default SearchResults;
