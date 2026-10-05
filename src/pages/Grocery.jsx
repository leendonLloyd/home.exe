import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GroceryCard from '../components/GroceryCard';
import GroceryItemSheet from '../components/GroceryItemSheet';
import GroceryTripsSheet from '../components/GroceryTripsSheet';
import SaveSheet from '../components/SaveSheet';
import { AISLES, GROCERY_PRESETS } from '../lib/groceryDefaults';
import { useGroceryStore } from '../lib/groceryCloud';

const FILTERS = [
  { id: 'needed', label: 'Needed' },
  { id: 'all', label: 'All items' },
];

export default function Grocery() {
  const store = useGroceryStore();
  const { items, want, got, trips } = store.state;

  const [filter, setFilter] = useState('needed');
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const sections = useMemo(() => {
    const visible = items.filter((item) => (filter === 'all' ? true : (want[item.id] ?? 0) > 0));
    return AISLES.map((aisle) => ({ ...aisle, entries: visible.filter((item) => item.aisle === aisle.id) }))
      .filter((section) => section.entries.length > 0);
  }, [items, want, filter]);

  const totals = useMemo(() => {
    const wanted = Object.entries(want);
    return {
      lines: wanted.length,
      units: wanted.reduce((sum, [, qty]) => sum + qty, 0),
      picked: wanted.filter(([itemId]) => got[itemId]).reduce((sum, [, qty]) => sum + qty, 0),
    };
  }, [want, got]);

  const left = totals.units - totals.picked;

  const lines = useMemo(() =>
    items.filter((item) => want[item.id] > 0).map((item) => ({
      itemId: item.id, name: item.name, ownerName: AISLES.find((a) => a.id === item.aisle)?.label ?? '', count: want[item.id],
    })), [items, want]);

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Groceries</h1>
          <p className="muted">
            {!store.ready ? 'Syncing…' : totals.lines === 0 ? 'Nothing on the list' : `${left} of ${totals.units} still to get`}
          </p>
        </div>
        <button type="button" className="btn small" onClick={() => setSheet('trips')}>
          Shops
        </button>
        <button type="button" className="btn primary small" disabled={totals.lines === 0} onClick={() => setSheet('save')}>
          Done
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

        {totals.lines > 0 ? (
          <div className="kpi-total">
            <div>
              <span className="kpi-total-value">{left}</span>
              <span className="kpi-total-label">still to get</span>
            </div>
            <div className="kpi-total-meta">
              <span>
                {totals.picked} of {totals.units} in the trolley
              </span>
              <span>
                {totals.lines} item{totals.lines === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ) : null}

        <div className="segmented" role="tablist" aria-label="Filter">
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

        {sections.map((section) => (
          <section className="group" key={section.id} style={{ '--tint': section.tint }}>
            <button
              type="button"
              className="group-head"
              aria-expanded={!collapsed[section.id]}
              onClick={() => toggleSection(section.id)}
            >
              <span className="dot" />
              <h2>{section.label}</h2>
              <span className="badge">
                {section.entries.reduce((sum, item) => sum + (want[item.id] ?? 0), 0)}
              </span>
              <span className={collapsed[section.id] ? 'caret' : 'caret open'} aria-hidden="true">
                ⌄
              </span>
            </button>
            {collapsed[section.id] ? null : (
              <div className="grid">
                {section.entries.map((item) => (
                  <GroceryCard
                    key={item.id}
                    item={item}
                    want={want[item.id] ?? 0}
                    got={Boolean(got[item.id])}
                    onBump={(delta) => store.bumpWant(item.id, delta)}
                    onToggleGot={(next) => store.toggleGot(item.id, next)}
                    onOpenActions={() => {
                      setEditing(item);
                      setSheet('item');
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {store.ready && items.length === 0 ? (
          <>
            <p className="empty">No items yet.</p>
            <button type="button" className="btn block" onClick={() => store.seedPresets(GROCERY_PRESETS)}>
              Start with {GROCERY_PRESETS.length} common items
            </button>
          </>
        ) : null}

        {store.ready && items.length > 0 && sections.length === 0 ? (
          <p className="empty">Nothing needed right now. Switch to All items to add something.</p>
        ) : null}

        {totals.lines > 0 ? (
          <button type="button" className="btn ghost block" onClick={store.clearList}>
            Clear the list
          </button>
        ) : null}
      </main>

      <nav className="tab-bar">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setEditing(null);
            setSheet('item');
          }}
        >
          + Item
        </button>
      </nav>

      <GroceryItemSheet
        open={sheet === 'item'}
        item={editing}
        onClose={() => {
          setSheet(null);
          setEditing(null);
        }}
        onSave={store.saveItem}
        onDelete={store.deleteItem}
      />

      <SaveSheet
        open={sheet === 'save'}
        total={totals.units}
        lines={lines}
        onClose={() => setSheet(null)}
        onSave={store.saveTrip}
      />

      <GroceryTripsSheet
        open={sheet === 'trips'}
        trips={trips}
        onClose={() => setSheet(null)}
        onDelete={store.deleteTrip}
        onRepeat={store.repeatTrip}
        onExport={store.exportState}
      />
    </div>
  );
}
