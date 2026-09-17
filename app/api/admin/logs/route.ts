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

function checkPwd(pwd: string | null | undefined) {
  return pwd === process.env.ADMIN_PASSWORD;
}

// GET：操作日志列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json(
      { data: data || [] },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：清空日志
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    await supabase.from('admin_logs').delete().lt('created_at', new Date(0).toISOString());
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}