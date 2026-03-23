/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { TagResponse } from '@/services/tag.service';

interface TagsState {
  tags: TagResponse[];
  isLoading: boolean;
  loadError: string | null;

  // Actions
  loadTags: (teamId: string) => Promise<void>;
  createTag: (teamId: string, name: string, color: string, scope?: 'team' | 'private') => Promise<TagResponse | null>;
  updateTag: (teamId: string, tagId: string, data: { name?: string; color?: string }) => Promise<boolean>;
  deleteTag: (teamId: string, tagId: string) => Promise<boolean>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoading: false,
  loadError: null,

  loadTags: async (teamId: string) => {
    set({ isLoading: true, loadError: null });
    try {
      const { tagService } = useServices();
      const tags = await tagService.list(teamId);
      set({ tags, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, loadError: error.message || 'Failed to load tags' });
    }
  },

  createTag: async (teamId: string, name: string, color: string, scope?: 'team' | 'private') => {
    try {
      const { tagService } = useServices();
      const tag = await tagService.create(teamId, name, color, scope);
      set((state) => ({
        tags: [...state.tags, tag],
      }));
      return tag;
    } catch (error: any) {
      throw error;
    }
  },

  updateTag: async (teamId: string, tagId: string, data: { name?: string; color?: string }) => {
    try {
      const { tagService } = useServices();
      const updated = await tagService.update(teamId, tagId, data);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === tagId ? updated : t)),
      }));
      return true;
    } catch (error: any) {
      return false;
    }
  },

  deleteTag: async (teamId: string, tagId: string) => {
    try {
      const { tagService } = useServices();
      await tagService.delete(teamId, tagId);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== tagId),
      }));
      return true;
    } catch (error: any) {
      return false;
    }
  },
}));
