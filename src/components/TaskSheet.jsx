import { useEffect, useState } from 'react';
import { joinItem, splitItem } from '../lib/todoCategories';
import Sheet from './Sheet';

const emptyDraft = (category) => ({
  category: category ?? '',
  name: '',
  person: '',
  due: '',
  priority: '',
  notes: '',
});

export default function TaskSheet({ open, task, categories, priorityOptions, presetCategory, busy, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => emptyDraft(presetCategory));

  useEffect(() => {
    if (!open) return;
    if (task) {
      const { category, name } = splitItem(task.item);
      setDraft({ category, name, person: task.person, due: task.due, priority: task.priority, notes: task.notes });
    } else {
      setDraft(emptyDraft(presetCategory));
    }
  }, [open, task, presetCategory]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));
  const canSubmit = Boolean(draft.name.trim());

  const submit = () => {
    if (!canSubmit) return;
    onSave({
      item: joinItem(draft.category, draft.name),
      person: draft.person,
      due: draft.due,
      priority: draft.priority,
      notes: draft.notes,
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={task ? 'Edit task' : 'Add task'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!canSubmit || busy} onClick={submit}>
          {busy ? 'Saving…' : task ? 'Save changes' : 'Add task'}
        </button>
      }
    >
      <label className="field-label">Group</label>
      <div className="chip-wrap">
        <button type="button" className={draft.category === '' ? 'chip active' : 'chip'} onClick={() => patch({ category: '' })}>
          None
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={draft.category === category ? 'chip active' : 'chip'}
            onClick={() => patch({ category })}
          >
            {category}
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="task-name">
        Task
      </label>
      <input
        id="task-name"
        value={draft.name}
        onChange={(event) => patch({ name: event.target.value })}
        placeholder="e.g. PRIMARY CANDLE"
      />
      <p className="muted small">Saved to the sheet as “{joinItem(draft.category, draft.name) || '…'}”.</p>

      <label className="field-label" htmlFor="task-person">
        Person in charge
      </label>
      <input id="task-person" value={draft.person} onChange={(event) => patch({ person: event.target.value })} placeholder="Optional" />

      <label className="field-label" htmlFor="task-due">
        Due date
      </label>
      <input id="task-due" type="date" value={draft.due} onChange={(event) => patch({ due: event.target.value })} />

      {priorityOptions.length > 0 ? (
        <>
          <label className="field-label">Priority</label>
          <div className="chip-wrap">
            <button type="button" className={draft.priority === '' ? 'chip active' : 'chip'} onClick={() => patch({ priority: '' })}>
              None
            </button>
            {priorityOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={draft.priority === option ? 'chip active' : 'chip'}
                onClick={() => patch({ priority: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <label className="field-label" htmlFor="task-notes">
        Notes
      </label>
      <input id="task-notes" value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Optional" />

      {task ? (
        <button type="button" className="btn danger block" disabled={busy} onClick={() => { onDelete(task); onClose(); }}>
          Delete from sheet
        </button>
      ) : null}
    </Sheet>
  );
}
