import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.GPT_SOVITS_API_URL;

  if (!base) {
    return NextResponse.json({ online: false, reason: '未配置 GPT_SOVITS_API_URL' });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(base.replace(/\/$/, '') + '/docs', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    return NextResponse.json({
      online: true,
      latency: Date.now() - start,
      status: resp.status,
    });
  } catch (e: any) {
    return NextResponse.json({
      online: false,
      reason: e.name === 'AbortError' ? '请求超时' : e.message,
      latency: Date.now() - start,
    });
  }
}
