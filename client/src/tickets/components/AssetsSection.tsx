'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Download, Eye, Copy, Check, FileText, Code2, Loader2 } from 'lucide-react';
import { useServices } from '@/services/index';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { toast } from 'sonner';

import type { AttachmentResponse } from '@/services/ticket.service';
import { ImageAttachmentsGrid } from './ImageAttachmentsGrid';

interface AssetsSectionProps {
  ticketId: string;
  ticketTitle: string;
  ticketUpdatedAt?: string;
  attachments?: AttachmentResponse[];
  onUploadAttachment?: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment?: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment?: boolean;
}

export function AssetsSection({ ticketId, ticketTitle, ticketUpdatedAt, attachments, onUploadAttachment, onDeleteAttachment, isUploadingAttachment }: AssetsSectionProps) {
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
    try {
      await fetchMarkdown();
      setPreviewFormat('markdown');
      setPreviewOpen(true);
    } catch { /* toast already shown */ }
  }, [fetchMarkdown]);

  const handleDownloadMd = useCallback(async () => {
    try {
      const content = await fetchMarkdown();
      handleDownload(content, `${safeFilename}-spec.md`, 'text/markdown');
    } catch { /* toast already shown */ }
  }, [fetchMarkdown, handleDownload, safeFilename]);

  const handlePreviewXml = useCallback(async () => {
    try {
      await fetchXml();
      setPreviewFormat('xml');
      setPreviewOpen(true);
    } catch { /* toast already shown */ }
  }, [fetchXml]);

  const handleDownloadXml = useCallback(async () => {
    try {
      const content = await fetchXml();
      handleDownload(content, `${safeFilename}-aec.xml`, 'application/xml');
    } catch { /* toast already shown */ }
  }, [fetchXml, handleDownload, safeFilename]);

  const handleCopyXml = useCallback(async () => {
    try {
      const content = await fetchXml();
      await navigator.clipboard.writeText(content);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
      toast.success('AEC XML copied to clipboard');
    } catch { /* toast already shown */ }
  }, [fetchXml]);

  const previewContent = previewFormat === 'markdown' ? markdownContent || '' : xmlContent || '';
  const previewTitle = previewFormat === 'markdown' ? 'Tech Spec' : 'AEC Contract';
  const previewFilename = previewFormat === 'markdown' ? `${safeFilename}-spec.md` : `${safeFilename}-aec.xml`;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* For Humans — Tech Spec */}
        <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-[var(--text)]">Tech Spec</h4>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  .md
                </Badge>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                For humans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewMd}
              disabled={loadingMd}
              className="flex-1 h-8 text-xs"
            >
              {loadingMd ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadMd}
              disabled={loadingMd}
              className="flex-1 h-8 text-xs"
            >
              {loadingMd ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Download
            </Button>
          </div>
        </div>

        {/* For Machines — AEC XML */}
        <div className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Code2 className="h-4.5 w-4.5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-[var(--text)]">AEC Contract</h4>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  .xml
                </Badge>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                For machines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewXml}
              disabled={loadingXml}
              className="flex-1 h-8 text-xs"
            >
              {loadingXml ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadXml}
              disabled={loadingXml}
              className="h-8 text-xs"
            >
              {loadingXml ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              .xml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyXml}
              disabled={loadingXml}
              className="h-8 text-xs"
            >
              {copiedXml ? (
                <Check className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copiedXml ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Attachments subsection */}
      {onUploadAttachment && onDeleteAttachment && (
        <div className="mt-6">
          <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-3">
            Attachments{attachments && attachments.length > 0 ? ` (${attachments.length})` : ''}
          </h4>
          <ImageAttachmentsGrid
            attachments={attachments || []}
            onUpload={onUploadAttachment}
            onDelete={onDeleteAttachment}
            isUploading={isUploadingAttachment || false}
          />
        </div>
      )}

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
