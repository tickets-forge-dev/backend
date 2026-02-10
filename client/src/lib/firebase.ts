import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fetch Firebase configuration from backend at runtime
// This ensures the config is available even if env vars weren't set during build
let firebaseConfig: any = null;
let firebaseInitialized = false;

async function getFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/config/firebase`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }
    firebaseConfig = await response.json();
    return firebaseConfig;
  } catch (error) {
    console.error('❌ Failed to fetch Firebase configuration from backend:', error);
    // Fallback to environment variables if available
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
    return firebaseConfig;
  }
}

// Initialize Firebase config synchronously (uses cached value if available)
function getFirebaseConfigSync() {
  if (firebaseConfig) {
    return firebaseConfig;
  }
  // Return env vars as fallback (should be available after first async fetch)
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
}

// Initialize Firebase with sync config (uses fallback if needed)
const config = getFirebaseConfigSync();
const app = initializeApp(config);

// Initialize services
export const auth = getAuth(app);
const firestore = getFirestore(app);

// OAuth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Fetch fresh config from backend on first page load to ensure we have latest values
if (typeof window !== 'undefined') {
  getFirebaseConfig().then((freshConfig) => {
    if (freshConfig.apiKey && !firebaseConfig?.apiKey) {
      // Config was fetched successfully, can re-initialize if needed
      firebaseConfig = freshConfig;
    }
  }).catch(() => {
    // Silently fail - fallback config is already in use
  });

  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(firestore).catch((err) => {
      // Silently fail - offline persistence is optional
      // err.code === 'failed-precondition' means multiple tabs open
      // err.code === 'unimplemented' means browser doesn't support IndexedDB
    });
  });
}

export default app;
