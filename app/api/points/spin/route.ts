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

// 转盘 16 格：红 7、黑 7、绿 2
const WHEEL: string[] = [
  'red', 'black', 'red', 'green',
  'black', 'red', 'black', 'red',
  'green', 'black', 'red', 'black',
  'red', 'black', 'red', 'black',
];

const ALLOWED_BETS = [10, 50, 100, 500, 1000];
const ALLOWED_COLORS = ['red', 'black', 'green'];

export async function POST(req: NextRequest) {
  try {
    const { device_id, bet, color } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    const betAmount = Number(bet);
    if (!ALLOWED_BETS.includes(betAmount)) {
      return NextResponse.json({
        error: `下注额必须是 ${ALLOWED_BETS.join(' / ')} 之一`,
      }, { status: 400 });
    }

    if (!ALLOWED_COLORS.includes(color)) {
      return NextResponse.json({
        error: '请选择红 / 黑 / 绿',
      }, { status: 400 });
    }

    // 获取用户
    const { data: user, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ error: '用户不存在，请先签到' }, { status: 400 });
    }

    if (user.points < betAmount) {
      return NextResponse.json({
        success: false,
        error: `积分不足，需要 ${betAmount} 积分`,
        data: { points: user.points },
      }, { status: 400 });
    }

    // 抽奖
    const index = Math.floor(Math.random() * WHEEL.length);
    const resultColor = WHEEL[index];

    // 计算返还
    let multiplier = 0;
    if (resultColor === color) {
      multiplier = color === 'green' ? 10 : 2;
    }
    const payout = betAmount * multiplier;
    const profit = payout - betAmount;
    const newPoints = user.points - betAmount + payout;

    // 更新
    const { error: updateErr } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        total_spins: user.total_spins + 1,
      })
      .eq('device_id', device_id);

    if (updateErr) throw updateErr;

    // 记流水
    const colorLabel = { red: '红', black: '黑', green: '绿' }[color];
    const resultLabel = { red: '红', black: '黑', green: '绿' }[resultColor];
    await supabase.from('point_logs').insert([{
      device_id,
      amount: profit,
      reason: `猜${colorLabel} → 开出${resultLabel}（${profit >= 0 ? '+' : ''}${profit}）`,
    }]);

    return NextResponse.json({
      success: true,
      data: {
        index,
        result_color: resultColor,
        guess_color: color,
        bet: betAmount,
        multiplier,
        payout,
        profit,
        points: newPoints,
        total_slots: WHEEL.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}