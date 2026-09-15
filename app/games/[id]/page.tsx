'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function GameLoaderPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch('/api/games')
      .then((r) => r.json())
      .then((d) => {
        const games = d.data || [];
        const game = games.find((g: any) => g.id === id);

        if (!game) {
          setStatus('error');
          setErrorMsg('游戏不存在或已下架');
          return;
        }

        const htmlPath = `/${id}.html`;
        fetch(htmlPath, { method: 'HEAD' })
          .then((res) => {
            if (res.ok) {
              window.location.replace(htmlPath);
            } else {
              setStatus('error');
              setErrorMsg(`游戏文件 ${htmlPath} 不存在`);
            }
          })
          .catch(() => {
            setStatus('error');
            setErrorMsg('无法加载游戏文件');
          });
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('加载失败');
      });
  }, [id]);

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0f1420] text-white z-50">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-base font-semibold mb-2">出错了</p>
          <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push('/games')}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition"
          >
            返回游戏列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0f1420] text-white z-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🎮</div>
        <p className="text-sm text-gray-400">正在加载游戏…</p>
      </div>
    </div>
  );
}