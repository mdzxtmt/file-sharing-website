'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Message = {
  id: string;
  device_id: string;
  player_name: string;
  avatar: string;
  content: string;
  created_at: string;
};

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('device_id', id);
  }
  return id;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myDeviceId, setMyDeviceId] = useState('');
  const [myAvatar, setMyAvatar] = useState('😀');
  const [myName, setMyName] = useState('匿名玩家');

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages?limit=100&t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      setMessages(d.data || []);
    } catch {}
  }

  useEffect(() => {
    const id = getDeviceId();
    setMyDeviceId(id);
    setMyName(localStorage.getItem('player_name') || '匿名玩家');
    setMyAvatar(localStorage.getItem('player_avatar') || '😀');

    loadMessages().finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (submitting) return;
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: myDeviceId,
          player_name: myName,
          avatar: myAvatar,
          content,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '发布失败');
      setContent('');
      await loadMessages();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      const now = Date.now();
      const diff = (now - d.getTime()) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
      return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            💬 留言板
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {messages.length} 条留言</p>
        </div>
        <Link href="/" className="text-sm text-indigo-500 hover:underline shrink-0">← 返回首页</Link>
      </div>

      {/* 发布框 */}
      <div className="glass-card p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{myAvatar}</span>
          <span className="text-sm font-semibold">{myName}</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么吧…（最多 500 字）"
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition resize-y"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">{content.length} / 500</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="btn-gradient text-sm px-6 py-2 disabled:opacity-50"
          >
            {submitting ? '发布中…' : '发布留言'}
          </button>
        </div>
      </div>

      {/* 留言列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse bg-white/40 dark:bg-white/5" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">还没有留言，来发第一条吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="glass-card p-4 fade-up">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{m.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <Link
                      href={`/u/${m.device_id}`}
                      className="font-semibold text-sm hover:text-indigo-500 transition"
                    >
                      {m.player_name}
                    </Link>
                    <span className="text-[11px] text-gray-400">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                    {m.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}