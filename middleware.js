import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  console.log(`[api] ${req.method} ${pathname}${search} ip=${ip} ua="${userAgent}"`);

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
