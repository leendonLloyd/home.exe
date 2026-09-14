import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { RACK, bounds, loadLabel } from '../lib/workoutPlans';

export default function SetSheet({ open, target, onClose, onSave, onClear }) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (!open || !target) return;
    const [, top] = bounds(target.reps);
    setReps(String(target.current?.reps ?? top));
    const planned = target.load ? target.load.kg : '';
    setWeight(String(target.current?.weight ?? planned));
  }, [open, target]);

  if (!target) return null;

  const [low, top] = bounds(target.reps);
  const step = top - low > 9 ? 3 : 1;
  const quick = [];
  for (let value = low; value <= top; value += step) quick.push(value);

  const bump = (delta) => setReps((prev) => String(Math.max(0, (Number(prev) || 0) + delta)));

  const commit = () => {
    const value = parseInt(reps, 10);
    const kg = parseFloat(weight);
    onSave(Number.isNaN(value) || value <= 0 ? null : { reps: value, weight: Number.isNaN(kg) ? null : kg });
  };

  return (
    <Sheet
      open={open}
      title={`Set ${target.setNo} of ${target.sets}`}
      onClose={onClose}
      footer={
        <div className="row-form">
          <button type="button" className="btn block" onClick={onClear}>
            Clear set
          </button>
          <button type="button" className="btn primary block" onClick={commit}>
            Save set
          </button>
        </div>
      }
    >
      <div>
        <p className="ex-name">{target.name}</p>
        <p className="muted small">
          Target {target.reps} · plan says {loadLabel(target.load)}
        </p>
      </div>

      <span className="field-label">Reps</span>
      <div className="stepper big">
        <button type="button" onClick={() => bump(-1)} aria-label="One fewer rep">
          −
        </button>
        <input type="number" inputMode="numeric" value={reps} onChange={(event) => setReps(event.target.value)} aria-label="Reps completed" />
        <button type="button" onClick={() => bump(1)} aria-label="One more rep">
          +
        </button>
      </div>
      <div className="chip-wrap">
        {quick.map((value) => (
          <button key={value} type="button" className={Number(reps) === value ? 'chip active' : 'chip'} onClick={() => setReps(String(value))}>
            {value}
          </button>
        ))}
      </div>

      <span className="field-label">{target.load ? `Weight used${target.load.per === 2 ? ' · per hand' : ''}` : 'Added weight (optional)'}</span>
      <input type="number" inputMode="decimal" step="0.5" value={weight} onChange={(event) => setWeight(event.target.value)} aria-label="Weight used" />
      <div className="chip-wrap">
        {RACK.map((value) => (
          <button key={value} type="button" className={parseFloat(weight) === value ? 'chip active' : 'chip'} onClick={() => setWeight(String(value))}>
            {value}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
