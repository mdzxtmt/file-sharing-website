'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Game = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

type ScoreItem = {
  id: string;
  game_key: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
  duration: number | null;
  created_at: string;
};

export default function RankingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState('');
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载游戏列表
  useEffect(() => {
    fetch('/api/games?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setGames(list);
        if (list.length > 0) setGame(list[0].id);
      })
      .catch(() => {});
  }, []);

  // 加载当前游戏排行
  useEffect(() => {
    if (!game) return;
    setLoading(true);
    fetch(`/api/scores?game=${game}&limit=50&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('zh-CN', {
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

  const gameInfo = games.find((g) => g.id === game);

  return (
    <div className="fade-up max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🏆 排行榜
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {gameInfo ? `${gameInfo.icon} ${gameInfo.name}` : '加载中…'} · 前 50 名
          </p>
        </div>
        <Link href="/games" className="text-sm text-indigo-500 hover:underline">
          ← 返回游戏
        </Link>
      </div>

      {/* 游戏 Tab */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {games.filter((g) => g.has_score !== false).map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              game === g.id
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
            }`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

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
            <div className="text-5xl mb-3">{gameInfo?.icon || '🎮'}</div>
            <p>还没有成绩记录</p>
            <p className="text-xs mt-2">快去挑战第一个成绩吧！</p>
            <Link
              href={game === '2048' ? '/games/2048' : '/games/arena'}
              className="btn-gradient inline-block mt-6 px-6 py-2.5 text-sm"
            >
              开始游戏
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[60px_1fr_100px_100px_100px] gap-2 px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/30 dark:border-white/10">
              <div>排名</div>
              <div>玩家</div>
              <div className="text-right">分数</div>
              <div className="text-right">
                {game === '2048' ? '最大方块' : '波次'}
              </div>
              <div className="text-right">时间</div>
            </div>

            <div className="divide-y divide-white/30 dark:divide-white/10">
              {scores.map((s, i) => {
                const medal =
                  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                const isTop3 = i < 3;
                const maxTile = game === '2048' ? Math.pow(2, s.wave) : null;

                return (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[40px_1fr_auto] sm:grid-cols-[60px_1fr_100px_100px_100px] gap-2 px-3 py-3 items-center transition ${
                      isTop3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''
                    } hover:bg-white/40 dark:hover:bg-white/5`}
                  >
                    <div
                      className={`text-center font-bold shrink-0 ${
                        i === 0 ? 'text-2xl' : i === 1 ? 'text-xl' : i === 2 ? 'text-lg' : 'text-sm text-gray-400'
                      }`}
                    >
                      {medal}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {s.player_name}
                      </div>
                      <div className="sm:hidden text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
                        {game === '2048' ? (
                          <span>最大 {maxTile}</span>
                        ) : (
                          <span>第 {s.wave} 波 · 击杀 {s.kills}</span>
                        )}
                        <span>{formatDuration(s.duration)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-bold text-indigo-500 tabular-nums">
                        {s.score.toLocaleString()}
                      </div>
                      <div className="sm:hidden text-[10px] text-gray-400 -mt-0.5">
                        分
                      </div>
                    </div>

                    <div className="hidden sm:block text-right text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                      {game === '2048' ? maxTile : s.wave}
                    </div>

                    <div className="hidden sm:block text-right text-xs text-gray-400 tabular-nums">
                      {formatDate(s.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}