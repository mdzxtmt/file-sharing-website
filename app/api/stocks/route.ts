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

// 股票定义（前后端一致）
export const STOCKS = [
  { symbol: 'GOLD', name: '黄金矿业', icon: '🥇', basePrice: 100 },
  { symbol: 'TECH', name: '科技龙头', icon: '💻', basePrice: 200 },
  { symbol: 'OIL',  name: '石油集团', icon: '🛢️', basePrice: 80 },
  { symbol: 'FOOD', name: '食品公司', icon: '🍔', basePrice: 50 },
  { symbol: 'BANK', name: '银行控股', icon: '🏦', basePrice: 150 },
];

// 确定性价格公式（前后端一致）
export function getPrice(symbol: string, basePrice: number, timeMs: number): number {
  const t = timeMs / 1000;
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const wave1 = Math.sin(t * 0.2 + seed * 0.7) * 0.12;
  const wave2 = Math.sin(t * 0.53 + seed * 1.3) * 0.07;
  const wave3 = Math.sin(t * 1.27 + seed * 2.1) * 0.04;
  return Math.round(basePrice * (1 + wave1 + wave2 + wave3));
}

// GET：获取持仓 + 积分
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');

    if (!deviceId) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    // 用户积分
    const { data: user } = await supabase
      .from('user_points')
      .select('points')
      .eq('device_id', deviceId)
      .maybeSingle();

    // 持仓
    const { data: holdings } = await supabase
      .from('stock_holdings')
      .select('symbol, quantity, avg_cost')
      .eq('device_id', deviceId)
      .gt('quantity', 0);

    // 最新价格
    const now = Date.now();
    const prices: Record<string, number> = {};
    for (const s of STOCKS) {
      prices[s.symbol] = getPrice(s.symbol, s.basePrice, now);
    }

    // 计算持仓市值
    let totalValue = 0;
    const positionList = (holdings || []).map((h) => {
      const price = prices[h.symbol] || 0;
      const value = price * h.quantity;
      const cost = Number(h.avg_cost) * h.quantity;
      totalValue += value;
      return {
        symbol: h.symbol,
        quantity: h.quantity,
        avg_cost: Number(h.avg_cost),
        current_price: price,
        value,
        cost,
        profit: value - cost,
      };
    });

    return NextResponse.json(
      {
        data: {
          points: user?.points || 0,
          prices,
          holdings: positionList,
          total_value: totalValue,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}