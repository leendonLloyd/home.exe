// Display-only. Nothing here reads or writes storage — it rearranges what the
// store already loaded, so changing any of it is safe for the data.

const byName = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

export const sortByName = (entries) => [...entries].sort((a, b) => byName(a.name, b.name));

/**
 * One column per owner who actually has something in this section, so a
 * colour group reads as "hers | his" rather than one mixed pile. Owners keep
 * the order they were added in; anything whose owner has since been deleted
 * falls into a trailing column rather than disappearing.
 */
export function ownerColumns(entries, owners, ownerKeyOf) {
  const buckets = new Map();
  entries.forEach((entry) => {
    const key = ownerKeyOf(entry);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(entry);
  });

  const ordered = owners
    .filter((owner) => buckets.has(owner.key))
    .map((owner) => ({ ...owner, entries: sortByName(buckets.get(owner.key)) }));

  const known = new Set(owners.map((owner) => owner.key));
  const orphaned = [...buckets.entries()].filter(([key]) => !known.has(key));

  return [
    ...ordered,
    ...orphaned.map(([key, list]) => ({ key, name: key || 'Unassigned', color: '#6c7789', entries: sortByName(list) })),
  ];
}
