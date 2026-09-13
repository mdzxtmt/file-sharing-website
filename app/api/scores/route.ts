// app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// POST /api/scores —— 提交游戏分数
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_name, score, wave, kills, duration } = body;

    if (score === undefined || score === null) {
      return NextResponse.json({ error: '缺少 score' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_scores')
      .insert([
        {
          player_name: (player_name || '').trim().slice(0, 20) || '匿名玩家',
          score: Number(score) || 0,
          wave: Number(wave) || 1,
          kills: Number(kills) || 0,
          duration: duration ? Number(duration) : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================
// GET /api/scores?limit=20 —— 查询排行榜（每人只保留最高分）
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    // 先多取一些，用于去重后再截取
    const { data, error } = await supabase
      .from('game_scores')
      .select('id, player_name, score, wave, kills, duration, created_at')
      .order('score', { ascending: false })
      .order('wave', { ascending: false })
      .order('kills', { ascending: false })
      .limit(500);

    if (error) throw error;

    // 按玩家名去重，每人保留最高分那条（因为已按分数降序排列）
    const seen = new Set<string>();
    const unique: typeof data = [];
    for (const row of data || []) {
      const name = (row.player_name || '').trim() || '匿名玩家';
      if (seen.has(name)) continue;
      seen.add(name);
      unique.push(row);
      if (unique.length >= limit) break;
    }

    return NextResponse.json({ data: unique });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
}