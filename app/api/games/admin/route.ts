import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkPwd(pwd: string | null | undefined) {
  return pwd === process.env.ADMIN_PASSWORD;
}

// GET：所有游戏（包括禁用的，需要密码）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (!checkPwd(password)) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST：新增或更新游戏
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      password, id, name, icon, description, path,
      tag, gradient, color, sort_order, is_active,
    } = body;

    if (!checkPwd(password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    if (!id?.trim() || !name?.trim()) {
      return NextResponse.json({ error: '游戏 ID 和名称不能为空' }, { status: 400 });
    }

    const record = {
      id: id.trim().slice(0, 30),
      name: name.trim().slice(0, 50),
      icon: (icon || '🎮').slice(0, 10),
      description: (description || '').slice(0, 200),
      path: (path || `/games/${id.trim()}`).slice(0, 100),
      tag: (tag || '').slice(0, 20),
      gradient: (gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)').slice(0, 200),
      color: (color || '#6366f1').slice(0, 20),
      sort_order: Number(sort_order) || 99,
      is_active: is_active !== false,
    };

    const { data, error } = await supabase
      .from('games')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE：删除游戏
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const password = searchParams.get('password');

    if (!checkPwd(password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}