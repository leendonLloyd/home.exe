import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TaskRow from '../components/TaskRow';
import TaskSheet from '../components/TaskSheet';
import TodoSetupSheet from '../components/TodoSetupSheet';
import { categoriesOf, groupTasks } from '../lib/todoCategories';
import { useTodoStore } from '../lib/todoStore';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
];

const SUMMARY_ORDER = ['Total Tasks', 'Completed Tasks', 'Pending Tasks', 'Overdue Tasks'];

export default function Todo() {
  const store = useTodoStore();
  const { tasks, summary, priorityOptions } = store.data;

  const [filter, setFilter] = useState('open');
  // Tracks what's open rather than what's closed, so groups that arrive with
  // a later sync default to collapsed instead of springing open.
  const [expanded, setExpanded] = useState({});
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null);
  const [presetCategory, setPresetCategory] = useState('');

  const toggleSection = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const visible = useMemo(
    () => tasks.filter((task) => (filter === 'all' ? true : filter === 'done' ? task.done : !task.done)),
    [tasks, filter]
  );

  const groups = useMemo(() => groupTasks(visible), [visible]);
  const categories = useMemo(() => categoriesOf(tasks), [tasks]);
  const doneCount = tasks.filter((task) => task.done).length;

  const openAdd = (category) => {
    setPresetCategory(category ?? '');
    setEditing(null);
    setSheet('task');
  };

  if (!store.url) {
    return (
      <div className="screen">
        <header className="app-bar">
          <Link to="/" className="icon-btn" aria-label="Back to hub">
            ←
          </Link>
          <div>
            <h1>To Do</h1>
            <p className="muted">Not connected</p>
          </div>
        </header>

        <main className="scroll">
          <div className="flag">
            <strong>Connect the planner sheet.</strong> Deploy the Apps Script in <code>apps-script/</code> as a Web app,
            then paste its <code>/exec</code> URL. It stays on this device.
          </div>
          <button type="button" className="btn primary block" onClick={() => setSheet('setup')}>
            Connect
          </button>
        </main>

        <TodoSetupSheet
          open={sheet === 'setup'}
          current={store.url}
          onClose={() => setSheet(null)}
          onConnect={store.connect}
          onDisconnect={store.disconnect}
        />
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>To Do</h1>
          <p className="muted">
            {store.loading ? 'Syncing…' : `${doneCount} of ${tasks.length} done`}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={() => store.refresh()} disabled={store.loading} aria-label="Reload from sheet">
          ↻
        </button>
        <button type="button" className="btn small" onClick={() => setSheet('setup')}>
          Sheet
        </button>
      </header>

      <main className="scroll">
        {store.error ? (
          <div className="flag warn">
            <strong>{store.error}</strong>
            <button type="button" className="btn small" onClick={store.dismissError}>
              Dismiss
            </button>
          </div>
        ) : null}

        {SUMMARY_ORDER.some((key) => summary[key] != null) ? (
          <div className="kpi-panel summary">
            {SUMMARY_ORDER.filter((key) => summary[key] != null).map((key) => (
              <div className="kpi-col" key={key}>
                <span className="kpi-col-label">{key.replace(' Tasks', '')}</span>
                <span className="kpi-total-value">{summary[key]}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="segmented" role="tablist" aria-label="Filter tasks">
          {FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={filter === entry.id}
              className={filter === entry.id ? 'seg active' : 'seg'}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {groups.map((group) => (
          <section className="group" key={group.key} style={{ '--tint': 'var(--accent)' }}>
            <button
              type="button"
              className="group-head"
              aria-expanded={Boolean(expanded[group.key])}
              onClick={() => toggleSection(group.key)}
            >
              <span className="dot" />
              <h2>{group.key}</h2>
              <span className="badge">{group.entries.length}</span>
              <span className={expanded[group.key] ? 'caret open' : 'caret'} aria-hidden="true">
                ⌄
              </span>
            </button>

            {expanded[group.key] ? (
              <div className="stack-rows">
                {group.entries.map(({ task, label }) => (
                  <TaskRow
                    key={task.row}
                    task={task}
                    label={label}
                    onToggle={() => store.toggleDone(task)}
                    onOpen={() => {
                      setEditing(task);
                      setSheet('task');
                    }}
                  />
                ))}
                <button type="button" className="btn ghost block" onClick={() => openAdd(group.key === 'Other' ? '' : group.key)}>
                  + Add to {group.key}
                </button>
              </div>
            ) : null}
          </section>
        ))}

        {groups.length === 0 ? (
          <p className="empty">
            {store.loading ? 'Loading from the sheet…' : filter === 'open' ? 'Nothing open. Everything is ticked off.' : 'No tasks here.'}
          </p>
        ) : null}
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn primary" onClick={() => openAdd('')} disabled={store.busy}>
          + Task
        </button>
      </nav>

      <TaskSheet
        open={sheet === 'task'}
        task={editing}
        categories={categories}
        priorityOptions={priorityOptions}
        presetCategory={presetCategory}
        busy={store.busy}
        onClose={() => {
          setSheet(null);
          setEditing(null);
        }}
        onSave={(fields) => (editing ? store.updateTask(editing, fields) : store.addTask(fields))}
        onDelete={store.removeTask}
      />

      <TodoSetupSheet
        open={sheet === 'setup'}
        current={store.url}
        onClose={() => setSheet(null)}
        onConnect={store.connect}
        onDisconnect={store.disconnect}
      />
    </div>
  );
}
