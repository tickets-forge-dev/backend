'use client';

import { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';

export default function Home() {
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...');

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
        <h1 className="text-4xl font-semibold mb-4">Executable Tickets</h1>
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
        <p className="text-sm text-gray-500">
          Project setup complete. Start implementing Story 1.2 (Design System)
        </p>
      </div>
    </main>
  );
}
