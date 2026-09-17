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

function checkPwd(pwd: string | null | undefined) {
  return pwd === process.env.ADMIN_PASSWORD;
}

// 记日志
async function log(action: string, target: string, detail: string) {
  try {
    await supabase.from('admin_logs').insert([{ action, target, detail }]);
  } catch {}
}

// GET：用户列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  const search = searchParams.get('search') || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    let query = supabase
      .from('user_points')
      .select('device_id, player_name, avatar, points, checkin_streak, total_checkins, total_spins, last_seen, created_at', { count: 'exact' });

    if (search) {
      query = query.ilike('player_name', `%${search}%`);
    }

    const { data, error, count } = await query
      .order('last_seen', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      { data: data || [], total: count || 0 },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST：调整积分 / 改昵称
export async function POST(req: NextRequest) {
  try {
    const { password, action, device_id, amount, player_name } = await req.json();

    if (!checkPwd(password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    if (!device_id) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    // 获取用户
    const { data: user, error: getErr } = await supabase
      .from('user_points')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (getErr) throw getErr;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // ===== 调整积分 =====
    if (action === 'adjust_points') {
      const delta = Number(amount);
      if (!Number.isFinite(delta) || delta === 0) {
        return NextResponse.json({ error: '积分调整量必须是有效的非零数' }, { status: 400 });
      }

      const newPoints = Math.max(0, user.points + delta);

      const { error: upErr } = await supabase
        .from('user_points')
        .update({ points: newPoints })
        .eq('device_id', device_id);

      if (upErr) throw upErr;

      // 记流水
      await supabase.from('point_logs').insert([{
        device_id,
        amount: delta,
        reason: `管理员调整`,
      }]);

      await log('adjust_points', device_id, `${user.player_name}: ${user.points} → ${newPoints}（${delta >= 0 ? '+' : ''}${delta}）`);

      return NextResponse.json({ success: true, points: newPoints });
    }

    // ===== 改昵称 =====
    if (action === 'rename') {
      const name = (player_name || '').trim().slice(0, 20);
      if (!name) {
        return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
      }

      const { error: upErr } = await supabase
        .from('user_points')
        .update({ player_name: name })
        .eq('device_id', device_id);

      if (upErr) throw upErr;

      await log('rename', device_id, `${user.player_name} → ${name}`);

      return NextResponse.json({ success: true });
    }

    // ===== 重置签到（测试用）=====
    if (action === 'reset_checkin') {
      const { error: upErr } = await supabase
        .from('user_points')
        .update({ last_checkin: null, checkin_streak: 0 })
        .eq('device_id', device_id);

      if (upErr) throw upErr;

      await log('reset_checkin', device_id, `${user.player_name} 重置签到`);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：删除用户
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    const deviceId = searchParams.get('device_id');

    if (!checkPwd(password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    if (!deviceId) {
      return NextResponse.json({ error: '缺少 device_id' }, { status: 400 });
    }

    // 删除用户数据
    await supabase.from('user_points').delete().eq('device_id', deviceId);
    await supabase.from('point_logs').delete().eq('device_id', deviceId);
    await supabase.from('messages').delete().eq('device_id', deviceId);
    await supabase.from('game_comments').delete().eq('device_id', deviceId);

    await log('delete_user', deviceId, '删除用户及所有数据');

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}