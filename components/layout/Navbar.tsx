'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/voice', label: '语音', icon: '🎙️' },
  { href: '/games', label: '游戏', icon: '🎮' },
  { href: '/messages', label: '留言', icon: '💬' },
  { href: '/points', label: '积分', icon: '🪙' },
  { href: '/user', label: '我的', icon: '👤' },
];

/* ===== 内联状态徽章 ===== */
function StatusBadge() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | undefined>();
  const [checking, setChecking] = useState(false);

  async function check() {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/tts-status', { cache: 'no-store' });
      const data = await res.json();
      setOnline(!!data.online);
      setLatency(data.latency);
    } catch {
      setOnline(false);
      setLatency(undefined);
    } finally {
      setTimeout(() => setChecking(false), 400);
    }
  }

  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = checking
    ? '检测中…'
    : online === null
    ? '检测中…'
    : online
    ? 'GPT-SoVITS 在线'
    : 'GPT-SoVITS 离线';

  const dotColor = checking ? '#6366f1' : online ? '#22c55e' : '#ef4444';
  const bg = checking
    ? 'rgba(99,102,241,0.12)'
    : online
    ? 'rgba(34,197,94,0.12)'
    : 'rgba(239,68,68,0.12)';
  const fg = checking ? '#6366f1' : online ? '#16a34a' : '#dc2626';
  const border = checking
    ? 'rgba(99,102,241,0.3)'
    : online
    ? 'rgba(34,197,94,0.3)'
    : 'rgba(239,68,68,0.3)';

  return (
    <button
      onClick={check}
      disabled={checking}
      title={
        checking
          ? '正在检测…'
          : online
          ? `在线 · 延迟 ${latency ?? '-'}ms · 点击刷新`
          : '离线 · 点击重试'
      }
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition hover:scale-105 active:scale-95 disabled:cursor-wait shrink-0"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}
    >
      <span className="relative flex h-2 w-2">
        {!checking && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ background: dotColor }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: dotColor }}
        />
      </span>
      <span className="whitespace-nowrap">{label}</span>
      {online && !checking && latency !== undefined && (
        <span className="opacity-60 hidden sm:inline">{latency}ms</span>
      )}
      <svg
        className={`w-3 h-3 transition-transform ${checking ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-xl bg-white/75 dark:bg-[#0b1020]/75 border-b border-white/40 dark:border-white/10 shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold shadow-md group-hover:scale-105 transition">
              M
            </span>
            <span className="font-bold text-base sm:text-lg tracking-tight hidden xs:inline">
              mdzxtmt
            </span>
          </Link>

          {/* 桌面导航 */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-500 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <StatusBadge />
            </div>

            {/* 汉堡按钮 */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition"
              aria-label={open ? '关闭菜单' : '打开菜单'}
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-300 origin-center ${
                    open ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-current rounded-full transition-opacity duration-200 ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-300 origin-center ${
                    open ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* 移动端遮罩 */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 移动端抽屉 */}
      <aside
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-[78%] max-w-xs bg-white/95 dark:bg-[#0b1020]/95 backdrop-blur-xl shadow-2xl border-l border-white/40 dark:border-white/10 transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/40 dark:border-white/10">
          <span className="font-semibold text-sm">菜单</span>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition text-xl"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/40 dark:border-white/10">
          <StatusBadge />
        </div>
      </aside>
    </>
  );
}