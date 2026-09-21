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
  { symbol: 'OIL',  basePrice: 80 },
  { symbol: 'FOOD', basePrice: 50 },
  { symbol: 'BANK', basePrice: 150 },
];

function getPrice(symbol: string, basePrice: number, timeMs: number): number {
  const t = timeMs / 1000;
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const wave1 = Math.sin(t * 0.2 + seed * 0.7) * 0.12;
  const wave2 = Math.sin(t * 0.53 + seed * 1.3) * 0.07;
  const wave3 = Math.sin(t * 1.27 + seed * 2.1) * 0.04;
  return Math.round(basePrice * (1 + wave1 + wave2 + wave3));
}

export async function POST(req: NextRequest) {
  try {
    const { device_id, symbol, quantity } = await req.json();

    if (!device_id || !symbol) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1 || Math.floor(qty) !== qty) {
      return NextResponse.json({ error: '数量必须是 ≥ 1 的整数' }, { status: 400 });
    }

    const stock = STOCKS.find((s) => s.symbol === symbol);
    if (!stock) {
      return NextResponse.json({ error: '股票不存在' }, { status: 400 });
    }

    // 当前价格
    const now = Date.now();
    const price = getPrice(symbol, stock.basePrice, now);
    const total = price * qty;

    // 检查持仓
    const { data: holding } = await supabase
      .from('stock_holdings')
      .select('*')
      .eq('device_id', device_id)
      .eq('symbol', symbol)
      .maybeSingle();

    if (!holding || holding.quantity < qty) {
      return NextResponse.json({ error: '持仓不足' }, { status: 400 });
    }

    // 更新持仓
    const newQty = holding.quantity - qty;
    await supabase
      .from('stock_holdings')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', holding.id);

    // 加积分
    const { data: user } = await supabase
      .from('user_points')
      .select('points')
      .eq('device_id', device_id)
      .maybeSingle();

    const newPoints = (user?.points || 0) + total;
    await supabase
      .from('user_points')
      .update({ points: newPoints })
      .eq('device_id', device_id);

    // 计算盈亏
    const cost = Number(holding.avg_cost) * qty;
    const profit = total - cost;

    // 记录交易
    await supabase.from('stock_trades').insert([{
      device_id,
      symbol,
      type: 'sell',
      quantity: qty,
      price,
      total,
      profit,
    }]);

    // 积分流水
    await supabase.from('point_logs').insert([{
      device_id,
      amount: total,
      reason: `卖出 ${symbol} × ${qty} @ ${price}（${profit >= 0 ? '+' : ''}${profit}）`,
    }]);

    return NextResponse.json({
      success: true,
      data: { price, total, profit, points: newPoints },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}