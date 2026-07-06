import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDMBE4t2Kq7qaE3cS_8sUAwyaW68tjkQZY",
  authDomain: "bervos-official-5df71.firebaseapp.com",
  projectId: "bervos-official",
  storageBucket: "bervos-official.firebasestorage.app",
  messagingSenderId: "945077155937",
  appId: "1:945077155937:web:4bb4a18d0ca99a8bb4d220",
  measurementId: "G-FBRFK6N3G8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export { GoogleAuthProvider };
