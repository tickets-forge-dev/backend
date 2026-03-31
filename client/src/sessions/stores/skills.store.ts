import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: string;
}

export interface SkillRecommendation {
  skillId: string;
  reason: string;
}

interface SkillsState {
  catalog: SkillCatalogItem[];
  recommended: SkillRecommendation[];
  selectedIds: string[];
  mode: 'auto' | 'manual';
  isLoadingCatalog: boolean;
  isLoadingRecommendations: boolean;

  fetchCatalog: () => Promise<void>;
  fetchRecommendations: (ticketId: string) => Promise<void>;
  toggleSkill: (skillId: string) => void;
  setMode: (mode: 'auto' | 'manual') => void;
  getEffectiveSkillIds: () => string[];
}

async function authFetch(path: string): Promise<Response> {
  const user = auth.currentUser;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
  const teamId = useTeamStore.getState().currentTeam?.id;
  if (teamId) headers['x-team-id'] = teamId;
  return fetch(`${API_URL}${path}`, { headers });
}

const MAX_SKILLS = 3;

export const useSkillsStore = create<SkillsState>((set, get) => ({
  catalog: [],
  recommended: [],
  selectedIds: [],
  mode: 'auto',
  isLoadingCatalog: false,
  isLoadingRecommendations: false,

  fetchCatalog: async () => {
    if (get().catalog.length > 0) return;
    set({ isLoadingCatalog: true });
    try {
      const res = await authFetch('/skills/catalog');
      if (res.ok) {
        const data = await res.json();
        set({ catalog: data, isLoadingCatalog: false });
      } else {
        set({ isLoadingCatalog: false });
      }
    } catch {
      set({ isLoadingCatalog: false });
    }
  },

  fetchRecommendations: async (ticketId: string) => {
    const cacheKey = `forge:skill-recs:${ticketId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        set({
          recommended: parsed,
          selectedIds: parsed.map((r: SkillRecommendation) => r.skillId),
        });
        return;
      } catch { /* corrupted cache — refetch */ }
    }

    set({ isLoadingRecommendations: true });
    try {
      const res = await fetch(`${API_URL}/skills/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'x-team-id': useTeamStore.getState().currentTeam?.id || '',
        },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        const data = await res.json();
        const recs = data.recommended || [];
        sessionStorage.setItem(cacheKey, JSON.stringify(recs));
        set({
          recommended: recs,
          selectedIds: recs.map((r: SkillRecommendation) => r.skillId),
          isLoadingRecommendations: false,
        });
      }
    } catch {
      set({ isLoadingRecommendations: false });
    }
  },

  toggleSkill: (skillId: string) => {
    const { selectedIds } = get();
    if (selectedIds.includes(skillId)) {
      set({ selectedIds: selectedIds.filter(id => id !== skillId) });
    } else if (selectedIds.length < MAX_SKILLS) {
      set({ selectedIds: [...selectedIds, skillId] });
    }
  },

  setMode: (mode) => {
    set({ mode });
    if (mode === 'manual') {
      set({ selectedIds: [] });
    }
  },

  getEffectiveSkillIds: () => {
    const { mode, selectedIds, recommended } = get();
    if (mode === 'auto') {
      return recommended.map(r => r.skillId);
    }
    return selectedIds;
  },
}));
