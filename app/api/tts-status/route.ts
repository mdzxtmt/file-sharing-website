// app/api/tts-status/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.GPT_SOVITS_API_URL;

  if (!base) {
    return NextResponse.json(
      { online: false, reason: '未配置 GPT_SOVITS_API_URL' },
      { status: 200 }
    );
  }

  const start = Date.now();

  try {
    // GPT-SoVITS api_v2.py 是 FastAPI，请求根路径或 /docs
    // 只要服务器有响应（哪怕是 404/405），就说明服务在线
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 秒超时

    const resp = await fetch(base.replace(/\/$/, '') + '/docs', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: process.env.GPT_SOVITS_API_KEY
        ? { Authorization: `Bearer ${process.env.GPT_SOVITS_API_KEY}` }
        : undefined,
    });

    clearTimeout(timeout);

    const latency = Date.now() - start;

    // 只要有任何 HTTP 响应，就认为服务可达
    return NextResponse.json({
      online: true,
      latency,
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