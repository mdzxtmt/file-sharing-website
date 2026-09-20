'use client';

import { useEffect } from 'react';

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 秒

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('device_id') || '';
}

export default function Heartbeat() {
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    async function send() {
      const id = getDeviceId();
      if (!id) return; // 没有 device_id 说明用户还没用过任何功能
      // 页面不可见时不发心跳（节省资源）
      if (document.visibilityState === 'hidden') return;

      try {
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: id }),
          cache: 'no-store',
        });
      } catch {}
    }

    // 立即发一次
    send();

    // 定时发
    timer = setInterval(send, HEARTBEAT_INTERVAL);

    // 页面从后台切回时立即发一次
    function onVisible() {
      if (document.visibilityState === 'visible') send();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}