/**
 * useServices Hook
 * 
 * Provides access to application services with dependency injection pattern.
 * Services are instantiated once and reused across the application.
 * 
 * Part of: Story 4.1 - Task 9
 */

import { useMemo } from 'react';
import { GitHubService } from '@/services/github.service';
import { TicketService } from '@/services/ticket.service';
import { AuthService } from '@/services/auth.service';

export function useServices() {
  const githubService = useMemo(() => new GitHubService(), []);
  const ticketService = useMemo(() => new TicketService(), []);
  const authService = useMemo(() => new AuthService(), []);

  return {
    githubService,
    ticketService,
    authService,
  };
}
