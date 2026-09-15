import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'site_verified';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 小时

function signCookie(expiryMs: number): string {
  const secret = process.env.COOKIE_SECRET || '';
  const data = `v1:${expiryMs}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  return `${data}:${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: '缺少验证令牌' }, { status: 400 });
    }

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      console.error('Turnstile failed:', verifyData);
      return NextResponse.json({ error: '人机验证失败' }, { status: 403 });
    }

    const expiry = Date.now() + COOKIE_MAX_AGE * 1000;
    const cookieValue = signCookie(expiry);

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