import { useEffect, useState } from 'react';
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
      title="Connect the sheet"
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
          {current ? 'Save URL' : 'Connect'}
        </button>
      }
    >
      <p className="muted small">
        Deploy <code>apps-script/TodoList.gs</code> on the planner sheet as a Web app — execute as <strong>Me</strong>,
        access <strong>Anyone</strong> — then paste the <code>/exec</code> URL here.
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
        The URL stays on this device only — it is never committed with the site. Anyone holding it can read and edit the
        sheet, so treat it like a password and paste it on each device separately.
      </p>

      {current ? (
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            onDisconnect();
            onClose();
          }}
        >
          Disconnect this device
        </button>
      ) : null}
    </Sheet>
  );
}
