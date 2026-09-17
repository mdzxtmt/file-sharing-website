'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const BETS = [10, 50, 100, 500, 1000];

// 与后端一致：红 7 / 黑 7 / 绿 2
const WHEEL_COLORS: ('red' | 'black' | 'green')[] = [
  'red', 'black', 'red', 'green',
  'black', 'red', 'black', 'red',
  'green', 'black', 'red', 'black',
  'red', 'black', 'red', 'black',
];

const COLOR_CONFIG = {
  red:   { bg: '#dc2626', label: '红', emoji: '🔴' },
  black: { bg: '#1a1a1a', label: '黑', emoji: '⚫' },
  green: { bg: '#16a34a', label: '绿', emoji: '🟢' },
};

type SpinResult = {
  index: number;
  result_color: 'red' | 'black' | 'green';
  guess_color: 'red' | 'black' | 'green';
  bet: number;
  multiplier: number;
  payout: number;
  profit: number;
  points: number;
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

export default function SpinPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [bet, setBet] = useState(100);
    const [customBet, setCustomBet] = useState('');
  const [guess, setGuess] = useState<'red' | 'black' | 'green'>('red');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [history, setHistory] = useState<SpinResult[]>([]);

  // 加载积分
  useEffect(() => {
    const id = getDeviceId();
    const name = localStorage.getItem('player_name') || '匿名玩家';
    fetch(`/api/points?device_id=${id}&player_name=${encodeURIComponent(name)}&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => { if (d.data) setPoints(d.data.points); })
      .catch(() => {});
  }, []);

  async function handleSpin() {
    if (spinning) return;
    if (points === null) return;
        if (!Number.isFinite(bet) || bet < 1 || Math.floor(bet) !== bet) {
      alert('下注额必须是 ≥ 1 的整数');
      return;
    }
    if (points < bet) {
      alert(`积分不足，需要 ${bet} 积分`);
      return;
    }

    setSpinning(true);
    setResult(null);

    try {
      const id = getDeviceId();
      const res = await fetch('/api/points/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: id, bet, color: guess }),
      });
      const d = await res.json();

      if (!res.ok) {
        alert(d.error || '下注失败');
        setSpinning(false);
        return;
      }

      const winIndex = d.data.index;
      const totalSlots = WHEEL_COLORS.length;
      const anglePerSlot = 360 / totalSlots;

      // 让中奖格中心停在指针位置（顶部）
      const baseRotation = rotation % 360;
      const targetAngle = 360 - (winIndex + 0.5) * anglePerSlot;
      const randomOffset = (Math.random() - 0.5) * (anglePerSlot * 0.6);
      const finalRotation = rotation - baseRotation + 360 * 6 + targetAngle + randomOffset;

      setRotation(finalRotation);

      setTimeout(() => {
        setResult(d.data);
        setPoints(d.data.points);
        setHistory((h) => [d.data, ...h].slice(0, 10));
        setSpinning(false);
      }, 5000);
    } catch (e: any) {
      alert('网络错误：' + e.message);
      setSpinning(false);
    }
  }

  const anglePerSlot = 360 / WHEEL_COLORS.length;
  const gradientStops = WHEEL_COLORS.map((color, i) => {
    const start = i * anglePerSlot;
    const end = (i + 1) * anglePerSlot;
    return `${COLOR_CONFIG[color].bg} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="fade-up max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-red-500 via-gray-700 to-green-500 bg-clip-text text-transparent">
            🎰 幸运轮盘
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            猜颜色：红 ×2 / 黑 ×2 / 绿 ×10
          </p>
        </div>
        <Link href="/user" className="text-sm text-indigo-500 hover:underline shrink-0">
          ← 我的
        </Link>
      </div>

      {/* 积分 */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-500">当前积分</span>
        <span className="text-2xl font-bold text-yellow-500 tabular-nums">
          {points ?? '...'}
        </span>
      </div>

      {/* 转盘 */}
      <div className="relative flex items-center justify-center mb-6 select-none">
        {/* 顶部指针 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: '-12px' }}>
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '16px solid transparent',
              borderRight: '16px solid transparent',
              borderTop: '32px solid #fbbf24',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
            }}
          />
        </div>

        <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px]">
          <div
            className="absolute inset-0 rounded-full shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
              padding: '10px',
            }}
          >
            <div
              className="w-full h-full rounded-full relative"
              style={{
                background: `conic-gradient(${gradientStops})`,
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? 'transform 5s cubic-bezier(0.15, 0.9, 0.15, 1)'
                  : 'none',
              }}
            >
              {/* 每格上的数字 */}
              {WHEEL_COLORS.map((_, i) => {
                const angle = (i + 0.5) * anglePerSlot;
                return (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 h-1/2 origin-bottom flex justify-center"
                    style={{
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                      width: '40px',
                    }}
                  >
                    <div className="pt-5 sm:pt-7">
                      <span
                        className="text-white font-extrabold text-sm sm:text-base"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                      >
                        {i + 1}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* 中心宝石 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl flex items-center justify-center z-10 border-4 border-white">
                <span className="text-2xl sm:text-3xl">💎</span>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* 下注额 */}
      <div className="glass-card p-4 mb-3">
        <div className="text-xs text-gray-500 mb-2 font-medium">💰 下注额</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {BETS.map((b) => (
            <button
              key={b}
              onClick={() => { setBet(b); setCustomBet(''); }}
              disabled={spinning}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                bet === b && !customBet
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow'
                  : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* 自定义输入 */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={customBet}
            onChange={(e) => {
              const v = e.target.value;
              setCustomBet(v);
              const n = Number(v);
              if (n > 0 && Number.isFinite(n)) {
                setBet(Math.floor(n));
              }
            }}
            placeholder="自定义下注额"
            min={1}
            disabled={spinning}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-yellow-400 transition disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 shrink-0">积分</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          下注额 ≥ 1，且不超过当前积分
        </p>
      </div>

      {/* 猜颜色 */}
      <div className="glass-card p-4 mb-4">
        <div className="text-xs text-gray-500 mb-2 font-medium">🎯 猜颜色</div>
        <div className="grid grid-cols-3 gap-2">
          {(['red', 'black', 'green'] as const).map((c) => {
            const cfg = COLOR_CONFIG[c];
            const active = guess === c;
            const multiplier = c === 'green' ? 10 : 2;
            return (
              <button
                key={c}
                onClick={() => setGuess(c)}
                disabled={spinning}
                className={`relative py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-50 ${
                  active ? 'ring-4 ring-yellow-400 shadow-lg scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ background: cfg.bg }}
              >
                <div className="text-xl mb-0.5">{cfg.emoji}</div>
                <div>{cfg.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">×{multiplier}</div>
                {active && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 转动按钮 */}
      <button
        onClick={handleSpin}
        disabled={spinning || points === null || points < bet}
        className="w-full py-4 text-base font-bold rounded-xl text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{
          background: spinning
            ? 'linear-gradient(135deg, #6b7280, #4b5563)'
            : `linear-gradient(135deg, ${COLOR_CONFIG[guess].bg}, #f59e0b)`,
        }}
      >
        {spinning
          ? '🎲 转动中…'
          : points === null
          ? '加载中…'
          : points < bet
          ? `积分不足（需 ${bet}）`
          : `🎰 猜${COLOR_CONFIG[guess].label} 下注 ${bet}`}
      </button>

      {/* 结果 */}
      {result && (
        <div className="glass-card p-6 mt-6 text-center fade-up">
          <div className="text-7xl mb-3">
            {result.profit > 0 ? '🎉' : result.profit === 0 ? '😐' : '💸'}
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">开出</div>
            <div
              className="inline-block px-6 py-3 rounded-2xl text-white text-2xl font-extrabold shadow-lg"
              style={{ background: COLOR_CONFIG[result.result_color].bg }}
            >
              {COLOR_CONFIG[result.result_color].emoji} {COLOR_CONFIG[result.result_color].label}
            </div>
          </div>
          <div className="text-lg font-bold mb-3">
            {result.profit > 0 ? (
              <span className="text-green-500">+{result.profit} 积分</span>
            ) : result.profit === 0 ? (
              <span className="text-gray-400">保本</span>
            ) : (
              <span className="text-red-500">{result.profit} 积分</span>
            )}
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <div>下注 <b>{result.bet}</b>，返还 <b>{result.payout}</b></div>
            {result.multiplier > 0 && (
              <div className="text-xs text-green-500">倍率 ×{result.multiplier}</div>
            )}
            <div className="pt-2 border-t border-white/20 mt-2">
              当前积分：
              <span className="font-bold text-yellow-500 text-lg">{result.points}</span>
            </div>
          </div>
        </div>
      )}

      {/* 历史 */}
      {history.length > 0 && (
        <div className="glass-card p-5 mt-6">
          <h3 className="text-sm font-bold mb-3 text-gray-600 dark:text-gray-300">
            📜 最近记录
          </h3>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5 gap-2"
              >
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_CONFIG[h.guess_color].bg }} />
                  <span className="text-gray-400">→</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_CONFIG[h.result_color].bg }} />
                </span>
                <span className="text-gray-500">下注 {h.bet}</span>
                <span
                  className={`font-bold tabular-nums shrink-0 ${
                    h.profit > 0 ? 'text-green-500' : h.profit === 0 ? 'text-gray-400' : 'text-red-500'
                  }`}
                >
                  {h.profit >= 0 ? '+' : ''}{h.profit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 概率说明 */}
      <div className="glass-card p-5 mt-6">
        <h3 className="text-sm font-bold mb-3 text-gray-600 dark:text-gray-300">
          🎯 概率与倍率
        </h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { color: 'red', count: 7, multiplier: 2 },
            { color: 'black', count: 7, multiplier: 2 },
            { color: 'green', count: 2, multiplier: 10 },
          ].map(({ color, count, multiplier }) => {
            const c = color as 'red' | 'black' | 'green';
            const prob = (count / 16 * 100).toFixed(1);
            return (
              <div
                key={color}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-white"
                style={{ background: COLOR_CONFIG[c].bg }}
              >
                <span className="text-2xl">{COLOR_CONFIG[c].emoji}</span>
                <span className="font-bold">{COLOR_CONFIG[c].label}</span>
                <span className="text-[10px] opacity-80">{prob}%</span>
                <span className="text-xs font-bold">×{multiplier}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
          💡 转盘共 16 格：红 7 / 黑 7 / 绿 2<br />
          猜中红或黑返还 ×2（含本金），猜中绿返还 ×10（含本金），猜错输光
        </p>
      </div>
    </div>
  );
}