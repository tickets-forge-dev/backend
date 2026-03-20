/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: getState() is lazy access, not a React hook */
import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface GenerationJobClient {
  id: string;
  teamId: string;
  ticketId: string;
  ticketTitle: string;
  createdBy: string;
  status: 'running' | 'retrying' | 'completed' | 'failed' | 'cancelled';
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
  isSubscribed: boolean;
  subscribe: (teamId: string, userId: string) => () => void;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  startFinalization: (ticketId: string) => Promise<{ jobId: string }>;
  getJobById: (jobId: string) => GenerationJobClient | undefined;
  activeJobCount: () => number;
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

/**
 * Convert a Firestore Timestamp or any date-like value to a JS Date.
 */
function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
}

/**
 * Map a Firestore document to a GenerationJobClient.
 */
function mapDoc(doc: { id: string; data: () => Record<string, unknown> }): GenerationJobClient {
  const d = doc.data();
  return {
    id: doc.id,
    teamId: (d.teamId as string) || '',
    ticketId: (d.ticketId as string) || '',
    ticketTitle: (d.ticketTitle as string) || '',
    createdBy: (d.createdBy as string) || '',
    status: (d.status as GenerationJobClient['status']) || 'running',
    phase: (d.phase as string) ?? null,
    percent: (d.percent as number) || 0,
    attempt: (d.attempt as number) || 1,
    previousJobId: (d.previousJobId as string) ?? null,
    error: (d.error as string) ?? null,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    completedAt: d.completedAt ? toDate(d.completedAt) : null,
  };
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  isSubscribed: false,

  subscribe: (teamId: string, userId: string) => {
    if (!firestore) {
      console.warn('[JobsStore] Firestore not initialized, skipping subscription');
      return () => {};
    }

    const jobsRef = collection(firestore, `teams/${teamId}/jobs`);
    const q = query(
      jobsRef,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs = snapshot.docs.map(mapDoc);
        set({ jobs, isSubscribed: true });
      },
      (error) => {
        console.error('[JobsStore] Snapshot error:', error);
      },
    );

    return () => {
      unsubscribe();
      set({ isSubscribed: false });
    };
  },

  cancelJob: async (jobId: string) => {
    const response = await authFetch(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message || `Failed to cancel job: ${response.statusText}`);
    }
  },

  retryJob: async (jobId: string) => {
    const response = await authFetch(`/jobs/${jobId}/retry`, {
      method: 'POST',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message || `Failed to retry job: ${response.statusText}`);
    }
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
    return { jobId: data.jobId };
  },

  getJobById: (jobId: string) => {
    return get().jobs.find((j) => j.id === jobId);
  },

  activeJobCount: () => {
    return get().jobs.filter((j) => j.status === 'running' || j.status === 'retrying').length;
  },
}));
