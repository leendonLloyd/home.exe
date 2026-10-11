// Display-only. Nothing here reads or writes storage — it rearranges what the
// store already loaded, so changing any of it is safe for the data.

const byName = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

export const sortByName = (entries) => [...entries].sort((a, b) => byName(a.name, b.name));

// Not a person: the catch-all an item sits under when it belongs to the
// household rather than to one of you, or when its owner has gone missing.
const UNNAMED = /^\s*(n\.?\s*\/?\s*a\.?|none|unassigned|household|shared)\s*$/i;

export const isUnnamedOwner = (name) => !String(name ?? '').trim() || UNNAMED.test(String(name));

/**
 * One column per owner who actually has something in this section, so a colour
 * group reads as "hers | his" rather than one mixed pile.
 *
 * Named owners come first, in the order they were added, so the two of you sit
 * side by side at the top. N/A and anything else that is not a person sort
 * below them however the owner list happens to be arranged, and an item whose
 * owner has since been deleted keeps a column at the very end rather than
 * disappearing.
 */
export function ownerColumns(entries, owners, ownerKeyOf) {
  const buckets = new Map();
  entries.forEach((entry) => {
    const key = ownerKeyOf(entry);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(entry);
  });

  const present = owners
    .filter((owner) => buckets.has(owner.key))
    .map((owner) => ({ ...owner, entries: sortByName(buckets.get(owner.key)) }));

  const known = new Set(owners.map((owner) => owner.key));
  const orphaned = [...buckets.entries()]
    .filter(([key]) => !known.has(key))
    .map(([key, list]) => ({ key, name: key || 'Unassigned', color: '#6c7789', entries: sortByName(list) }));

  return [
    ...present.filter((column) => !isUnnamedOwner(column.name)),
    ...present.filter((column) => isUnnamedOwner(column.name)),
    ...orphaned,
  ];
}
