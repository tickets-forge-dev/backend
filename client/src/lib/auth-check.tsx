'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setAuthenticated(!!user);
      setLoading(false);

      // Redirect to login if not authenticated (unless already on login page)
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [pathname, router, setUser]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-hover)] mx-auto mb-4"></div>
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
