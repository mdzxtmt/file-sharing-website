'use client';

import { useState, useEffect } from 'react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  async function loadItems() {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      setItems(data.data || []);
    } catch {}
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pwd');
    if (saved) {
      setPassword(saved);
      setLogged(true);
      loadItems();
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
      // 删除测试数据
      if (data.data?.id) {
        await fetch(`/api/announcements?id=${data.data.id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      }
      sessionStorage.setItem('admin_pwd', password);
      setLogged(true);
      await loadItems();
    } catch (e: any) {
      setError(e.message || '登录失败');
    }
  }

  async function handleSubmit() {
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
      setTitle('');
      setContent('');
      setType('info');
      await loadItems();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除这条公告？')) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '删除失败');
      }
      await loadItems();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_pwd');
    setPassword('');
    setLogged(false);
    setItems([]);
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

      <div className="glass-card p-5 sm:p-6 mb-6">
        <h2 className="text-base font-bold mb-4">📢 发布新公告</h2>

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
            placeholder="公告内容（最多 500 字）"
            maxLength={500}
            rows={4}
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
                    type === t.key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/60 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-gradient text-sm px-6 py-2.5 ml-auto disabled:opacity-50"
            >
              {submitting ? '发布中…' : '发布'}
            </button>
          </div>

          {error && <div className="text-xs text-red-500 text-center">{error}</div>}
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4">📋 现有公告（{items.length}）</h2>

        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">还没有公告</div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">
                      {a.type === 'warning' ? '⚠️' : a.type === 'success' ? '✅' : '📢'}
                    </span>
                    <span className="font-semibold text-sm">{a.title}</span>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-500 shrink-0 transition">
                    删除
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </p>
                <div className="text-[10px] text-gray-400 mt-2">{formatDate(a.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}