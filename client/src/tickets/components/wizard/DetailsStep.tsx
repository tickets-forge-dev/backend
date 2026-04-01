'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { validateTitle } from '@/tickets/utils/validateTitle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Lightbulb, Bug, ClipboardList, Folder, PenLine, FileUp, Mic, MicOff, ChevronDown, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFoldersStore } from '@/stores/folders.store';
import { useTeamStore } from '@/teams/stores/team.store';
import { MarkdownInput } from './MarkdownInput';
import { VoiceWaveform } from './VoiceWaveform';

/**
 * DetailsStep — First step in the wizard.
 *
 * Captures: ticket type, priority, folder (optional), and description.
 * No repository or file upload — those are in separate steps.
 */
export function DetailsStep() {
  const {
    input,
    type,
    priority,
    folderId,
    setTitle,
    setType,
    setPriority,
    setFolderId,
  } = useWizardStore();

  const { currentTeam } = useTeamStore();
  const { folders, loadFolders } = useFoldersStore();
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const handleEditorClose = useCallback(() => setEditorOpen(false), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setTitle(input.title ? `${input.title}\n\n${content}` : content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [input.title, setTitle]);

  const descriptionRef = useRef<HTMLDivElement>(null);

  // Subtle audio cues for recording start/stop
  const playTone = useCallback((freq: number, duration: number, volume = 0.08) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
    } catch { /* audio context unavailable */ }
  }, []);

  const playStartBeep = useCallback(() => {
    playTone(880, 0.12);  // A5 — short high beep
  }, [playTone]);

  const playStopBeep = useCallback(() => {
    playTone(440, 0.15);  // A4 — slightly longer, lower tone
  }, [playTone]);

  // Speech-to-text via Web Speech API + audio visualizer
  const [isListening, setIsListening] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const textRef = useRef(input.title); // Always-current text value (avoids stale closures)
  const baseTextRef = useRef(''); // Text before current speech session started
  const interimRef = useRef(''); // Current interim (unfinished) transcript

  // Keep ref in sync with store (only when not listening — avoid overwriting during speech)
  useEffect(() => {
    if (!isListening) textRef.current = input.title;
  }, [input.title, isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }
    setIsListening(false);
  }, [micStream]);

  // Focus textarea and move cursor to end after speech updates
  const focusEnd = useCallback(() => {
    const textarea = descriptionRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  }, []);

  const toggleSpeechToText = useCallback(async () => {
    if (isListening) {
      playStopBeep();
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Get mic stream for the waveform visualizer
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
    } catch {
      // Mic permission denied — still allow speech recognition without visualizer
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalPart = '';
      let interimPart = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += transcript;
        } else {
          interimPart += transcript;
        }
      }

      // Commit final text permanently
      if (finalPart) {
        const base = textRef.current;
        const separator = base && !base.endsWith(' ') && !base.endsWith('\n') ? ' ' : '';
        const updated = base + separator + finalPart;
        textRef.current = updated;
        baseTextRef.current = updated;
        interimRef.current = '';
        setTitle(updated);
        requestAnimationFrame(focusEnd);
      }

      // Show interim text live (not committed — will be replaced)
      if (interimPart && !finalPart) {
        interimRef.current = interimPart;
        const base = textRef.current;
        const separator = base && !base.endsWith(' ') && !base.endsWith('\n') ? ' ' : '';
        setTitle(base + separator + interimPart);
        requestAnimationFrame(focusEnd);
      }
    };

    recognition.onerror = () => {
      stream?.getTracks().forEach(t => t.stop());
      setMicStream(null);
      setIsListening(false);
    };
    recognition.onend = () => {
      stream?.getTracks().forEach(t => t.stop());
      setMicStream(null);
      setIsListening(false);
    };

    baseTextRef.current = textRef.current;
    interimRef.current = '';
    recognitionRef.current = recognition;
    recognition.start();
    playStartBeep();
    setIsListening(true);
    requestAnimationFrame(focusEnd);
  }, [isListening, stopListening, playStartBeep, playStopBeep, setTitle, focusEnd]);

  const hasSpeechSupport = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // 'S' hotkey to toggle dictation (only when not typing in an input/textarea)
  useEffect(() => {
    if (!hasSpeechSupport) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        toggleSpeechToText();
        // Scroll description into view when starting
        if (!isListening) {
          descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasSpeechSupport, toggleSpeechToText, isListening]);

  // Load folders on mount
  useEffect(() => {
    if (currentTeam?.id) {
      loadFolders(currentTeam.id);
    }
  }, [currentTeam?.id, loadFolders]);

  return (
    <div className="space-y-5">
      {/* Type & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
            Type
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">
                <span className="inline-flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Feature
                </span>
              </SelectItem>
              <SelectItem value="bug">
                <span className="inline-flex items-center gap-2">
                  <Bug className="h-3.5 w-3.5 text-red-500" />
                  Bug
                </span>
              </SelectItem>
              <SelectItem value="task">
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                  Task
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
            Priority
          </label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Low
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  High
                </span>
              </SelectItem>
              <SelectItem value="urgent">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Urgent
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Folder */}
      {folders.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
            Folder
            <span className="ml-1.5 normal-case font-normal text-[var(--text-tertiary)]">— optionally group this ticket into a folder</span>
          </label>
          <Select value={folderId ?? '__none__'} onValueChange={(val) => setFolderId(val === '__none__' ? null : val)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  No folder (feed)
                </span>
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <span className="inline-flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 text-gray-500" />
                    {folder.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description — Primary focus area */}
      <div ref={descriptionRef} className="space-y-3 p-5 rounded-lg border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Ticket Description
          </label>
          <div className="flex items-center gap-2">
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={toggleSpeechToText}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                  isListening
                    ? 'text-red-500 border-red-500/40 bg-red-500/10 hover:bg-red-500/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--bg-hover)]'
                }`}
                title={isListening ? 'Stop recording (S)' : 'Speak description (S)'}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5 flex-shrink-0" />
                    <VoiceWaveform stream={micStream} />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Speak
                    <kbd className="hidden sm:inline-flex items-center px-1 py-0 text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded leading-tight">S</kbd>
                  </>
                )}
              </button>
            )}
            <div className="relative" ref={importMenuRef}>
              <button
                type="button"
                onClick={() => setImportMenuOpen(!importMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border-subtle)] hover:border-[var(--border)] rounded-md transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Upload className="h-3.5 w-3.5" />
                Import
                <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
              </button>
              {importMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-lg z-50">
                  <button
                    type="button"
                    onClick={() => { fileInputRef.current?.click(); setImportMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors rounded-t-lg"
                  >
                    <FileUp className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    From File
                  </button>
                  <button
                    type="button"
                    onClick={() => { router.push('/tickets/create?mode=import&source=jira'); setImportMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84h-9.63zm.05 6.67c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V9.51a.84.84 0 0 0-.84-.84h-9.63zm0 6.68c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35v-9.56a.84.84 0 0 0-.84-.84h-9.63z"/></svg>
                    From Jira
                  </button>
                  <button
                    type="button"
                    onClick={() => { router.push('/tickets/create?mode=import&source=linear'); setImportMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors rounded-b-lg"
                  >
                    <svg className="h-3.5 w-3.5 text-violet-500" viewBox="0 0 24 24" fill="currentColor"><path d="M2.29 13.91a10.15 10.15 0 0 0 7.8 7.8l-7.8-7.8zm-.86-2.15a10.17 10.17 0 0 0 12.81 12.81L1.43 11.76zM12 1.43 1.43 12l10.56 10.56A10.18 10.18 0 0 0 12 1.44zm1.8-.23 8.96 8.96a10.18 10.18 0 0 0-8.96-8.96zm5.1 3.77L13.1 22.6a10.15 10.15 0 0 0 5.8-17.63z"/></svg>
                    From Linear
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.markdown,.text,.csv,.json,.xml,.yaml,.yml"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border-subtle)] hover:border-[var(--border)] rounded-md transition-colors hover:bg-[var(--bg-hover)]"
              title="Open full markdown editor"
            >
              <PenLine className="h-3.5 w-3.5" />
              Open Editor
            </button>
          </div>
        </div>
        <MarkdownInput
          value={input.title}
          onChange={setTitle}
          placeholder="e.g. As a user, I want to reset my password so that I can regain access to my account if I forget it."
          maxLength={5000}
          rows={8}
          autoFocus={true}
          externalEditorButton
          fullscreenOpen={editorOpen}
          onFullscreenClose={handleEditorClose}
        />
        {input.title.length > 0 && (() => {
          const result = validateTitle(input.title);
          return !result.valid ? (
            <span
              role="alert"
              className="text-xs text-amber-500"
            >
              {result.reason}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}
