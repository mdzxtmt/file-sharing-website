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
  { symbol: 'GOLD', name: '黄金矿业', icon: '🪙', basePrice: 100 },
  { symbol: 'TECH', name: '科技巨头', icon: '💻', basePrice: 200 },
  { symbol: 'OIL', name: '石油能源', icon: '🛢️', basePrice: 80 },
  { symbol: 'FOOD', name: '食品消费', icon: '🍔', basePrice: 50 },
  { symbol: 'BANK', name: '银行金融', icon: '🏦', basePrice: 150 },
];

// 新版价格公式：振幅更大、波动更剧烈
function getPrice(symbol, basePrice, timeMs = Date.now()) {
  const t = timeMs / 1000;
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  // 5 层波动叠加，幅度猛、周期短，模拟暴涨暴跌
  const wave1 = Math.sin(t * 0.85 + seed * 0.7) * 0.45;   // 主趋势 ~7.4 秒
  const wave2 = Math.sin(t * 1.9 + seed * 1.3) * 0.28;    // 次趋势 ~3.3 秒
  const wave3 = Math.sin(t * 4.1 + seed * 2.1) * 0.16;    // 快波动 ~1.5 秒
  const wave4 = Math.sin(t * 8.3 + seed * 3.7) * 0.09;    // 极快抖动 ~0.76 秒
  const wave5 = Math.sin(t * 15.7 + seed * 5.3) * 0.05;   // 高频噪音 ~0.4 秒
  const price = basePrice * (1 + wave1 + wave2 + wave3 + wave4 + wave5);
  // 保底：不低于基础价的 10%，防止价格跌到负数或接近 0
  const minPrice = basePrice * 0.1;
  return Math.round(Math.max(price, minPrice) * 100) / 100;
}

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
    const positions = (holdings || []).map((h) => {
      const price = prices[h.symbol] || 0;
      const value = price * h.quantity;
      const cost = h.avg_cost * h.quantity;
      totalValue += value;
      return {
        symbol: h.symbol,
        quantity: h.quantity,
        avg_cost: h.avg_cost,
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
          positions,
          totalValue,
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