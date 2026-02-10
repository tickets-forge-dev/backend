import { useState, useEffect } from 'react';
import { DEMO_TICKETS } from '../mocks/demo-tickets';

const DISMISSED_DEMO_TICKETS_KEY = 'dismissed-demo-tickets';

/**
 * Hook to manage demo tickets
 * - Returns demo tickets that haven't been dismissed
 * - Provides function to dismiss/delete a demo ticket
 * - Persists dismissal in localStorage
 */
export function useDemoTickets() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed tickets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_DEMO_TICKETS_KEY);
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse dismissed demo tickets', err);
      }
    }
  }, []);

  // Get demo tickets that haven't been dismissed
  const activeDemoTickets = DEMO_TICKETS.filter((ticket) => !dismissedIds.includes(ticket.id));

  // Dismiss a demo ticket (remove from view, save to localStorage)
  const dismissDemoTicket = (ticketId: string) => {
    const updated = [...dismissedIds, ticketId];
    setDismissedIds(updated);
    localStorage.setItem(DISMISSED_DEMO_TICKETS_KEY, JSON.stringify(updated));
  };

  // Restore all demo tickets (for Settings)
  const restoreDemoTickets = () => {
    setDismissedIds([]);
    localStorage.removeItem(DISMISSED_DEMO_TICKETS_KEY);
  };

  return {
    activeDemoTickets,
    dismissedCount: dismissedIds.length,
    dismissDemoTicket,
    restoreDemoTickets,
    hasAnyDismissed: dismissedIds.length > 0,
  };
}
