// Counting a bulk back in. `returned` records how many pieces of each line
// have been found again; everything else here is derived from it, so the
// history list and the check page can never disagree about what's outstanding.

export const returnedOf = (session, itemId) => session.returned?.[itemId] ?? 0;

// Clamped, because a line's count can shrink on import and a stale `returned`
// entry shouldn't be able to report more pieces back than were ever sent.
export const backOf = (session, line) => Math.min(line.count, returnedOf(session, line.itemId));

export const remainingOf = (session, line) => line.count - backOf(session, line);

export function checkProgress(session) {
  const back = session.lines.reduce((sum, line) => sum + backOf(session, line), 0);
  return {
    sent: session.total,
    back,
    missing: session.total - back,
    complete: back >= session.total,
    started: back > 0,
    closed: Boolean(session.closedAt),
  };
}

export const shortLines = (session) => session.lines.filter((line) => remainingOf(session, line) > 0);
