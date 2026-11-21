import { useEffect, useState } from 'react';
import { KINDS, TIERS } from '../lib/gamesCloud';
import Sheet from './Sheet';

const EMPTY = {
  question: { round: '', q: '', a: '', b: '', answer: '' },
  tiebreaker: { q: '', answer: '' },
  song: { title: '', artist: '', note: '' },
  prize: { name: '', tier: 'minor', quantity: 1, image: '' },
};

export default function GameItemSheet({ open, kind, item, rounds, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(EMPTY.question);

  useEffect(() => {
    if (open) setDraft(item ? { ...EMPTY[kind], ...item } : { ...EMPTY[kind], round: rounds[rounds.length - 1] ?? '' });
  }, [open, kind, item, rounds]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));
  const field = (key, label, placeholder) => (
    <>
      <label className="field-label" htmlFor={`game-${key}`}>{label}</label>
      <input id={`game-${key}`} value={draft[key] ?? ''} placeholder={placeholder} onChange={(event) => patch({ [key]: event.target.value })} />
    </>
  );

  const quantity = parseInt(draft.quantity, 10);
  const canSubmit = kind === 'prize' ? Boolean(draft.name?.trim()) && quantity >= 1 : kind === 'song' ? Boolean(draft.title?.trim()) : Boolean(draft.q?.trim()) && (kind !== 'question' || (draft.a?.trim() && draft.b?.trim()));
  const submit = () => {
    if (!canSubmit) return;
    const clean = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    onSave(kind === 'prize' ? { ...clean, quantity } : clean);
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={`${item ? 'Edit' : 'Add'} ${KINDS[kind].label.toLowerCase()}`}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={submit} disabled={!canSubmit}>
          {item ? 'Save changes' : `Add ${KINDS[kind].label.toLowerCase()}`}
        </button>
      }
    >
      {kind === 'question' ? (
        <>
          <label className="field-label">Round</label>
          <div className="chip-wrap">
            {rounds.map((round) => (
              <button key={round} type="button" className={draft.round === round ? 'chip active' : 'chip'} onClick={() => patch({ round })}>
                {round}
              </button>
            ))}
          </div>
          <input aria-label="Round name" value={draft.round} placeholder="or type a new round" onChange={(event) => patch({ round: event.target.value })} />
          {field('q', 'Question', 'Who said "I love you" first?')}
          {field('a', 'A · hands on head', 'Shira')}
          {field('b', 'B · hands on hips', 'Leendon')}
          <label className="field-label">Answer</label>
          <div className="segmented" role="radiogroup" aria-label="Answer">
            {[['A', 'A'], ['B', 'B'], ['', 'Not set']].map(([value, label]) => (
              <button key={label} type="button" role="radio" aria-checked={draft.answer === value} className={draft.answer === value ? 'seg active' : 'seg'} onClick={() => patch({ answer: value })}>
                {label}
              </button>
            ))}
          </div>
          <p className="muted small">Not set: the LED slide highlights neither option, so you can reveal it out loud.</p>
        </>
      ) : null}

      {kind === 'tiebreaker' ? (
        <>
          {field('q', 'Question', 'How many days have we been together?')}
          {field('answer', 'Answer', 'Closest number wins')}
        </>
      ) : null}

      {kind === 'song' ? (
        <>
          {field('title', 'Title', 'Song title')}
          {field('artist', 'Artist', 'Artist')}
          {field('note', 'Note for the band or tech', 'e.g. play the first 10 seconds')}
        </>
      ) : null}

      {kind === 'prize' ? (
        <>
          {field('name', 'Prize', 'Kuchenluxe 17-inch Electric Griller')}
          <label className="field-label">Tier</label>
          <div className="segmented" role="radiogroup" aria-label="Tier">
            {TIERS.map((tier) => (
              <button key={tier} type="button" role="radio" aria-checked={draft.tier === tier} className={draft.tier === tier ? 'seg active' : 'seg'} onClick={() => patch({ tier })}>
                {tier}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="game-quantity">How many to give away</label>
          <input id="game-quantity" type="number" inputMode="numeric" min="1" value={draft.quantity} onChange={(event) => patch({ quantity: event.target.value })} />
          {field('image', 'Photo (optional)', 'https://… or images/prizes/griller.png')}
          <p className="muted small">A link to a photo, or a path to one in the wedding site's repo. It shows on the raffle wheel and the winner screen.</p>
        </>
      ) : null}

      {item ? (
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            onDelete(item.id);
            onClose();
          }}
        >
          Delete {KINDS[kind].label.toLowerCase()}
        </button>
      ) : null}
    </Sheet>
  );
}
