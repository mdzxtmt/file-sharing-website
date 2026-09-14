'use client';

import { useEffect } from 'react';

export default function Game2048Page() {
  useEffect(() => {
    window.location.replace('/game2048.html');
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0f1420] text-white z-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🔢</div>
        <p className="text-sm text-gray-400">正在加载 2048…</p>
      </div>
    </div>
  );
}