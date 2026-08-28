export const dynamicParams = true;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeWrapper from '@/components/HomeWrapper';
import { defaultMetadata } from '@/lib/metadata';
import { getAllPosts, getAllTags } from '@/lib/posts';
import {
  getTagPagePath,
  getTagPath,
  normalizeTagParam,
  parsePageParam,
} from '@/lib/routing';
import { getPaginatedPosts, getTotalPages } from '@/utils/paginationUtils';

interface PageProps {
  params: Promise<{ tag: string; page: string }>;
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { tag: rawTag, page } = await params;
  const tag = normalizeTagParam(rawTag);
  const pageNumber = parsePageParam(page, 2);

  if (tag === null || pageNumber === null) {
    notFound();
  }

  return defaultMetadata({
    description: `${tag} 태그가 포함된 merlog 포스트 목록`,
    keywords: [tag],
    url: getTagPagePath(tag, pageNumber),
  });
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  const allTags = getAllTags(allPosts);
  const paths = [];

  for (const tag of allTags) {
    const filteredPosts = allPosts.filter((post) => post.tags.includes(tag));
    const totalPages = getTotalPages(filteredPosts.length);

    for (let i = 2; i <= totalPages; i++) {
      paths.push({
        tag,
        page: i.toString(),
      });
    }
  }

  return paths;
}

const Page = async ({ params }: PageProps) => {
  const { tag: rawTag, page } = await params;
  const tag = normalizeTagParam(rawTag);
  const pageNumber = parsePageParam(page, 2);

  if (tag === null || pageNumber === null) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const filteredPosts = allPosts.filter((post) => post.tags.includes(tag));

  const totalPages = getTotalPages(filteredPosts.length);

  if (pageNumber > totalPages) {
    notFound();
  }

  const currentPosts = getPaginatedPosts(filteredPosts, pageNumber);
  const allTags = getAllTags(allPosts);

  return (
    <HomeWrapper
      posts={currentPosts}
      allTags={allTags}
      totalPages={totalPages}
      currentPage={pageNumber}
      selectedTag={tag}
      basePath={getTagPath(tag)}
    />
  );
};

export default Page;
