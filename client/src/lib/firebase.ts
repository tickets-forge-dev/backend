import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

console.log('✅ Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server'
});

// Initialize services
export const auth = getAuth(app);

// Force emulator connection for local development if needed
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Running on localhost - auth will redirect to current origin');
}
export const firestore = getFirestore(app);
export const storage = getStorage(app);

console.log('✅ Firebase services ready:', {
  auth: !!auth,
  firestore: !!firestore,
  storage: !!storage,
});

// OAuth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Enable Firestore offline persistence
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      }
    });
  });
}

export default app;
