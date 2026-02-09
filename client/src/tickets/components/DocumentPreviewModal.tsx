'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { MarkdownHooks as Markdown } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, Check } from 'lucide-react';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  format: 'markdown' | 'xml';
  filename: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  title,
  content,
  format,
  filename,
}: DocumentPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden textarea
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const mimeType = format === 'markdown' ? 'text/markdown' : 'application/xml';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, format, filename]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2.5 text-xs"
              >
                {copied ? (
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2.5 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Preview of {title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {format === 'markdown' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-[var(--text)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text)] prose-code:text-[var(--primary)] prose-code:bg-[var(--bg-hover)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[var(--bg-hover)] prose-pre:border prose-pre:border-[var(--border)]/30 prose-a:text-[var(--primary)] prose-blockquote:border-[var(--border)] prose-blockquote:text-[var(--text-secondary)] prose-table:w-full prose-th:bg-[var(--bg-hover)] prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-[var(--text)] prose-th:font-medium prose-td:px-3 prose-td:py-2 prose-td:text-[var(--text-secondary)] prose-tr:border-b prose-tr:border-[var(--border)]/40">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          ) : (
            <pre className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words bg-[var(--bg-hover)] rounded-lg p-4 border border-[var(--border)]/30 overflow-x-auto">
              {content}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
