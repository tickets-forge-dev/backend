'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Pencil, Send, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { SlideOverPanel } from '@/src/sessions/components/molecules/SlideOverPanel';
import { TicketService } from '@/services/ticket.service';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface DesignEditBladeProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string | null;
  onRefresh?: () => Promise<void>;
}

export function DesignEditBlade({ open, onClose, ticketId, ticketTitle, ticketDescription, onRefresh }: DesignEditBladeProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'How would you like to edit the screen specifications?' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ticketService = useMemo(() => new TicketService(), []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when blade opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleGenerateDescription = useCallback(async () => {
    if (!ticketTitle) return;
    setIsGeneratingDesc(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const user = auth.currentUser;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      const teamId = useTeamStore.getState().currentTeam?.id;
      if (teamId) headers['x-team-id'] = teamId;

      const res = await fetch(`${API_URL}/tickets/generate-ui-description`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: ticketTitle, description: ticketDescription }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (data.uiDescription) {
        setInput(data.uiDescription);
        inputRef.current?.focus();
      }
    } catch {
      toast.error('Failed to generate UI description');
    } finally {
      setIsGeneratingDesc(false);
    }
  }, [ticketTitle, ticketDescription]);

  const handleSend = useCallback(async () => {
    const instruction = input.trim();
    if (!instruction || isProcessing) return;

    // Add user message
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: instruction };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      await ticketService.generateWireframes(ticketId, instruction);

      const successMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Screen specifications updated. You can continue editing or close this panel.',
      };
      setMessages(prev => [...prev, successMsg]);

      if (onRefresh) await onRefresh();
    } catch (error: any) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Something went wrong: ${error?.response?.data?.message || error?.message || 'Failed to update specifications'}. Try again.`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isProcessing, ticketId, ticketService, onRefresh]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Edit Specifications"
      subtitle={ticketTitle}
      width="w-[440px]"
    >
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Pencil className="w-3 h-3 text-purple-500" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                  : 'text-[var(--text-secondary)]'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
              </div>
              <div className="text-[13px] text-[var(--text-tertiary)]">
                Updating specifications...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your changes..."
              rows={2}
              disabled={isProcessing}
              className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)] resize-none disabled:opacity-50 scrollbar-thin"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleGenerateDescription}
            disabled={isGeneratingDesc || isProcessing}
            className="inline-flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-400 disabled:opacity-40 transition-colors"
          >
            {isGeneratingDesc ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
            {isGeneratingDesc ? 'Generating...' : 'Generate description from ticket'}
          </button>
        </div>
      </div>
    </SlideOverPanel>
  );
}
