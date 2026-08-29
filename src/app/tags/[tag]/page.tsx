export const dynamicParams = false;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeWrapper from '@/components/HomeWrapper';
import { defaultMetadata } from '@/lib/metadata';
import { getAllPosts, getAllTags } from '@/lib/posts';
import { getTagPath, normalizeTagParam } from '@/lib/routing';
import { getPaginatedPosts, getTotalPages } from '@/utils/paginationUtils';

interface PageProps {
  params: Promise<{ tag: string }>;
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const rawTag = (await params).tag;
  const tag = normalizeTagParam(rawTag);

  if (tag === null) {
    notFound();
  }

  return defaultMetadata({
    description: `${tag} 태그가 포함된 merlog 포스트 목록`,
    keywords: [tag],
    url: getTagPath(tag),
  });
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  const allTags = getAllTags(allPosts);

  return allTags.map((tag) => ({
    tag,
  }));
}

const Page = async ({ params }: PageProps) => {
  const rawTag = (await params).tag;
  const tag = normalizeTagParam(rawTag);

  if (tag === null) {
    notFound();
  }

  const allPosts = await getAllPosts();

  const filteredPosts = allPosts.filter((post) => post.tags.includes(tag));

  if (filteredPosts.length === 0) {
    notFound();
  }

  const totalPages = getTotalPages(filteredPosts.length);
  const currentPosts = getPaginatedPosts(filteredPosts, 1);
  const allTags = getAllTags(allPosts);

  return (
    <HomeWrapper
      posts={currentPosts}
      allTags={allTags}
      totalPages={totalPages}
      currentPage={1}
      selectedTag={tag}
      basePath={getTagPath(tag)}
    />
  );
};

export default Page;
