import { Link } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

/**
 * Wraps the screens whose data lives in Firestore. Sign-in is per device and
 * sticks, so this is a one-off on each phone rather than something seen daily.
 */
export default function CloudGate({ title, children }) {
  const { user, checking, error, signIn, dismissError } = useAuth();

  if (checking) {
    return (
      <div className="screen">
        <header className="app-bar">
          <Link to="/" className="icon-btn" aria-label="Back to hub">
            ←
          </Link>
          <div>
            <h1>{title}</h1>
            <p className="muted">Checking sign-in…</p>
          </div>
        </header>
        <main className="scroll">
          <p className="empty">One moment.</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="screen">
        <header className="app-bar">
          <Link to="/" className="icon-btn" aria-label="Back to hub">
            ←
          </Link>
          <div>
            <h1>{title}</h1>
            <p className="muted">Sign in to sync</p>
          </div>
        </header>
        <main className="scroll">
          {error ? (
            <div className="flag warn">
              <strong>{error}</strong>
              <button type="button" className="btn small" onClick={dismissError}>
                Dismiss
              </button>
            </div>
          ) : null}
          <div className="flag">
            <strong>This list is shared.</strong> Sign in with the Google account on the household list and it stays in
            step across both phones — counting on one shows up on the other.
          </div>
          <button type="button" className="btn primary block" onClick={signIn}>
            Continue with Google
          </button>
        </main>
      </div>
    );
  }

  return children;
}
