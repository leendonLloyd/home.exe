import Icon from './Icon';

export default function ItemCard({ item, pill, count, onBump, onOpenActions }) {
  return (
    <article
      className={count > 0 ? 'item active' : 'item'}
      role="button"
      tabIndex={0}
      aria-label={`Options for ${item.name}`}
      onClick={onOpenActions}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenActions();
      }}
    >
      <div className="item-head">
        <span className="item-icon">
          <Icon name={item.icon} size={20} />
        </span>
        <span className="item-text">
          <span className="item-name">{item.name}</span>
          <span className="pill" style={{ '--pill': pill?.color ?? '#6c7789' }}>
            {pill?.label ?? 'Unassigned'}
          </span>
        </span>
      </div>

      <div className="stepper" onClick={(event) => event.stopPropagation()} role="presentation">
        <button type="button" onClick={() => onBump(-1)} disabled={count === 0} aria-label={`Decrease ${item.name}`}>
          −
        </button>
        <span className="stepper-value">{count}</span>
        <button type="button" onClick={() => onBump(1)} aria-label={`Increase ${item.name}`}>
          +
        </button>
      </div>
    </article>
  );
}
