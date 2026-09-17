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

// GET：获取留言列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const { data, error } = await supabase
      .from('messages')
      .select('id, device_id, player_name, avatar, content, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      { data: data || [] },
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

// POST：发布留言
export async function POST(req: NextRequest) {
  try {
    const { device_id, player_name, avatar, content } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    const trimmed = content.trim().slice(0, 500);

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        device_id,
        player_name: (player_name || '匿名玩家').trim().slice(0, 20),
        avatar: (avatar || '😀').slice(0, 8),
        content: trimmed,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：删除留言（需要密码）
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const password = searchParams.get('password');

    if (!checkPwd(password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    // 软删除
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}