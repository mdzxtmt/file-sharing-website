'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PointItem = {
  device_id: string;
  player_name: string;
  points: number;
  checkin_streak: number;
  total_checkins: number;
  total_spins: number;
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

export default function PointsPage() {
  const [items, setItems] = useState<PointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDeviceId, setMyDeviceId] = useState('');
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number | null>(null);

  useEffect(() => {
    const id = getDeviceId();
    setMyDeviceId(id);

    fetch(`/api/points/rank?limit=100&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list: PointItem[] = d.data || [];
        setItems(list);
        const idx = list.findIndex((it) => it.device_id === id);
        if (idx >= 0) {
          setMyRank(idx + 1);
          setMyPoints(list[idx].points);
        } else {
          setMyRank(null);
          setMyPoints(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            🪙 积分排行榜
          </h1>
          <p className="text-sm text-gray-500 mt-1">前 100 名</p>
        </div>
        <Link
          href="/spin"
          className="btn-gradient text-sm px-4 py-2"
        >
          🎰 转盘抽奖
        </Link>
      </div>

      {/* 我的排名卡片 */}
      {myDeviceId && (
        <div className="glass-card p-5 sm:p-6 mb-6">
          <h2 className="text-sm font-bold mb-4 text-gray-600 dark:text-gray-300">
            📍 我的排名
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-500 tabular-nums">
                {myRank === null ? '—' : `#${myRank}`}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">排名</div>
            </div>
            <div className="rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-500 tabular-nums">
                {myPoints ?? '—'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">积分</div>
            </div>
            <Link
              href="/user"
              className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-indigo-500/15 to-pink-500/15 border border-indigo-500/20 flex items-center justify-center text-center hover:from-indigo-500/25 hover:to-pink-500/25 transition"
            >
              <div>
                <div className="text-xl sm:text-2xl">📅</div>
                <div className="text-[11px] text-indigo-500 font-medium mt-1">
                  去签到
                </div>
              </div>
            </Link>
          </div>
          {myRank === null && (
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              还没有积分记录，去签到开启你的排名之旅吧
            </p>
          )}
        </div>
      )}

      {/* 排行榜 */}
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
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-5xl mb-3">🪙</div>
            <p>还没有积分记录</p>
            <Link
              href="/user"
              className="btn-gradient inline-block mt-6 px-6 py-2.5 text-sm"
            >
              去签到赚积分
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((p, i) => {
              const medal =
                i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              const isMe = p.device_id === myDeviceId;
              const isTop3 = i < 3;

              return (
                <div
                  key={p.device_id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-500/30'
                      : isTop3
                      ? 'bg-gradient-to-r from-amber-500/5 to-transparent hover:bg-white/40 dark:hover:bg-white/5'
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`w-10 text-center font-bold shrink-0 ${
                      i === 0 ? 'text-2xl' : i === 1 ? 'text-xl' : i === 2 ? 'text-lg' : 'text-sm text-gray-400'
                    }`}
                  >
                    {medal}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {p.player_name || '匿名玩家'}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-medium shrink-0">
                          我
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-3">
                      <span>🔥 连续 {p.checkin_streak} 天</span>
                      <span>📅 累计 {p.total_checkins} 次</span>
                      <span>🎰 抽奖 {p.total_spins} 次</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-yellow-500 tabular-nums">
                      {p.points.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 -mt-0.5">积分</div>
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