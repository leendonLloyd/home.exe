import { Component } from 'react';

const RELOAD_FLAG = 'home.exe:chunk-reload';

// Every deploy gives the chunks new content-hashed names and GitHub Pages only
// serves the newest build, so a tab holding the previous index.html — or a
// phone waking a backgrounded app — asks for a file that is no longer there.
// The wording differs per browser, hence matching several.
export function isStaleChunkError(error) {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|unable to preload|chunkloaderror/i.test(text);
}

/**
 * Without this, a rejected dynamic import unmounts the whole tree and leaves a
 * blank page with nothing to act on. A stale chunk is fixed by reloading, so
 * that happens automatically — but only once per session, because a reload
 * loop is worse than the blank page it replaces.
 */
export default class RouteBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { error, reloading: isStaleChunkError(error) && !alreadyReloaded() };
  }

  componentDidCatch(error) {
    if (!isStaleChunkError(error) || alreadyReloaded()) return;
    markReloaded();
    window.location.reload();
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;

    if (reloading) {
      return (
        <div className="screen">
          <main className="scroll">
            <p className="empty">Updating to the latest version…</p>
          </main>
        </div>
      );
    }

    return (
      <div className="screen">
        <header className="app-bar">
          <div>
            <h1>Something broke</h1>
            <p className="muted">This screen failed to load</p>
          </div>
        </header>
        <main className="scroll">
          <div className="flag warn">
            <strong>{isStaleChunkError(error) ? 'Could not fetch part of the app.' : error.message || String(error)}</strong>
            {isStaleChunkError(error) ? ' Reloading did not help, so it is probably the connection rather than an update.' : ''}
          </div>
          <button
            type="button"
            className="btn primary block"
            onClick={() => {
              clearReloaded();
              window.location.reload();
            }}
          >
            Reload
          </button>
          <a className="btn block" href="#/" onClick={() => this.setState({ error: null })}>
            Back to the hub
          </a>
        </main>
      </div>
    );
  }
}

// sessionStorage, not local: a genuinely broken deploy should stop looping now,
// but a new tab tomorrow deserves its own attempt.
function alreadyReloaded() {
  try {
    return window.sessionStorage.getItem(RELOAD_FLAG) === '1';
  } catch {
    return false;
  }
}

function markReloaded() {
  try {
    window.sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    /* private browsing; the worst case is no automatic reload */
  }
}

function clearReloaded() {
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* nothing to clear */
  }
}
