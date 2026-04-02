'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Download, Eye, Copy, Check, FileText, Code2, Loader2, ArrowRight } from 'lucide-react';
import { useServices } from '@/services/index';
import { DocumentPreviewModal } from '../DocumentPreviewModal';
import { toast } from 'sonner';

interface ExportsSectionProps {
  ticketId: string;
  ticketTitle: string;
  ticketUpdatedAt?: string;
}

/**
 * ExportsSection — Generated ticket documents for humans and machines.
 *
 * Two export formats:
 * 1. Tech Spec (.md) — Human-readable spec for PMs, designers, stakeholders
 * 2. AEC Contract (.xml) — Machine-readable format for AI coding agents
 */
export function ExportsSection({ ticketId, ticketTitle, ticketUpdatedAt }: ExportsSectionProps) {
  const { ticketService } = useServices();
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);

  // Invalidate cached exports when ticket data changes
  const prevUpdatedAt = useRef(ticketUpdatedAt);
  useEffect(() => {
    if (prevUpdatedAt.current && prevUpdatedAt.current !== ticketUpdatedAt) {
      setMarkdownContent(null);
      setXmlContent(null);
    }
    prevUpdatedAt.current = ticketUpdatedAt;
  }, [ticketUpdatedAt]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'markdown' | 'xml'>('markdown');
  const [loadingMd, setLoadingMd] = useState(false);
  const [loadingXml, setLoadingXml] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const safeFilename = ticketTitle
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  const fetchMarkdown = useCallback(async (): Promise<string> => {
    if (markdownContent) return markdownContent;
    setLoadingMd(true);
    try {
      const content = await ticketService.exportMarkdown(ticketId);
      setMarkdownContent(content);
      return content;
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate Tech Spec');
      throw error;
    } finally {
      setLoadingMd(false);
    }
  }, [ticketId, ticketService, markdownContent]);

  const fetchXml = useCallback(async (): Promise<string> => {
    if (xmlContent) return xmlContent;
    setLoadingXml(true);
    try {
      const content = await ticketService.exportXml(ticketId);
      setXmlContent(content);
      return content;
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate AEC Contract');
      throw error;
    } finally {
      setLoadingXml(false);
    }
  }, [ticketId, ticketService, xmlContent]);

  const handleDownload = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handlePreviewMd = useCallback(async () => {
    try { await fetchMarkdown(); setPreviewFormat('markdown'); setPreviewOpen(true); } catch {}
  }, [fetchMarkdown]);

  const handleDownloadMd = useCallback(async () => {
    try { const c = await fetchMarkdown(); handleDownload(c, `${safeFilename}-spec.md`, 'text/markdown'); } catch {}
  }, [fetchMarkdown, handleDownload, safeFilename]);

  const handlePreviewXml = useCallback(async () => {
    try { await fetchXml(); setPreviewFormat('xml'); setPreviewOpen(true); } catch {}
  }, [fetchXml]);

  const handleDownloadXml = useCallback(async () => {
    try { const c = await fetchXml(); handleDownload(c, `${safeFilename}-aec.xml`, 'application/xml'); } catch {}
  }, [fetchXml, handleDownload, safeFilename]);

  const handleCopyXml = useCallback(async () => {
    try {
      const c = await fetchXml();
      await navigator.clipboard.writeText(c);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
      toast.success('AEC XML copied to clipboard');
    } catch {}
  }, [fetchXml]);

  const previewContent = previewFormat === 'markdown' ? markdownContent || '' : xmlContent || '';
  const previewTitle = previewFormat === 'markdown' ? 'Tech Spec' : 'AEC Contract';
  const previewFilename = previewFormat === 'markdown' ? `${safeFilename}-spec.md` : `${safeFilename}-aec.xml`;

  return (
    <>
      <div className="space-y-6">
        {/* Section intro */}
        <div>
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            Generated from your ticket spec. The Tech Spec is for your team; the AEC Contract is for AI coding agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* For Humans — Tech Spec */}
          <div className="rounded-lg border border-[var(--border-subtle)] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-medium text-[var(--text)]">Tech Spec</h4>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Human-readable specification
                </p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">.md</span>
            </div>

            {/* Description */}
            <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
              A complete markdown document with problem statement, acceptance criteria, solution approach, and implementation details. Share with your team or attach to project management tools.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewMd}
                disabled={loadingMd}
                className="flex-1 h-8 text-[11px]"
              >
                {loadingMd ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Eye className="h-3 w-3 mr-1.5" />}
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMd}
                disabled={loadingMd}
                className="flex-1 h-8 text-[11px]"
              >
                {loadingMd ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
                Download
              </Button>
            </div>
          </div>

          {/* For Machines — AEC Contract */}
          <div className="rounded-lg border border-[var(--border-subtle)] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Code2 className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-medium text-[var(--text)]">AEC Contract</h4>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Machine-readable specification
                </p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">.xml</span>
            </div>

            {/* Description */}
            <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
              Structured XML format optimized for AI coding agents like Claude, Cursor, or Copilot. Copy and paste into your agent&apos;s context, or download to include in your repo.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewXml}
                disabled={loadingXml}
                className="h-8 text-[11px]"
              >
                {loadingXml ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Eye className="h-3 w-3 mr-1.5" />}
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadXml}
                disabled={loadingXml}
                className="h-8 text-[11px]"
              >
                {loadingXml ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
                .xml
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyXml}
                disabled={loadingXml}
                className="h-8 text-[11px]"
              >
                {copiedXml ? <Check className="h-3 w-3 mr-1.5 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
                {copiedXml ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>

        {/* How to use hint */}
        <div className="px-4 py-3 rounded-lg bg-[var(--bg-hover)]/40 border border-[var(--border-subtle)] space-y-2">
          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
            These documents stay in sync with your ticket — every edit, refinement, or review update is reflected automatically.
          </p>
          <div className="flex flex-col gap-1.5 text-[11px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
              <span><span className="text-[var(--text-secondary)]">Cloud Develop</span> — click Develop and the AEC Contract is used automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
              <span><span className="text-[var(--text-secondary)]">MCP Bridge</span> — assign a developer and they receive it via CLI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
              <span><span className="text-[var(--text-secondary)]">Manual</span> — copy the AEC Contract into any AI coding agent</span>
            </div>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewTitle}
        content={previewContent}
        format={previewFormat}
        filename={previewFilename}
      />
    </>
  );
}
