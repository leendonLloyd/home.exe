import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HistorySheet from '../components/HistorySheet';
import ItemCard from '../components/ItemCard';
import ItemSheet from '../components/ItemSheet';
import KpiStrip from '../components/KpiStrip';
import OwnerSheet from '../components/OwnerSheet';
import SaveSheet from '../components/SaveSheet';
import Sheet from '../components/Sheet';
import { COLOR_TYPES } from '../lib/defaults';
import { useLaundryStore } from '../lib/store';

export default function Laundry() {
  const store = useLaundryStore();
  const { owners, items, counts, sessions } = store.state;

  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (colorId) => setCollapsed((prev) => ({ ...prev, [colorId]: !prev[colorId] }));

  const countOf = (itemId) => counts[itemId] ?? 0;

  const derived = useMemo(() => {
    const ownerById = Object.fromEntries(owners.map((owner) => [owner.id, owner]));
    const lines = items
      .filter((item) => (counts[item.id] ?? 0) > 0)
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        ownerName: ownerById[item.ownerId]?.name ?? 'Unassigned',
        count: counts[item.id],
      }));

    const total = lines.reduce((sum, line) => sum + line.count, 0);

    const sumBy = (keyFn) => {
      const map = new Map();
      items.forEach((item) => {
        const value = counts[item.id] ?? 0;
        if (!value) return;
        const key = keyFn(item);
        map.set(key, (map.get(key) ?? 0) + value);
      });
      return map;
    };

    const byColor = sumBy((item) => item.colorType);
    const byOwner = sumBy((item) => item.ownerId);
    const byType = sumBy((item) => item.name);

    return {
      ownerById,
      lines,
      total,
      pieces: { types: new Set(items.map((item) => item.name)).size, owners: owners.length },
      breakdowns: {
        color: COLOR_TYPES.filter((color) => byColor.get(color.id)).map((color) => ({
          key: color.id,
          label: color.label,
          value: byColor.get(color.id),
          tint: color.tint,
        })),
        owner: owners
          .filter((owner) => byOwner.get(owner.id))
          .map((owner) => ({ key: owner.id, label: owner.name, value: byOwner.get(owner.id), tint: owner.color })),
        type: [...byType.entries()].map(([name, value]) => ({ key: name, label: name, value, tint: '#8fd0f0' })),
      },
    };
  }, [owners, items, counts]);

  const sections = COLOR_TYPES.map((color) => ({
    ...color,
    entries: items.filter((item) => item.colorType === color.id),
  })).filter((section) => section.entries.length > 0);

  const openItemSheet = (item) => {
    setEditing(item);
    setSheet('item');
  };

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Laundry</h1>
          <p className="muted">{sessions.length} saved bulks</p>
        </div>
        <button type="button" className="btn primary small" onClick={() => setSheet('save')} disabled={derived.total === 0}>
          Save
        </button>
      </header>

      <main className="scroll">
        <KpiStrip total={derived.total} pieces={derived.pieces} breakdowns={derived.breakdowns} />

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
              <span className="badge">{section.entries.reduce((sum, item) => sum + countOf(item.id), 0)}</span>
              <span className={collapsed[section.id] ? 'caret' : 'caret open'} aria-hidden="true">
                ⌄
              </span>
            </button>
            {collapsed[section.id] ? null : (
              <div className="grid">
                {section.entries.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    owner={derived.ownerById[item.ownerId]}
                    count={countOf(item.id)}
                    onBump={(delta) => store.bumpCount(item.id, delta)}
                    onOpenActions={() => {
                      setEditing(item);
                      setSheet('actions');
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {sections.length === 0 ? <p className="empty">No clothing types yet. Add one below.</p> : null}

        {derived.total > 0 ? (
          <button type="button" className="btn ghost block" onClick={store.resetCounts}>
            Clear counts
          </button>
        ) : null}
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn" onClick={() => setSheet('owner')}>
          + Owner
        </button>
        <button type="button" className="btn primary" onClick={() => openItemSheet(null)}>
          + Item
        </button>
        <button type="button" className="btn" onClick={() => setSheet('history')}>
          History
        </button>
      </nav>

      <OwnerSheet
        open={sheet === 'owner'}
        owners={owners}
        onClose={() => setSheet(null)}
        onAdd={store.addOwner}
        onDelete={store.deleteOwner}
      />

      <ItemSheet
        open={sheet === 'item'}
        owners={owners}
        item={editing}
        onClose={() => setSheet(null)}
        onSave={store.saveItem}
      />

      <Sheet open={sheet === 'actions'} title={editing ? editing.name : 'Item'} onClose={() => setSheet(null)}>
        <button type="button" className="btn block" onClick={() => setSheet('item')}>
          Edit item
        </button>
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            store.deleteItem(editing.id);
            setSheet(null);
            setEditing(null);
          }}
        >
          Delete item
        </button>
      </Sheet>

      <SaveSheet
        open={sheet === 'save'}
        total={derived.total}
        lines={derived.lines}
        onClose={() => setSheet(null)}
        onSave={store.saveSession}
      />

      <HistorySheet
        open={sheet === 'history'}
        sessions={sessions}
        onClose={() => setSheet(null)}
        onDelete={store.deleteSession}
        onExport={store.exportState}
        onImport={store.importState}
      />
    </div>
  );
}
