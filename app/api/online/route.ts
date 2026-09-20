import { NextResponse } from 'next/server';
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

// 在线判定：5 分钟内有活动
const ONLINE_WINDOW_MINUTES = 2;

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000).toISOString();

    // 在线人数
    const { count: onlineCount, error: err1 } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', cutoff);

    if (err1) throw err1;

    // 总用户数
    const { count: totalCount, error: err2 } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true });

    if (err2) throw err2;

    return NextResponse.json(
      {
        online: onlineCount || 0,
        total: totalCount || 0,
        window: ONLINE_WINDOW_MINUTES,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}