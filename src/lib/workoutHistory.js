// Sessions 1–9 of the suit block, transcribed from the paper log. Numbered in
// order rather than dated, because not every session recorded a date.
export const SEED_SESSIONS = [
  { session: 1, day: 'Press', note: 'first full log' },
  { session: 2, day: 'Pull', note: 'bent-over rows' },
  { session: 3, day: 'Delts & Arms', note: '' },
  { session: 4, day: 'Press', note: '1 day after Delts, all lifts down' },
  { session: 5, day: 'Pull', note: 'shrugs skipped, grip' },
  { session: 6, day: 'Delts & Arms', note: '4 days rest, four PRs' },
  { session: 7, day: 'Press', note: '' },
  { session: 8, day: 'Delts & Arms', note: 'elbow pain, cut short' },
  { session: 9, day: 'Press', note: 'most recent' },
];

export const PARTS = ['Delts', 'Back', 'Chest', 'Arms', 'Core', 'Legs'];

const e = (session, day, reps, load, note) => ({
  session,
  day,
  reps,
  load,
  total: reps.reduce((sum, value) => sum + value, 0),
  note,
});

export const SEED_HISTORY = [
  {
    key: 'ohp-da',
    part: 'Delts',
    exercise: 'Seated Shoulder Press',
    slot: 'Delts & Arms · 4 × 6–10',
    entries: [
      e(3, 'Delts & Arms', [8, 8, 7, 8], '12'),
      e(6, 'Delts & Arms', [8, 8, 8, 7], '12'),
      e(8, 'Delts & Arms', [9, 9, 8, 8], '12'),
    ],
  },
  {
    key: 'ohp-press',
    part: 'Delts',
    exercise: 'Seated Shoulder Press',
    slot: 'Press · 3 × 8–12',
    note: 'Session 9 is the first at 11 kg. Fewer reps, more total work.',
    entries: [
      e(1, 'Press', [9, 10, 10], '9'),
      e(4, 'Press', [12, 8, 7], '9 / 11 / 11'),
      e(7, 'Press', [12, 11, 11], '9'),
      e(9, 'Press', [12, 11, 8], '11'),
    ],
  },
  {
    key: 'lat-raise',
    part: 'Delts',
    exercise: 'Lateral Raise',
    slot: 'all three upper days · 12–20',
    note: 'The clearest progression in the whole log. Early sessions collapsed below the rep floor by the last set; from session 5 onward every set stays in range. Weight moved 4.5 → 6 kg at session 7.',
    entries: [
      e(1, 'Press', [17, 16, 14, 11], '4.5'),
      e(2, 'Pull', [14, 14, 12, 10], '4.5'),
      e(3, 'Delts & Arms', [16, 14, 11, 11, 9], '4.5'),
      e(4, 'Press', [16, 14, 12, 12], '4.5'),
      e(5, 'Pull', [18, 14, 13, 13], '4.5'),
      e(6, 'Delts & Arms', [21, 16, 14, 13, 12], '4.5'),
      e(7, 'Press', [14, 12, 11, 11], '6'),
      e(8, 'Delts & Arms', [14, 13, 12, 11, 11], '6'),
      e(9, 'Press', [15, 14, 13, 12], '6'),
    ],
  },
  {
    key: 'rear-delt',
    part: 'Delts',
    exercise: 'Chest-Supported Rear Delt Raise',
    slot: 'Pull & Delts · 12–20',
    note: '3 → 4.5 → 6 → 7 kg across five sessions. The falling totals are the weight climbing, not a regression.',
    entries: [
      e(2, 'Pull', [20, 17, 14, 14], '3 / 4.5 ×3'),
      e(3, 'Delts & Arms', [17, 16, 14], '6'),
      e(5, 'Pull', [17, 16, 14, 14], '6'),
      e(6, 'Delts & Arms', [21, 16, 15], '6'),
      e(8, 'Delts & Arms', [18, 16, 15], '7'),
    ],
  },
  {
    key: 'row-heavy',
    part: 'Back',
    exercise: 'Chest-Supported Row',
    slot: 'heavy slot · 4 × 8–12 @ 16 kg',
    note: "Session 1's 42 came with reps climbing across sets — a sign set one wasn't near failure. Session 9's 41 included a 5–6 minute rest before set four. The honest working range is 35–37.",
    entries: [
      e(1, 'Press', [10, 10, 11, 11], '16'),
      e(4, 'Press', [10, 9, 8, 7], '16'),
      e(5, 'Pull', [10, 9, 8, 8], '16'),
      e(7, 'Press', [11, 9, 9, 8], '16'),
      e(9, 'Press', [10, 10, 10, 11], '16'),
    ],
  },
  {
    key: 'row-light',
    part: 'Back',
    exercise: 'Chest-Supported Row',
    slot: 'light slot · Delts & Arms · 3 × 10–15',
    note: 'This slot is prescribed at 14 kg. Both sessions at 16 fell short of the rep floor.',
    entries: [
      e(3, 'Delts & Arms', [10, 9, 9], '16'),
      e(6, 'Delts & Arms', [12, 12, 11], '14'),
      e(8, 'Delts & Arms', [11, 10, 9], '16'),
    ],
  },
  {
    key: 'pullover',
    part: 'Back',
    exercise: 'DB Pullover',
    slot: 'Pull · 3 × 12–20 @ 9 kg',
    note: "Went from an exercise you couldn't feel in the target muscle to a working lift above the prescribed weight.",
    entries: [e(2, 'Pull', [15, 15, 13], '9'), e(5, 'Pull', [16, 14, 14], '9')],
  },
  {
    key: 'bent-row',
    part: 'Back',
    exercise: 'Bent-Over DB Row',
    slot: 'discontinued after session 2',
    entries: [e(2, 'Pull', [8, 9, 8, 9], '16')],
  },
  {
    key: 'shrug',
    part: 'Back',
    exercise: 'DB Shrug',
    slot: '@ 16 kg',
    note: 'Grip-limited throughout. Moved to slot 2 and shortened to 8–12 reps; not yet tested since.',
    entries: [
      e(2, 'Pull', [12, 11, 8, 5], '16'),
      e(5, 'Pull', [], null, 'skipped — grip failed'),
      e(8, 'Delts & Arms', [], null, 'not reached'),
    ],
  },
  {
    key: 'bench',
    part: 'Chest',
    exercise: 'DB Bench Press',
    slot: 'Press · 3 × 6–10 @ 16 kg',
    note: "Flat across the block. Session 4's 17 came one day after a heavy Delts session. The only lift with no upward trend — also the only one on a muscle you deprioritised.",
    entries: [
      e(1, 'Press', [8, 8, 7], '16'),
      e(4, 'Press', [6, 6, 5], '16'),
      e(7, 'Press', [7, 8, 8], '16'),
      e(9, 'Press', [7, 8, 7], '16'),
    ],
  },
  {
    key: 'incline-bench',
    part: 'Chest',
    exercise: 'Incline DB Bench Press',
    slot: 'Pull · 3 × 8–12 @ 13 kg',
    entries: [e(2, 'Pull', [9, 9, 9], '13'), e(5, 'Pull', [9, 9, 8], '13')],
  },
  {
    key: 'curl-press',
    part: 'Arms',
    exercise: 'Incline DB Curl',
    slot: 'Press · 10–15',
    note: 'Nearly doubled. The turning point was dropping 8 → 7 kg at session 4, then earning 8 kg back with an extra set.',
    entries: [
      e(1, 'Press', [10, 9, 7], '8'),
      e(4, 'Press', [13, 11, 11], '7'),
      e(7, 'Press', [15, 14, 6, 11], '7 / 7 / 8 / 7'),
      e(9, 'Press', [15, 13, 11, 9], '8'),
    ],
  },
  {
    key: 'curl-da',
    part: 'Arms',
    exercise: 'Incline DB Curl',
    slot: 'Delts & Arms · 3 × 10–15',
    note: 'Consistently below the Press day version — it is the second curl of the day. Session 8 is unreliable: elbow pain throughout.',
    entries: [
      e(3, 'Delts & Arms', [14, 12, 9], '7'),
      e(6, 'Delts & Arms', [9, 7, 10], '8 / 8 / 7'),
      e(8, 'Delts & Arms', [17, 9, 7], '7 / 8 / 8'),
    ],
  },
  {
    key: 'hammer',
    part: 'Arms',
    exercise: 'Hammer Curl',
    slot: 'Delts & Arms · 3 × 10–15',
    entries: [
      e(3, 'Delts & Arms', [14], '7', 'only set one completed'),
      e(6, 'Delts & Arms', [16, 14, 10], '7 / 7 / 8'),
      e(8, 'Delts & Arms', [16, 12, 11], '8'),
    ],
  },
  {
    key: 'oh-ext',
    part: 'Arms',
    exercise: 'Overhead DB Extension',
    slot: 'Press · 3 × 10–15',
    note: 'Session 9 sets one and two had wrist extension creeping in; set three at 14 came after the grip was corrected.',
    entries: [
      e(1, 'Press', [12, 11, 11], '8'),
      e(7, 'Press', [14, 14, 12], '9'),
      e(9, 'Press', [13, 11, 14], '9'),
    ],
  },
  {
    key: 'skull',
    part: 'Arms',
    exercise: 'DB Skull Crusher',
    slot: 'Delts & Arms · 3 × 10–15',
    flag: 'Session 8 — elbow pain. Weight misread and taken to 8 kg, pain near the elbow, reps collapsed 12 → 7 and the exercise was ended. Three days later the elbow was quiet. Return at 4.5 kg and progress by reps, not load.',
    entries: [
      e(6, 'Delts & Arms', [12, 11, 10], '6'),
      e(8, 'Delts & Arms', [12, 7], '6', 'stopped — elbow pain'),
    ],
  },
  {
    key: 'side-plank',
    part: 'Core',
    exercise: 'Side Plank',
    slot: 'Pull · 3 × 30–45 s · seconds, not reps',
    note: 'Weighted crunches and lying leg raises: no sessions logged. Crunches skipped when reached; leg raises live on the Lower day.',
    entries: [e(2, 'Pull', [29, 32, 28], null), e(5, 'Pull', [30, 28, 27], null)],
  },
];

