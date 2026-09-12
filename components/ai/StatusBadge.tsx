'use client';

import { useEffect, useState } from 'react';

type Status = {
  online: boolean;
  latency?: number;
  reason?: string;
};

export default function StatusBadge() {
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(true);

  async function check() {
    setChecking(true);
    try {
      const res = await fetch('/api/tts-status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ online: false, reason: '无法检测' });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    check();
    const timer = setInterval(check, 30000); // 每 30 秒自动检测一次
    return () => clearInterval(timer);
  }, []);

  const online = status?.online;

  return (
    <button
      onClick={check}
      title={online ? `在线（延迟 ${status?.latency}ms）` : `离线：${status?.reason || '未知'}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition hover:scale-105"
      style={{
        background: online ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: online ? '#16a34a' : '#dc2626',
        border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      <span
        className="relative flex h-2 w-2"
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ background: online ? '#22c55e' : '#ef4444' }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: online ? '#22c55e' : '#ef4444' }}
        />
      </span>
      {checking && !status ? '检测中…' : online ? 'GPT-SoVITS 在线' : 'GPT-SoVITS 离线'}
      {online && status?.latency !== undefined && (
        <span className="opacity-60">{status.latency}ms</span>
      )}
    </button>
  );
}