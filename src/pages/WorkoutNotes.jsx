import { Link } from 'react-router-dom';
import { NOTES } from '../lib/workoutNotes';
import { PLANS, planById } from '../lib/workoutPlans';
import { useWorkoutStore } from '../lib/workoutStore';

export default function WorkoutNotes() {
  const store = useWorkoutStore();
  const plan = planById(store.state.planId);
  const notes = NOTES[plan.id] ?? [];

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/workout" className="icon-btn" aria-label="Back to tracker">
          ←
        </Link>
        <div>
          <h1>Plan notes</h1>
          <p className="muted">{plan.name}</p>
        </div>
      </header>

      <main className="scroll">
        <div className="plan-switch" role="group" aria-label="Choose a plan">
          {PLANS.map((entry) => (
            <button key={entry.id} type="button" aria-pressed={entry.id === plan.id} onClick={() => store.setPlan(entry.id)}>
              {entry.tab}
            </button>
          ))}
        </div>

        {notes.map((note) => (
          <section className="note" key={note.title}>
            <h2>{note.title}</h2>
            {note.body.map((para) => (
              <p key={para.text}>
                {para.lead ? <strong>{para.lead} </strong> : null}
                {para.text}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
