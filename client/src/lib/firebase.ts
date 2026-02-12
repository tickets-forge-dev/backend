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

// Initialize Firebase only with valid credentials and on client side
let app: any = null;
let auth: any = null;
let firestore: any = null;

function initializeFirebaseIfValid() {
  if (app || typeof window === 'undefined') {
    return; // Already initialized or not on client
  }

  const config = getFirebaseConfigSync();

  // Skip initialization if we don't have a valid API key
  // (prevents auth/invalid-api-key errors during static generation)
  if (!config.apiKey) {
    console.warn('⚠️ Firebase API key not available, skipping initialization');
    return;
  }

  try {
    app = initializeApp(config);
    auth = getAuth(app);
    firestore = getFirestore(app);
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
}

// Initialize on client side
if (typeof window !== 'undefined') {
  // Initialize immediately if we have valid credentials
  initializeFirebaseIfValid();

  // Also try to fetch fresh config from backend
  getFirebaseConfig().then((freshConfig) => {
    if (freshConfig?.apiKey && !firebaseInitialized) {
      // Config was fetched successfully and we haven't initialized yet, try again
      firebaseConfig = freshConfig;
      initializeFirebaseIfValid();
    }
  }).catch(() => {
    // Silently fail - fallback config is already in use
  });

  // Enable offline persistence when Firebase is ready
  if (firestore) {
    import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
      enableIndexedDbPersistence(firestore).catch((err) => {
        // Silently fail - offline persistence is optional
      });
    });
  }
}

// Export auth (will be null during SSR/build, but that's OK)
export { auth };

// OAuth providers
export const googleProvider = new GoogleAuthProvider();

// GitHub provider with repo scope to fetch user's repositories
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo'); // Access to private repos

export default app;
