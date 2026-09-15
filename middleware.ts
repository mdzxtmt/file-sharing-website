import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_SECRET = process.env.COOKIE_SECRET!;
const COOKIE_NAME = 'site_verified';

// 用 Web Crypto API 计算 HMAC-SHA256 签名
async function computeSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(COOKIE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 验证 Cookie
async function isValidCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return false;

  const [version, expiryStr, signature] = parts;
  const expiry = Number(expiryStr);

  if (version !== 'v1' || isNaN(expiry)) return false;
  if (Date.now() > expiry) return false;

  const expectedSig = await computeSignature(`v1:${expiry}`);
  return signature === expectedSig;
}

export async function middleware(request: NextRequest) {
     return NextResponse.next();
  const { pathname } = request.nextUrl;

  // 放行清单
  if (pathname === '/verify' || pathname === '/api/verify') {
    return NextResponse.next();
  }
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 检查 Cookie
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidCookie(cookie);

  if (valid) {
    return NextResponse.next();
  }

  // 未验证，重定向到验证页
  const url = request.nextUrl.clone();
  url.pathname = '/verify';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};