import { useEffect, useState } from 'react';
import Sheet from './Sheet';

const LOCAL_KEY = 'home.exe:laundry:v1';

const readLocal = () => {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Moves what this phone saved before the move to Firestore.
 *
 * Deliberately manual, and deliberately a replace. Both phones hold their own
 * copy, so uploading on sign-in would race and merge into duplicates; and a
 * merge of two independent histories has no sensible answer, so the import
 * says plainly that it overwrites and shows what it is about to send.
 */
export default function DeviceImportSheet({ open, cloud, onClose, onImport }) {
  const [local, setLocal] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLocal(readLocal());
    setConfirming(false);
    setDone(false);
  }, [open]);

  const has = local && (local.items?.length || local.sessions?.length || local.owners?.length);
  const cloudHas = cloud.items.length + cloud.sessions.length + cloud.owners.length;

  return (
    <Sheet open={open} title="Import this device" onClose={onClose}>
      {done ? (
        <p className="muted small">Imported. Both phones will show it once they refresh.</p>
      ) : !has ? (
        <p className="muted small">
          Nothing saved on this device to import — it has no laundry data from before the move to Firestore.
        </p>
      ) : (
        <>
          <p className="muted small">Saved on this device, before syncing:</p>
          <ul className="stack-list compact">
            <li>
              <span>Owners</span>
              <strong>{local.owners?.length ?? 0}</strong>
            </li>
            <li>
              <span>Clothing types</span>
              <strong>{local.items?.length ?? 0}</strong>
            </li>
            <li>
              <span>Saved bulks</span>
              <strong>{local.sessions?.length ?? 0}</strong>
            </li>
          </ul>

          {cloudHas > 0 ? (
            <div className="flag warn">
              <strong>This replaces what is synced.</strong> There are already {cloud.owners.length} owners,{' '}
              {cloud.items.length} types and {cloud.sessions.length} bulks shared. Importing overwrites all of it —
              including anything the other phone added.
            </div>
          ) : (
            <p className="muted small">Nothing is synced yet, so this will be the starting point for both phones.</p>
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
