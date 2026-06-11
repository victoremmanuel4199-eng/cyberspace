
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCEuEVepyZu1VjXk5-cnS_g4pvadk78rak",
  authDomain: "cyberspace-98ab7.firebaseapp.com",
  projectId: "cyberspace-98ab7",
  storageBucket: "cyberspace-98ab7.firebasestorage.app",
  messagingSenderId: "459007082080",
  appId: "1:459007082080:web:89e502e25283ee22168d05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Firebase Firestore & Cloud Storage are disabled per user requirements ("Do not use firestore or storage yet")
// We export undefined/null values so imports in other files don't fail compilation
export const db: any = undefined;
export const storage: any = undefined;
