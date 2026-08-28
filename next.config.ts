import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    formats: ['image/webp'],
    qualities: [75, 90],
  },
  outputFileTracingIncludes: {
    '/*': ['./.cache/merlog/**/*'],
  },
};

export default nextConfig;
