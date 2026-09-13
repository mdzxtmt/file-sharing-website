'use client';

import Link from 'next/link';

type Game = {
  id: string;
  href: string;
  title: string;
  desc: string;
  icon: string;
  tag: string;
  gradient: string;
  available: boolean;
};

const GAMES: Game[] = [
  {
    id: 'memory',
    href: '/game',
    title: '记忆翻牌',
    desc: '翻开两张相同的图案即可消除，考验你的记忆力与观察力。',
    icon: '🃏',
    tag: '益智',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    available: true,
  },
  {
    id: 'arena',
    href: '/arena',
    title: 'ARENA FPS',
    desc: '3D 生存射击，波次挑战、武器改装、弹反回血。支持键鼠与触屏。',
    icon: '🔫',
    tag: '射击',
    gradient: 'linear-gradient(135deg,#ef4444,#f97316)',
    available: true,
  },
];

export default function GamesPage() {
  return (
    <div className="fade-up max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          小游戏
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          选择一个游戏开始，支持手机和电脑。
        </p>
      </div>

      {/* 游戏卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const inner = (
    <div className="glass-card p-5 flex flex-col gap-3 h-full group">
      {/* 图标 + 标签 */}
      <div className="flex items-start justify-between">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md"
          style={{ background: game.gradient }}
        >
          <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
            {game.icon}
          </span>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium">
          {game.tag}
        </span>
      </div>

      {/* 标题 + 描述 */}
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-1 group-hover:text-indigo-500 transition">
          {game.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {game.desc}
        </p>
      </div>

      {/* 按钮 */}
      <div className="flex items-center justify-between pt-2 border-t border-white/30 dark:border-white/10">
        <span className="text-xs text-gray-400">点击开始</span>
        <span className="text-sm text-indigo-500 font-semibold group-hover:translate-x-1 transition-transform">
          进入 →
        </span>
      </div>
    </div>
  );

  if (!game.available) {
    return (
      <div className="opacity-60 cursor-not-allowed">
        {inner}
      </div>
    );
  }

  return (
    <Link href={game.href} className="block h-full">
      {inner}
    </Link>
  );
}