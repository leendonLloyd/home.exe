import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { COLOR_TYPES } from '../lib/defaults';
import { useLaundryStore } from '../lib/store';

export default function LaundrySummary() {
  const { state } = useLaundryStore();
  const { owners, items, counts } = state;
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (sectionId) => setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const { sections, byType, total } = useMemo(() => {
    const ownerById = Object.fromEntries(owners.map((owner) => [owner.id, owner]));
    const counted = items
      .map((item) => ({ ...item, count: counts[item.id] ?? 0, owner: ownerById[item.ownerId] }))
      .filter((item) => item.count > 0);

    const typeTotals = new Map();
    counted.forEach((item) => {
      const entry = typeTotals.get(item.name) ?? { name: item.name, icon: item.icon, count: 0 };
      entry.count += item.count;
      typeTotals.set(item.name, entry);
    });

    return {
      sections: COLOR_TYPES.map((color) => ({
        ...color,
        entries: counted.filter((item) => item.colorType === color.id),
      })).filter((section) => section.entries.length > 0),
      byType: [...typeTotals.values()].sort((a, b) => b.count - a.count),
      total: counted.reduce((sum, item) => sum + item.count, 0),
    };
  }, [owners, items, counts]);

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/laundry" className="icon-btn" aria-label="Back to counter">
          ←
        </Link>
        <div>
          <h1>Summary</h1>
          <p className="muted">{total} pieces to send</p>
        </div>
      </header>

      <main className="scroll">
        {total === 0 ? <p className="empty">Nothing counted yet.</p> : null}

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
              <span className="badge">{section.entries.reduce((sum, item) => sum + item.count, 0)}</span>
              <span className={collapsed[section.id] ? 'caret' : 'caret open'} aria-hidden="true">
                ⌄
              </span>
            </button>
            {collapsed[section.id] ? null : (
              <ul className="stack-list">
                {section.entries.map((item) => (
                  <li key={item.id}>
                    <span className="summary-label">
                      <Icon name={item.icon} size={16} />
                      {item.name}
                    </span>
                    <span className="pill" style={{ '--pill': item.owner ? item.owner.color : '#7a8598' }}>
                      {item.owner ? item.owner.name : 'Unassigned'}
                    </span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {byType.length > 0 ? (
          <section className="group" style={{ '--tint': 'var(--accent)' }}>
            <button
              type="button"
              className="group-head"
              aria-expanded={!collapsed.byType}
              onClick={() => toggleSection('byType')}
            >
              <span className="dot" />
              <h2>All clothing types</h2>
              <span className="badge">{total}</span>
              <span className={collapsed.byType ? 'caret' : 'caret open'} aria-hidden="true">
                ⌄
              </span>
            </button>
            {collapsed.byType ? null : (
              <ul className="stack-list">
                {byType.map((entry) => (
                  <li key={entry.name}>
                    <span className="summary-label">
                      <Icon name={entry.icon} size={16} />
                      {entry.name}
                    </span>
                    <strong>{entry.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
