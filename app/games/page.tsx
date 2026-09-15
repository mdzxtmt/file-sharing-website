'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Game = {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  tag: string;
  gradient: string;
  color: string;
};

type ScoreItem = {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
  created_at: string;
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [rankGame, setRankGame] = useState('');
  const [topScores, setTopScores] = useState<ScoreItem[]>([]);
    const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/games');
      const d = await res.json();
      const list = d.data || [];
      setGames(list);
      // 如果当前选中的游戏被删了，切到第一个
      if (list.length > 0 && !list.find((g: Game) => g.id === rankGame)) {
        setRankGame(list[0].id);
      }
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => {
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!rankGame) return;
    setLoading(true);
    fetch(`/api/scores?game=${rankGame}&limit=5`)
      .then((r) => r.json())
      .then((d) => setTopScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rankGame]);

  const rankGameInfo = games.find((g) => g.id === rankGame);

  return (
    <div className="fade-up max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            小游戏
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            选择游戏开始挑战，冲击排行榜。
          </p>
        </div>
        <button
          onClick={loadGames}
          disabled={refreshing}
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2"
        >
          <span className={refreshing ? 'inline-block animate-spin' : ''}>🔄</span>
          <span className="hidden sm:inline">{refreshing ? '刷新中…' : '刷新'}</span>
        </button>
      </div>

      {/* 游戏卡片网格 - 动态渲染 */}
      {games.length === 0 ? (
        <div className="glass-card p-10 text-center mb-10">
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-sm text-gray-400">还没有游戏</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {games.map((g) => (
            <Link key={g.id} href={g.path || `/games/${g.id}`} className="block group">
              <div className="glass-card overflow-hidden relative h-full">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{ background: g.gradient }}
                />
                <div className="relative p-5 sm:p-6 flex flex-col gap-4 h-full">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg group-hover:scale-105 transition"
                      style={{ background: g.gradient }}
                    >
                      {g.icon}
                    </div>
                    {g.tag && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
                        {g.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold mb-1">
                      {g.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {g.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/30 dark:border-white/10">
                    <span className="text-xs text-gray-400">点击开始</span>
                    <span
                      className="text-sm font-semibold group-hover:translate-x-1 transition-transform"
                      style={{ color: g.color }}
                    >
                      开始 →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 排行榜预览 */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🏆 排行榜 Top 5
            {rankGameInfo && (
              <span className="text-sm font-normal text-gray-400">
                · {rankGameInfo.icon} {rankGameInfo.name}
              </span>
            )}
          </h3>
          <Link
            href="/games/ranking"
            className="text-sm text-indigo-500 hover:underline"
          >
            查看完整榜单 →
          </Link>
        </div>

        {games.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => setRankGame(g.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  rankGame === g.id
                    ? 'bg-indigo-500 text-white shadow'
                    : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
                }`}
              >
                {g.icon} {g.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse bg-white/40 dark:bg-white/5" />
            ))}
          </div>
        ) : topScores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-4xl mb-2">🎮</div>
            还没有成绩，快来挑战第一个吧！
          </div>
        ) : (
          <div className="space-y-2">
            {topScores.map((s, i) => {
              const medal =
                i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i === 3 ? '4️⃣' : '5️⃣';
              const maxTile = rankGame === '2048' ? Math.pow(2, s.wave) : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition"
                >
                  <div className="w-8 text-center text-lg shrink-0">{medal}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{s.player_name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {maxTile
                        ? `最大 ${maxTile}`
                        : `第 ${s.wave} 波 · 击杀 ${s.kills}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-indigo-500 tabular-nums">
                      {s.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 -mt-0.5">分</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}