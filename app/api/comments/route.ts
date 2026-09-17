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

// GET：获取某游戏的评论
// ?game=arena
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    if (!game) {
      return NextResponse.json({ error: '缺少 game 参数' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_comments')
      .select('id, game_key, device_id, player_name, avatar, content, rating, created_at')
      .eq('game_key', game)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 计算平均分
    const list = data || [];
    const avgRating = list.length > 0
      ? list.reduce((s, c) => s + (c.rating || 0), 0) / list.length
      : 0;

    return NextResponse.json(
      {
        data: list,
        stats: {
          count: list.length,
          avg_rating: Math.round(avgRating * 10) / 10,
        },
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

// POST：发布评论
export async function POST(req: NextRequest) {
  try {
    const { game_key, device_id, player_name, avatar, content, rating } = await req.json();

    if (!game_key || !device_id) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    const ratingNum = Math.max(1, Math.min(5, Number(rating) || 5));

    const { data, error } = await supabase
      .from('game_comments')
      .insert([{
        game_key,
        device_id,
        player_name: (player_name || '匿名玩家').trim().slice(0, 20),
        avatar: (avatar || '😀').slice(0, 8),
        content: content.trim().slice(0, 500),
        rating: ratingNum,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：删除评论（需要密码）
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

    const { error } = await supabase
      .from('game_comments')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}