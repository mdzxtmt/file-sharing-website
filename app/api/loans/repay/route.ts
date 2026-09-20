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

function calcDebt(loan: any) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(loan.borrowed_at).getTime()) / (1000 * 60 * 60 * 24))
  );
  const interest = Math.floor(loan.principal * Number(loan.interest_rate) * days);
  const total = loan.principal + interest;
  const remaining = Math.max(0, total - loan.repaid);
  return { days, interest, total, remaining };
}

// POST：还款（可部分还）
export async function POST(req: NextRequest) {
  try {
    const { device_id, amount } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1 || Math.floor(amt) !== amt) {
      return NextResponse.json({ error: '还款金额必须是 ≥ 1 的整数' }, { status: 400 });
    }

    // 获取用户
    const { data: user, error: userErr } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 });
    }

    if (user.points < amt) {
      return NextResponse.json({ error: '积分不足' }, { status: 400 });
    }

    // 获取所有未还清借款（按时间从早到晚）
    const { data: loans, error: loansErr } = await supabase
      .from('loans')
      .select('*')
      .eq('device_id', device_id)
      .eq('is_cleared', false)
      .order('borrowed_at', { ascending: true });

    if (loansErr) throw loansErr;
    if (!loans || loans.length === 0) {
      return NextResponse.json({ error: '没有需要还的借款' }, { status: 400 });
    }

    // 按顺序还款
    let remainingPay = amt;
    let totalPaid = 0;

    for (const loan of loans) {
      if (remainingPay <= 0) break;
      const debt = calcDebt(loan);
      const pay = Math.min(remainingPay, debt.remaining);
      const newRepaid = loan.repaid + pay;
      const cleared = newRepaid >= debt.total;

      await supabase
        .from('loans')
        .update({
          repaid: newRepaid,
          is_cleared: cleared,
          cleared_at: cleared ? new Date().toISOString() : null,
        })
        .eq('id', loan.id);

      remainingPay -= pay;
      totalPaid += pay;
    }

    // 扣除用户积分
    const newPoints = user.points - totalPaid;
    await supabase
      .from('user_points')
      .update({ points: newPoints })
      .eq('device_id', device_id);

    // 记流水
    await supabase.from('point_logs').insert([{
      device_id,
      amount: -totalPaid,
      reason: `还款 ${totalPaid}`,
    }]);

    return NextResponse.json({
      success: true,
      data: {
        paid: totalPaid,
        points: newPoints,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}