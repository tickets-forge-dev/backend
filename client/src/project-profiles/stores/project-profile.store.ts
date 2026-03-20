import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectProfileSummary {
  id: string;
  teamId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  status: 'pending' | 'scanning' | 'ready' | 'failed';
  scannedAt: string | null;
  scannedBy: string | null;
  fileCount: number;
  techStack: string[];
  commitSha: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProfileDetail extends ProjectProfileSummary {
  profileContent: string | null;
}

// ---------------------------------------------------------------------------
// Auth fetch helper (matches jobs store pattern)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface ProjectProfileState {
  profiles: ProjectProfileSummary[];
  currentProfile: ProjectProfileDetail | null;
  isLoading: boolean;
  isTriggeringScan: boolean;
  error: string | null;

  loadProfiles: () => Promise<void>;
  loadProfileById: (profileId: string) => Promise<void>;
  findByRepo: (repoOwner: string, repoName: string) => Promise<ProjectProfileSummary | null>;
  triggerScan: (repoOwner: string, repoName: string, branch?: string) => Promise<{ profileId: string; status: string }>;
  deleteProfile: (profileId: string) => Promise<void>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProjectProfileStore = create<ProjectProfileState>((set) => ({
  profiles: [],
  currentProfile: null,
  isLoading: false,
  isTriggeringScan: false,
  error: null,

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch('/project-profiles');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).message || `Failed to load profiles: ${response.statusText}`);
      }
      const data = (await response.json()) as ProjectProfileSummary[];
      set({ profiles: data, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles';
      set({ isLoading: false, error: errorMessage });
    }
  },

  loadProfileById: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`/project-profiles/${profileId}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).message || `Failed to load profile: ${response.statusText}`);
      }
      const data = (await response.json()) as ProjectProfileDetail;
      set({ currentProfile: data, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      set({ isLoading: false, error: errorMessage });
    }
  },

  findByRepo: async (repoOwner: string, repoName: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`/project-profiles?repo=${encodeURIComponent(`${repoOwner}/${repoName}`)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).message || `Failed to find profile: ${response.statusText}`);
      }
      const data = (await response.json()) as ProjectProfileSummary | null;
      set({ isLoading: false });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find profile';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  triggerScan: async (repoOwner: string, repoName: string, branch?: string) => {
    set({ isTriggeringScan: true, error: null });
    try {
      const body: Record<string, string> = { repoOwner, repoName };
      if (branch) {
        body.branch = branch;
      }
      const response = await authFetch('/project-profiles/scan', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error((errBody as Record<string, string>).message || `Failed to trigger scan: ${response.statusText}`);
      }
      const data = (await response.json()) as { profileId: string; status: string };
      set({ isTriggeringScan: false });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger scan';
      set({ isTriggeringScan: false, error: errorMessage });
      throw err;
    }
  },

  deleteProfile: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`/project-profiles/${profileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).message || `Failed to delete profile: ${response.statusText}`);
      }
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== profileId),
        currentProfile: state.currentProfile?.id === profileId ? null : state.currentProfile,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      set({ isLoading: false, error: errorMessage });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
