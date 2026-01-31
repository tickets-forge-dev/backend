'use client';

import { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ThemeToggle } from '@/core/components/ThemeToggle';
import Link from 'next/link';

export default function Home() {
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...');

  useEffect(() => {
    // Test Firebase connection
    try {
      if (auth && firestore) {
        setFirebaseStatus('Connected');
        console.log('Firebase Auth:', auth.app.options.projectId);
        console.log('Firestore:', firestore.app.options.projectId);
      } else {
        setFirebaseStatus('Not initialized');
      }
    } catch (error) {
      setFirebaseStatus('Error: ' + (error as Error).message);
      console.error('Firebase initialization error:', error);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <img src="/forge-icon.png" alt="Forge" width={120} height={120} className="rounded-2xl" />
        </div>

        <div>
          <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--text)] mb-2">
            Forge
          </h1>
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            Transform product intent into execution-ready tickets
          </p>
        </div>

        <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-2">
            Firebase Status:
          </p>
          <Badge variant={firebaseStatus === 'Connected' ? 'default' : 'secondary'}>
            {firebaseStatus}
          </Badge>
          {firebaseStatus.includes('Connected') && (
            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-2">
              Project: forge-e014f
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center items-center">
          <ThemeToggle />
          <Link href="/tickets">
            <Button>Go to Tickets</Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost">Settings</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
