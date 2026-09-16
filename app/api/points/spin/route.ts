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

const SPIN_COST = 20;

// 奖品配置：权重越大越容易中
const PRIZES = [
  { label: '谢谢参与', points: 0,   weight: 30, color: '#666' },
  { label: '5 积分',   points: 5,   weight: 25, color: '#10b981' },
  { label: '10 积分',  points: 10,  weight: 20, color: '#3b82f6' },
  { label: '20 积分',  points: 20,  weight: 12, color: '#8b5cf6' },
  { label: '50 积分',  points: 50,  weight: 8,  color: '#ec4899' },
  { label: '100 积分', points: 100, weight: 4,  color: '#f59e0b' },
  { label: '200 积分', points: 200, weight: 1,  color: '#ef4444' },
];

function drawPrize() {
  const totalWeight = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return { index: i, prize: PRIZES[i] };
  }
  return { index: 0, prize: PRIZES[0] };
}

export async function POST(req: NextRequest) {
  try {
    const { device_id } = await req.json();

    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
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

    // 积分不足
    if (user.points < SPIN_COST) {
      return NextResponse.json({
        success: false,
        error: `积分不足，需要 ${SPIN_COST} 积分`,
        data: { points: user.points },
      }, { status: 400 });
    }

    // 抽奖
    const { index, prize } = drawPrize();

    // 结算
    const newPoints = user.points - SPIN_COST + prize.points;
    const { error: updateErr } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        total_spins: user.total_spins + 1,
      })
      .eq('device_id', device_id);

    if (updateErr) throw updateErr;

    // 记流水
    await supabase.from('point_logs').insert([
      { device_id, amount: -SPIN_COST, reason: '转盘抽奖消耗' },
      ...(prize.points > 0
        ? [{ device_id, amount: prize.points, reason: `转盘奖励：${prize.label}` }]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        index,
        label: prize.label,
        color: prize.color,
        points_won: prize.points,
        points: newPoints,
        total_prizes: PRIZES.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}