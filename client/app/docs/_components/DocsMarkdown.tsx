'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const calloutEmojis: Record<string, { label: string; color: string; bg: string }> = {
  '📘': { label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  '🚧': { label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  '❗': { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  '👍': { label: 'Success', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

// ReadMe-style emoji shortcodes to actual emoji
const emojiShortcodes: Record<string, string> = {
  ':blue_book:': '📘',
  ':construction:': '🚧',
  ':exclamation:': '❗',
  ':thumbsup:': '👍',
};

function replaceEmojiShortcodes(text: string): string {
  let result = text;
  for (const [code, emoji] of Object.entries(emojiShortcodes)) {
    result = result.replaceAll(code, emoji);
  }
  return result;
}

const components: Components = {
  blockquote: ({ children }) => {
    // Check if first text content starts with a callout emoji
    const text = extractText(children);
    for (const [emoji, style] of Object.entries(calloutEmojis)) {
      if (text.startsWith(emoji)) {
        return (
          <div className={`rounded-lg border p-4 my-4 ${style.bg}`}>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${style.color}`}>
              {style.label}
            </div>
            <div className="text-sm text-[var(--text-secondary)] [&>p]:m-0">
              {children}
            </div>
          </div>
        );
      }
    }
    return (
      <blockquote className="border-l-2 border-[var(--border-subtle)] pl-4 my-4 text-[var(--text-secondary)] italic">
        {children}
      </blockquote>
    );
  },
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold tracking-tight mt-10 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold tracking-tight mt-10 mb-3 pb-2 border-b border-[var(--border-subtle)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-8 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold mt-6 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-[var(--primary)] hover:underline">{children}</a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-sm text-[var(--text-secondary)]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-4 space-y-1 text-sm text-[var(--text-secondary)]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      const lang = className?.replace('language-', '') || '';
      return (
        <div className="relative group">
          {lang && (
            <span className="absolute top-2 right-3 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]/50 font-mono">
              {lang}
            </span>
          )}
          <code className={`${className} block`} {...props}>{children}</code>
        </div>
      );
    }
    return (
      <code className="bg-[var(--bg-subtle)] text-[var(--primary)] px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[#0d0d0d] border border-[var(--border-subtle)] rounded-lg p-4 overflow-x-auto mb-4 text-sm leading-relaxed font-mono">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-[var(--border-subtle)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="py-2 px-3 text-sm text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">{children}</td>
  ),
  hr: () => (
    <hr className="border-[var(--border-subtle)] my-8" />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text)]">{children}</strong>
  ),
};

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return '';
}

export function DocsMarkdown({ content }: { content: string }) {
  const processed = replaceEmojiShortcodes(content);

  return (
    <div className="docs-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
