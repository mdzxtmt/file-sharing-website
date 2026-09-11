'use client';

import { useState, useRef } from 'react';

const LANGS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'yue', label: '粤语' },
];

export default function TTSPage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('zh');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleSynthesize() {
    if (!text.trim() || loading) return;
    setLoading(true);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, textLang: lang }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('合成失败：' + (err.error || res.status));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play(), 100);
    } catch (e: any) {
      alert('网络错误：' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        GPT-SoVITS 语音合成
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        输入文字，选择语言，一键生成逼真语音。
      </p>

      <div className="glass-card p-5 flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在这里输入要合成的文字…"
          rows={6}
          className="w-full p-4 rounded-xl bg-white/70 dark:bg-white/10 outline-none resize-y text-sm leading-6"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">语言：</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/70 dark:bg-white/10 outline-none text-sm"
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleSynthesize}
            disabled={loading || !text.trim()}
            className="btn-gradient text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {loading ? '合成中…' : '🎙️ 生成语音'}
          </button>
        </div>

        {audioUrl && (
          <div className="pt-3 border-t border-white/30 flex flex-col gap-2">
            <audio ref={audioRef} src={audioUrl} controls className="w-full" />
            <a
              href={audioUrl}
              download={`tts-${Date.now()}.wav`}
              className="text-xs text-indigo-500 hover:underline self-end"
            >
              ⬇️ 下载音频
            </a>
          </div>
        )}
      </div>
    </div>
  );
}