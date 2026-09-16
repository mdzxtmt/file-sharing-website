import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'site_verified';

// Web Crypto HMAC-SHA256
async function computeSig(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isValidCookie(
  cookieValue: string | undefined,
  secret: string
): Promise<boolean> {
  if (!cookieValue || !secret) return false;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return false;

  const [version, expiryStr, sig] = parts;
  if (version !== 'v1') return false;

  const expiry = Number(expiryStr);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  const expected = await computeSig(`v1:${expiryStr}`, secret);

  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 放行清单
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
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.COOKIE_SECRET || '';
  const valid = await isValidCookie(cookie, secret);

  if (valid) {
    return NextResponse.next();
  }

  // 未验证，重定向
  const url = request.nextUrl.clone();
  url.pathname = '/verify';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};