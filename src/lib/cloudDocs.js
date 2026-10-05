import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { HOUSEHOLD, db } from './firebase';

// Firestore paths alternate collection and document, so each app gets one
// collection under the household document and keeps its data as named docs
// inside it. A single listener then covers a whole app, and a document per
// record is what lets two phones write different records without colliding.
export const colRef = (app) => collection(db, 'households', HOUSEHOLD, app);
export const docRef = (app, id) => doc(db, 'households', HOUSEHOLD, app, id);

const explain = (err) =>
  err.code === 'permission-denied'
    ? 'Firestore refused the request. Check the rules are published and list this Google account.'
    : err.message || String(err);

/**
 * Live contents of one app's collection, keyed by document id.
 *
 * `docs` is null until the first snapshot lands, which is how callers tell
 * "still loading" from "genuinely empty" — the difference between showing a
 * spinner and telling someone their list is empty when it isn't.
 */
export function useCloudDocs(app) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => onSnapshot(
    colRef(app),
    (snap) => {
      const next = {};
      snap.forEach((d) => { next[d.id] = d.data(); });
      setDocs(next);
      setError(null);
    },
    (err) => setError(explain(err))
  ), [app]);

  return { docs, ready: docs !== null, error, setError, report: (err) => setError(explain(err)) };
}
