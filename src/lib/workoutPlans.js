// Dumbbell rack on hand, in kg. Adjustable pair plus two fixed pairs (10 lb, 15 lb).
export const RACK = [1.5, 3, 4.5, 6, 6.8, 7, 8, 9, 11, 12, 13, 14, 16, 18];

// `log` is the history group an exercise writes into, so the same lift keeps one
// trend line across days and plans. Two slots of one lift split only where the
// prescription differs enough that the totals are not comparable.
const SUIT_BLOCK = [
  {
    key: 'press',
    tab: 'Press',
    title: 'Upper 1 · Press',
    note: 'Chest, front & side delts',
    ex: [
      { log: 'bench', n: 'DB Bench Press', sets: 3, reps: '6–10', load: { per: 2, kg: 16 }, rest: '3 min', rir: [1, 2] },
      { log: 'row-heavy', n: 'Chest-Supported Row', sets: 4, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'ohp-press', n: 'Seated Shoulder Press', sets: 3, reps: '8–12', load: { per: 2, kg: 11 }, rest: '2 min', rir: [1, 2] },
      { log: 'lat-raise', n: 'Lateral Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'curl-press', n: 'Incline DB Curl', sub: 'bench at 45° · start set one at 8 kg, do not switch mid-exercise', sets: 4, reps: '10–15', load: { per: 2, kg: 8 }, rest: '2 min', rir: [0, 1] },
      { log: 'oh-ext', n: 'Overhead DB Extension', sub: 'upper arms in line with torso', sets: 3, reps: '10–15', load: { per: 1, kg: 9 }, rest: '90 s', rir: [0, 1] },
    ],
  },
  {
    key: 'lower',
    tab: 'Lower',
    title: 'Lower · Maintenance',
    note: 'Hold what you have',
    ex: [
      { log: 'goblet', n: 'Heel-Elevated Goblet Squat', sets: 3, reps: '10–15', load: { per: 1, kg: 18 }, rest: '2–3 min', rir: [2] },
      { log: 'rdl', n: 'DB Romanian Deadlift', sets: 3, reps: '10–15', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [2] },
      { log: 'bss', n: 'Bulgarian Split Squat', sub: 'per leg', sets: 2, reps: '10–12', load: { per: 2, kg: 9 }, rest: '2 min after both legs', rir: [2] },
      { log: 'calf-seated', n: 'Seated Calf Raise', sets: 3, reps: '15–25', load: { per: 2, kg: 18 }, rest: '60 s', rir: [0] },
      { log: 'carry', n: 'Suitcase Carry', sub: 'per side · grip, traps, obliques', sets: 2, reps: '60 steps', load: { per: 1, kg: 18 }, rest: '90 s', rir: null },
      { log: 'leg-raise', n: 'Lying Leg Raise', sets: 3, reps: '12–20', load: null, rest: '60 s', rir: [0, 1] },
    ],
  },
  {
    key: 'pull',
    tab: 'Pull',
    title: 'Upper 2 · Pull',
    note: 'Back thickness & traps',
    ex: [
      { log: 'row-heavy', n: 'Chest-Supported Row', sub: 'bench at 30° · elbows to hips, the lat-biased path', sets: 4, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'shrug', n: 'DB Shrug', sub: '1-second squeeze · straps if grip caps you', sets: 4, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2 min', rir: [0, 1] },
      { log: 'pullover', n: 'DB Pullover', sub: 'pack the shoulder blades down · lock a 15° elbow bend', sets: 3, reps: '12–20', load: { per: 1, kg: 9 }, rest: '90 s', rir: [0, 1] },
      { log: 'incline-bench', n: 'Incline DB Bench Press', sets: 3, reps: '8–12', load: { per: 2, kg: 13 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'rear-delt', n: 'Chest-Supported Rear Delt Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'lat-raise', n: 'Lateral Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'side-plank', n: 'Side Plank', sub: 'per side · log seconds · obliques', sets: 3, reps: '30–45 secs', load: null, rest: '45 s', rir: [0, 1] },
    ],
  },
  {
    key: 'delts-arms',
    tab: 'Delts & Arms',
    title: 'Upper 3 · Delts & Arms',
    note: 'The priority day',
    ex: [
      { log: 'ohp-da', n: 'Seated Shoulder Press', sub: 'fresh, so go heavier than day 1', sets: 4, reps: '6–10', load: { per: 2, kg: 12 }, rest: '3 min', rir: [1, 2] },
      { log: 'lat-raise', n: 'Lateral Raise', sub: 'pace them · every set in range beats one big set', sets: 5, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'row-light', n: 'Chest-Supported Row', sub: 'the lighter row · Press day has the heavy one', sets: 3, reps: '10–15', load: { per: 2, kg: 14 }, rest: '2 min', rir: [1, 2] },
      { log: 'rear-delt', n: 'Chest-Supported Rear Delt Raise', sets: 3, reps: '15–20', load: { per: 2, kg: 7 }, rest: '90 s', rir: [0] },
      { log: 'hammer', n: 'Hammer Curl', sub: 'alternate sets with the skull crushers', sets: 3, reps: '10–15', load: { per: 2, kg: 8 }, rest: '2 min', rir: [0, 1] },
      { log: 'skull', n: 'DB Skull Crusher', sub: 'neutral grip · back at 4.5 kg after the session 8 elbow', sets: 3, reps: '10–15', load: { per: 2, kg: 4.5 }, rest: '2 min', rir: [1, 2] },
      { log: 'curl-da', n: 'Incline DB Curl', sub: 'biceps long head · second curl of the day, expect less', sets: 3, reps: '10–15', load: { per: 2, kg: 7 }, rest: '2 min', rir: [0, 1] },
      { log: 'crunch', n: 'Weighted Crunch', sub: 'bell on the chest · slow, no neck yanking', sets: 3, reps: '12–20', load: { per: 1, kg: 9 }, rest: '60 s', rir: [0, 1] },
    ],
  },
];

const BASE_4_DAY = [
  {
    key: 'upper-a',
    tab: 'Upper A',
    title: 'Upper A',
    note: 'Bench + horizontal pull',
    ex: [
      { log: 'bench', n: 'DB Bench Press', sets: 3, reps: '6–10', load: { per: 2, kg: 16 }, rest: '3 min', rir: [1, 2] },
      { log: 'row-heavy', n: 'Chest-Supported Row', sets: 3, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'pullover', n: 'DB Pullover', sub: 'pack the shoulder blades down · lock a 15° elbow bend', sets: 3, reps: '12–20', load: { per: 1, kg: 9 }, rest: '90 s', rir: [0, 1] },
      { log: 'ohp-press', n: 'Seated Shoulder Press', sets: 3, reps: '8–12', load: { per: 2, kg: 11 }, rest: '2 min', rir: [1, 2] },
      { log: 'lat-raise', n: 'Lateral Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'curl-press', n: 'Incline DB Curl', sub: 'bench at 45° · full stretch at the bottom', sets: 3, reps: '10–15', load: { per: 2, kg: 7 }, rest: '2 min', rir: [0, 1] },
      { log: 'oh-ext', n: 'Overhead DB Extension', sub: 'upper arms in line with torso · 45° or upright, pick one', sets: 3, reps: '10–15', load: { per: 1, kg: 9 }, rest: '90 s', rir: [0, 1] },
      { log: 'shrug', n: 'DB Shrug', sub: '1-second squeeze · straps if grip caps you', sets: 3, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2 min', rir: [0, 1] },
    ],
  },
  {
    key: 'lower-a',
    tab: 'Lower A',
    title: 'Lower A',
    note: 'Squat bias',
    ex: [
      { log: 'goblet', n: 'Heel-Elevated Goblet Squat', sets: 3, reps: '10–15', load: { per: 1, kg: 18 }, rest: '2–3 min', rir: [2] },
      { log: 'bss', n: 'Bulgarian Split Squat', sub: 'per leg', sets: 3, reps: '8–12', load: { per: 2, kg: 9 }, rest: '2 min after both legs', rir: [2] },
      { log: 'rdl', n: 'DB Romanian Deadlift', sets: 3, reps: '10–15', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [2, 3] },
      { log: 'hip-thrust', n: 'Single-Leg Hip Thrust', sub: 'per side · 18 kg is too light for two legs', sets: 4, reps: '12–20', load: { per: 1, kg: 14 }, rest: '90 s', rir: [0, 1] },
      { log: 'calf-single', n: 'Single-Leg Calf Raise', sets: 4, reps: '12–20', load: { per: 1, kg: 18 }, rest: '60 s', rir: [0] },
      { log: 'carry', n: 'Suitcase Carry', sub: 'per side · capped, so walk further', sets: 3, reps: '60 steps', load: { per: 1, kg: 18 }, rest: '90 s', rir: null },
    ],
  },
  {
    key: 'upper-b',
    tab: 'Upper B',
    title: 'Upper B',
    note: 'Overhead + vertical emphasis',
    ex: [
      { log: 'ohp-da', n: 'Seated Shoulder Press', sets: 3, reps: '6–10', load: { per: 2, kg: 12 }, rest: '3 min', rir: [1, 2] },
      { log: 'row-heavy', n: 'Chest-Supported Row', sub: 'bench at 30° · elbows to hips', sets: 3, reps: '8–12', load: { per: 2, kg: 16 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'incline-bench', n: 'Incline DB Bench Press', sets: 3, reps: '8–12', load: { per: 2, kg: 13 }, rest: '2–3 min', rir: [1, 2] },
      { log: 'rear-delt', n: 'Chest-Supported Rear Delt Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'lat-raise', n: 'Lateral Raise', sets: 4, reps: '12–20', load: { per: 2, kg: 6 }, rest: '90 s', rir: [0, 1] },
      { log: 'skull', n: 'DB Skull Crusher', sub: 'leave 1–2 in the tank on set one · superset with hammer curls', sets: 3, reps: '10–15', load: { per: 2, kg: 6 }, rest: '2 min', rir: [1, 2] },
      { log: 'hammer', n: 'Hammer Curl', sub: 'neutral grip · 8 kg once you clear 15', sets: 3, reps: '10–15', load: { per: 2, kg: 8 }, rest: '2 min', rir: [0, 1] },
      { log: 'crunch', n: 'Weighted Crunch', sub: 'bell on the chest · slow, no neck yanking', sets: 3, reps: '12–20', load: { per: 1, kg: 9 }, rest: '60 s', rir: [0, 1] },
    ],
  },
  {
    key: 'lower-b',
    tab: 'Lower B',
    title: 'Lower B',
    note: 'Hinge bias',
    ex: [
      { log: 'rdl', n: 'DB Romanian Deadlift', sets: 3, reps: '8–12', load: { per: 2, kg: 18 }, rest: '3 min', rir: [2] },
      { log: 'lunge', n: 'DB Reverse Lunge', sub: 'per leg', sets: 3, reps: '10–12', load: { per: 2, kg: 12 }, rest: '2 min', rir: [2] },
      { log: 'step-up', n: 'DB Step-Up', sub: 'per leg · knee-height step', sets: 3, reps: '8–12', load: { per: 2, kg: 9 }, rest: '90 s', rir: [1, 2] },
      { log: 'leg-curl', n: 'Slider or Nordic Leg Curl', sets: 4, reps: '6–12', load: null, rest: '90 s', rir: [0, 1] },
      { log: 'calf-seated', n: 'Seated Calf Raise', sets: 4, reps: '15–25', load: { per: 2, kg: 18 }, rest: '60 s', rir: [0] },
      { log: 'leg-raise', n: 'Lying Leg Raise', sub: 'no bar, so floor version', sets: 3, reps: '12–20', load: null, rest: '60 s', rir: [0, 1] },
      { log: 'side-plank', n: 'Side Plank', sub: 'per side · log seconds · obliques', sets: 3, reps: '30–45 secs', load: null, rest: '45 s', rir: [0, 1] },
    ],
  },
];

export const PLANS = [
  {
    id: 'suit',
    tab: 'Suit block',
    name: 'Suit block · 15 wk',
    blurb: 'Shoulders, back, arms · 3 upper + 1 lower',
    schedule: 'Press · Lower · rest · Pull · rest · Delts & Arms · rest',
    days: SUIT_BLOCK,
  },
  {
    id: 'base',
    tab: 'Base 4-day',
    name: 'Base upper/lower',
    blurb: 'Adjustable pair to 18 kg · 4 days',
    schedule: 'Upper A · Lower A · rest · Upper B · Lower B · rest · rest',
    days: BASE_4_DAY,
  },
];

export const planById = (id) => PLANS.find((plan) => plan.id === id) ?? PLANS[0];

export const loadLabel = (load) => (load ? `${load.per} × ${load.kg} kg` : 'bodyweight');

// "12–20" -> [12, 20] ; "60 steps" -> [60, 60]
export const bounds = (reps) => {
  const range = reps.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (range) return [Number(range[1]), Number(range[2])];
  const one = reps.match(/(\d+)/);
  return one ? [Number(one[1]), Number(one[1])] : [8, 12];
};

export const rirLabel = (rir) => {
  if (!rir) return 'grip-limited';
  return rir.length > 1 ? `${rir[0]}–${rir[rir.length - 1]} RIR` : `${rir[0]} RIR`;
};
