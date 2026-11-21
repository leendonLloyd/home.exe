import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GameItemSheet from '../components/GameItemSheet';
import { GAMES_PAGE, KINDS, useGamesStore } from '../lib/gamesCloud';

const TABS = [
  { kind: 'question', label: 'Questions' },
  { kind: 'tiebreaker', label: 'Tiebreakers' },
  { kind: 'song', label: 'Songs' },
  { kind: 'prize', label: 'Prizes' },
];

const describe = (kind, item) => {
  if (kind === 'question') return { title: item.q, sub: `A ${item.a} · B ${item.b}`, tag: item.answer || 'not set' };
  if (kind === 'prize') return { title: item.name, sub: item.image ? 'Has a photo' : 'No photo', tag: `${item.tier} ×${item.quantity || 1}` };
  if (kind === 'tiebreaker') return { title: item.q, sub: item.answer || 'Answer not set', tag: '' };
  return { title: item.title, sub: [item.artist, item.youtube ? `clips ${[item.start || '0:00', item.start2, item.start3].filter(Boolean).join(' / ')} · ${item.length || 10}s` : 'no clip', item.note].filter(Boolean).join(' · '), tag: '' };
};

export default function Games() {
  const store = useGamesStore();
  const [kind, setKind] = useState('question');
  const [editing, setEditing] = useState(undefined);   // undefined: closed, null: adding, object: editing

  const list = store.lists[kind];
  const rounds = useMemo(() => [...new Set(store.lists.question.map((q) => q.round).filter(Boolean))], [store.lists.question]);
  const unset = store.lists.question.filter((q) => !q.answer).length;

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Wedding games</h1>
          <p className="muted">{store.ready ? `${store.lists.question.length} questions · ${store.lists.song.length} songs · ${store.lists.prize.length} prizes` : 'Loading…'}</p>
        </div>
        <a className="btn small" href={GAMES_PAGE} target="_blank" rel="noopener noreferrer">
          Open page
        </a>
      </header>

      <div className="sub-bar">
        <div className="segmented" role="tablist" aria-label="Game">
          {TABS.map((tab) => (
            <button key={tab.kind} type="button" role="tab" aria-selected={kind === tab.kind} className={kind === tab.kind ? 'seg active' : 'seg'} onClick={() => setKind(tab.kind)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="scroll">
        {store.error ? (
          <div className="flag warn">
            <strong>{store.error}</strong>{' '}
            <button type="button" className="btn small" onClick={store.dismissError}>
              Dismiss
            </button>
          </div>
        ) : null}

        {store.ready && !list.length ? (
          <div className="flag">
            <strong>Nothing saved here yet.</strong> The {kind === 'prize' ? 'raffle' : 'games'} page is showing its{' '}
            {kind === 'prize' ? 'raffle-prizes.json' : 'games.json'} copy. Start from that copy, then edit it here.
            <button type="button" className="btn primary block" onClick={() => store.seedFromJson(kind)}>
              Copy from {kind === 'prize' ? 'raffle-prizes.json' : 'games.json'}
            </button>
          </div>
        ) : null}

        {kind === 'prize' && list.length ? <p className="flag small">The raffle draws minor prizes first and the grand prize last; within a tier, in this order.</p> : null}

        {kind === 'question' && unset ? <p className="flag small">{unset} question{unset > 1 ? 's have' : ' has'} no answer set yet.</p> : null}

        <div className="stack-rows">
          {list.map((item, n) => {
            const row = describe(kind, item);
            const showRound = kind === 'question' && item.round !== list[n - 1]?.round;
            return (
              <Fragment key={item.id}>
                {showRound ? <p className="field-label">{item.round || 'No round'}</p> : null}
                <article
                  className="task-row"
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${row.title}`}
                  onClick={() => setEditing(item)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setEditing(item);
                  }}
                >
                  <span className="muted small nowrap">{n + 1}.</span>
                  <span className="task-text">
                    <span className="task-name">{row.title}</span>
                    {row.sub ? <span className="muted small">{row.sub}</span> : null}
                  </span>
                  {row.tag ? <span className="pill">{row.tag}</span> : null}
                  <button type="button" className="micro-btn" aria-label="Move up" disabled={n === 0} onClick={(event) => { event.stopPropagation(); store.move(kind, item.id, -1); }}>
                    ↑
                  </button>
                  <button type="button" className="micro-btn" aria-label="Move down" disabled={n === list.length - 1} onClick={(event) => { event.stopPropagation(); store.move(kind, item.id, 1); }}>
                    ↓
                  </button>
                </article>
              </Fragment>
            );
          })}
        </div>

        <p className="muted small">Changes show on the games and raffle pages the next time they load. If Firestore can't be reached, they fall back to their JSON files.</p>
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn primary" onClick={() => setEditing(null)}>
          + {KINDS[kind].label}
        </button>
      </nav>

      <GameItemSheet
        open={editing !== undefined}
        kind={kind}
        item={editing}
        rounds={rounds}
        onClose={() => setEditing(undefined)}
        onSave={(draft) => store.save(kind, draft)}
        onDelete={store.remove}
      />
    </div>
  );
}
