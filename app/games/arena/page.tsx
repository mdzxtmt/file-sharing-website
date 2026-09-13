'use client';

import { useEffect } from 'react';

export default function ArenaPage() {
  useEffect(() => {
    // 直接跳转到游戏 HTML，绕过 iframe 限制
    window.location.replace('/arena.html');
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white z-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🎮</div>
        <p className="text-sm text-gray-400">正在加载游戏…</p>
      </div>
    </div>
  );
}