import { create } from 'zustand';
import { TicketService } from '@/services/ticket.service';
import type { AECResponse } from '@/services/ticket.service';
import type { ZoomLevel } from '../components/records/ZoomToggle';
import type { RecordFilterState } from '../components/records/RecordFilters';
import { DEFAULT_FILTERS } from '../components/records/RecordFilters';

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

interface ChangeRecordsState {
  // Data
  tickets: AECResponse[];
  loading: boolean;

  // Selection
  selectedId: string | null;

  // View controls
  zoom: ZoomLevel;
  dateRange: { from: string; to: string };
  search: string;
  filters: RecordFilterState;
  showNames: 'off' | 'creator' | 'developer' | 'both';

  // Actions
  loadRecords: () => Promise<void>;
  setSelectedId: (id: string | null) => void;
  setZoom: (zoom: ZoomLevel) => void;
  setDateRange: (from: string, to: string) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: RecordFilterState) => void;
  resetFilters: () => void;
  cycleShowNames: () => void;
}

const ticketService = new TicketService();

export const useChangeRecordsStore = create<ChangeRecordsState>((set, get) => ({
  tickets: [],
  loading: true,
  selectedId: null,
  zoom: 'day',
  dateRange: defaultDateRange(),
  search: '',
  filters: DEFAULT_FILTERS,
  showNames: 'off',

  loadRecords: async () => {
    set({ loading: true });
    try {
      const all = await ticketService.list();
      const withRecords = all
        .filter((t) => t.changeRecord !== null)
        .sort(
          (a, b) =>
            new Date(a.changeRecord!.submittedAt).getTime() -
            new Date(b.changeRecord!.submittedAt).getTime(),
        );
      set({ tickets: withRecords, loading: false });
      if (withRecords.length > 0 && !get().selectedId) {
        set({ selectedId: withRecords[withRecords.length - 1].id });
      }
    } catch {
      set({ loading: false });
    }
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setZoom: (zoom) => set({ zoom }),
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  setSearch: (search) => set({ search }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS, search: '' }),
  cycleShowNames: () => {
    const order: Array<'off' | 'creator' | 'developer' | 'both'> = ['off', 'creator', 'developer', 'both'];
    const idx = order.indexOf(get().showNames);
    set({ showNames: order[(idx + 1) % order.length] });
  },
}));
