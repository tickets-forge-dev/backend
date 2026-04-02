import { create } from 'zustand';

export type ColumnId = 'status' | 'priority' | 'assignee' | 'creator' | 'updated';

interface ColumnConfig {
  order: ColumnId[];
  hidden: Set<ColumnId>;
}

const DEFAULT_ORDER: ColumnId[] = ['status', 'priority', 'assignee', 'creator', 'updated'];

function loadConfig(teamId: string): ColumnConfig {
  if (typeof window === 'undefined') return { order: DEFAULT_ORDER, hidden: new Set() };
  try {
    const saved = localStorage.getItem(`ticket-grid-columns-${teamId}`);
    if (!saved) return { order: DEFAULT_ORDER, hidden: new Set() };
    const parsed = JSON.parse(saved);
    if (!parsed.order || !Array.isArray(parsed.order)) return { order: DEFAULT_ORDER, hidden: new Set() };
    // Add any new columns not in saved config
    const savedOrder = parsed.order.filter((c: string) => DEFAULT_ORDER.includes(c as ColumnId));
    const newColumns = DEFAULT_ORDER.filter(c => !savedOrder.includes(c));
    return {
      order: [...savedOrder, ...newColumns] as ColumnId[],
      hidden: new Set((parsed.hidden || []).filter((c: string) => DEFAULT_ORDER.includes(c as ColumnId))),
    };
  } catch {
    return { order: DEFAULT_ORDER, hidden: new Set() };
  }
}

function saveConfig(teamId: string, config: ColumnConfig) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`ticket-grid-columns-${teamId}`, JSON.stringify({
        order: config.order,
        hidden: [...config.hidden],
      }));
    } catch {}
  }
}

interface ColumnConfigState {
  config: ColumnConfig;
  loadColumnConfig: (teamId: string) => void;
  toggleColumn: (teamId: string, columnId: ColumnId) => void;
  reorderColumns: (teamId: string, newOrder: ColumnId[]) => void;
  resetToDefaults: (teamId: string) => void;
}

export const useColumnConfigStore = create<ColumnConfigState>((set, get) => ({
  config: { order: DEFAULT_ORDER, hidden: new Set() },

  loadColumnConfig: (teamId: string) => {
    set({ config: loadConfig(teamId) });
  },

  toggleColumn: (teamId: string, columnId: ColumnId) => {
    const config = get().config;
    const newHidden = new Set(config.hidden);
    if (newHidden.has(columnId)) newHidden.delete(columnId);
    else newHidden.add(columnId);
    const newConfig = { ...config, hidden: newHidden };
    saveConfig(teamId, newConfig);
    set({ config: newConfig });
  },

  reorderColumns: (teamId: string, newOrder: ColumnId[]) => {
    const config = get().config;
    const newConfig = { ...config, order: newOrder };
    saveConfig(teamId, newConfig);
    set({ config: newConfig });
  },

  resetToDefaults: (teamId: string) => {
    const newConfig = { order: DEFAULT_ORDER, hidden: new Set<ColumnId>() };
    saveConfig(teamId, newConfig);
    set({ config: newConfig });
  },
}));
