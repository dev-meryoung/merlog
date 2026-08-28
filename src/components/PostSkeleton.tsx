const PostSkeleton = () => (
  <div
    role='status'
    aria-busy='true'
    aria-label='포스트를 불러오는 중'
    className='w-full mx-auto p-5 md:p-10 rounded-lg bg-white shadow-md dark:bg-darkActive motion-safe:animate-pulse'
  >
    <div className='relative'>
      {/* IndexNavigation Skeleton */}
      <nav className='hidden min-[1620px]:block absolute left-[968px] top-0 h-full'>
        <div className='sticky top-20 min-w-[284px] p-4 bg-white dark:bg-darkActive shadow-md rounded-lg'>
          <div className='space-y-3'>
            <div className='h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded' />
            <div className='h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded ml-2' />
            <div className='h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded' />
            <div className='h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded ml-2' />
            <div className='h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded' />
          </div>
        </div>
      </nav>

      {/* Title */}
      <div className='h-8 md:h-10 w-3/4 bg-gray-200 dark:bg-gray-600 rounded mb-4' />

      {/* Date */}
      <div className='h-4 md:h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded mb-4' />

      {/* Tags */}
      <div className='flex pb-4 mb-4 border-b border-gray-200 dark:border-text-light'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-7 w-16 bg-gray-200 dark:bg-gray-600 rounded-3xl mr-2'
          />
        ))}
      </div>

      {/* Thumbnail */}
      <div className='w-full aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-8' />

      {/* Content lines */}
      <div className='space-y-4' aria-hidden='true'>
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-full' />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-[95%]' />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-[90%]' />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-[85%]' />
        <br />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-full' />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-[92%]' />
        <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-[98%]' />
      </div>
    </div>
  </div>
);

export default PostSkeleton;
