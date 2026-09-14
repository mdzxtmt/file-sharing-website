'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ScoreItem = {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
  created_at: string;
};

export default function GamesPage() {
  const [topScores, setTopScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scores?limit=5')
      .then((r) => r.json())
      .then((d) => setTopScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          小游戏
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          3D 生存射击，挑战波次，冲击排行榜。
        </p>
      </div>

      {/* 游戏入口大卡片 */}
      <Link href="/games/arena" className="block group mb-10">
        <div className="glass-card overflow-hidden relative">
          {/* 渐变背景装饰 */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.12), rgba(99,102,241,0.15))',
            }}
          />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
            {/* 图标 */}
            <div
              className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl shadow-lg group-hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
            >
              🔫
            </div>

            {/* 文字 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold">ARENA FPS</h2>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
                  3D 射击
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                3D 生存射击。波次挑战、武器改装、弹反回血。
                支持键鼠与触屏操作，手机电脑都能玩。
              </p>
              <div className="mt-3 flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-gray-500">
                <span>🎯 波次生存</span>
                <span>🔧 武器改装</span>
                <span>⚡ 弹反回血</span>
                <span>📱 触屏支持</span>
              </div>
            </div>

            {/* 按钮 */}
            <div className="shrink-0">
              <span className="btn-gradient inline-block px-7 py-3 text-sm group-hover:translate-x-1 transition-transform">
                开始游戏 →
              </span>
            </div>
          </div>
        </div>
      </Link>
            {/* 2048 入口 */}
      <Link href="/games/2048" className="block group mb-10">
        <div className="glass-card overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: 'linear-gradient(135deg, rgba(249,168,38,0.15), rgba(237,194,46,0.12))',
            }}
          />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
            <div
              className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl shadow-lg group-hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg,#f9a826,#edc22e)' }}
            >
              🔢
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold">2048</h2>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
                  数字合并
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                滑动合并相同数字，挑战 2048 方块。支持键盘方向键和手机滑动。
              </p>
              <div className="mt-3 flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-gray-500">
                <span>📱 触摸滑动</span>
                <span>⌨️ 方向键</span>
                <span>🏆 排行榜</span>
              </div>
            </div>
            <div className="shrink-0">
              <span className="btn-gradient inline-block px-7 py-3 text-sm group-hover:translate-x-1 transition-transform">
                开始游戏 →
              </span>
            </div>
          </div>
        </div>
      </Link>


      {/* 排行预览 */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🏆 排行榜 Top 5
          </h3>
          <Link
            href="/games/ranking"
            className="text-sm text-indigo-500 hover:underline"
          >
            查看完整榜单 →
          </Link>
        </div>

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
            {topScores.map((s, i) => (
              <ScoreRow key={s.id} rank={i + 1} item={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ rank, item }: { rank: number; item: ScoreItem }) {
  const medal =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition">
      <div className="w-8 text-center text-lg shrink-0">{medal}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{item.player_name}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          第 {item.wave} 波 · 击杀 {item.kills}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-lg font-bold text-indigo-500 tabular-nums">
          {item.score.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-400">分</div>
      </div>
    </div>
  );
}