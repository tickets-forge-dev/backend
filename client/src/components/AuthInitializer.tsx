'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Global auth initializer - must be placed in root layout
 * Listens to Firebase auth state changes and updates the global store
 */
export function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    console.log('🟢 [AuthInitializer] Mounting and subscribing to auth state changes');

    if (!auth) {
      console.warn('⚠️ [AuthInitializer] Firebase auth not available, will retry...');
      // Retry after a delay to allow Firebase to initialize
      const timer = setTimeout(() => {
        import('@/lib/firebase').then(({ auth: firebaseAuth }) => {
          if (firebaseAuth) {
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
              console.log('🔐 [AuthInitializer] Auth state changed:', {
                email: user?.email || 'logged out',
                uid: user?.uid || 'none'
              });
              setUser(user);
            });
            return () => {
              console.log('🔴 [AuthInitializer] Unmounting and unsubscribing');
              unsubscribe();
            };
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 [AuthInitializer] Auth state changed:', {
        email: user?.email || 'logged out',
        uid: user?.uid || 'none'
      });
      setUser(user);
    });

    return () => {
      console.log('🔴 [AuthInitializer] Unmounting and unsubscribing');
      unsubscribe();
    };
  }, [setUser]);

  return null;
}
