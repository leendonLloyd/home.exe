// No amounts or due days are guessed here — unlike laundry's clothing presets,
// a wrong number for rent is worse than an empty list. Presets are name + icon
// only; the person adding a bill fills in the real figures.
export const BILL_PRESETS = [
  { name: 'Rent', icon: 'home' },
  { name: 'Electricity', icon: 'bolt' },
  { name: 'Water', icon: 'droplet' },
  { name: 'Internet', icon: 'wifi' },
  { name: 'Mobile', icon: 'phone' },
  { name: 'Credit Card', icon: 'card' },
  { name: 'Insurance', icon: 'shield' },
  { name: 'Subscription', icon: 'receipt' },
];

export const DEFAULT_STATE = {
  bills: [],
  payments: [],
};
