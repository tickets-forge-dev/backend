import { create } from 'zustand';
import { useServices } from '@/services/index';
import type { AECResponse } from '@/services/ticket.service';

interface TicketsState {
  tickets: AECResponse[];
  currentTicket: AECResponse | null;
  isCreating: boolean;
  createError: string | null;
  isLoading: boolean;
  loadError: string | null;
  fetchError: string | null;

  // Actions
  createTicket: (title: string, description?: string) => Promise<AECResponse | null>;
  loadTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  clearCreateError: () => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  isCreating: false,
  createError: null,
  isLoading: false,
  loadError: null,
  fetchError: null,

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

  fetchTicket: async (id: string) => {
    set({ isLoading: true, fetchError: null, currentTicket: null });

    try {
      const { ticketService } = useServices();
      const ticket = await ticketService.getById(id);

      set({ currentTicket: ticket, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load ticket';
      set({ isLoading: false, fetchError: errorMessage });
    }
  },

  clearCreateError: () => {
    set({ createError: null });
  },
}));
