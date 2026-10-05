import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Safe to commit. A Firebase web config is public by design — it identifies the
// project, it does not grant anything. firebase/firestore.rules is what decides
// who may read and write, and it names two Google accounts.
//
// Analytics is deliberately not initialised: it adds weight and a cookie banner
// question for two people using a household app.
const firebaseConfig = {
  apiKey: 'AIzaSyAmKq2v_kEWJpWQ7riKIAhX93fYQIYiQMg',
  authDomain: 'home-exe.firebaseapp.com',
  projectId: 'home-exe',
  storageBucket: 'home-exe.firebasestorage.app',
  messagingSenderId: '905148454425',
  appId: '1:905148454425:web:8aa3273f0505772c31bc88',
};

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
