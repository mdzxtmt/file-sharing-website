'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function ArenaPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(true);

  // 进入页面时隐藏导航栏，退出时恢复
  useEffect(() => {
    if (fullscreen) {
      document.body.classList.add('hide-navbar');
    } else {
      document.body.classList.remove('hide-navbar');
    }
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, [fullscreen]);

  // 让 iframe 自动聚焦
  useEffect(() => {
    iframeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 bg-black"
      style={{ top: fullscreen ? 0 : '4rem' }}
    >
      {/* 顶部悬浮操作栏 */}
      <div className="absolute top-3 right-3 z-50 flex gap-2">
        <button
          onClick={() => setFullscreen((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white backdrop-blur border border-white/20 hover:bg-black/70 transition"
        >
          {fullscreen ? '显示导航' : '全屏游戏'}
        </button>
        <Link
          href="/games"
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white backdrop-blur border border-white/20 hover:bg-black/70 transition"
        >
          退出
        </Link>
      </div>

      <iframe
        ref={iframeRef}
        src="/arena.html"
        title="ARENA FPS"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; gamepad"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen allow-popups"
      />
    </div>
  );
}