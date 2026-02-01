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
  isUpdating: boolean;
  updateError: string | null;

  // Actions
  createTicket: (title: string, description?: string) => Promise<AECResponse | null>;
  loadTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  updateTicket: (
    id: string,
    data: { acceptanceCriteria?: string[]; assumptions?: string[] }
  ) => Promise<boolean>;
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
  isUpdating: false,
  updateError: null,

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

  updateTicket: async (
    id: string,
    data: { acceptanceCriteria?: string[]; assumptions?: string[] }
  ) => {
    set({ isUpdating: true, updateError: null });

    try {
      const { ticketService } = useServices();
      const updatedTicket = await ticketService.update(id, data);

      // Update current ticket
      set({ currentTicket: updatedTicket, isUpdating: false });

      // Also update in tickets list if present
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
      }));

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update ticket';
      set({ isUpdating: false, updateError: errorMessage });
      return false;
    }
  },

  clearCreateError: () => {
    set({ createError: null });
  },
}));
