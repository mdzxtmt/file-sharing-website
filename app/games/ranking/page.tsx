'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ScoreItem = {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
  duration: number | null;
  created_at: string;
};

export default function RankingPage() {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scores?limit=50')
      .then((r) => r.json())
      .then((d) => setScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  function formatDuration(sec: number | null) {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className="fade-up max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🏆 排行榜
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ARENA FPS · 前 50 名
          </p>
        </div>
        <Link
          href="/games"
          className="text-sm text-indigo-500 hover:underline"
        >
          ← 返回游戏
        </Link>
      </div>

      {/* 排行榜列表 */}
      <div className="glass-card p-4 sm:p-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg animate-pulse bg-white/40 dark:bg-white/5"
              />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-5xl mb-3">🎮</div>
            <p>还没有成绩记录</p>
            <p className="text-xs mt-2">快去挑战第一个成绩吧！</p>
            <Link
              href="/games/arena"
              className="btn-gradient inline-block mt-6 px-6 py-2.5 text-sm"
            >
              开始游戏
            </Link>
          </div>
        ) : (
          <>
            {/* 表头（桌面端显示） */}
            <div className="hidden sm:grid grid-cols-[60px_1fr_100px_80px_80px_100px] gap-2 px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/30 dark:border-white/10">
              <div>排名</div>
              <div>玩家</div>
              <div className="text-right">分数</div>
              <div className="text-right">波次</div>
              <div className="text-right">击杀</div>
              <div className="text-right">时间</div>
            </div>

            {/* 列表 */}
            <div className="divide-y divide-white/30 dark:divide-white/10">
              {scores.map((s, i) => (
                <ScoreRow
                  key={s.id}
                  rank={i + 1}
                  item={s}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreRow({
  rank,
  item,
  formatDate,
  formatDuration,
}: {
  rank: number;
  item: ScoreItem;
  formatDate: (s: string) => string;
  formatDuration: (s: number | null) => string;
}) {
  const medal =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;

  const isTop3 = rank <= 3;

  return (
    <div
      className={`grid grid-cols-[40px_1fr_auto] sm:grid-cols-[60px_1fr_100px_80px_80px_100px] gap-2 px-3 py-3 items-center transition ${
        isTop3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''
      } hover:bg-white/40 dark:hover:bg-white/5`}
    >
      {/* 排名 */}
      <div
        className={`text-center font-bold shrink-0 ${
          rank === 1
            ? 'text-2xl'
            : rank === 2
            ? 'text-xl'
            : rank === 3
            ? 'text-lg'
            : 'text-sm text-gray-400'
        }`}
      >
        {medal}
      </div>

      {/* 玩家 + 移动端详情 */}
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate">{item.player_name}</div>
        <div className="sm:hidden text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
          <span>第 {item.wave} 波</span>
          <span>击杀 {item.kills}</span>
          <span>{formatDuration(item.duration)}</span>
        </div>
      </div>

      {/* 分数（移动端显示在右侧） */}
      <div className="text-right shrink-0">
        <div className="text-base sm:text-lg font-bold text-indigo-500 tabular-nums">
          {item.score.toLocaleString()}
        </div>
        <div className="sm:hidden text-[10px] text-gray-400 -mt-0.5">分</div>
      </div>

      {/* 桌面端额外列 */}
      <div className="hidden sm:block text-right text-sm text-gray-600 dark:text-gray-300 tabular-nums">
        {item.wave}
      </div>
      <div className="hidden sm:block text-right text-sm text-gray-600 dark:text-gray-300 tabular-nums">
        {item.kills}
      </div>
      <div className="hidden sm:block text-right text-xs text-gray-400 tabular-nums">
        {formatDate(item.created_at)}
      </div>
    </div>
  );
}