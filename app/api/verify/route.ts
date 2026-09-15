import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const response = NextResponse.json({ success: true });
    response.cookies.set('site_verified', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 小时
      path: '/',
    });

    return response;
  } catch (e: any) {
    console.error('Verify error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}