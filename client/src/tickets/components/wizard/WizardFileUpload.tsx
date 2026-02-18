'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Upload, X, FileText, Image, File as FileIcon } from 'lucide-react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface WizardFileUploadProps {
  files: File[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
  if (file.type === 'application/pdf' || file.type.includes('text')) return <FileText className="h-4 w-4 text-orange-500" />;
  return <FileIcon className="h-4 w-4 text-[var(--text-tertiary)]" />;
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
    // Check for duplicates by name
    if (files.some((f) => f.name === file.name && f.size === file.size)) {
      setError(`${file.name} is already added`);
      return;
    }
    onAdd(file);
  }, [files, onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(addFile);
  }, [addFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(addFile);
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [addFile]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-400">
          Reference Materials
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Add screenshots, wireframes, documentation, or reference files to help inform the ticket (max {MAX_FILES} files, 5MB each)
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          rounded-lg p-6 text-center transition-all cursor-pointer
          ${dragOver
            ? 'ring-2 ring-[var(--purple)] bg-[var(--purple)]/5'
            : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-active)]'
          }
          ${files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
      >
        <Upload className="mx-auto h-5 w-5 text-[var(--text-tertiary)] mb-2" />
        <p className="text-xs text-[var(--text-tertiary)]">
          Drop files here or <span className="text-[var(--purple)] font-medium">browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.md,.txt,.csv,.json,.xml,.yaml,.yml"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--red)]">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 bg-[var(--bg-subtle)] text-sm"
            >
              {getFileIcon(file)}
              <span className="flex-1 truncate text-[var(--text)]">{file.name}</span>
              <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="text-[var(--text-tertiary)] hover:text-[var(--red)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
