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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    const now = Date.now();
    const day1 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const min5 = new Date(now - 5 * 60 * 1000).toISOString();

    // ============ 基础统计 ============
    const [
      { count: totalUsers },
      { count: onlineUsers },
      { count: activeUsers7d },
      { count: activeUsers30d },
      { count: totalMessages },
      { count: totalComments },
      { count: totalScores },
    ] = await Promise.all([
      supabase.from('user_points').select('*', { count: 'exact', head: true }),
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_seen', min5),
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_seen', day7),
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_seen', day30),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('game_comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('game_scores').select('*', { count: 'exact', head: true }),
    ]);

    // ============ 签到统计 ============
    const [
      { count: checkinToday },
      { count: checkin7d },
      { count: checkin30d },
    ] = await Promise.all([
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_checkin', day1.slice(0, 10)),
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_checkin', day7.slice(0, 10)),
      supabase.from('user_points').select('*', { count: 'exact', head: true }).gte('last_checkin', day30.slice(0, 10)),
    ]);

    // ============ 积分总量 ============
    const { data: pointsSum } = await supabase
      .from('user_points')
      .select('points');

    const totalPoints = (pointsSum || []).reduce((s, u) => s + (u.points || 0), 0);

    // ============ 每日签到曲线（最近 7 天）============
    const dailyCheckins: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const { count } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('last_checkin', dateStr);
      dailyCheckins.push({ date: dateStr, count: count || 0 });
    }

    // ============ 游戏分数分布 ============
    const { data: gameScores } = await supabase
      .from('game_scores')
      .select('game_key');

    const gameStats: Record<string, number> = {};
    (gameScores || []).forEach((s) => {
      gameStats[s.game_key] = (gameStats[s.game_key] || 0) + 1;
    });

    return NextResponse.json(
      {
        users: {
          total: totalUsers || 0,
          online: onlineUsers || 0,
          active7d: activeUsers7d || 0,
          active30d: activeUsers30d || 0,
        },
        checkin: {
          today: checkinToday || 0,
          week: checkin7d || 0,
          month: checkin30d || 0,
          daily: dailyCheckins,
        },
        content: {
          messages: totalMessages || 0,
          comments: totalComments || 0,
          scores: totalScores || 0,
        },
        points: {
          total: totalPoints,
          avg: totalUsers ? Math.round(totalPoints / totalUsers) : 0,
        },
        games: gameStats,
      },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}