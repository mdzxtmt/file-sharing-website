'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Profile = {
  user: {
    device_id: string;
    player_name: string;
    avatar: string;
    points: number;
    checkin_streak: number;
    total_checkins: number;
    total_spins: number;
    created_at: string;
    last_seen: string;
  };
  bestByGame: Record<string, any>;
  messages: { id: string; content: string; created_at: string }[];
  comments: { id: string; game_key: string; content: string; rating: number; created_at: string }[];
};

const GAME_NAMES: Record<string, { name: string; icon: string }> = {
  arena:     { name: 'ARENA FPS', icon: '🔫' },
  '2048':    { name: '2048', icon: '🔢' },
  bmpt:      { name: 'BMPT', icon: '🦼' },
  bvr:       { name: 'BVR', icon: '🚀' },
};

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('device_id') || '';
}

export default function ProfilePage() {
  const params = useParams();
  const deviceId = (params?.device_id as string) || '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMe, setIsMe] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    setIsMe(deviceId === getDeviceId());

    fetch(`/api/profile?device_id=${encodeURIComponent(deviceId)}&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d);
          // 判断在线（5 分钟内有活动）
          const lastSeen = new Date(d.user.last_seen).getTime();
          setOnline(Date.now() - lastSeen < 5 * 60 * 1000);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
    } catch { return ''; }
  }

  function formatTime(iso: string) {
    try {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      return d.toLocaleDateString('zh-CN');
    } catch { return ''; }
  }

  if (loading) {
    return (
      <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="glass-card h-48 animate-pulse bg-white/40 dark:bg-white/5 mb-6" />
        <div className="glass-card h-32 animate-pulse bg-white/40 dark:bg-white/5" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="glass-card p-12">
          <div className="text-5xl mb-3">😕</div>
          <p className="text-gray-400 mb-6">用户不存在</p>
          <Link href="/" className="btn-gradient inline-block px-6 py-2.5 text-sm">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const u = profile.user;

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 用户卡片 */}
      <div className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.12))',
          }}
        />
        <div className="relative flex items-start gap-5 flex-wrap">
          {/* 在线状态 */}
          {online && (
            <div className="shrink-0">
              <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white shadow">
                ● 在线
              </span>
            </div>
          )}

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold truncate">{u.player_name}</h1>
              {isMe && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-medium">我</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              加入于 {formatDate(u.created_at)}
            </div>

            {/* 统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatBox label="积分" value={u.points.toLocaleString()} color="text-yellow-500" />
              <StatBox label="连续签到" value={`${u.checkin_streak} 天`} color="text-indigo-500" />
              <StatBox label="累计签到" value={u.total_checkins} />
              <StatBox label="抽奖次数" value={u.total_spins} />
            </div>
          </div>
        </div>

        {isMe && (
          <div className="relative mt-5 pt-5 border-t border-white/20">
            <Link href="/user" className="btn-gradient inline-block px-5 py-2 text-sm">
              ⚙️ 编辑我的资料
            </Link>
          </div>
        )}
      </div>

      {/* 游戏战绩 */}
      {Object.keys(profile.bestByGame).length > 0 && (
        <div className="glass-card p-5 sm:p-6 mb-6">
          <h2 className="text-base font-bold mb-4">🎮 游戏战绩</h2>
          <div className="space-y-2">
            {Object.entries(profile.bestByGame).map(([key, data]) => {
              const info = GAME_NAMES[key] || { name: key, icon: '🎮' };
              const maxTile = key === '2048' ? Math.pow(2, data.wave) : null;
              return (
                <Link
                  key={key}
                  href={`/games/ranking`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition"
                >
                  <span className="text-2xl shrink-0">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{info.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {maxTile
                        ? `最大方块 ${maxTile}`
                        : `第 ${data.wave} 波 · 击杀 ${data.kills}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-indigo-500 tabular-nums">
                      {data.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 -mt-0.5">最高分</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 留言历史 */}
      {profile.messages.length > 0 && (
        <div className="glass-card p-5 sm:p-6 mb-6">
          <h2 className="text-base font-bold mb-4">💬 最近留言</h2>
          <div className="space-y-2">
            {profile.messages.map((m) => (
              <div key={m.id} className="px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{m.content}</p>
                <div className="text-[10px] text-gray-400 mt-1">{formatTime(m.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 评论历史 */}
      {profile.comments.length > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-base font-bold mb-4">⭐ 最近评论</h2>
          <div className="space-y-2">
            {profile.comments.map((c) => {
              const info = GAME_NAMES[c.game_key] || { name: c.game_key, icon: '🎮' };
              return (
                <div key={c.id} className="px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-xs font-semibold">{info.name}</span>
                    <span className="text-yellow-400 text-xs">
                      {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">{formatTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{c.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/messages" className="text-sm text-indigo-500 hover:underline">
          去留言板 →
        </Link>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="rounded-xl p-2.5 bg-white/60 dark:bg-white/10 text-center">
      <div className={`text-lg font-bold tabular-nums ${color || 'text-gray-700 dark:text-gray-200'}`}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}