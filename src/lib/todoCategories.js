// Items in the sheet read "Entourage: CORD", "Fam: Mama Gigi Shoes" — the part
// before the first colon is a grouping the sheet uses by convention. Splitting
// it out lets the app show sections without changing how the sheet is written.

export function splitItem(item) {
  const at = item.indexOf(':');
  if (at === -1) return { category: '', name: item.trim() };
  return { category: item.slice(0, at).trim(), name: item.slice(at + 1).trim() };
}

export const joinItem = (category, name) =>
  (category.trim() ? `${category.trim()}: ${name.trim()}` : name.trim());

export function categoriesOf(tasks) {
  const seen = [];
  tasks.forEach((task) => {
    const { category } = splitItem(task.item);
    if (category && !seen.includes(category)) seen.push(category);
  });
  return seen;
}

export function groupTasks(tasks) {
  const order = [];
  const byCategory = new Map();
  tasks.forEach((task) => {
    const { category, name } = splitItem(task.item);
    const key = category || 'Other';
    if (!byCategory.has(key)) {
      byCategory.set(key, []);
      order.push(key);
    }
    byCategory.get(key).push({ task, label: name || task.item });
  });
  return order.map((key) => ({ key, entries: byCategory.get(key) }));
}
