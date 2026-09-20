import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (url: any, options: any) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  }
);

// 心跳接口：只更新 last_seen，不返回数据（轻量）
export async function POST(req: NextRequest) {
  try {
    const { device_id } = await req.json();

    if (!device_id) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    await supabase
      .from('user_points')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', device_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}