import React from 'react';

/**
 * 把公告文本渲染为 React 元素
 * 支持：换行、**加粗**、*斜体*、`代码`、[文字](链接)、自动识别 URL
 */
export function formatAnnouncement(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (line.trim() === '') {
      // 空行 = 段落间距
      result.push(<div key={`br-${lineIdx}`} style={{ height: '0.75em' }} />);
      return;
    }

    result.push(
      <div key={`line-${lineIdx}`} className="leading-relaxed">
        {parseLine(line, lineIdx)}
      </div>
    );
  });

  return result;
}

function parseLine(line: string, keyPrefix: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  // 正则依次匹配：
  // 1. [文字](链接)
  // 2. **加粗**
  // 3. *斜体*
  // 4. `代码`
  // 5. 裸链接 https://...
  const pattern =
    /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(https?:\/\/[^\s]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(line)) !== null) {
    // 匹配前的纯文本
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${idx++}`;

    if (token.startsWith('[')) {
      // [文字](链接)
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        nodes.push(
          <a
            key={key}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            {m[1]}
          </a>
        );
      }
    } else if (token.startsWith('**')) {
      // **加粗**
      nodes.push(
        <strong key={key} className="font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*')) {
      // *斜体*
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      // `代码`
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-xs font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('http')) {
      // 裸链接
      nodes.push(
        <a
          key={key}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 hover:underline break-all"
        >
          {token}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // 剩余文本
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}