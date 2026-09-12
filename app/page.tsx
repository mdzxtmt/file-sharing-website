'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type FileItem = {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  public_url: string;
  download_count?: number;
  view_count?: number;
  upload_time: string;
  category_id?: string | null;
  description?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'hot' | 'name'>('new');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, size: 0, downloads: 0 });

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name,slug,icon')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data as Category[]);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase
        .from('files')
        .select('id,name,size,mime_type,public_url,download_count,view_count,upload_time,category_id,description')
        .eq('is_public', true);

      if (activeCat !== 'all') query = query.eq('category_id', activeCat);

      if (sortBy === 'new') query = query.order('upload_time', { ascending: false });
      else if (sortBy === 'hot') query = query.order('download_count', { ascending: false });
      else query = query.order('name', { ascending: true });

      query = query.limit(60);

      const { data, error } = await query;
      if (!cancelled && !error && data) {
        setFiles(data as FileItem[]);
        const totalSize = data.reduce((s, f: any) => s + (f.size || 0), 0);
        const totalDl = data.reduce((s, f: any) => s + (f.download_count || 0), 0);
        setStats({ total: data.length, size: totalSize, downloads: totalDl });
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeCat, sortBy]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return files;
    const k = keyword.trim().toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(k) ||
        (f.description || '').toLowerCase().includes(k)
    );
  }, [files, keyword]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-16 sm:pb-12">
          <div className="fade-up flex flex-col items-start gap-4">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-medium">
              AI 语音 · 文件分享
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              分享文件，克隆声音
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              上传、分享文件，或直接使用 GPT-SoVITS 语音合成，一键生成逼真语音。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
              <Link
                href="/tts"
                className="btn-gradient text-sm text-center px-6 py-3 sm:py-2.5"
              >
                🎙️ 语音合成
              </Link>
              <Link
                href="/upload"
                className="px-6 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-center border border-gray-300 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition"
              >
                ⬆️ 上传文件
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 统计 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: '文件总数', value: stats.total.toLocaleString() },
            { label: '占用空间', value: formatSize(stats.size) },
            { label: '累计下载', value: stats.downloads.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 sm:p-5 text-center">
              <div className="text-lg sm:text-2xl font-bold text-indigo-500 truncate">
                {s.value}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 搜索 + 排序 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索文件名或描述…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-indigo-400 transition"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10"
          >
            <option value="new">最新上传</option>
            <option value="hot">下载最多</option>
            <option value="name">按名称</option>
          </select>
        </div>
      </section>

      {/* 分类 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setActiveCat('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCat === 'all'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCat === c.id
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20'
              }`}
            >
              {c.icon ? `${c.icon} ` : ''}
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* 文件网格 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-24 sm:pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-32 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-4xl mb-3">📂</div>
            <div className="text-gray-500 text-sm">
              {keyword ? '没有找到匹配的文件' : '还没有文件，来上传第一个吧'}
            </div>
            <Link
              href="/upload"
              className="btn-gradient inline-block mt-4 text-sm px-5 py-2"
            >
              上传文件
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((f) => (
              <FileCard key={f.id} file={f} />
            ))}
          </div>
        )}
      </section>

      {/* 移动端浮动上传 */}
      <Link
        href="/upload"
        className="sm:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full btn-gradient flex items-center justify-center text-2xl shadow-lg"
        aria-label="上传文件"
      >
        +
      </Link>
    </div>
  );
}

function FileCard({ file }: { file: FileItem }) {
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const isImage = file.mime_type?.startsWith('image/');
  const isAudio = file.mime_type?.startsWith('audio/');
  const isVideo = file.mime_type?.startsWith('video/');
  const icon = isImage ? '🖼️' : isAudio ? '🎵' : isVideo ? '🎬' : '📄';

  return (
    <a
      href={file.public_url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="glass-card p-4 flex flex-col gap-3 fade-up group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate group-hover:text-indigo-500 transition">
            {file.name}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{formatSize(file.size)}</span>
            <span>·</span>
            <span>{formatDate(file.upload_time)}</span>
          </div>
        </div>
      </div>

      {file.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {file.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/30 dark:border-white/10">
        <span className="px-2 py-0.5 rounded bg-white/60 dark:bg-white/10 font-mono">
          {ext}
        </span>
        <span className="flex items-center gap-3">
          <span>⬇ {file.download_count || 0}</span>
          <span>👁 {file.view_count || 0}</span>
        </span>
      </div>
    </a>
  );
}
