'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Comment = {
  id: string;
  game_key: string;
  device_id: string;
  player_name: string;
  avatar: string;
  content: string;
  rating: number;
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

export default function CommentsPage() {
  const params = useParams();
  const gameId = (params?.id as string) || '';

  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState({ count: 0, avg_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [gameName, setGameName] = useState('');

  async function loadComments() {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/comments?game=${gameId}&limit=100&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const d = await res.json();
      setComments(d.data || []);
      setStats(d.stats || { count: 0, avg_rating: 0 });
    } catch {}
  }

  useEffect(() => {
    if (!gameId) return;

    // 加载游戏名
    fetch(`/api/games?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const g = (d.data || []).find((x: any) => x.id === gameId);
        if (g) setGameName(`${g.icon} ${g.name}`);
      })
      .catch(() => {});

    loadComments().finally(() => setLoading(false));
  }, [gameId]);

  async function handleSubmit() {
    if (submitting) return;
    if (!content.trim()) { alert('请输入评论'); return; }

    setSubmitting(true);
    try {
      const id = getDeviceId();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_key: gameId,
          device_id: id,
          player_name: localStorage.getItem('player_name') || '匿名玩家',
          content,
          rating,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '发布失败');
      setContent('');
      setRating(5);
      await loadComments();
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
      return d.toLocaleDateString('zh-CN');
    } catch { return ''; }
  }

  
  const myName = typeof window !== 'undefined' ? (localStorage.getItem('player_name') || '匿名玩家') : '匿名玩家';

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            💬 游戏评论
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {gameName || gameId} · {stats.count} 条评论
          </p>
        </div>
        <Link href={`/games/${gameId}`} className="text-sm text-indigo-500 hover:underline shrink-0">
          ← 返回游戏
        </Link>
      </div>

      {/* 评分总览 */}
      <div className="glass-card p-4 sm:p-5 mb-6 flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-yellow-500 tabular-nums">
            {stats.avg_rating || '—'}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">平均分</div>
        </div>
        <div className="flex-1">
          <Stars value={Math.round(stats.avg_rating)} readonly size="md" />
          <div className="text-xs text-gray-500 mt-1">{stats.count} 条评价</div>
        </div>
      </div>

      {/* 发布评论 */}
      <div className="glass-card p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold">{myName}</span>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1.5 block">评分</label>
          <Stars value={rating} onChange={setRating} size="lg" />
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的游戏体验…（最多 500 字）"
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
            {submitting ? '发布中…' : '发布评论'}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse bg-white/40 dark:bg-white/5" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-gray-400 text-sm">还没有评论，来写第一条吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="glass-card p-4 fade-up">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/u/${c.device_id}`}
                      className="font-semibold text-sm hover:text-indigo-500 transition"
                    >
                      {c.player_name}
                    </Link>
                    <Stars value={c.rating} readonly size="sm" />
                    <span className="text-[11px] text-gray-400">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                    {c.content}
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

/* ===== 星级评分组件 ===== */
function Stars({
  value,
  onChange,
  readonly,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };
  return (
    <div className={`flex gap-0.5 ${sizes[size]} select-none`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => !readonly && onChange && onChange(n)}
          disabled={readonly}
          className={`transition ${readonly ? 'cursor-default' : 'hover:scale-110 active:scale-95'}`}
          type="button"
        >
          <span className={n <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}