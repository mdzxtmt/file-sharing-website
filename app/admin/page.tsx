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
  sort_order: number;
  is_active: boolean;
  has_score: boolean;
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'announce' | 'games'>('announce');

  // 公告
  const [annItems, setAnnItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  // 游戏
  const [games, setGames] = useState<Game[]>([]);
  const defaultForm = {
    id: '', name: '', icon: '🎮', description: '', tag: '',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#6366f1', has_score: true, sort_order: 99, is_active: true,
  };
  const [gForm, setGForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pwd');
    if (saved) {
      setPassword(saved);
      setLogged(true);
      loadAnnouncements();
      loadGames(saved);
    }
  }, []);

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

  async function handleSubmitAnnounce() {
    setError('');
    if (!title.trim() || !content.trim()) { setError('标题和内容不能为空'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, title, content, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建失败');
      setTitle(''); setContent(''); setType('info');
      await loadAnnouncements();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnnounce(id: string) {
    if (!confirm('确定删除这条公告？')) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '删除失败');
      }
      await loadAnnouncements();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSaveGame() {
    setError('');
    if (!gForm.id.trim() || !gForm.name.trim()) {
      setError('游戏 ID 和名称不能为空');
      return;
    }
    try {
      const res = await fetch('/api/games/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...gForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      alert(
        editingId
          ? '更新成功'
          : `添加成功！\n\n记得把游戏文件上传到 public/${gForm.id}.html`
      );
      setEditingId(null);
      setGForm(defaultForm);
      await loadGames(password);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleEditGame(g: Game) {
    setEditingId(g.id);
    setGForm({
      id: g.id,
      name: g.name,
      icon: g.icon,
      description: g.description || '',
      tag: g.tag || '',
      gradient: g.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      color: g.color || '#6366f1',
      sort_order: g.sort_order || 99,
      is_active: g.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteGame(id: string) {
    if (!confirm(`确定删除游戏「${id}」？\n\n注意：public/${id}.html 文件需要手动删除。`)) return;
    try {
      const res = await fetch(`/api/games/admin?id=${id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '删除失败');
      }
      await loadGames(password);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_pwd');
    setPassword('');
    setLogged(false);
    setAnnItems([]);
    setGames([]);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  }

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
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          🛠️ 后台管理
        </h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition">
          退出登录
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('announce')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
            tab === 'announce' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 dark:bg-white/10 hover:bg-white/90'
          }`}
        >
          📢 公告管理
        </button>
        <button
          onClick={() => setTab('games')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
            tab === 'games' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 dark:bg-white/10 hover:bg-white/90'
          }`}
        >
          🎮 游戏管理
        </button>
      </div>

      {/* ============ 公告管理 ============ */}
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
                  onClick={handleSubmitAnnounce}
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
                      <button onClick={() => handleDeleteAnnounce(a.id)} className="text-xs text-red-400 hover:text-red-500 shrink-0 transition">
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

      {/* ============ 游戏管理 ============ */}
      {tab === 'games' && (
        <>
          <div className="glass-card p-5 sm:p-6 mb-6">
            <h2 className="text-base font-bold mb-4">
              {editingId ? `✏️ 编辑：${editingId}` : '➕ 添加新游戏'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">游戏 ID *（英文小写，如 snake）</label>
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
                <label className="text-xs text-gray-500 mb-1 block">标签（右上角）</label>
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
                <label className="text-xs text-gray-500 mb-1 block">排序（越小越靠前）</label>
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
                    <span className="text-xs text-gray-500 ml-2">
                      （不勾选则不在排行榜/用户中心显示）
                    </span>
                  </div>
                </label>
              </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveGame} className="btn-gradient text-sm px-6 py-2.5">
                {editingId ? '保存修改' : '一键添加'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setGForm(defaultForm);
                  }}
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
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: g.gradient }}
                    >
                      {g.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{g.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {g.id} · 排序 {g.sort_order}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditGame(g)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteGame(g.id)}
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
    </div>
  );
}