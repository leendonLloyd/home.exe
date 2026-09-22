import Icon from './Icon';

// Same shape as ItemCard, but the number counts down: it starts at what was
// sent and you deduct as each piece turns up, so zero means accounted for.
export default function CheckCard({ line, pill, remaining, locked, onBump }) {
  const done = remaining === 0;

  return (
    <article className={`item check${done ? ' done' : ''}${!done && locked ? ' short' : ''}`}>
      <div className="item-head">
        <span className="item-icon">
          <Icon name={line.icon} size={20} />
        </span>
        <span className="item-text">
          <span className="item-name">{line.name}</span>
          <span className="pill" style={{ '--pill': pill?.color ?? '#6c7789' }}>
            {pill?.label ?? 'Unassigned'}
          </span>
        </span>
      </div>

      <div className="stepper">
        <button type="button" onClick={() => onBump(1)} disabled={done} aria-label={`Found one ${line.name}`}>
          −
        </button>
        <span className="stepper-value">
          {remaining}
          <small>of {line.count}</small>
        </span>
        <button
          type="button"
          onClick={() => onBump(-1)}
          disabled={remaining === line.count}
          aria-label={`Undo one ${line.name}`}
        >
          +
        </button>
      </div>
    </article>
  );
}
