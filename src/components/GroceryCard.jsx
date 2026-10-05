import Icon from './Icon';

/**
 * Two states in one card: at home you set how many are wanted, in the shop you
 * tick it off. Ticking dims and strikes it so what is left stands out while
 * you walk — the whole card is the tick target, since the stepper already owns
 * its own taps.
 */
export default function GroceryCard({ item, want, got, onBump, onToggleGot, onOpenActions }) {
  return (
    <article className={got ? 'item grocery got' : 'item grocery'}>
      <button
        type="button"
        className="grocery-tick"
        aria-pressed={got}
        aria-label={`${got ? 'Untick' : 'Tick'} ${item.name}`}
        onClick={() => onToggleGot(!got)}
      >
        <span className={got ? 'task-check on' : 'task-check'}>{got ? '✓' : ''}</span>
        <span className="item-text">
          <span className="item-name">{item.name}</span>
        </span>
      </button>

      <div className="grocery-foot">
        <div className="stepper" onClick={(event) => event.stopPropagation()} role="presentation">
          <button type="button" onClick={() => onBump(-1)} disabled={want === 0} aria-label={`One fewer ${item.name}`}>
            −
          </button>
          <span className="stepper-value">{want}</span>
          <button type="button" onClick={() => onBump(1)} aria-label={`One more ${item.name}`}>
            +
          </button>
        </div>
        <button type="button" className="micro-btn" aria-label={`Options for ${item.name}`} onClick={onOpenActions}>
          <Icon name={item.icon} size={16} />
        </button>
      </div>
    </article>
  );
}
