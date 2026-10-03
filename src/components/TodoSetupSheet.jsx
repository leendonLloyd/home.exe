import { useEffect, useState } from 'react';
import { DEFAULT_EXEC_URL } from '../lib/sheetConfig';
import { looksLikeExecUrl } from '../lib/todoApi';
import Sheet from './Sheet';

export default function TodoSetupSheet({ open, current, build, onClose, onConnect, onDisconnect }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (open) setUrl(current || '');
  }, [open, current]);

  const trimmed = url.trim();
  const odd = trimmed !== '' && !looksLikeExecUrl(trimmed);

  return (
    <Sheet
      open={open}
      title="Sheet connection"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={!trimmed}
          onClick={() => {
            onConnect(trimmed);
            onClose();
          }}
        >
          {trimmed === DEFAULT_EXEC_URL ? 'Use the built-in URL' : 'Use this URL'}
        </button>
      }
    >
      <p className="muted small">
        A deployment URL ships with the app, so this only needs changing to point at a different one — testing a new
        deployment before it is committed, say.
      </p>

      <label className="field-label" htmlFor="todo-url">
        Web app URL
      </label>
      <input
        id="todo-url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://script.google.com/macros/s/…/exec"
        autoComplete="off"
        spellCheck={false}
      />
      {odd ? <p className="muted small warm">That doesn&apos;t look like an /exec URL. Saving it anyway is fine if you know better.</p> : null}

      {current ? (
        <p className="muted small">
          Connected deployment reports build <strong>{build || '(none — predates build stamping, so it is out of date)'}</strong>.
          If that isn&apos;t the build in <code>apps-script/TodoList.gs</code>, the deployment is serving older code.
        </p>
      ) : null}

      <p className="muted small">
        Anyone holding this URL can read and edit the planner sheet — the deployment is open to anyone with the link.
      </p>

      {current ? (
        <button
          type="button"
          className="btn block"
          onClick={() => {
            onDisconnect();
            onClose();
          }}
        >
          Reset to the built-in URL
        </button>
      ) : null}
    </Sheet>
  );
}
