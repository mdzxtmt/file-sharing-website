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

// 阶梯利率
function getInterestRate(amount: number): number {
  if (amount >= 5000) return 0.03;
  if (amount >= 1000) return 0.02;
  return 0.01;
}

// 计算单笔欠款
function calcDebt(loan: any) {
  const hoursPassed = (Date.now() - new Date(loan.borrowed_at).getTime()) / (1000 * 60 * 60);
  // 借了立刻算 1 天，之后每过 24 小时 +1 天
  const days = Math.floor(hoursPassed / 24) + 1;
  const interest = Math.floor(loan.principal * Number(loan.interest_rate) * days);
  const total = loan.principal + interest;
  const remaining = Math.max(0, total - loan.repaid);
  return { days, interest, total, remaining };
}

const MAX_LOAN = 10000;

// GET：查询当前欠款
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');

    if (!deviceId) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    const { data: loans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_cleared', false)
      .order('borrowed_at', { ascending: true });

    if (error) throw error;

    const list = (loans || []).map((l) => ({
      id: l.id,
      principal: l.principal,
      repaid: l.repaid,
      interest_rate: Number(l.interest_rate),
      borrowed_at: l.borrowed_at,
      ...calcDebt(l),
    }));

    const totalDebt = list.reduce((s, l) => s + l.remaining, 0);
    const totalPrincipal = list.reduce((s, l) => s + l.principal, 0);
    const totalInterest = list.reduce((s, l) => s + l.interest, 0);
    const totalRepaid = list.reduce((s, l) => s + l.repaid, 0);

    return NextResponse.json(
      {
        data: {
          loans: list,
          summary: {
            count: list.length,
            total_debt: totalDebt,
            total_principal: totalPrincipal,
            total_interest: totalInterest,
            total_repaid: totalRepaid,
            max_loan: MAX_LOAN,
          },
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

// POST：借款
export async function POST(req: NextRequest) {
  try {
    const { device_id, amount } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1 || Math.floor(amt) !== amt) {
      return NextResponse.json({ error: '借款金额必须是 ≥ 1 的整数' }, { status: 400 });
    }
    if (amt > MAX_LOAN) {
      return NextResponse.json({ error: `单笔借款上限 ${MAX_LOAN}` }, { status: 400 });
    }

    // 检查未还清的欠款数量
    const { data: existing } = await supabase
      .from('loans')
      .select('id')
      .eq('device_id', device_id)
      .eq('is_cleared', false);

    if ((existing || []).length >= 5) {
      return NextResponse.json({ error: '未还清的借款最多 5 笔' }, { status: 400 });
    }

    // 检查用户
    const { data: user, error: userErr } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!user) {
      return NextResponse.json({ error: '用户不存在，请先签到' }, { status: 400 });
    }

    const rate = getInterestRate(amt);

    // 创建借款记录
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .insert([{
        device_id,
        principal: amt,
        interest_rate: rate,
        repaid: 0,
      }])
      .select()
      .single();

    if (loanErr) throw loanErr;

    // 立即到账
    const newPoints = user.points + amt;
    await supabase
      .from('user_points')
      .update({ points: newPoints })
      .eq('device_id', device_id);

    // 记流水
    await supabase.from('point_logs').insert([{
      device_id,
      amount: amt,
      reason: `借款 ${amt}（日息 ${(rate * 100).toFixed(1)}%）`,
    }]);

    return NextResponse.json({
      success: true,
      data: {
        loan_id: loan.id,
        amount: amt,
        rate,
        points: newPoints,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}