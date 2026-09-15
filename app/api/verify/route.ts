import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY!;
const COOKIE_SECRET = process.env.COOKIE_SECRET!;
const COOKIE_NAME = 'site_verified';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 小时

// 生成签名 Cookie 的值
function generateCookieValue(expiryMs: number): string {
  const data = `v1:${expiryMs}`;
  const signature = crypto
    .createHmac('sha256', COOKIE_SECRET)
    .update(data)
    .digest('hex');
  return `${data}:${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: '缺少验证令牌' }, { status: 400 });
    }

    // 向 Cloudflare 验证令牌
    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: TURNSTILE_SECRET,
          response: token,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      console.error('Turnstile failed:', verifyData);
      return NextResponse.json({ error: '人机验证失败' }, { status: 403 });
    }

    // 验证通过，设置签名 Cookie
    const expiry = Date.now() + COOKIE_MAX_AGE * 1000;
    const cookieValue = generateCookieValue(expiry);

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (e: any) {
    console.error('Verify error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}