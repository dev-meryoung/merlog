export const dynamicParams = false;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PostWrapper from '@/components/PostWrapper';
import { getPost } from '@/lib/mdx';
import { defaultMetadata } from '@/lib/metadata';
import { getAllPosts, getPostInfo } from '@/lib/posts';
import { toSameOriginUrl } from '@/lib/url';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({
  params,
}: PostPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const postInfo = await getPostInfo(slug);

  if (!postInfo) {
    notFound();
  }

  const postURL = toSameOriginUrl(`/post/${slug}`);

  return defaultMetadata({
    title: postInfo.title,
    description: postInfo.description,
    keywords: postInfo.tags,
    image: postInfo.thumbnail,
    url: postURL,
    openGraphType: 'article',
    publishedTime: new Date(postInfo.date).toISOString(),
  });
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();

  return allPosts.map((post) => ({ slug: post.slug }));
}

const PostPage = async ({ params }: PostPageProps) => {
  const { slug } = await params;
  const post = await getPost(slug);

  const { postInfo, mdxSource, headings, previousPost, nextPost } = post;
  const postURL = toSameOriginUrl(`/post/${slug}`);

  return (
    <>
      <JsonLd post={postInfo} url={postURL} />
      <PostWrapper
        postInfo={postInfo}
        mdxSource={mdxSource}
        headings={headings}
        previousPost={previousPost}
        nextPost={nextPost}
      />
    </>
  );
};

export default PostPage;
