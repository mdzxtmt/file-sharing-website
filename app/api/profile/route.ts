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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');

    if (!deviceId) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    // 1. 用户基本信息
    const { data: user } = await supabase
      .from('user_points')
      .select('device_id, player_name, avatar, points, checkin_streak, total_checkins, total_spins, created_at, last_seen')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 2. 游戏战绩（按游戏分组，取最高分）
    const { data: scores } = await supabase
      .from('game_scores')
      .select('game_key, score, wave, kills, duration, created_at')
      .eq('device_id', deviceId)
      .order('score', { ascending: false })
      .limit(100);

    // 按 game_key 分组，取每个游戏的最高分
    const bestByGame: Record<string, any> = {};
    (scores || []).forEach((s) => {
      if (!bestByGame[s.game_key] || s.score > bestByGame[s.game_key].score) {
        bestByGame[s.game_key] = s;
      }
    });

    // 3. 留言历史
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, created_at')
      .eq('device_id', deviceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. 评论历史
    const { data: comments } = await supabase
      .from('game_comments')
      .select('id, game_key, content, rating, created_at')
      .eq('device_id', deviceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json(
      {
        user: {
          device_id: user.device_id,
          player_name: user.player_name,
          avatar: user.avatar || '😀',
          points: user.points || 0,
          checkin_streak: user.checkin_streak || 0,
          total_checkins: user.total_checkins || 0,
          total_spins: user.total_spins || 0,
          created_at: user.created_at,
          last_seen: user.last_seen,
        },
        bestByGame,
        messages: messages || [],
        comments: comments || [],
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