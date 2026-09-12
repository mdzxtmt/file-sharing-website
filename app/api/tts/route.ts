import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text, textLang = 'zh' } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '文本不能为空' }, { status: 400 });
    }

    const base = process.env.GPT_SOVITS_API_URL;
    if (!base) {
      return NextResponse.json({ error: '未配置 GPT_SOVITS_API_URL' }, { status: 500 });
    }

    const params = new URLSearchParams({
      text: text.trim(),
      text_lang: textLang,
      text_split_method: 'cut5',
      batch_size: '1',
      media_type: 'wav',
      streaming_mode: 'false',
    });

    if (process.env.GPT_SOVITS_REF_AUDIO) {
      params.set('ref_audio_path', process.env.GPT_SOVITS_REF_AUDIO);
    }
    if (process.env.GPT_SOVITS_PROMPT_TEXT) {
      params.set('prompt_text', process.env.GPT_SOVITS_PROMPT_TEXT);
      params.set('prompt_lang', textLang);
    }

    const url = `${base.replace(/\/$/, '')}/tts?${params.toString()}`;

    const resp = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: process.env.GPT_SOVITS_API_KEY
        ? { Authorization: `Bearer ${process.env.GPT_SOVITS_API_KEY}` }
        : undefined,
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
