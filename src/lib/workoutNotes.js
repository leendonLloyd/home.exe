// Prose that shipped with each plan. `lead` is the bolded opener of a paragraph.
const p = (text, lead) => ({ text, lead });

export const NOTES = {
  suit: [
    {
      title: 'Core, twice a week each',
      body: [
        p('Abs: lying leg raise on the lower day, weighted crunch on Delts & Arms. Obliques: suitcase carries on the lower day, side plank on Pull. Spread across different sessions so neither gets both hits on the same day.'),
      ],
    },
    {
      title: 'Feeler sets',
      body: [
        p("Turn the last warm-up set on the day's first exercise into a measurement: 3 reps at about 90% of your working weight, rest 60 seconds, then decide. Snappy means go up. Normal means proceed as planned. Slow or achy means drop a bell and add reps."),
        p('Openers for each day: bench press on Press, goblet squat on Lower, chest-supported row on Pull, shoulder press on Delts & Arms. One feeler set per session, on that lift only.'),
        p('Over fifteen weeks this matters more than it sounds. It stops a poorly-timed session from becoming a bad log entry you then react to by changing weights that were never the problem.'),
      ],
    },
    {
      title: 'Your ceiling barely matters here',
      body: [
        p("18 kg per hand caps rows, shrugs, RDLs and squats — but almost nothing you're prioritising. Side delts at 4.5 kg, rear delts at 3 kg, curls at 7–8 kg, triceps at 4.5 kg: those have years of headroom on your rack. The equipment limits the muscles you've put on maintenance, which is a lucky coincidence."),
        p('Back work is all chest-supported rowing, three times a week, at 30°. One row done well beats three done adequately, and the pullover covers the lat-specific angle rowing misses. Shrugs sit at 10–15 reps because they start near your 18 kg ceiling.'),
      ],
    },
    {
      title: 'The 15-week shape of it',
      body: [
        p('Calibration. Stay at 2–3 RIR, learn the new lifts, find your real weights. Don’t chase anything yet.', 'Weeks 1–2 · to 30 Aug.'),
        p('Build. Double progression on everything, 1–2 RIR on compounds. This is where most of the work happens.', 'Weeks 3–7 · to 4 Oct.'),
        p('Light week. Same weights, half the sets. Non-negotiable — three months of accumulating fatigue is what stalls people in week ten.', 'Week 8 · 5–11 Oct.'),
        p('Push. Isolations to 0 RIR, and when a dumbbell caps out, add tempo or partials rather than reps forever.', 'Weeks 9–14 · to 22 Nov.'),
        p("Cut volume by 40%, keep the weights. You'll look fuller, not flatter — recovered muscle holds more glycogen.", 'Week 15 · 23–29 Nov.'),
      ],
    },
    {
      title: 'Why three upper days',
      body: [
        p("Your priorities are all upper body, so splitting training evenly between upper and lower spends half your week on things you didn't ask for. Three upper days and one lower gives side delts 13 weekly sets instead of 8, biceps 9 instead of 6, and mid-back 11 instead of 7 — without adding a session. Legs move to maintenance, which holds what you have."),
      ],
    },
    {
      title: 'What fills a jacket',
      body: [
        p('Shoulder width first — side delts are the highest-leverage muscle for a silhouette and they take the most volume here. Then upper-back and trap thickness, which is what fills the space across the back of a jacket. Lats give taper but are limited without a vertical pull. Arms fill sleeves. Chest is on maintenance at 6 weekly sets since it dropped off your list.'),
      ],
    },
    {
      title: 'Side delts every session',
      body: [
        p("Laterals appear on all three upper days at 4–5 sets. That's deliberate: they're small, light, recover in a day, and are the single biggest visual return in the program. If one thing survives a rushed session, make it these."),
      ],
    },
    {
      title: "The part that isn't training",
      body: [
        p('Goal is recomposition, not gaining. Eat at maintenance or a small deficit — no more than about 300 under. Protein 1.8–2.2 g per kg of bodyweight, which matters more in a deficit than a surplus. Aim to lose 0.25–0.5% of bodyweight per week; faster than that comes out of muscle.'),
        p('The walking pad does the work here. 30 minutes on rest days creates the deficit without competing for recovery the way harder cardio would.'),
      ],
    },
    {
      title: 'Reading the log in a deficit',
      body: [
        p('Totals will slow or flatten. That is expected and is not a signal to change weights. A flat Σ alongside a shrinking waist means it is working. Keep training heavy — the lifting is what decides whether the weight you lose comes off fat or muscle.'),
        p('Measure the waist weekly, same time of day. It is the number that moves now, not the scale and not the lifts.'),
      ],
    },
    {
      title: 'Same principles apply',
      body: [
        p('Everything in the base plan still holds: double progression, form-limited stopping on hinges, isolations taken to the last rep. Switch plans above to reread them.'),
      ],
    },
  ],

  base: [
    {
      title: 'Core, twice a week each',
      body: [
        p('Abs: weighted crunch on Upper B, lying leg raise on Lower B. Obliques: suitcase carries on Lower A, side plank on Lower B. Different jobs — crunches and leg raises flex the spine, carries and planks resist it bending sideways, which is what obliques actually do most of.'),
        p('Crunches are the one core movement worth loading. Start at 9 kg on your chest and progress it like any other lift. Planks progress by time, then by elevating your feet — not by adding sets.'),
      ],
    },
    {
      title: 'What you gave up',
      body: [
        p('The prone Y-raise was your only direct lower-trap work. If your shoulders start complaining or overhead pressing feels pinchy, put it back as two light sets before the shoulder press rather than as an exercise at the end.'),
      ],
    },
    {
      title: 'Your rack',
      body: [
        p('Adjustable pair at 1.5, 3, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18 kg, plus fixed pairs at 10 lb (4.5 kg) and 15 lb (6.8 kg). The fixed pairs matter more than they look — they fill the gap between 3 and 6 kg, which is exactly where laterals and rear delts live.'),
        p('Two useful patterns. From 6 to 9 kg you have 1 kg steps, so arms and delts progress smoothly for a long time. From 12 to 18 kg the steps are 2 kg, which is a 12–17% jump — add reps first on those lifts, then the weight.'),
      ],
    },
    {
      title: 'Feeler sets',
      body: [
        p('A feeler set is the last set of your warm-up ramp on the first exercise of the day, used as a measurement rather than as work. It answers one question: is today a normal day, or not?'),
        p('Run it at roughly 90% of your working weight for 3 reps, then rest 60 seconds and decide:'),
        p('Today is a good day. Go to your planned weight, and if set one clears the top of the range, take the next bell up.', 'Snappy, no grinding, felt lighter than expected'),
        p('Planned weight, planned reps. This is most days.', 'Normal — 3 reps moved fine, some effort on the last one'),
        p('Drop one bell and add reps, or hold the weight and accept the bottom of the range. Do not push into it. A bad day trained honestly costs you nothing; a bad day forced costs you the week.', 'Slow, heavy, or something aches'),
        p('The point is deciding before your first working set instead of discovering it halfway through and salvaging a bad session. On your compressed week, bench went 6/6/5 against 8/8/7 — a feeler set would have told you that in ninety seconds.'),
        p('One per session, first exercise only. Later lifts are affected by the ones before them, so a feeler set there tells you about accumulated fatigue rather than readiness, which is not a thing you can act on.'),
      ],
    },
    {
      title: 'Grip, not traps',
      body: [
        p('Shrugs and carries are the two lifts where your forearms fail before the target muscle does. Straps fix that for about the price of a coffee and are worth it for these two only — never for carries you are doing to build grip, and never as a substitute for a lift you simply cannot hold.'),
      ],
    },
    {
      title: 'What caps out, and when',
      body: [
        p('18 kg per hand is the ceiling. Already there or close: shrugs, carries, RDLs, seated calf raises. Bench press has exactly one jump left at 18 kg. Bent-over rows are capped by your lower back holding the hinge rather than by the bells. Once a lift hits its ceiling, progression comes from reps, then tempo, then unilateral versions — never from adding a fifth and sixth set.'),
        p('This is why hip thrusts are single-leg and calf raises favour one leg at a time: halving the limbs doubles the effective load, which is the only real way past a fixed ceiling.'),
      ],
    },
    {
      title: 'Two curl grips',
      body: [
        p('Incline curl: supinated, arm behind the torso — biceps long head under stretch. Hammer curl: neutral, arm at your side — brachialis and brachioradialis. Together they cover the elbow flexors; two of either would not.'),
      ],
    },
    {
      title: 'Where the fourth sets went',
      body: [
        p('Extra sets sit on the cheap lifts — laterals, rear delts, calves, hip thrusts, leg curls. Small muscles, light loads, 60-second rests, nothing that follows you into the next session. The openers stay at three on purpose: a fourth set of heavy pressing or hinging costs recovery, and progression there should come from load instead.'),
      ],
    },
    {
      title: 'Overhead extension progression',
      body: [
        p('Two hands on one bell splits the load, so 8 kg is roughly 4 kg per arm. At 15 easy reps, move to single-arm at 5–6 kg instead of jumping to the next bell — the two-handed version has nowhere sensible to go.'),
      ],
    },
    {
      title: 'Why two triceps angles',
      body: [
        p('The long head crosses the shoulder, so it only stretches with the arm overhead. Overhead extension on A covers that; skull crushers on B work the other two heads with the elbow in front. Doing both versions of the same angle would be the wasteful option.'),
      ],
    },
    {
      title: "Rows, plus the one thing that isn't",
      body: [
        p('Rows train the lat by squeezing; the pullover trains it under stretch, with the arm extended and no elbow flexion. It is the only non-row back movement available without a bar or a band, which is the entire reason it holds a slot. With 11 weekly row sets already, a third row would add nothing this does not.'),
      ],
    },
    {
      title: 'These numbers are a first guess',
      body: [
        p('Loads are scaled off 16 kg per hand on flat bench, then rounded to something you actually own. If a set lands more than two reps outside its range, change the weight next session and stop thinking about it.'),
      ],
    },
    {
      title: 'Progression',
      body: [
        p('Total reps across all sets is the marker. 11+9+7 is 27 — next session, beat it at the same weight. Add load when every set reaches the top of the range, and never when adding it would drop your last set below the bottom. When the jump between bells is too big, add reps first, then a set.'),
      ],
    },
    {
      title: 'How much decline is normal',
      body: [
        p('Expect 10–20% fewer reps on your last set than your first. More than about 30% means rest was too short or set one was taken too close to failure — both fixable, and fixing them usually raises your total. Compounds on 3 minutes should barely decline; isolations on 60–90 seconds will drop more.'),
      ],
    },
    {
      title: 'When the dumbbells run out',
      body: [
        p("Don't chase reps forever on lower body. Add 3-second lowering, a pause at the bottom, or 1.5 reps. Cheaper than buying more iron."),
      ],
    },
    {
      title: 'Why hinges get more reserve',
      body: [p('Form fails before the muscle does. End the set when bar path or spine position changes, even at 3 RIR.')],
    },
    {
      title: 'Why isolations get less',
      body: [p('Low joint stress, no technical failure mode, and the stimulus sits in the last few reps. Laterals, calves, rear delts — take them all the way.')],
    },
    {
      title: 'If time is short',
      body: [
        p('Superset non-competing pairs rather than cutting rest: laterals with curls, calves with leg raises. Short rest on your opener means set three is limited by fatigue, not strength.'),
      ],
    },
    {
      title: 'Calibration',
      body: [p('Once or twice a month, take one isolation set to true failure. Most people sit two reps further from the ceiling than they think.')],
    },
  ],
};
