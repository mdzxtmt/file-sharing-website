import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST：提交分数
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { game_key = 'arena', player_name, score, wave, kills, duration } = body;

    if (score === undefined || score === null) {
      return NextResponse.json({ error: '缺少 score' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_scores')
      .insert([{
        game_key,
        player_name: (player_name || '').trim().slice(0, 20) || '匿名玩家',
        score: Number(score) || 0,
        wave: Number(wave) || 1,
        kills: Number(kills) || 0,
        duration: duration ? Number(duration) : null,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET：查询排行榜（按游戏区分）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game') || 'arena';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const { data, error } = await supabase
      .from('game_scores')
      .select('id, game_key, player_name, score, wave, kills, duration, created_at')
      .eq('game_key', game)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    // 按玩家去重，保留最高分
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