import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const COOKIE_SECRET = process.env.COOKIE_SECRET!;
const COOKIE_NAME = 'site_verified';

// 验证 Cookie 是否有效
function isValidCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return false;

  const [version, expiryStr, signature] = parts;
  const expiry = Number(expiryStr);

  if (version !== 'v1' || isNaN(expiry)) return false;
  if (Date.now() > expiry) return false;

  // 重新计算签名，比对
  const expectedSig = crypto
    .createHmac('sha256', COOKIE_SECRET)
    .update(`v1:${expiry}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============ 放行清单 ============
  // 1. 验证页和验证 API
  if (pathname === '/verify' || pathname === '/api/verify') {
    return NextResponse.next();
  }

  // 2. Next.js 内部资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 3. 所有静态文件（带扩展名的，如 .html .css .js .png）
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 4. 其他 API 路由（如果想让 API 也绕过验证）
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ============ 检查验证 Cookie ============
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (isValidCookie(cookie)) {
    return NextResponse.next();
  }

  // ============ 未验证，重定向到验证页 ============
  const url = request.nextUrl.clone();
  url.pathname = '/verify';
  url.search = '';  // 清空查询参数，避免循环
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，排除：
     * - _next/static (静态资源)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};