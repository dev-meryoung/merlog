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

const DEFAULT_IMAGE_URL = toSameOriginUrl(SITE_CONFIG.image);

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
  image = DEFAULT_IMAGE_URL,
  url = SITE_CONFIG.url,
  openGraphType = 'website',
  publishedTime,
  robots = 'index, follow',
}: DefaultMetadataProps): Metadata => {
  const canonicalUrl = toAbsoluteUrl(url);
  const imageUrl = image ? toAbsoluteUrl(image) : DEFAULT_IMAGE_URL;
  const socialImage = {
    url: imageUrl,
    alt: `${title} 대표 이미지`,
  };

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
      images: [socialImage],
      ...(openGraphType === 'article' && publishedTime
        ? { publishedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage],
    },
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    metadataBase: new URL(SITE_CONFIG.url),
  };
};
