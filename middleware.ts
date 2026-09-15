import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/verify' || pathname === '/api/verify') {
    return NextResponse.next();
  }
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return NextResponse.next();
  }

  // 检查 Cookie
  const cookie = request.cookies.get('site_verified')?.value;
  if (cookie === 'ok') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/verify';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};