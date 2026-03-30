import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useTicketsStore } from '@/stores/tickets.store';

/**
 * Subscribes to a single ticket's Firestore document for real-time status updates.
 * Only activates when the ticket is in 'executing' status to minimize Firestore reads.
 * When the status changes (e.g. executing → delivered), updates the ticket in the list store.
 */
export function useTicketStatusSubscription(
  ticketId: string,
  teamId: string | undefined,
  currentStatus: string,
) {
  const statusRef = useRef(currentStatus);
  statusRef.current = currentStatus;

  useEffect(() => {
    if (!teamId || !firestore || currentStatus !== 'executing') return;

    const docRef = doc(firestore, 'teams', teamId, 'aecs', ticketId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const newStatus = data.status as string;
        if (newStatus !== statusRef.current) {
          // Status changed — update the ticket in the list
          const { tickets } = useTicketsStore.getState();
          const updated = tickets.map((t) =>
            t.id === ticketId ? { ...t, status: newStatus } : t,
          );
          useTicketsStore.setState({ tickets: updated });
        }
      },
      (error) => {
        console.warn(`[useTicketStatusSubscription] ${ticketId}:`, error.message);
      },
    );

    return unsubscribe;
  }, [ticketId, teamId, currentStatus]);
}
