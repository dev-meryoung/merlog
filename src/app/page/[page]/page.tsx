export const dynamicParams = false;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeWrapper from '@/components/HomeWrapper';
import { defaultMetadata } from '@/lib/metadata';
import { getAllPosts, getAllTags } from '@/lib/posts';
import { parsePageParam } from '@/lib/routing';
import { getPaginatedPosts, getTotalPages } from '@/utils/paginationUtils';

interface PageProps {
  params: Promise<{ page: string }>;
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { page } = await params;
  const pageNumber = parsePageParam(page, 2);

  if (pageNumber === null) {
    notFound();
  }

  return defaultMetadata({
    title: `포스트 목록 ${pageNumber}페이지`,
    url: `/page/${pageNumber}`,
  });
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  const totalPages = getTotalPages(allPosts.length);

  const paths = [];
  for (let i = 2; i <= totalPages; i++) {
    paths.push({ page: i.toString() });
  }

  return paths;
}

const Page = async ({ params }: PageProps) => {
  const { page } = await params;
  const pageNumber = parsePageParam(page, 2);
  const allPosts = await getAllPosts();
  const totalPages = getTotalPages(allPosts.length);

  if (pageNumber === null || pageNumber > totalPages) {
    notFound();
  }

  const currentPosts = getPaginatedPosts(allPosts, pageNumber);
  const allTags = getAllTags(allPosts);

  return (
    <HomeWrapper
      posts={currentPosts}
      allTags={allTags}
      totalPages={totalPages}
      currentPage={pageNumber}
      basePath=''
    />
  );
};

export default Page;
