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

// 签到奖励规则
function getReward(streak: number): number {
  const base = 10;
  const bonus = Math.min(streak, 10) * 2; // 连续天数加成，最多 +20
  return base + bonus;
}

export async function POST(req: NextRequest) {
  try {
    const { device_id, player_name } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // 获取用户
    let { data: user, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (error) throw error;

    // 不存在就创建
    if (!user) {
      const { data: created, error: createErr } = await supabase
        .from('user_points')
        .insert([{
          device_id,
          player_name: player_name || '匿名玩家',
        }])
        .select()
        .single();
      if (createErr) throw createErr;
      user = created;
    }

    // 今天已签到
    if (user.last_checkin === today) {
      return NextResponse.json({
        success: false,
        error: '今天已经签到过了',
        data: {
          points: user.points,
          checkin_streak: user.checkin_streak,
        },
      }, { status: 400 });
    }

    // 计算连续天数
    let newStreak = 1;
    if (user.last_checkin) {
      const last = new Date(user.last_checkin);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = user.checkin_streak + 1;
      }
    }

    const reward = getReward(newStreak);
    const newPoints = user.points + reward;

    // 更新
    const { error: updateErr } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        last_checkin: today,
        checkin_streak: newStreak,
        total_checkins: user.total_checkins + 1,
        player_name: player_name || user.player_name,
      })
      .eq('device_id', device_id);

    if (updateErr) throw updateErr;

    // 记流水
    await supabase.from('point_logs').insert([{
      device_id,
      amount: reward,
      reason: `每日签到（连续 ${newStreak} 天）`,
    }]);

    return NextResponse.json({
      success: true,
      data: {
        reward,
        points: newPoints,
        checkin_streak: newStreak,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}