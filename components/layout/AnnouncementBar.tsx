'use client';

import { useEffect, useState } from 'react';

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
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem('ann_hidden_until');
    if (hiddenUntil && Number(hiddenUntil) > Date.now()) {
      setClosed(true);
      return;
    }
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 6000);
    return () => clearInterval(t);
  }, [items.length]);

  function handleClose() {
    setClosed(true);
    localStorage.setItem('ann_hidden_until', String(Date.now() + 24 * 60 * 60 * 1000));
  }

  if (closed || items.length === 0) return null;

  const item = items[current];
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  return (
    <div
      className="relative w-full border-b px-4 sm:px-6 py-2.5 fade-up"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <span className="text-lg shrink-0">{style.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-semibold text-sm">{item.title}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {item.content}
            </span>
          </div>
        </div>

        {items.length > 1 && (
          <div className="hidden sm:flex gap-1 shrink-0">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  i === current ? 'bg-indigo-500' : 'bg-gray-400/40'
                }`}
                aria-label={`公告 ${i + 1}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleClose}
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 transition text-lg leading-none"
          aria-label="关闭公告"
        >
          ×
        </button>
      </div>
    </div>
  );
}