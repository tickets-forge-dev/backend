import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { AECResponse } from '@/services/ticket.service';

interface TicketsState {
  tickets: AECResponse[];
  isCreating: boolean;
  createError: string | null;
  isLoading: boolean;
  loadError: string | null;

  // Actions
  createTicket: (title: string, description?: string) => Promise<AECResponse | null>;
  loadTickets: () => Promise<void>;
  clearCreateError: () => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  isCreating: false,
  createError: null,
  isLoading: false,
  loadError: null,

  createTicket: async (title: string, description?: string) => {
    set({ isCreating: true, createError: null });

    try {
      const { ticketService } = useServices();
      const aec = await ticketService.create({ title, description });

      // Add to local tickets list
      set((state) => ({
        tickets: [aec, ...state.tickets],
        isCreating: false,
      }));

      return aec;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create ticket';
      set({ isCreating: false, createError: errorMessage });
      return null;
    }
  },

  loadTickets: async () => {
    set({ isLoading: true, loadError: null });

    try {
      const { ticketService } = useServices();
      const tickets = await ticketService.list();

      set({ tickets, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load tickets';
      set({ isLoading: false, loadError: errorMessage });
    }
  },

  clearCreateError: () => {
    set({ createError: null });
  },
}));
