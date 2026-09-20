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
    if (!Number.isFinite(betAmount) || betAmount < 1 || Math.floor(betAmount) !== betAmount) {
      return NextResponse.json({ error: '下注额必须是 ≥ 1 的整数' }, { status: 400 });
    }
    if (betAmount > 1000000) {
      return NextResponse.json({ error: '下注额上限 1000000' }, { status: 400 });
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
    let newPoints = user.points - betAmount + payout;
    let autoPaid = 0;

    // ===== 如果赢了，自动抵扣欠款 =====
    if (profit > 0) {
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('device_id', device_id)
        .eq('is_cleared', false)
        .order('borrowed_at', { ascending: true });

      let left = profit;
      if (loans && loans.length > 0) {
        for (const loan of loans) {
          if (left <= 0) break;
          const days = Math.max(
            0,
            Math.floor((Date.now() - new Date(loan.borrowed_at).getTime()) / (1000 * 60 * 60 * 24))
          );
          const interest = Math.floor(loan.principal * Number(loan.interest_rate) * days);
          const total = loan.principal + interest;
          const remaining = Math.max(0, total - loan.repaid);
          const pay = Math.min(left, remaining);
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

          left -= pay;
          autoPaid += pay;
        }

        // 抵扣的部分从 newPoints 里减去
        newPoints -= autoPaid;

        if (autoPaid > 0) {
          await supabase.from('point_logs').insert([{
            device_id,
            amount: -autoPaid,
            reason: `转盘收益自动抵扣欠款 ${autoPaid}`,
          }]);
        }
      }
    }

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
        auto_paid: autoPaid,
        points: newPoints,
        total_slots: WHEEL.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}