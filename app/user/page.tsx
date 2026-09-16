'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Game = {
  id: string;
  name: string;
  icon: string;
  has_score: boolean;
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

type PointsData = {
  points: number;
  last_checkin: string | null;
  checkin_streak: number;
  total_checkins: number;
  total_spins: number;
  checked_in_today: boolean;
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

export default function UserPage() {
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState('');
  const [myScores, setMyScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 积分相关
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [checking, setChecking] = useState(false);

  // 读取昵称
  useEffect(() => {
    const name = localStorage.getItem('player_name') || '';
    setNickname(name);
  }, []);

  // 加载积分
  const loadPoints = async () => {
    const id = getDeviceId();
    if (!id) return;
    try {
      const res = await fetch(
        `/api/points?device_id=${id}&player_name=${encodeURIComponent(nickname || '匿名玩家')}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const d = await res.json();
      if (d.data) setPointsData(d.data);
    } catch {}
  };

  useEffect(() => {
    loadPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, saved]);

  // 加载游戏列表
  useEffect(() => {
    fetch(`/api/games?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setGames(list);
        const scoreGames = list.filter((g: Game) => g.has_score !== false);
        if (scoreGames.length > 0) setGame(scoreGames[0].id);
      })
      .catch(() => {});
  }, []);

  // 加载我的成绩
  useEffect(() => {
    if (!nickname || !game) {
      setMyScores([]);
      return;
    }
    setLoading(true);
    fetch(
      `/api/scores?game=${game}&raw=1&player=${encodeURIComponent(nickname)}&limit=100&t=${Date.now()}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((d) => setMyScores(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game, nickname, saved]);

  function handleSave() {
    const name = nickname.trim().slice(0, 20) || '匿名玩家';
    localStorage.setItem('player_name', name);
    setNickname(name);
    setSaved((s) => !s);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleCheckin() {
    if (checking || pointsData?.checked_in_today) return;
    setChecking(true);
    try {
      const id = getDeviceId();
      const res = await fetch('/api/points/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: id,
          player_name: nickname || '匿名玩家',
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || '签到失败');
        return;
      }
      const isCrit = d.data.critical;
      alert(
        `签到成功！+${d.data.reward} 积分${isCrit ? ' 🎉 暴击翻倍！' : ''}\n连续签到 ${d.data.checkin_streak} 天`
      );
      await loadPoints();
    } catch (e: any) {
      alert('签到失败：' + e.message);
    } finally {
      setChecking(false);
    }
  }

  const totalGames = myScores.length;
  const bestScore = myScores.reduce((m, s) => Math.max(m, s.score), 0);
  const bestWave = myScores.reduce((m, s) => Math.max(m, s.wave), 0);
  const totalKills = myScores.reduce((m, s) => m + s.kills, 0);

  const scoreGames = games.filter((g) => g.has_score !== false);
  const gameInfo = scoreGames.find((g) => g.id === game);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('zh-CN', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
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

      {/* ===== 积分卡片 ===== */}
      <div className="glass-card p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            🪙 我的积分
          </h2>
          <Link
            href="/spin"
            className="btn-gradient text-sm px-4 py-2"
          >
            🎰 转盘抽奖
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-500 tabular-nums">
              {pointsData?.points ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">当前积分</div>
          </div>
          <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-500 tabular-nums">
              {pointsData?.checkin_streak ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">连续签到</div>
          </div>
          <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-200 tabular-nums">
              {pointsData?.total_checkins ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">累计签到</div>
          </div>
          <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-200 tabular-nums">
              {pointsData?.total_spins ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">累计抽奖</div>
          </div>
        </div>

        <button
          onClick={handleCheckin}
          disabled={checking || pointsData?.checked_in_today}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
            pointsData?.checked_in_today
              ? 'bg-green-500/20 text-green-600 dark:text-green-400 cursor-not-allowed'
              : 'btn-gradient'
          } disabled:opacity-70`}
        >
          {checking
            ? '签到中…'
            : pointsData?.checked_in_today
            ? '✅ 今日已签到'
            : '📅 每日签到（+10 ~ 30 积分）'}
        </button>
        <p className="text-[11px] text-gray-400 mt-2 text-center">
          连续签到越多，奖励越高（最多 +20 加成）
        </p>
      </div>

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
      {scoreGames.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {scoreGames.map((g) => (
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

      {/* ===== 我的战绩 ===== */}
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

      {/* ===== 历史成绩 ===== */}
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
              <div key={i} className="h-14 rounded-lg animate-pulse bg-white/40 dark:bg-white/5" />
            ))}
          </div>
        ) : myScores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-4xl mb-2">🎯</div>
            <p>还没有成绩记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myScores.slice(0, 20).map((s) => {
              const maxTile = game === '2048' ? Math.pow(2, s.wave) : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {maxTile
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
  label, value, highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
      <div className={`text-xl sm:text-2xl font-bold truncate ${
        highlight ? 'text-indigo-500' : 'text-gray-700 dark:text-gray-200'
      }`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-1">{label}</div>
    </div>
  );
}