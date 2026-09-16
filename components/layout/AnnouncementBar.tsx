'use client';

import { formatAnnouncement } from '@/lib/formatAnnouncement';
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

const READ_KEY = 'ann_read_ids';

export default function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // 加载公告 + 读取已读记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(READ_KEY);
      if (saved) setReadIds(JSON.parse(saved));
    } catch {}

    fetch(`/api/announcements?all=1&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // 未读公告 = 所有公告 - 已读 ID
  const unread = items.filter((it) => !readIds.includes(it.id));

  // 轮播：只在有未读时
  useEffect(() => {
    if (unread.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % unread.length);
    }, 6000);
    return () => clearInterval(t);
  }, [unread.length]);

  // 当前显示的那条
  useEffect(() => {
    if (current >= unread.length) setCurrent(0);
  }, [unread.length, current]);

  function handleAcknowledge() {
    // 把当前所有未读公告标记为已读
    const newReadIds = [...readIds, ...unread.map((it) => it.id)];
    setReadIds(newReadIds);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(newReadIds));
    } catch {}
  }

  // 加载中不显示（避免闪烁）
  if (!loaded) return null;

  // ===== 没有公告数据 =====
  if (items.length === 0) {
    return (
      <div className="w-full border-b px-4 sm:px-6 py-2.5 bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-lg shrink-0">📭</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500">暂无公告</span>
          </div>
          <Link
            href="/announcements"
            className="shrink-0 text-xs text-indigo-500 hover:underline"
          >
            查看全部 →
          </Link>
        </div>
      </div>
    );
  }

  // ===== 全部已读 =====
  if (unread.length === 0) {
    return (
      <div className="w-full border-b px-4 sm:px-6 py-2.5 bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-lg shrink-0">✅</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500">没有新公告</span>
          </div>
          <Link
            href="/announcements"
            className="shrink-0 text-xs text-indigo-500 hover:underline"
          >
            查看全部 →
          </Link>
        </div>
      </div>
    );
  }

  // ===== 有未读公告 =====
  const item = unread[current];
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  return (
    <div
      className="w-full border-b px-4 sm:px-6 py-2.5 fade-up transition-all"
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
              {item.content.replace(/[*`\[\]]/g, '').replace(/\(https?:\/\/[^)]+\)/g, '')}
            </span>
          </div>
        </Link>

        {/* 多条时显示圆点 */}
        {unread.length > 1 && (
          <div className="hidden sm:flex gap-1 shrink-0">
            {unread.map((_, i) => (
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
          onClick={handleAcknowledge}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition whitespace-nowrap"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}