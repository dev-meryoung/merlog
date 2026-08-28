import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants';
import { toAbsoluteUrl, toSameOriginUrl } from './url';

const DEFAULT_KEYWORDS = [
  '프론트엔드',
  '개발자',
  '기술 블로그',
  '머영',
  'Web',
  'Frontend',
  'Developer',
  'Next.js',
  'React',
  'Markdown',
  'Blog',
  'merlog',
];

const DEFAULT_IMAGE = {
  url: toSameOriginUrl(SITE_CONFIG.image),
  width: 1200,
  height: 630,
  alt: 'thumbnail',
};

interface DefaultMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  openGraphType?: 'website' | 'article';
  publishedTime?: string;
  robots?: Metadata['robots'];
}

export const defaultMetadata = ({
  title = SITE_CONFIG.title,
  description = SITE_CONFIG.description,
  keywords = [],
  image = DEFAULT_IMAGE.url,
  url = SITE_CONFIG.url,
  openGraphType = 'website',
  publishedTime,
  robots = 'index, follow',
}: DefaultMetadataProps): Metadata => {
  const canonicalUrl = toAbsoluteUrl(url);
  const imageUrl = image ? toAbsoluteUrl(image) : DEFAULT_IMAGE.url;

  return {
    title,
    description,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    openGraph: {
      type: openGraphType,
      locale: 'ko_KR',
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.title,
      images: [{ ...DEFAULT_IMAGE, url: imageUrl }],
      ...(openGraphType === 'article' && publishedTime
        ? { publishedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    metadataBase: new URL(SITE_CONFIG.url),
  };
};
