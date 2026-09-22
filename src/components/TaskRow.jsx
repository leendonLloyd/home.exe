// The sheet strikes through completed rows; this mirrors that so the two
// read the same way side by side.
export default function TaskRow({ task, label, onToggle, onOpen }) {
  return (
    <article
      className={task.done ? 'task-row done' : 'task-row'}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${task.item}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
      }}
    >
      <button
        type="button"
        className={task.done ? 'task-check on' : 'task-check'}
        aria-label={`Mark ${task.item} ${task.done ? 'not done' : 'done'}`}
        aria-pressed={task.done}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {task.done ? '✓' : ''}
      </button>

      <span className="task-text">
        <span className="task-name">{label}</span>
        {task.person || task.dueText || task.notes ? (
          <span className="muted small">
            {[task.person, task.dueText, task.notes].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </span>

      {task.priority ? <span className="pill">{task.priority}</span> : null}
      {task.daysLeft ? <span className="muted small nowrap">{task.daysLeft}</span> : null}
    </article>
  );
}
