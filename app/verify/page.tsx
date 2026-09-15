'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: any;
    onTurnstileVerify?: (token: string) => void;
  }
}

export default function VerifyPage() {
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    // 定义全局回调（Turnstile 验证成功后调用）
    window.onTurnstileVerify = async (token: string) => {
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
          window.location.href = '/';
        } else {
          setError(data.error || '验证失败，请刷新重试');
          setVerifying(false);
          // 重置 widget
          if (window.turnstile && widgetRef.current) {
            window.turnstile.reset(widgetRef.current);
          }
        }
      } catch {
        setError('网络错误，请刷新重试');
        setVerifying(false);
      }
    };

    // 加载 Turnstile 脚本
    function renderWidget() {
      if (!window.turnstile || !widgetRef.current || renderedRef.current) return;
      renderedRef.current = true;
      window.turnstile.render(widgetRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: (token: string) => {
          if (window.onTurnstileVerify) window.onTurnstileVerify(token);
        },
        'error-callback': () => setError('验证组件出错，请刷新重试'),
        'expired-callback': () => setError('验证已过期，请重新验证'),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // 动态插入 script
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
        script.async = true;
        script.defer = true;
        (window as any).onloadTurnstileCallback = renderWidget;
        document.head.appendChild(script);
      } else {
        // script 已在，等待加载
        const t = setInterval(() => {
          if (window.turnstile) {
            clearInterval(t);
            renderWidget();
          }
        }, 100);
      }
    }
  }, [verifying]);

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

        <div className="flex justify-center mb-4" ref={widgetRef}></div>

        {verifying && (
          <p className="text-xs text-indigo-400 animate-pulse">验证中…</p>
        )}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    </div>
  );
}