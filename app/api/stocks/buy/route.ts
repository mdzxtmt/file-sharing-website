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

const STOCKS = [
  { symbol: 'GOLD', basePrice: 100 },
  { symbol: 'TECH', basePrice: 200 },
  { symbol: 'OIL', basePrice: 80 },
  { symbol: 'FOOD', basePrice: 50 },
  { symbol: 'BANK', basePrice: 150 },
];

// 新版价格公式（与 route.ts 完全一致）
function getPrice(symbol: string, basePrice: number, t: number): number {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const wave1 = Math.sin(t * 0.8 + seed * 0.7) * 0.25;
  const wave2 = Math.sin(t * 1.9 + seed * 1.3) * 0.15;
  const wave3 = Math.sin(t * 3.7 + seed * 2.1) * 0.08;
  const jitter = Math.sin(t * 12.3 + seed * 5.7) * 0.04;
  return Math.round(basePrice * (1 + wave1 + wave2 + wave3 + jitter));
}

export async function POST(req: NextRequest) {
  try {
    const { device_id, symbol, quantity } = await req.json();
    if (!device_id || !symbol) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: '数量必须是正整数' }, { status: 400 });
    }

    const stock = STOCKS.find((s) => s.symbol === symbol);
    if (!stock) {
      return NextResponse.json({ error: '股票不存在' }, { status: 400 });
    }

    // 最新价格
    const now = Date.now();
    const price = getPrice(symbol, stock.basePrice, now);
    const total = price * qty;

    // 用户
    const { data: user } = await supabase
      .from('user_points')
      .select('points')
      .eq('device_id', device_id)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: '用户不存在，请先签到' }, { status: 400 });
    }
    if ((user.points || 0) < total) {
      return NextResponse.json(
        { error: `积分不足（需 ${total}，当前 ${user.points}）` },
        { status: 400 }
      );
    }

    // 扣分
    const newPoints = user.points - total;
    await supabase
      .from('user_points')
      .update({ points: newPoints })
      .eq('device_id', device_id);

    // 更新持仓（合并）
    const { data: existing } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('device_id', device_id)
      .eq('symbol', symbol)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + qty;
      const newAvg = (existing.avg_cost * existing.quantity + total) / newQty;
      await supabase
        .from('stock_holdings')
        .update({
          quantity: newQty,
          avg_cost: Math.round(newAvg * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('stock_holdings').insert({
        device_id,
        symbol,
        quantity: qty,
        avg_cost: price,
      });
    }

    // 记录交易
    await supabase.from('stock_trades').insert({
      device_id,
      symbol,
      type: 'buy',
      quantity: qty,
      price,
      total,
    });

    // 记录积分流水
    await supabase.from('point_logs').insert({
      device_id,
      amount: -total,
      reason: `买入 ${symbol} × ${qty} @ ${price}`,
    });

    return NextResponse.json({
      success: true,
      data: { price, total, points: newPoints },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}