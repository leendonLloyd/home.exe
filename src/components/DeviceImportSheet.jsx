import { useEffect, useState } from 'react';
import Sheet from './Sheet';

const readLocal = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Moves what this phone saved before the app moved to Firestore.
 *
 * Deliberately manual, and deliberately a replace. Both phones hold their own
 * copy, so uploading on sign-in would race and merge into duplicates; and a
 * merge of two independent histories has no sensible answer, so the import
 * says plainly that it overwrites and shows what it is about to send.
 *
 * `counts` turns each side's state into labelled totals, which is all this
 * needs to know about the shape of any particular app's data.
 */
export default function DeviceImportSheet({ open, storageKey, counts, cloudState, onClose, onImport }) {
  const [local, setLocal] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLocal(readLocal(storageKey));
    setConfirming(false);
    setDone(false);
  }, [open, storageKey]);

  const localRows = local ? counts(local) : [];
  const cloudRows = counts(cloudState);
  const hasLocal = localRows.some((row) => row.value > 0);
  const hasCloud = cloudRows.some((row) => row.value > 0);

  return (
    <Sheet open={open} title="Import this device" onClose={onClose}>
      {done ? (
        <p className="muted small">Imported. The other phone will show it once it refreshes.</p>
      ) : !hasLocal ? (
        <p className="muted small">
          Nothing saved on this device to import — it holds no data from before the move to Firestore.
        </p>
      ) : (
        <>
          <p className="muted small">Saved on this device, before syncing:</p>
          <ul className="stack-list compact">
            {localRows.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>

          {hasCloud ? (
            <div className="flag warn">
              <strong>This replaces what is synced.</strong>{' '}
              {cloudRows.filter((row) => row.value > 0).map((row) => `${row.value} ${row.label.toLowerCase()}`).join(', ')}{' '}
              already shared. Importing overwrites all of it — including anything the other phone added.
            </div>
          ) : (
            <p className="muted small">Nothing is synced yet, so this becomes the starting point for both phones.</p>
          )}

          {confirming ? (
            <div className="row-form">
              <button type="button" className="btn block" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger block"
                onClick={async () => {
                  await onImport(local);
                  setDone(true);
                }}
              >
                Replace and import
              </button>
            </div>
          ) : (
            <button type="button" className="btn primary block" onClick={() => setConfirming(true)}>
              Import to the shared list
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
