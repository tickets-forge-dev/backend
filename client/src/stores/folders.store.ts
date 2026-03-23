/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { FolderResponse } from '@/services/folder.service';

interface FolderOrderData {
  private: string[];
  team: string[];
}

interface FoldersState {
  folders: FolderResponse[];
  isLoading: boolean;
  loadError: string | null;
  expandedFolders: Set<string>;

  // Actions
  loadFolders: (teamId: string) => Promise<void>;
  createFolder: (teamId: string, name: string, scope?: 'team' | 'private') => Promise<FolderResponse | null>;
  renameFolder: (teamId: string, folderId: string, name: string) => Promise<boolean>;
  deleteFolder: (teamId: string, folderId: string) => Promise<boolean>;
  moveTicket: (teamId: string, ticketId: string, folderId: string | null) => Promise<boolean>;
  toggleFolder: (folderId: string) => void;
  updateFolderScope: (teamId: string, folderId: string, scope: 'team' | 'private', confirm?: boolean) => Promise<{ folder?: FolderResponse; affectedTickets?: any[] }>;
  reorderFolders: (teamId: string, scope: 'team' | 'private', orderedIds: string[]) => void;
}

const STORAGE_KEY = 'folders-expanded-state';
const ORDER_STORAGE_KEY_PREFIX = 'folder-display-order-';

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

function loadFolderOrder(teamId: string): FolderOrderData | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(`${ORDER_STORAGE_KEY_PREFIX}${teamId}`);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveFolderOrder(teamId: string, order: FolderOrderData) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${ORDER_STORAGE_KEY_PREFIX}${teamId}`, JSON.stringify(order));
    } catch {
      // Silently fail
    }
  }
}

function applyFolderOrder(folders: FolderResponse[], teamId: string): FolderResponse[] {
  const savedOrder = loadFolderOrder(teamId);
  if (!savedOrder) return folders;

  const privateFolders = folders.filter(f => f.scope === 'private');
  const teamFolders = folders.filter(f => f.scope === 'team');

  const sortByOrder = (items: FolderResponse[], orderList: string[]) => {
    const orderMap = new Map(orderList.map((id, idx) => [id, idx]));
    return [...items].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
  };

  return [
    ...sortByOrder(privateFolders, savedOrder.private || []),
    ...sortByOrder(teamFolders, savedOrder.team || []),
  ];
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
      set({ folders: applyFolderOrder(folders, teamId), isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, loadError: error.message || 'Failed to load folders' });
    }
  },

  createFolder: async (teamId: string, name: string, scope?: 'team' | 'private') => {
    try {
      const { folderService } = useServices();
      const folder = await folderService.create(teamId, name, scope);
      set((state) => ({
        folders: [...state.folders, folder],
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
        folders: state.folders.map((f) => (f.id === folderId ? updated : f)),
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

        // Remove from saved order
        const savedOrder = loadFolderOrder(teamId);
        if (savedOrder) {
          savedOrder.private = (savedOrder.private || []).filter(id => id !== folderId);
          savedOrder.team = (savedOrder.team || []).filter(id => id !== folderId);
          saveFolderOrder(teamId, savedOrder);
        }

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

  updateFolderScope: async (teamId: string, folderId: string, scope: 'team' | 'private', confirm?: boolean) => {
    const { folderService } = useServices();
    const result = await folderService.updateScope(teamId, folderId, scope, confirm);
    if (result.folder) {
      set((state) => ({
        folders: applyFolderOrder(
          state.folders.map((f) => (f.id === folderId ? result.folder! : f)),
          teamId,
        ),
      }));
    }
    return result;
  },

  reorderFolders: (teamId: string, scope: 'team' | 'private', orderedIds: string[]) => {
    const savedOrder = loadFolderOrder(teamId) || { private: [], team: [] };
    if (scope === 'private') {
      savedOrder.private = orderedIds;
    } else {
      savedOrder.team = orderedIds;
    }
    saveFolderOrder(teamId, savedOrder);

    set((state) => ({
      folders: applyFolderOrder(state.folders, teamId),
    }));
  },
}));
