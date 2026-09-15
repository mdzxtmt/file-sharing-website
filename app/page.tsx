'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Game = {
  id: string;
  name: string;
  icon: string;
};

type ScoreItem = {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
};

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState('');
  const [topScores, setTopScores] = useState<ScoreItem[]>([]);

  // 加载游戏列表
  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setGames(list);
        if (list.length > 0) setGame(list[0].id);
      })
      .catch(() => {});
  }, []);

  // 加载当前游戏 Top 3
  useEffect(() => {
    if (!game) return;
    fetch(`/api/scores?game=${game}&limit=3`)
      .then((r) => r.json())
      .then((d) => setTopScores(d.data || []))
      .catch(() => {});
  }, [game]);

  return (
    <div className="min-h-screen">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-20 sm:pb-16">
          <div className="fade-up flex flex-col items-start gap-5 max-w-3xl">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-medium">
              我是屎
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              这是mdzxtm<br className="sm:hidden" />的网站
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              用迪克做的。
            </p>
          </div>
        </div>
      </section>

      {/* ===== 两大入口 ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 语音卡片 */}
          <Link href="/voice" className="block group">
            <div className="glass-card p-6 sm:p-8 h-full relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.10), rgba(236,72,153,0.10))',
                }}
              />
              <div className="relative flex flex-col gap-4 h-full">
                <div className="flex items-start justify-between">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  >
                    🎙️
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
                    AI 语音
                  </span>
                </div>

                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-indigo-500 transition">
                    GPT-SoVITS 语音合成
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    请输入文本，目前只有塔菲。
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/30 dark:border-white/10">
                  <span className="text-xs text-gray-400">支持 0 种语言</span>
                  <span className="text-sm text-indigo-500 font-semibold group-hover:translate-x-1 transition-transform">
                    立即体验 →
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* 游戏卡片 */}
          <Link href="/games" className="block group">
            <div className="glass-card p-6 sm:p-8 h-full relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.10), rgba(234,179,8,0.08))',
                }}
              />
              <div className="relative flex flex-col gap-4 h-full">
                <div className="flex items-start justify-between">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
                  >
                    🎮
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
                    小游戏
                  </span>
                </div>

                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-orange-500 transition">
                    给木
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    一堆给木，快点给我凹排行榜（）。
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/30 dark:border-white/10">
                  <span className="text-xs text-gray-400">多款游戏</span>
                  <span className="text-sm text-orange-500 font-semibold group-hover:translate-x-1 transition-transform">
                    开始游戏 →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ===== 排行榜预览（带 Tab） ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🏆 排行榜 Top 3
            </h3>
            <Link
              href="/games/ranking"
              className="text-sm text-indigo-500 hover:underline"
            >
              查看完整榜单 →
            </Link>
          </div>

          {/* 游戏 Tab */}
          {games.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {games.filter((g) => g.has_score !== false).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGame(g.id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                    game === g.id
                      ? 'bg-indigo-500 text-white shadow'
                      : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
                  }`}
                >
                  {g.icon} {g.name}
                </button>
              ))}
            </div>
          )}

          {/* 排行榜列表 */}
          {topScores.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="text-4xl mb-2">🎮</div>
              还没有成绩，快来挑战第一个吧！
              <div className="mt-4">
                <Link
                  href={game === '2048' ? '/games/2048' : '/games/arena'}
                  className="btn-gradient inline-block px-6 py-2.5 text-sm"
                >
                  开始游戏
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {topScores.map((s, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                const maxTile = game === '2048' ? Math.pow(2, s.wave) : null;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5"
                  >
                    <div className="w-8 text-center text-lg shrink-0">
                      {medal}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {s.player_name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {game === '2048'
                          ? `最大 ${maxTile}`
                          : `第 ${s.wave} 波 · 击杀 ${s.kills}`}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-500 tabular-nums shrink-0">
                      {s.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}