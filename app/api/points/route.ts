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
    const playerName = searchParams.get('player_name');

    if (!deviceId) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    // 查用户
    let { data: user, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) throw error;

    // 不存在就创建
    if (!user) {
      const { data: created, error: createErr } = await supabase
        .from('user_points')
        .insert([{
          device_id: deviceId,
          player_name: playerName || '匿名玩家',
          points: 0,
        }])
        .select()
        .single();

      if (createErr) throw createErr;
      user = created;
    } else if (playerName && user.player_name !== playerName) {
      // 同步昵称
      await supabase
        .from('user_points')
        .update({ player_name: playerName })
        .eq('device_id', deviceId);
      user.player_name = playerName;
    }

    // 计算今天是否已签到
    const today = new Date().toISOString().slice(0, 10);
    const checkedInToday = user.last_checkin === today;

    // 计算连续签到是否中断（超过 1 天没签到就归零）
    let displayStreak = user.checkin_streak;
    if (user.last_checkin) {
      const last = new Date(user.last_checkin);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) displayStreak = 0;
    }

    return NextResponse.json({
      data: {
        points: user.points,
        last_checkin: user.last_checkin,
        checkin_streak: displayStreak,
        total_checkins: user.total_checkins,
        total_spins: user.total_spins,
        checked_in_today: checkedInToday,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}