import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const useAuth = () => {
  const [user, setUser] = useState(() => auth.currentUser);
  const [checking, setChecking] = useState(() => !auth.currentUser);
  const [error, setError] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setChecking(false);
  }), []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Popups are blocked outright by some mobile browsers and by standalone
      // home-screen apps, where redirect is the only flow that works.
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setError(describe(redirectErr));
          return;
        }
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      setError(describe(err));
    }
  }, []);

  const leave = useCallback(() => signOut(auth), []);

  return { user, checking, error, signIn, signOut: leave, dismissError: () => setError(null) };
};

function describe(err) {
  if (err.code === 'auth/unauthorized-domain') {
    return 'This site is not on the project\'s authorised domains. Add it under Authentication → Settings → Authorized domains.';
  }
  if (err.code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled on the project. Turn it on under Authentication → Sign-in method.';
  }
  if (err.code === 'auth/network-request-failed') return 'Could not reach Firebase. Check the connection and try again.';
  return err.message || String(err);
}