export const STANDING = [
  { label: 'Moving well', body: 'Lateral raises, rear delts, incline curls, shoulder press on both days, pullovers. Every one of your priority muscles is progressing.' },
  { label: 'Flat', body: 'Bench press and incline bench — chest, which you moved to maintenance. Working as intended.' },
  { label: 'Unresolved', body: 'Shrugs, capped by grip rather than traps. Straps not yet bought.' },
  { label: 'Missing entirely', body: 'The Lower day, and with it all leg work, suitcase carries and lying leg raises. Nine sessions, zero lower body.', warn: true },
];

// Prescribed lifts with nothing logged yet. They exist so the history page shows
// the gaps — the Lower day above all — rather than hiding them.
const empty = (key, part, exercise, slot) => ({ key, part, exercise, slot, entries: [] });

export const EXTRA_GROUPS = [
  empty('crunch', 'Core', 'Weighted Crunch', 'Delts & Arms · 3 × 12–20'),
  empty('leg-raise', 'Core', 'Lying Leg Raise', 'Lower · 3 × 12–20'),
  empty('goblet', 'Legs', 'Heel-Elevated Goblet Squat', 'Lower · 3 × 10–15'),
  empty('rdl', 'Legs', 'DB Romanian Deadlift', 'Lower · 3 × 10–15'),
  empty('bss', 'Legs', 'Bulgarian Split Squat', 'Lower · 2 × 10–12'),
  empty('calf-seated', 'Legs', 'Seated Calf Raise', 'Lower · 3 × 15–25'),
  empty('carry', 'Legs', 'Suitcase Carry', 'Lower · 2 × 60 steps'),
  empty('hip-thrust', 'Legs', 'Single-Leg Hip Thrust', 'Base plan · Lower A'),
  empty('calf-single', 'Legs', 'Single-Leg Calf Raise', 'Base plan · Lower A'),
  empty('lunge', 'Legs', 'DB Reverse Lunge', 'Base plan · Lower B'),
  empty('step-up', 'Legs', 'DB Step-Up', 'Base plan · Lower B'),
  empty('leg-curl', 'Legs', 'Slider or Nordic Leg Curl', 'Base plan · Lower B'),
];

export const BASE_GROUPS = [...SEED_HISTORY, ...EXTRA_GROUPS];
