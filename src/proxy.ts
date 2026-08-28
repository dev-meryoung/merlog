import { NextResponse, type NextRequest } from 'next/server';
import { normalizeTagParam } from '@/lib/routing';

export const proxy = (request: NextRequest) => {
  const tagSegment = request.nextUrl.pathname.split('/')[2];

  if (tagSegment && normalizeTagParam(tagSegment) === null) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), {
      status: 404,
    });
  }

  return NextResponse.next();
};

export const config = {
  matcher: '/tags/:path*',
};
