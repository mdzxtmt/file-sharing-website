'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Prize = {
  label: string;
  points: number;
  color: string;
};

type SpinResult = {
  index: number;
  label: string;
  color: string;
  points_won: number;
  points: number;
};

// 后端定义的奖品顺序（与 API 保持一致）
const PRIZES: Prize[] = [
  { label: '谢谢参与', points: 0,   color: '#6b7280' },
  { label: '5 积分',   points: 5,   color: '#10b981' },
  { label: '10 积分',  points: 10,  color: '#3b82f6' },
  { label: '20 积分',  points: 20,  color: '#8b5cf6' },
  { label: '50 积分',  points: 50,  color: '#ec4899' },
  { label: '100 积分', points: 100, color: '#f59e0b' },
  { label: '200 积分', points: 200, color: '#ef4444' },
];

const SPIN_COST = 20;

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
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // 加载积分
  useEffect(() => {
    const id = getDeviceId();
    const name = localStorage.getItem('player_name') || '匿名玩家';
    fetch(`/api/points?device_id=${id}&player_name=${encodeURIComponent(name)}&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setPoints(d.data.points);
      })
      .catch(() => {});
  }, []);

  async function handleSpin() {
    if (spinning) return;
    if (points === null) return;
    if (points < SPIN_COST) {
      alert(`积分不足，需要 ${SPIN_COST} 积分`);
      return;
    }

    setSpinning(true);
    setResult(null);

    try {
      const id = getDeviceId();
      const res = await fetch('/api/points/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: id }),
      });
      const d = await res.json();

      if (!res.ok) {
        alert(d.error || '抽奖失败');
        setSpinning(false);
        return;
      }

      const winIndex = d.data.index;
      const totalPrizes = PRIZES.length;
      const anglePerPrize = 360 / totalPrizes;

      // 让中奖扇区的中心停在顶部（指针位置）
      // 当前顶部指向奖品 0 的起始边界
      // 奖品 i 中心角度 = (i + 0.5) * anglePerPrize
      // 转盘需要顺时针旋转：360 * N - (i + 0.5) * anglePerPrize
      // 加上随机偏移避免每次都一样
      const baseRotation = rotation % 360;
      const targetAngle = 360 - (winIndex + 0.5) * anglePerPrize;
      const randomOffset = (Math.random() - 0.5) * (anglePerPrize * 0.6);
      const finalRotation = rotation - baseRotation + 360 * 5 + targetAngle + randomOffset;

      setRotation(finalRotation);

      // 等动画结束
      setTimeout(() => {
        setResult(d.data);
        setPoints(d.data.points);
        setSpinning(false);
      }, 4500);
    } catch (e: any) {
      alert('抽奖失败：' + e.message);
      setSpinning(false);
    }
  }

  // 生成 conic-gradient 颜色
  const anglePerPrize = 360 / PRIZES.length;
  const gradientStops = PRIZES.map((p, i) => {
    const start = i * anglePerPrize;
    const end = (i + 1) * anglePerPrize;
    return `${p.color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="fade-up max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            🎰 转盘抽奖
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            每次消耗 {SPIN_COST} 积分
          </p>
        </div>
        <Link
          href="/user"
          className="text-sm text-indigo-500 hover:underline shrink-0"
        >
          ← 我的
        </Link>
      </div>

      {/* 积分显示 */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-500">当前积分</span>
        <span className="text-2xl font-bold text-yellow-500 tabular-nums">
          {points ?? '...'}
        </span>
      </div>

      {/* 转盘 */}
      <div className="relative flex items-center justify-center mb-6 select-none">
        {/* 指针 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: '-8px' }}>
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '28px solid #fbbf24',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          />
        </div>

        {/* 转盘主体 */}
        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]">
          {/* 外圈 */}
          <div className="absolute inset-0 rounded-full shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
              padding: '8px',
            }}
          >
            {/* 转盘 */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full relative"
              style={{
                background: `conic-gradient(${gradientStops})`,
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.15, 1)' : 'none',
              }}
            >
              {/* 奖品文字 */}
              {PRIZES.map((prize, i) => {
                const angle = (i + 0.5) * anglePerPrize;
                return (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 h-1/2 origin-bottom"
                    style={{
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                      width: '60px',
                    }}
                  >
                    <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span
                        className="text-white font-bold text-xs sm:text-sm drop-shadow-md"
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          letterSpacing: '2px',
                        }}
                      >
                        {prize.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* 中心圆 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 抽奖按钮 */}
      <button
        onClick={handleSpin}
        disabled={spinning || points === null || points < SPIN_COST}
        className="btn-gradient w-full py-4 text-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning
          ? '抽奖中…'
          : points === null
          ? '加载中…'
          : points < SPIN_COST
          ? `积分不足（需要 ${SPIN_COST}）`
          : `🎲 开始抽奖（-${SPIN_COST} 积分）`}
      </button>

      {/* 结果 */}
      {result && (
        <div className="glass-card p-5 mt-6 text-center fade-up">
          {result.points_won > 0 ? (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-lg font-bold mb-2">
                恭喜获得
              </div>
              <div
                className="text-3xl font-extrabold mb-3"
                style={{ color: result.color }}
              >
                {result.label}
              </div>
              <div className="text-sm text-gray-500">
                当前积分：<span className="font-bold text-yellow-500">{result.points}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">😅</div>
              <div className="text-lg font-bold mb-2">谢谢参与</div>
              <div className="text-sm text-gray-500">
                再来一次吧，运气总会来的！
              </div>
              <div className="text-sm text-gray-500 mt-2">
                当前积分：<span className="font-bold text-yellow-500">{result.points}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 奖品列表 */}
      <div className="glass-card p-5 mt-6">
        <h3 className="text-sm font-bold mb-3 text-gray-600 dark:text-gray-300">
          🎁 奖品列表
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRIZES.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: p.color }}
              />
              <span className="text-xs truncate">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="text-center text-xs text-gray-400 mt-6 space-y-1">
        <p>💡 每天签到可获得积分，连续签到奖励更高</p>
        <p>🎯 抽奖消耗 {SPIN_COST} 积分，中奖积分立即到账</p>
      </div>
    </div>
  );
}