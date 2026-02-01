import { TicketService } from './ticket.service';
import { AuthService } from './auth.service';

/**
 * Dependency Injection Hook (MANDATORY per CLAUDE.md)
 *
 * Returns service instances for use in Zustand stores.
 * Services are lazily instantiated.
 */

let ticketServiceInstance: TicketService | null = null;
let authServiceInstance: AuthService | null = null;

export function useServices() {
  // Lazy initialization - create service instances only once
  if (!ticketServiceInstance) {
    ticketServiceInstance = new TicketService();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }

  return {
    ticketService: ticketServiceInstance,
    authService: authServiceInstance,
  };
}
