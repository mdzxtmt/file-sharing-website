'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
};

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
    border: 'rgba(99,102,241,0.3)',
    icon: '📢',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))',
    border: 'rgba(251,191,36,0.35)',
    icon: '⚠️',
  },
  success: {
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08))',
    border: 'rgba(34,197,94,0.3)',
    icon: '✅',
  },
};

export default function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem('ann_hidden_until');
    if (hiddenUntil && Number(hiddenUntil) > Date.now()) {
      setHidden(true);
      return;
    }
    fetch(`/api/announcements?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {});
  }, []);

  // 多条公告自动轮播
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 6000);
    return () => clearInterval(t);
  }, [items.length]);

  function handleClose() {
    setHidden(true);
    localStorage.setItem('ann_hidden_until', String(Date.now() + 24 * 60 * 60 * 1000));
  }

  if (hidden || items.length === 0) return null;

  const item = items[current];
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  return (
    <div
      className="relative w-full border-b px-4 sm:px-6 py-2.5 fade-up"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* 图标 */}
        <span className="text-lg shrink-0">{style.icon}</span>

        {/* 公告内容（点击进入列表页） */}
        <Link
          href="/announcements"
          className="flex-1 min-w-0 hover:opacity-75 transition"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-semibold text-sm">{item.title}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {item.content}
            </span>
          </div>
        </Link>

        {/* 多条时显示圆点 */}
        {items.length > 1 && (
          <div className="hidden sm:flex gap-1 shrink-0">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrent(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  i === current ? 'bg-indigo-500' : 'bg-gray-400/40'
                }`}
                aria-label={`公告 ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* 查看全部 */}
        <Link
          href="/announcements"
          className="hidden sm:inline-block shrink-0 text-xs text-indigo-500 hover:underline"
        >
          查看全部 →
        </Link>

        {/* 我知道了 */}
        <button
          onClick={handleClose}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition whitespace-nowrap"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}