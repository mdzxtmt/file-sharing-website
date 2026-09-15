'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';

export default function VerifyPage() {
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  async function handleVerify(token: string) {
    if (verifying) return;
    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // 验证成功，跳转首页
        window.location.href = '/';
      } else {
        setError(data.error || '验证失败，请刷新重试');
        setVerifying(false);
      }
    } catch {
      setError('网络错误，请刷新重试');
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1020] px-4">
      <div className="glass-card p-8 max-w-md w-full text-center fade-up">
        <div className="text-5xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          让我看看你是不是人机
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          请完成人机验证以继续访问
        </p>

        <div className="flex justify-center mb-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={handleVerify}
            onError={() => setError('验证组件加载失败，请刷新重试')}
            onExpire={() => setError('验证已过期，请重新验证')}
            options={{ theme: 'dark', size: 'normal' }}
          />
        </div>

        {verifying && (
          <p className="text-xs text-indigo-400 animate-pulse">验证中…</p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}