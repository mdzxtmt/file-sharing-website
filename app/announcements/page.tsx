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

const TYPE_STYLES: Record<string, { border: string; icon: string; bg: string }> = {
  info: {
    border: 'rgba(99,102,241,0.4)',
    icon: '📢',
    bg: 'rgba(99,102,241,0.06)',
  },
  warning: {
    border: 'rgba(251,191,36,0.5)',
    icon: '⚠️',
    bg: 'rgba(251,191,36,0.06)',
  },
  success: {
    border: 'rgba(34,197,94,0.4)',
    icon: '✅',
    bg: 'rgba(34,197,94,0.06)',
  },
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/announcements?all=1&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            📢 公告
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            共 {items.length} 条公告
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-indigo-500 hover:underline shrink-0"
        >
          ← 返回首页
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card h-24 animate-pulse bg-white/40 dark:bg-white/5"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">还没有公告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
            return (
              <div
                key={item.id}
                className="glass-card p-5 sm:p-6 border-l-4 transition hover:shadow-lg"
                style={{
                  borderLeftColor: style.border,
                  background: style.bg,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xl shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold mb-1">
                      {item.title}
                    </h2>
                    <div className="text-[11px] text-gray-400">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}