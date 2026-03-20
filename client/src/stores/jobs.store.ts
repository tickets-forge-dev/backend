import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const POLL_INTERVAL_ACTIVE = 2000;  // 2s when jobs are running
const POLL_INTERVAL_IDLE = 10000;   // 10s when no active jobs

export interface GenerationJobClient {
  id: string;
  teamId: string;
  ticketId: string;
  ticketTitle: string;
  createdBy: string;
  status: 'running' | 'retrying' | 'completed' | 'failed' | 'cancelled';
  type: 'finalization' | 'scan';
  phase: string | null;
  percent: number;
  attempt: number;
  previousJobId: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

interface JobsState {
  jobs: GenerationJobClient[];
  /** Job IDs dismissed by the user (client-side only, survives until next poll replaces them) */
  dismissedIds: Set<string>;
  isSubscribed: boolean;
  subscribe: (teamId: string, userId: string) => () => void;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  startFinalization: (ticketId: string) => Promise<{ jobId: string }>;
  getJobById: (jobId: string) => GenerationJobClient | undefined;
  activeJobCount: () => number;
  /** Force an immediate poll (e.g. after starting a job) */
  poll: () => Promise<void>;
  /** Dismiss a single completed/failed job from the panel */
  dismissJob: (jobId: string) => void;
  /** Dismiss all completed/failed jobs from the panel */
  clearCompleted: () => void;
}

/**
 * Authenticated fetch wrapper for job endpoints.
 * Adds Firebase Bearer token and team header.
 */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };

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

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function mapJob(raw: Record<string, unknown>): GenerationJobClient {
  return {
    id: (raw.id as string) || '',
    teamId: (raw.teamId as string) || '',
    ticketId: (raw.ticketId as string) || '',
    ticketTitle: (raw.ticketTitle as string) || '',
    createdBy: (raw.createdBy as string) || '',
    status: (raw.status as GenerationJobClient['status']) || 'running',
    type: (raw.type as GenerationJobClient['type']) || 'finalization',
    phase: (raw.phase as string) ?? null,
    percent: (raw.percent as number) || 0,
    attempt: (raw.attempt as number) || 1,
    previousJobId: (raw.previousJobId as string) ?? null,
    error: (raw.error as string) ?? null,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    completedAt: raw.completedAt ? parseDate(raw.completedAt) : null,
  };
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  dismissedIds: new Set<string>(),
  isSubscribed: false,

  /**
   * Start polling the backend API for job updates.
   * Polls at 2s when active jobs exist, 10s when idle.
   * Returns an unsubscribe function to stop polling.
   */
  subscribe: (_teamId: string, _userId: string) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const fetchJobs = async () => {
      try {
        const res = await authFetch('/jobs');
        if (!res.ok) return;
        const data = (await res.json()) as Record<string, unknown>[];
        const jobs = data.map(mapJob);
        set({ jobs, isSubscribed: true });
      } catch {
        // Silently ignore poll failures — will retry on next tick
      }
    };

    const scheduleNext = () => {
      if (stopped) return;
      const hasActive = get().jobs.some((j) => j.status === 'running' || j.status === 'retrying');
      const interval = hasActive ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
      timer = setTimeout(async () => {
        await fetchJobs();
        scheduleNext();
      }, interval);
    };

    // Initial fetch, then start polling
    void fetchJobs().then(scheduleNext);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      set({ isSubscribed: false });
    };
  },

  poll: async () => {
    try {
      const res = await authFetch('/jobs');
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, unknown>[];
      const jobs = data.map(mapJob);
      set({ jobs });
    } catch {
      // Ignore
    }
  },

  cancelJob: async (jobId: string) => {
    const response = await authFetch(`/jobs/${jobId}/cancel`, { method: 'POST' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message || `Failed to cancel job: ${response.statusText}`);
    }
    // Immediately poll to reflect the change
    await get().poll();
  },

  retryJob: async (jobId: string) => {
    const response = await authFetch(`/jobs/${jobId}/retry`, { method: 'POST' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message || `Failed to retry job: ${response.statusText}`);
    }
    await get().poll();
  },

  startFinalization: async (ticketId: string) => {
    const response = await authFetch('/jobs/start', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message || `Failed to start job: ${response.statusText}`);
    }

    const data = (await response.json()) as { jobId: string };
    // Immediately poll to pick up the new job
    await get().poll();
    return { jobId: data.jobId };
  },

  getJobById: (jobId: string) => {
    return get().jobs.find((j) => j.id === jobId);
  },

  activeJobCount: () => {
    return get().jobs.filter((j) => j.status === 'running' || j.status === 'retrying').length;
  },

  dismissJob: (jobId: string) => {
    set((state) => {
      const next = new Set(state.dismissedIds);
      next.add(jobId);
      return { dismissedIds: next };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const next = new Set(state.dismissedIds);
      for (const job of state.jobs) {
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          next.add(job.id);
        }
      }
      return { dismissedIds: next };
    });
  },
}));
