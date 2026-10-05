import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Supplied at build time from GitHub repository variables, and from .env.local
// when running locally. See .env.example for the names.
//
// Worth being clear about what this does and doesn't buy: a Firebase web config
// is public by design, and Vite inlines these into the bundle, which GitHub
// Pages then serves publicly — so the values are readable by anyone who opens
// the deployed site either way. firebase/firestore.rules is what actually gates
// the data. Keeping them out of the repo is about config hygiene, not secrecy.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// A build with these unset would otherwise fail much later, deep in an auth
// call, saying nothing about the cause.
export const MISSING_CONFIG = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (c) => '_' + c).toUpperCase()}`);

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Stay signed in across app launches; being asked to sign in every time you
// open the laundry counter would make it useless on a phone.
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* private browsing blocks it; the session still works until the tab closes */
});

// Everything the two of them share lives under one household document rather
// than being keyed per user, because this is one set of data two people edit.
export const HOUSEHOLD = 'home';
