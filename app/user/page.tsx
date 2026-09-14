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
  game_key: string;
  player_name: string;
  score: number;
  wave: number;
  kills: number;
  duration: number | null;
  created_at: string;
};

export default function UserPage() {
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState('');
  const [myScores, setMyScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 读取昵称
  useEffect(() => {
    const name = localStorage.getItem('player_name') || '';
    setNickname(name);
  }, []);

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

    // 按游戏 + 玩家加载我的完整历史成绩
  useEffect(() => {
    if (!nickname || !game) {
      setMyScores([]);
      return;
    }
    setLoading(true);
    fetch(`/api/scores?game=${game}&raw=1&player=${encodeURIComponent(nickname)}&limit=100`)
      .then((r) => r.json())
      .then((d) => setMyScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game, nickname, saved]);

  function handleSave() {
    const name = nickname.trim().slice(0, 20) || '匿名玩家';
    localStorage.setItem('player_name', name);
    setNickname(name);
    setSaved((s) => !s); // 触发重新拉取
    setTimeout(() => setSaved(false), 1500);
  }

  // 当前游戏统计
  const totalGames = myScores.length;
  const bestScore = myScores.reduce((m, s) => Math.max(m, s.score), 0);
  const bestWave = myScores.reduce((m, s) => Math.max(m, s.wave), 0);
  const totalKills = myScores.reduce((m, s) => m + s.kills, 0);

  const gameInfo = games.find((g) => g.id === game);

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

  return (
    <div className="fade-up max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        我的
      </h1>

      {/* ===== 昵称设置 ===== */}
      <div className="glass-card p-5 sm:p-6 mb-6">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
          👤 玩家昵称
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          设置昵称后，游戏成绩会以此名字出现在排行榜上。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入你的昵称…"
            maxLength={20}
            className="flex-1 px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
          />
          <button
            onClick={handleSave}
            className="btn-gradient text-sm px-6 py-3 shrink-0"
          >
            {saved ? '✓ 已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* ===== 游戏 Tab ===== */}
      {games.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {games.map((g) => (
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
      )}

      {/* ===== 我的战绩统计 ===== */}
      <div className="glass-card p-5 sm:p-6 mb-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          📊 我的战绩
          {gameInfo && (
            <span className="text-sm font-normal text-gray-400">
              · {gameInfo.icon} {gameInfo.name}
            </span>
          )}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="游戏局数" value={totalGames} />
          <StatBox label="最高分" value={bestScore.toLocaleString()} highlight />
          <StatBox
            label={game === '2048' ? '最大方块' : '最高波次'}
            value={game === '2048' ? Math.pow(2, bestWave) : bestWave}
          />
          <StatBox
            label={game === '2048' ? '最高等级' : '累计击杀'}
            value={game === '2048' ? bestWave : totalKills}
          />
        </div>
      </div>

      {/* ===== 我的历史成绩 ===== */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            🎮 历史成绩
          </h2>
          {myScores.length > 0 && (
            <Link
              href="/games/ranking"
              className="text-sm text-indigo-500 hover:underline"
            >
              排行榜 →
            </Link>
          )}
        </div>

        {!nickname ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            请先设置昵称
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg animate-pulse bg-white/40 dark:bg-white/5"
              />
            ))}
          </div>
        ) : myScores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-4xl mb-2">🎯</div>
            <p>还没有成绩记录</p>
            <Link
              href={game === '2048' ? '/games/2048' : '/games/arena'}
              className="btn-gradient inline-block mt-4 px-6 py-2.5 text-sm"
            >
              去挑战一局
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {myScores.slice(0, 20).map((s) => {
              const maxTile = game === '2048' ? Math.pow(2, s.wave) : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {game === '2048'
                        ? `最大 ${maxTile}`
                        : `第 ${s.wave} 波 · 击杀 ${s.kills}`}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {formatDate(s.created_at)} · 用时 {formatDuration(s.duration)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-indigo-500 tabular-nums">
                      {s.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">分</div>
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

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
      <div
        className={`text-xl sm:text-2xl font-bold truncate ${
          highlight ? 'text-indigo-500' : 'text-gray-700 dark:text-gray-200'
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-1">{label}</div>
    </div>
  );
}