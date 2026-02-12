import { useMemo, useState } from 'react';

interface TicketGroup {
  label: string;
  key: 'today' | 'this-week' | 'older';
  tickets: any[];
}

export function useTicketGrouping(tickets: any[], initialCollapsedGroups?: string[]) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    initialCollapsedGroups ? new Set(initialCollapsedGroups) : new Set()
  );

  const groupedTickets = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    const today: any[] = [];
    const thisWeek: any[] = [];
    const older: any[] = [];

    tickets.forEach((ticket) => {
      const age = now - new Date(ticket.updatedAt).getTime();

      if (age < day) {
        today.push(ticket);
      } else if (age < week) {
        thisWeek.push(ticket);
      } else {
        older.push(ticket);
      }
    });

    const groups: TicketGroup[] = [];

    if (today.length > 0) {
      groups.push({ label: 'Today', key: 'today', tickets: today });
    }
    if (thisWeek.length > 0) {
      groups.push({ label: 'This Week', key: 'this-week', tickets: thisWeek });
    }
    if (older.length > 0) {
      groups.push({ label: 'Older', key: 'older', tickets: older });
    }

    return groups;
  }, [tickets]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return {
    groups: groupedTickets,
    collapsedGroups,
    toggleGroup,
  };
}
