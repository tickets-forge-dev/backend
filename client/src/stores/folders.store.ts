/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { FolderResponse } from '@/services/folder.service';

interface FoldersState {
  folders: FolderResponse[];
  isLoading: boolean;
  loadError: string | null;
  expandedFolders: Set<string>;

  // Actions
  loadFolders: (teamId: string) => Promise<void>;
  createFolder: (teamId: string, name: string) => Promise<FolderResponse | null>;
  renameFolder: (teamId: string, folderId: string, name: string) => Promise<boolean>;
  deleteFolder: (teamId: string, folderId: string) => Promise<boolean>;
  moveTicket: (teamId: string, ticketId: string, folderId: string | null) => Promise<boolean>;
  toggleFolder: (folderId: string) => void;
}

const STORAGE_KEY = 'folders-expanded-state';

function loadExpandedState(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveExpandedState(expanded: Set<string>) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
    } catch {
      // Silently fail
    }
  }
}

export const useFoldersStore = create<FoldersState>((set, get) => ({
  folders: [],
  isLoading: false,
  loadError: null,
  expandedFolders: loadExpandedState(),

  loadFolders: async (teamId: string) => {
    set({ isLoading: true, loadError: null });
    try {
      const { folderService } = useServices();
      const folders = await folderService.list(teamId);
      set({ folders, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, loadError: error.message || 'Failed to load folders' });
    }
  },

  createFolder: async (teamId: string, name: string) => {
    try {
      const { folderService } = useServices();
      const folder = await folderService.create(teamId, name);
      set((state) => ({
        folders: [...state.folders, folder].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      }));
      return folder;
    } catch (error: any) {
      throw error;
    }
  },

  renameFolder: async (teamId: string, folderId: string, name: string) => {
    try {
      const { folderService } = useServices();
      const updated = await folderService.rename(teamId, folderId, name);
      set((state) => ({
        folders: state.folders
          .map((f) => (f.id === folderId ? updated : f))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      }));
      return true;
    } catch (error: any) {
      return false;
    }
  },

  deleteFolder: async (teamId: string, folderId: string) => {
    try {
      const { folderService } = useServices();
      await folderService.delete(teamId, folderId);
      set((state) => {
        const next = new Set(state.expandedFolders);
        next.delete(folderId);
        saveExpandedState(next);
        return {
          folders: state.folders.filter((f) => f.id !== folderId),
          expandedFolders: next,
        };
      });
      return true;
    } catch (error: any) {
      return false;
    }
  },

  moveTicket: async (teamId: string, ticketId: string, folderId: string | null) => {
    try {
      const { folderService } = useServices();
      await folderService.moveTicket(teamId, ticketId, folderId);
      return true;
    } catch (error: any) {
      return false;
    }
  },

  toggleFolder: (folderId: string) => {
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      saveExpandedState(next);
      return { expandedFolders: next };
    });
  },
}));
