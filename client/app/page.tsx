'use client';

import { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { useTheme } from '@/hooks/useTheme';

export default function Home() {
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...');
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  useEffect(() => {
    // Test Firebase connection
    try {
      if (auth && firestore) {
        setFirebaseStatus('✅ Connected');
        console.log('Firebase Auth:', auth.app.options.projectId);
        console.log('Firestore:', firestore.app.options.projectId);
      } else {
        setFirebaseStatus('❌ Not initialized');
      }
    } catch (error) {
      setFirebaseStatus('❌ Error: ' + (error as Error).message);
      console.error('Firebase initialization error:', error);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/forge-icon.png"
            alt="Forge"
            width={120}
            height={120}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-4xl font-semibold mb-4">Forge</h1>
        <p className="text-gray-600 mb-8">
          Transform product intent into execution-ready tickets
        </p>
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p className="text-sm font-medium mb-2">Firebase Status:</p>
          <p className="text-sm">{firebaseStatus}</p>
          {firebaseStatus.includes('✅') && (
            <p className="text-xs text-gray-500 mt-2">
              Project: forge-e014f
            </p>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Project setup complete. Story 1.2 (Design System) in progress...
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={cycleTheme}
            className="px-4 py-2 rounded border text-sm"
            style={{
              background: 'var(--bg-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </button>
        </div>
      </div>
    </main>
  );
}
}
