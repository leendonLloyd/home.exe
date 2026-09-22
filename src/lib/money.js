export const money = (value) =>
  value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
