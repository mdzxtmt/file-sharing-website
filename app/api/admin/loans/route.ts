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

// GET：借款列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  const status = searchParams.get('status') || 'all'; // all / active / cleared
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    let query = supabase.from('loans').select('*');

    if (status === 'active') query = query.eq('is_cleared', false);
    else if (status === 'cleared') query = query.eq('is_cleared', true);

    const { data, error } = await query
      .order('borrowed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 获取所有 device_id 对应的昵称
    const deviceIds = [...new Set((data || []).map((l) => l.device_id))];
    let nameMap: Record<string, string> = {};
    if (deviceIds.length > 0) {
      const { data: users } = await supabase
        .from('user_points')
        .select('device_id, player_name')
        .in('device_id', deviceIds);
      (users || []).forEach((u) => {
        nameMap[u.device_id] = u.player_name;
      });
    }

    const list = (data || []).map((l) => ({
      ...l,
      player_name: nameMap[l.device_id] || '匿名玩家',
      ...calcDebt(l),
    }));

    // 统计
    const activeLoans = list.filter((l) => !l.is_cleared);
    const stats = {
      total: list.length,
      active_count: activeLoans.length,
      total_principal: list.reduce((s, l) => s + l.principal, 0),
      total_debt: activeLoans.reduce((s, l) => s + l.remaining, 0),
      total_interest: activeLoans.reduce((s, l) => s + l.interest, 0),
    };

    return NextResponse.json(
      { data: list, stats },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：删除单笔借款
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');
  const id = searchParams.get('id');

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  }

  try {
    await supabase.from('loans').delete().eq('id', id);

    // 记日志
    await supabase.from('admin_logs').insert([{
      action: 'delete_loan',
      target: id,
      detail: `删除借款记录`,
    }]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}