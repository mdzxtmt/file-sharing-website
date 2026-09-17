'use client';

import { useState, useEffect } from 'react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
};

type Game = {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  tag: string;
  gradient: string;
  color: string;
  has_score: boolean;
  sort_order: number;
  is_active: boolean;
};

type UserRow = {
  device_id: string;
  player_name: string;
  avatar: string;
  points: number;
  checkin_streak: number;
  total_checkins: number;
  total_spins: number;
  last_seen: string;
  created_at: string;
};

type Stats = any;
type AdminLog = {
  id: string;
  action: string;
  target: string;
  detail: string;
  created_at: string;
};

type Tab = 'announce' | 'games' | 'users' | 'stats' | 'logs';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('announce');

  // ===== 公告 =====
  const [annItems, setAnnItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  // ===== 游戏 =====
  const [games, setGames] = useState<Game[]>([]);
  const defaultForm = {
    id: '', name: '', icon: '🎮', description: '', tag: '',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#6366f1', has_score: true, sort_order: 99, is_active: true,
  };
  const [gForm, setGForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ===== 用户 =====
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [renameValue, setRenameValue] = useState('');

  // ===== 统计 =====
  const [stats, setStats] = useState<Stats>(null);

  // ===== 日志 =====
  const [logs, setLogs] = useState<AdminLog[]>([]);

  // ============ 数据加载 ============
  async function loadAnnouncements() {
    try {
      const res = await fetch(`/api/announcements?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setAnnItems(data.data || []);
    } catch {}
  }
  async function loadGames(pwd: string) {
    try {
      const res = await fetch(`/api/games/admin?password=${encodeURIComponent(pwd)}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setGames(data.data || []);
    } catch {}
  }
  async function loadUsers(pwd: string, search = '') {
    setUserLoading(true);
    try {
      const url = `/api/admin/users?password=${encodeURIComponent(pwd)}&search=${encodeURIComponent(search)}&limit=100&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      const d = await res.json();
      setUsers(d.data || []);
      setUserTotal(d.total || 0);
    } catch {}
    setUserLoading(false);
  }
  async function loadStats(pwd: string) {
    try {
      const res = await fetch(`/api/admin/stats?password=${encodeURIComponent(pwd)}&t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      if (!d.error) setStats(d);
    } catch {}
  }
  async function loadLogs(pwd: string) {
    try {
      const res = await fetch(`/api/admin/logs?password=${encodeURIComponent(pwd)}&limit=100&t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      setLogs(d.data || []);
    } catch {}
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pwd');
    if (saved) {
      setPassword(saved);
      setLogged(true);
      loadAnnouncements();
      loadGames(saved);
    }
  }, []);

  // 切 Tab 时加载数据
  useEffect(() => {
    if (!logged || !password) return;
    if (tab === 'users') loadUsers(password, userSearch);
    else if (tab === 'stats') loadStats(password);
    else if (tab === 'logs') loadLogs(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logged]);

  async function handleLogin() {
    setError('');
    if (!password.trim()) { setError('请输入密码'); return; }
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, title: '__test__', content: '__test__' }),
      });
      if (res.status === 401) { setError('密码错误'); return; }
      const data = await res.json();
      if (data.data?.id) {
        await fetch(`/api/announcements?id=${data.data.id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      }
      sessionStorage.setItem('admin_pwd', password);
      setLogged(true);
      await loadAnnouncements();
      await loadGames(password);
    } catch (e: any) {
      setError(e.message || '登录失败');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_pwd');
    setPassword('');
    setLogged(false);
    setAnnItems([]);
    setGames([]);
    setUsers([]);
    setLogs([]);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  }

  function timeAgo(iso: string) {
    try {
      const diff = (Date.now() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
      return new Date(iso).toLocaleDateString('zh-CN');
    } catch { return ''; }
  }

  // ============ 登录界面 ============
  if (!logged) {
    return (
      <div className="fade-up max-w-md mx-auto px-4 py-16">
        <div className="glass-card p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">🔒 后台管理</h1>
          <p className="text-xs text-gray-500 text-center mb-6">输入管理密码进入</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="管理密码"
            className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition mb-4"
          />
          {error && <div className="text-xs text-red-500 mb-4 text-center">{error}</div>}
          <button onClick={handleLogin} className="btn-gradient w-full py-3 text-sm">
            进入后台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          🛠️ 后台管理
        </h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition">
          退出登录
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: 'announce', label: '📢 公告' },
          { key: 'games', label: '🎮 游戏' },
          { key: 'users', label: '👥 用户' },
          { key: 'stats', label: '📊 统计' },
          { key: 'logs', label: '📋 日志' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white/70 dark:bg-white/10 hover:bg-white/90'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ 公告 Tab ============ */}
      {tab === 'announce' && (
        <>
          <div className="glass-card p-5 sm:p-6 mb-6">
            <h2 className="text-base font-bold mb-4">发布新公告</h2>
            <div className="flex flex-col gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="公告标题（最多 100 字）"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="公告内容（支持 **加粗**、*斜体*、[文字](链接)、换行）"
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition resize-y"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <label className="text-sm text-gray-600 dark:text-gray-300">类型：</label>
                <div className="flex gap-2">
                  {[
                    { key: 'info', label: '📢 普通' },
                    { key: 'success', label: '✅ 成功' },
                    { key: 'warning', label: '⚠️ 警告' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        type === t.key ? 'bg-indigo-500 text-white' : 'bg-white/60 dark:bg-white/10 hover:bg-white/90'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    setError('');
                    if (!title.trim() || !content.trim()) { setError('标题和内容不能为空'); return; }
                    setSubmitting(true);
                    try {
                      const res = await fetch('/api/announcements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password, title, content, type }),
                      });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error || '创建失败');
                      setTitle(''); setContent(''); setType('info');
                      await loadAnnouncements();
                    } catch (e: any) { setError(e.message); }
                    setSubmitting(false);
                  }}
                  disabled={submitting}
                  className="btn-gradient text-sm px-6 py-2.5 ml-auto disabled:opacity-50"
                >
                  {submitting ? '发布中…' : '发布'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <h2 className="text-base font-bold mb-4">现有公告（{annItems.length}）</h2>
            {annItems.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">还没有公告</div>
            ) : (
              <div className="space-y-3">
                {annItems.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{a.type === 'warning' ? '⚠️' : a.type === 'success' ? '✅' : '📢'}</span>
                        <span className="font-semibold text-sm">{a.title}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('确定删除这条公告？')) return;
                          try {
                            const res = await fetch(`/api/announcements?id=${a.id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
                            if (!res.ok) { const d = await res.json(); throw new Error(d.error || '删除失败'); }
                            await loadAnnouncements();
                          } catch (e: any) { setError(e.message); }
                        }}
                        className="text-xs text-red-400 hover:text-red-500 shrink-0 transition"
                      >
                        删除
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    <div className="text-[10px] text-gray-400 mt-2">{formatDate(a.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ 游戏 Tab ============ */}
      {tab === 'games' && (
        <>
          <div className="glass-card p-5 sm:p-6 mb-6">
            <h2 className="text-base font-bold mb-4">
              {editingId ? `✏️ 编辑：${editingId}` : '➕ 添加新游戏'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">游戏 ID *（英文小写）</label>
                <input
                  value={gForm.id}
                  onChange={(e) => setGForm({ ...gForm, id: e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase() })}
                  disabled={!!editingId}
                  placeholder="snake"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">游戏名称 *</label>
                <input
                  value={gForm.name}
                  onChange={(e) => setGForm({ ...gForm, name: e.target.value })}
                  placeholder="贪吃蛇"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">图标 emoji</label>
                <input
                  value={gForm.icon}
                  onChange={(e) => setGForm({ ...gForm, icon: e.target.value })}
                  placeholder="🐍"
                  maxLength={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">标签</label>
                <input
                  value={gForm.tag}
                  onChange={(e) => setGForm({ ...gForm, tag: e.target.value })}
                  placeholder="休闲"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">游戏描述</label>
                <input
                  value={gForm.description}
                  onChange={(e) => setGForm({ ...gForm, description: e.target.value })}
                  placeholder="经典贪吃蛇，方向键控制。"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">主题色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={gForm.color}
                    onChange={(e) => setGForm({ ...gForm, color: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-white/40 dark:border-white/10"
                  />
                  <input
                    value={gForm.color}
                    onChange={(e) => setGForm({ ...gForm, color: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">排序（越小越前）</label>
                <input
                  type="number"
                  value={gForm.sort_order}
                  onChange={(e) => setGForm({ ...gForm, sort_order: Number(e.target.value) || 99 })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">渐变背景</label>
                <input
                  value={gForm.gradient}
                  onChange={(e) => setGForm({ ...gForm, gradient: e.target.value })}
                  placeholder="linear-gradient(135deg,#6366f1,#8b5cf6)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition font-mono text-xs"
                />
                <div className="mt-2 h-10 rounded-lg" style={{ background: gForm.gradient }} />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gForm.has_score}
                    onChange={(e) => setGForm({ ...gForm, has_score: e.target.checked })}
                    className="w-5 h-5 rounded accent-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium">参与排行榜</span>
                    <span className="text-xs text-gray-500 ml-2">（不勾选则不在排行榜显示）</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  setError('');
                  if (!gForm.id.trim() || !gForm.name.trim()) { setError('游戏 ID 和名称不能为空'); return; }
                  try {
                    const res = await fetch('/api/games/admin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password, ...gForm }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || '保存失败');
                    alert(editingId ? '更新成功' : `添加成功！记得把游戏文件上传到 public/${gForm.id}.html`);
                    setEditingId(null);
                    setGForm(defaultForm);
                    await loadGames(password);
                  } catch (e: any) { setError(e.message); }
                }}
                className="btn-gradient text-sm px-6 py-2.5"
              >
                {editingId ? '保存修改' : '一键添加'}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setGForm(defaultForm); }}
                  className="px-6 py-2.5 rounded-xl text-sm border border-gray-300 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition"
                >
                  取消编辑
                </button>
              )}
            </div>
            {error && <div className="text-xs text-red-500 mt-3">{error}</div>}
          </div>

          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">现有游戏（{games.length}）</h2>
              <button
                onClick={() => loadGames(password)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 transition"
              >
                🔄 刷新
              </button>
            </div>
            {games.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">还没有游戏</div>
            ) : (
              <div className="space-y-3">
                {games.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: g.gradient }}>
                      {g.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{g.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {g.id} · 排序 {g.sort_order} {g.has_score === false && '· 不计分'}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(g.id);
                          setGForm({
                            id: g.id, name: g.name, icon: g.icon, description: g.description || '',
                            tag: g.tag || '', gradient: g.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: g.color || '#6366f1', has_score: g.has_score !== false,
                            sort_order: g.sort_order || 99, is_active: g.is_active !== false,
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`确定删除游戏「${g.id}」？`)) return;
                          try {
                            const res = await fetch(`/api/games/admin?id=${g.id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
                            if (!res.ok) { const d = await res.json(); throw new Error(d.error || '删除失败'); }
                            await loadGames(password);
                          } catch (e: any) { setError(e.message); }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ 用户 Tab ============ */}
      {tab === 'users' && (
        <>
          <div className="glass-card p-5 sm:p-6 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers(password, userSearch)}
                placeholder="搜索昵称…"
                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
              />
              <button
                onClick={() => loadUsers(password, userSearch)}
                disabled={userLoading}
                className="btn-gradient text-sm px-5 py-2.5 disabled:opacity-50"
              >
                {userLoading ? '搜索中…' : '搜索'}
              </button>
              <button
                onClick={() => { setUserSearch(''); loadUsers(password, ''); }}
                className="text-sm px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition"
              >
                清空
              </button>
              <div className="ml-auto text-xs text-gray-500">
                共 {userTotal} 个用户
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6">
            {userLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg animate-pulse bg-white/40 dark:bg-white/5" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">没有用户</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.device_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                    <span className="text-2xl shrink-0">{u.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{u.player_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">{u.device_id.slice(0, 16)}…</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
                        <span className="text-yellow-500 font-bold">🪙 {u.points}</span>
                        <span>🔥 {u.checkin_streak}天</span>
                        <span>🎰 {u.total_spins}次</span>
                        <span>最后活跃 {timeAgo(u.last_seen)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => { setEditingUser(u); setAdjustAmount(''); setRenameValue(u.player_name); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition"
                      >
                        管理
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ 统计 Tab ============ */}
      {tab === 'stats' && (
        <>
          {!stats ? (
            <div className="glass-card p-12 text-center text-gray-400 text-sm">
              加载中…
            </div>
          ) : (
            <>
              {/* 用户 */}
              <div className="glass-card p-5 sm:p-6 mb-4">
                <h2 className="text-base font-bold mb-4">👥 用户</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox label="总用户" value={stats.users.total} color="text-indigo-500" />
                  <StatBox label="在线（5分钟）" value={stats.users.online} color="text-green-500" />
                  <StatBox label="7日活跃" value={stats.users.active7d} />
                  <StatBox label="30日活跃" value={stats.users.active30d} />
                </div>
              </div>

              {/* 签到 */}
              <div className="glass-card p-5 sm:p-6 mb-4">
                <h2 className="text-base font-bold mb-4">📅 签到</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatBox label="今日签到" value={stats.checkin.today} color="text-green-500" />
                  <StatBox label="7日签到" value={stats.checkin.week} />
                  <StatBox label="30日签到" value={stats.checkin.month} />
                </div>
                <div className="text-xs text-gray-500 mb-2">近 7 日签到趋势</div>
                <div className="flex items-end gap-1 h-24">
                  {stats.checkin.daily.map((d: any, i: number) => {
                    const max = Math.max(...stats.checkin.daily.map((x: any) => x.count), 1);
                    const h = (d.count / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div className="text-[10px] text-gray-500 tabular-nums">{d.count}</div>
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-purple-500 min-h-[4px]"
                          style={{ height: `${Math.max(h, 4)}%` }}
                        />
                        <div className="text-[9px] text-gray-400">{d.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 内容 */}
              <div className="glass-card p-5 sm:p-6 mb-4">
                <h2 className="text-base font-bold mb-4">📝 内容</h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="留言数" value={stats.content.messages} />
                  <StatBox label="评论数" value={stats.content.comments} />
                  <StatBox label="游戏记录" value={stats.content.scores} />
                </div>
              </div>

              {/* 积分 */}
              <div className="glass-card p-5 sm:p-6 mb-4">
                <h2 className="text-base font-bold mb-4">🪙 积分</h2>
                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="总积分" value={stats.points.total.toLocaleString()} color="text-yellow-500" />
                  <StatBox label="人均积分" value={stats.points.avg} />
                </div>
              </div>

              {/* 游戏分布 */}
              {Object.keys(stats.games).length > 0 && (
                <div className="glass-card p-5 sm:p-6">
                  <h2 className="text-base font-bold mb-4">🎮 游戏记录分布</h2>
                  <div className="space-y-2">
                    {Object.entries(stats.games).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5">
                        <span className="font-medium">{k}</span>
                        <span className="text-gray-500 tabular-nums">{v as number} 条</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ============ 日志 Tab ============ */}
      {tab === 'logs' && (
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">📋 操作日志（{logs.length}）</h2>
            <div className="flex gap-2">
              <button
                onClick={() => loadLogs(password)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 transition"
              >
                🔄 刷新
              </button>
              <button
                onClick={async () => {
                  if (!confirm('确定清空所有日志？')) return;
                  try {
                    const res = await fetch(`/api/admin/logs?password=${encodeURIComponent(password)}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('清空失败');
                    await loadLogs(password);
                  } catch (e: any) { setError(e.message); }
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
              >
                清空
              </button>
            </div>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无日志</div>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 font-medium">{l.action}</span>
                    <span className="text-[11px] text-gray-400 font-mono truncate">{l.target?.slice(0, 20)}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{formatDate(l.created_at)}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{l.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ 用户管理弹窗 ============ */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="glass-card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{editingUser.avatar}</span>
              <div>
                <div className="font-bold">{editingUser.player_name}</div>
                <div className="text-[11px] text-gray-400 font-mono">{editingUser.device_id}</div>
              </div>
            </div>

            {/* 改昵称 */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">改昵称</label>
              <div className="flex gap-2">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  maxLength={20}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10"
                />
                <button
                  onClick={async () => {
                    if (!renameValue.trim()) return;
                    try {
                      const res = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password, action: 'rename', device_id: editingUser.device_id, player_name: renameValue }),
                      });
                      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                      alert('改昵称成功');
                      await loadUsers(password, userSearch);
                      setEditingUser(null);
                    } catch (e: any) { alert(e.message); }
                  }}
                  className="btn-gradient text-sm px-4 py-2"
                >
                  保存
                </button>
              </div>
            </div>

            {/* 调整积分 */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                调整积分（当前 {editingUser.points}）
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="+100 或 -50"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10"
                />
                <button
                  onClick={async () => {
                    const amt = Number(adjustAmount);
                    if (!Number.isFinite(amt) || amt === 0) { alert('请输入有效数字'); return; }
                    try {
                      const res = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password, action: 'adjust_points', device_id: editingUser.device_id, amount: amt }),
                      });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error);
                      alert(`调整成功，新积分：${d.points}`);
                      await loadUsers(password, userSearch);
                      setEditingUser(null);
                    } catch (e: any) { alert(e.message); }
                  }}
                  className="btn-gradient text-sm px-4 py-2"
                >
                  调整
                </button>
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[100, 500, 1000, -100].map((v) => (
                <button
                  key={v}
                  onClick={() => setAdjustAmount(String(v))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 transition"
                >
                  {v > 0 ? `+${v}` : v}
                </button>
              ))}
            </div>

            {/* 危险操作 */}
            <div className="pt-4 border-t border-white/20 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  if (!confirm('确定重置该用户的签到？')) return;
                  try {
                    const res = await fetch('/api/admin/users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password, action: 'reset_checkin', device_id: editingUser.device_id }),
                    });
                    if (!res.ok) throw new Error('重置失败');
                    alert('已重置');
                    await loadUsers(password, userSearch);
                    setEditingUser(null);
                  } catch (e: any) { alert(e.message); }
                }}
                className="text-xs px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition"
              >
                重置签到
              </button>
              <button
                onClick={async () => {
                  if (!confirm('⚠️ 确定删除该用户及所有数据？此操作不可恢复！')) return;
                  if (!confirm('再次确认：真的要删除？')) return;
                  try {
                    const res = await fetch(`/api/admin/users?password=${encodeURIComponent(password)}&device_id=${editingUser.device_id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('删除失败');
                    alert('已删除');
                    await loadUsers(password, userSearch);
                    setEditingUser(null);
                  } catch (e: any) { alert(e.message); }
                }}
                className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition ml-auto"
              >
                删除用户
              </button>
            </div>

            <button
              onClick={() => setEditingUser(null)}
              className="mt-4 w-full py-2 rounded-xl text-sm border border-gray-300 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 统计小卡片 ===== */
function StatBox({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/50 dark:bg-white/5 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color || 'text-gray-700 dark:text-gray-200'}`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-1">{label}</div>
    </div>
  );
}