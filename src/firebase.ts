import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

const app = hasConfig ? initializeApp(firebaseConfig) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const googleProvider = app ? new GoogleAuthProvider() : null as any;

if (hasConfig) {
  try {
    getAnalytics(app);
  } catch {
    // Analytics unavailable in this environment
  }
}
export { GoogleAuthProvider };
