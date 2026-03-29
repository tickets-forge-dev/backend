import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';
import type { SessionStatus, SessionEvent, SessionSummary, QuotaInfo } from '../types/session.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let _sessionAbortController: AbortController | undefined;
let _eventCounter = 0;

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const incomingHeaders = (init?.headers as Record<string, string>) || {};
  const headers: Record<string, string> = { ...incomingHeaders };

  if (!('Content-Type' in headers) && !('content-type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const teamId = useTeamStore.getState().currentTeam?.id;
  if (teamId) {
    headers['x-team-id'] = teamId;
  }

  return fetch(`${API_URL}${path}`, { ...init, headers });
}

interface SessionState {
  sessionId: string | null;
  ticketId: string | null;
  status: SessionStatus;
  events: SessionEvent[];
  pendingTools: Map<string, number>;
  summary: SessionSummary | null;
  error: string | null;
  elapsedSeconds: number;
  quota: QuotaInfo | null;

  startSession: (ticketId: string) => Promise<void>;
  cancelSession: () => Promise<void>;
  fetchQuota: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  ticketId: null,
  status: 'idle',
  events: [],
  pendingTools: new Map(),
  summary: null,
  error: null,
  elapsedSeconds: 0,
  quota: null,

  startSession: async (ticketId: string) => {
    const state = get();
    if (state.status === 'running' || state.status === 'provisioning') return;

    const abortController = new AbortController();
    _sessionAbortController = abortController;
    _eventCounter = 0;

    set({
      ticketId,
      status: 'provisioning',
      events: [],
      pendingTools: new Map(),
      summary: null,
      error: null,
      elapsedSeconds: 0,
    });

    // Start elapsed timer
    const timerInterval = setInterval(() => {
      const s = get();
      if (s.status === 'running' || s.status === 'provisioning') {
        set({ elapsedSeconds: s.elapsedSeconds + 1 });
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    try {
      const response = await authFetch(`/sessions/${ticketId}/start`, {
        method: 'POST',
        signal: abortController.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error((body as Record<string, string>).message || `Failed to start session`);
        }
        return;
      }

      set({ status: 'running' });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataLine = part.split('\n').find(line => line.startsWith('data: '));
          if (!dataLine) continue;

          let event: SessionEvent;
          try {
            const parsed = JSON.parse(dataLine.slice(6));
            event = { ...parsed, id: `evt_${++_eventCounter}`, timestamp: new Date().toISOString() };
          } catch {
            continue;
          }

          const currentState = get();

          // Handle status updates
          if (event.type === 'session.status') {
            const newStatus = (event.content as unknown as SessionStatus) || currentState.status;
            set({ status: newStatus, sessionId: event.toolUseId || currentState.sessionId });
            continue;
          }

          // Handle summary (session complete)
          if (event.type === 'event.summary') {
            set({
              status: 'completed',
              summary: {
                prUrl: null,
                prNumber: null,
                filesChanged: event.numTurns ?? 0,
                costUsd: event.costUsd ?? 0,
                durationMs: event.durationMs ?? 0,
              },
            });
            clearInterval(timerInterval);
            continue;
          }

          // Handle tool results — match to pending tool card and update in-place
          if (event.type === 'event.tool_result' && event.toolUseId) {
            const toolIndex = currentState.pendingTools.get(event.toolUseId);
            if (toolIndex !== undefined) {
              const updatedEvents = [...currentState.events];
              updatedEvents[toolIndex] = {
                ...updatedEvents[toolIndex],
                output: event.output,
                truncated: event.truncated,
                completed: true,
              };
              const newPending = new Map(currentState.pendingTools);
              newPending.delete(event.toolUseId);
              set({ events: updatedEvents, pendingTools: newPending });
              continue;
            }
          }

          // Regular event — append to list
          const newEvents = [...currentState.events, event];
          const newPending = new Map(currentState.pendingTools);
          if (event.toolUseId && event.type !== 'event.tool_result') {
            newPending.set(event.toolUseId, newEvents.length - 1);
          }
          set({ events: newEvents, pendingTools: newPending });
        }
      }

      // Stream ended
      _sessionAbortController = undefined;
      const finalState = get();
      if (finalState.status === 'running') {
        set({ status: 'completed' });
      }
      clearInterval(timerInterval);
    } catch (error) {
      _sessionAbortController = undefined;
      clearInterval(timerInterval);

      if (error instanceof DOMException && error.name === 'AbortError') {
        set({ status: 'cancelled', error: null });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ status: 'failed', error: errorMessage });
    }
  },

  cancelSession: async () => {
    if (_sessionAbortController) {
      _sessionAbortController.abort();
      _sessionAbortController = undefined;
    }

    const { sessionId } = get();
    if (sessionId) {
      try {
        await authFetch(`/sessions/${sessionId}/cancel`, { method: 'POST' });
      } catch {
        // Best-effort cancellation
      }
    }

    set({ status: 'cancelled', error: null });
  },

  fetchQuota: async () => {
    try {
      const res = await authFetch('/billing/quota');
      if (!res.ok) return;
      const data = await res.json();
      set({ quota: data as QuotaInfo });
    } catch {
      // Silently fail
    }
  },

  reset: () => {
    if (_sessionAbortController) {
      _sessionAbortController.abort();
      _sessionAbortController = undefined;
    }
    set({
      sessionId: null,
      ticketId: null,
      status: 'idle',
      events: [],
      pendingTools: new Map(),
      summary: null,
      error: null,
      elapsedSeconds: 0,
    });
  },
}));
