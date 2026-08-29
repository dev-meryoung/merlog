import type { MetadataRoute } from 'next';
import { getAllPosts, getAllTags } from '@/lib/posts';
import { getTagPagePath } from '@/lib/routing';
import { toSameOriginUrl } from '@/lib/url';
import { getTotalPages } from '@/utils/paginationUtils';

export const dynamic = 'force-static';

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const posts = await getAllPosts();
  const tags = getAllTags(posts);
  const latestPostDate = posts[0]?.date ? new Date(posts[0].date) : undefined;
  const totalPostPages = getTotalPages(posts.length);

  const urls: MetadataRoute.Sitemap = [
    {
      url: toSameOriginUrl('/'),
      lastModified: latestPostDate,
    },
  ];

  for (let page = 2; page <= totalPostPages; page++) {
    urls.push({
      url: toSameOriginUrl(`/page/${page}`),
      lastModified: latestPostDate,
    });
  }

  posts.forEach((post) => {
    urls.push({
      url: toSameOriginUrl(`/post/${post.slug}`),
      lastModified: new Date(post.date),
    });
  });

  tags.forEach((tag) => {
    const filteredPosts = posts.filter((post) => post.tags.includes(tag));
    const latestTagPostDate = filteredPosts.reduce<Date | undefined>(
      (latestDate, post) => {
        const postDate = new Date(post.date);

        return !latestDate || postDate > latestDate ? postDate : latestDate;
      },
      undefined
    );
    const totalTagPages = getTotalPages(filteredPosts.length);

    urls.push({
      url: toSameOriginUrl(getTagPagePath(tag, 1)),
      lastModified: latestTagPostDate,
    });

    for (let page = 2; page <= totalTagPages; page++) {
      urls.push({
        url: toSameOriginUrl(getTagPagePath(tag, page)),
        lastModified: latestTagPostDate,
      });
    }
  });

  return urls;
};

export default sitemap;
