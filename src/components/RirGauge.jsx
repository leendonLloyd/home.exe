import { rirLabel } from '../lib/workoutPlans';

// Four ticks for 0–3 reps in reserve; the filled ones are the prescribed window.
export default function RirGauge({ rir }) {
  const label = rirLabel(rir);
  return (
    <span className="gauge" role="img" aria-label={label}>
      {rir ? [0, 1, 2, 3].map((value) => <i key={value} className={rir.includes(value) ? 'on' : undefined} />) : null}
      <span>{label}</span>
    </span>
  );
}
