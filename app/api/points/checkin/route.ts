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

// 签到奖励规则：随机积分
function getReward(streak: number): { reward: number; critical: boolean } {
  // 基础奖励：随机 8 ~ 18
  const base = 8 + Math.floor(Math.random() * 11);

  // 连续签到加成：每多一天 1~3 分随机，最多 10 天
  const streakBonus = Math.min(streak, 10) * (1 + Math.floor(Math.random() * 3));

  // 10% 概率触发"暴击"，翻倍
  const isCritical = Math.random() < 0.1;
  const total = base + streakBonus;

  return {
    reward: isCritical ? total * 2 : total,
    critical: isCritical,
  };
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

    // 计算奖励
    const { reward, critical } = getReward(newStreak);

    // ===== 自动抵扣欠款 =====
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('device_id', device_id)
      .eq('is_cleared', false)
      .order('borrowed_at', { ascending: true });

    let autoPaid = 0;
    let leftReward = reward;

    if (loans && loans.length > 0) {
      for (const loan of loans) {
        if (leftReward <= 0) break;
        const hoursPassed = (Date.now() - new Date(loan.borrowed_at).getTime()) / (1000 * 60 * 60);
        const days = Math.floor(hoursPassed / 24) + 1;
        const interest = Math.floor(loan.principal * Number(loan.interest_rate) * days);
        const total = loan.principal + interest;
        const remaining = Math.max(0, total - loan.repaid);
        const pay = Math.min(leftReward, remaining);
        const newRepaid = loan.repaid + pay;
        const cleared = newRepaid >= total;

        await supabase
          .from('loans')
          .update({
            repaid: newRepaid,
            is_cleared: cleared,
            cleared_at: cleared ? new Date().toISOString() : null,
          })
          .eq('id', loan.id);

        leftReward -= pay;
        autoPaid += pay;
      }

      if (autoPaid > 0) {
        await supabase.from('point_logs').insert([{
          device_id,
          amount: -autoPaid,
          reason: `签到自动抵扣欠款 ${autoPaid}`,
        }]);
      }
    }

    const newPoints = user.points + leftReward;

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
      reason: critical
        ? `每日签到暴击（连续 ${newStreak} 天）`
        : `每日签到（连续 ${newStreak} 天）`,
    }]);

    return NextResponse.json({
      success: true,
      data: {
        reward,
        critical,
        auto_paid: autoPaid,
        points: newPoints,
        checkin_streak: newStreak,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}