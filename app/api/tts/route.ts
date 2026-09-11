// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro 可更长；Hobby 上限 10s

export async function POST(req: NextRequest) {
  try {
    const { text, textLang = 'zh', refAudioPath, promptText, promptLang = 'zh' } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '文本不能为空' }, { status: 400 });
    }

    const base = process.env.GPT_SOVITS_API_URL;
    if (!base) {
      return NextResponse.json({ error: '未配置 GPT_SOVITS_API_URL' }, { status: 500 });
    }

    // api_v2.py 使用 GET + query 参数
    const params = new URLSearchParams({
      text: text.trim(),
      text_lang: textLang,
      ref_audio_path: refAudioPath || process.env.GPT_SOVITS_REF_AUDIO || '',
      prompt_text: promptText || process.env.GPT_SOVITS_PROMPT_TEXT || '',
      prompt_lang: promptLang,
      text_split_method: 'cut5',
      batch_size: '1',
      media_type: 'wav',
      streaming_mode: 'false',
    });

    const url = `${base.replace(/\/$/, '')}/tts?${params.toString()}`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: process.env.GPT_SOVITS_API_KEY
        ? { Authorization: `Bearer ${process.env.GPT_SOVITS_API_KEY}` }
        : undefined,
      // 避免 Next.js 缓存
      cache: 'no-store',
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return NextResponse.json(
        { error: `GPT-SoVITS 返回 ${resp.status}`, detail },
        { status: 502 }
      );
    }

    const audio = await resp.arrayBuffer();

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audio.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}