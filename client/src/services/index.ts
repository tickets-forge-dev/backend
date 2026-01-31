import { TicketService } from './ticket.service';

/**
 * Dependency Injection Hook (MANDATORY per CLAUDE.md)
 *
 * Returns service instances for use in Zustand stores.
 * Services are lazily instantiated.
 */

let ticketServiceInstance: TicketService | null = null;

export function useServices() {
  // Lazy initialization - create service instances only once
  if (!ticketServiceInstance) {
    ticketServiceInstance = new TicketService();
  }

  return {
    ticketService: ticketServiceInstance,
  };
}
