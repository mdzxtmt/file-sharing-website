'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import StatusBadge from '@/components/ai/StatusBadge';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/tts', label: '语音合成', icon: '🎙️' },
  { href: '/upload', label: '上传', icon: '⬆️' },
  { href: '/ranking', label: '排行', icon: '🔥' },
  { href: '/user', label: '我的', icon: '👤' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 滚动时加背景
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 路由切换时关闭移动菜单
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 打开菜单时禁止背景滚动
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
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="返回首页"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold shadow-md group-hover:scale-105 transition">
              M
            </span>
            <span className="font-bold text-base sm:text-lg tracking-tight hidden xs:inline">
              文件分享
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
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition ${
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

            {/* 汉堡按钮（手机） */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition"
              aria-label={open ? '关闭菜单' : '打开菜单'}
              aria-expanded={open}
            >
              <span className="sr-only">菜单</span>
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

      {/* ===== 移动端抽屉 ===== */}
      {/* 遮罩 */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* 抽屉面板 */}
      <aside
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-[78%] max-w-xs bg-white/95 dark:bg-[#0b1020]/95 backdrop-blur-xl shadow-2xl border-l border-white/40 dark:border-white/10 transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 抽屉头部 */}
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

        {/* 导航项 */}
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

        {/* 抽屉底部状态 */}
        <div className="p-4 border-t border-white/40 dark:border-white/10">
          <StatusBadge />
        </div>
      </aside>
    </>
  );
}