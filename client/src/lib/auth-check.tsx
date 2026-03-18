'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';
import Image from 'next/image';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let isInitial = true;

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (isMounted) {
        setUser(user);
        setAuthenticated(!!user);
        setLoading(false);

        // Redirect to login if not authenticated (unless already on login page)
        if (!user && pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [pathname, router, setUser]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="relative flex flex-col items-center">
          {/* Fire icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse" />
            <Image
              src="/forge-icon.png"
              alt="forge"
              width={48}
              height={48}
              className="relative animate-forge-fire"
              priority
            />
          </div>
          {/* Ember particles around the icon */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none">
            {[
              { size: 2, left: '20%', delay: '0s', dur: '1.8s' },
              { size: 3, left: '50%', delay: '0.6s', dur: '2.2s' },
              { size: 2, left: '75%', delay: '1.2s', dur: '2.0s' },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute bottom-0 rounded-full bg-orange-400/60"
                style={{
                  width: p.size,
                  height: p.size,
                  left: p.left,
                  animation: `loader-ember ${p.dur} ${p.delay} ease-out infinite`,
                }}
              />
            ))}
          </div>
          <p className="mt-5 text-[var(--text-sm)] text-[var(--text-tertiary)] tracking-wide">
            Loading...
          </p>
        </div>
        <style jsx>{`
          @keyframes loader-ember {
            0% { opacity: 0; transform: translateY(0) scale(1); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-28px) scale(0.5); }
          }
          :global(.animate-forge-fire) {
            animation: forge-fire 2s ease-in-out infinite;
          }
          @keyframes forge-fire {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.06); filter: brightness(1.15); }
          }
        `}</style>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
