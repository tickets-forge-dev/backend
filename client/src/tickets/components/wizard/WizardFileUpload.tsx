'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, Image, File as FileIcon } from 'lucide-react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface WizardFileUploadProps {
  files: File[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <Image className="h-3.5 w-3.5 text-blue-500" />;
  if (file.type === 'application/pdf' || file.type.includes('text')) return <FileText className="h-3.5 w-3.5 text-orange-500" />;
  return <FileIcon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WizardFileUpload({ files, onAdd, onRemove }: WizardFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFile = useCallback((file: File) => {
    setError(null);
    if (files.length >= MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} exceeds 5MB limit`);
      return;
    }
    if (files.some((f) => f.name === file.name && f.size === file.size)) {
      setError(`${file.name} is already added`);
      return;
    }
    onAdd(file);
  }, [files, onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(addFile);
  }, [addFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(addFile);
    if (inputRef.current) inputRef.current.value = '';
  }, [addFile]);

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          rounded-md p-4 text-center transition-all cursor-pointer border border-dashed
          ${dragOver
            ? 'border-purple-500 bg-purple-500/5'
            : 'border-[var(--border-subtle)] hover:border-[var(--border)] bg-zinc-800/50'
          }
          ${files.length >= MAX_FILES ? 'opacity-40 cursor-not-allowed' : ''}
        `}
        onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
      >
        <Upload className="mx-auto h-4 w-4 text-[var(--text-tertiary)] mb-1.5" />
        <p className="text-[11px] text-[var(--text-tertiary)]">
          Drop files or <span className="text-purple-500 font-medium">browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.md,.txt,.csv,.json,.xml,.yaml,.yml,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 bg-[var(--bg-subtle)] group"
            >
              {getFileIcon(file)}
              <span className="flex-1 truncate text-xs text-[var(--text)]">{file.name}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
