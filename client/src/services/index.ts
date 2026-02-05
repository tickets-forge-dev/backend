import { TicketService } from './ticket.service';
import { AuthService } from './auth.service';
import { GitHubService } from './github.service';
import { QuestionRoundService } from './question-round.service';

/**
 * Dependency Injection Hook (MANDATORY per CLAUDE.md)
 *
 * Returns service instances for use in Zustand stores.
 * Services are lazily instantiated.
 */

let ticketServiceInstance: TicketService | null = null;
let authServiceInstance: AuthService | null = null;
let gitHubServiceInstance: GitHubService | null = null;
let questionRoundServiceInstance: QuestionRoundService | null = null;

export function useServices() {
  // Lazy initialization - create service instances only once
  if (!ticketServiceInstance) {
    ticketServiceInstance = new TicketService();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }

  if (!gitHubServiceInstance) {
    gitHubServiceInstance = new GitHubService();
  }

  if (!questionRoundServiceInstance) {
    questionRoundServiceInstance = new QuestionRoundService();
  }

  return {
    ticketService: ticketServiceInstance,
    authService: authServiceInstance,
    gitHubService: gitHubServiceInstance,
    questionRoundService: questionRoundServiceInstance,
  };
}
