export const COLOR_TYPES = [
  { id: 'whites', label: 'Whites', tint: '#8fa3c2' },
  { id: 'lights', label: 'Lights', tint: '#d99a2b' },
  { id: 'colors', label: 'Colors', tint: '#2a9d80' },
  { id: 'darks', label: 'Darks', tint: '#4d5fe3' },
  { id: 'delicates', label: 'Delicates', tint: '#d55a8c' },
];

export const OWNER_COLORS = ['#4d5fe3', '#d55a8c', '#2a9d80', '#c88413', '#2f8fc4', '#8a4fd6', '#d0642c', '#5d9c22'];

export const PRESET_TYPES = [
  { name: 'T-Shirt', icon: 'tshirt' },
  { name: 'Polo', icon: 'polo' },
  { name: 'Pants', icon: 'pants' },
  { name: 'Shorts', icon: 'shorts' },
  { name: 'Dress', icon: 'dress' },
  { name: 'Jacket', icon: 'jacket' },
  { name: 'Socks', icon: 'socks' },
  { name: 'Underwear', icon: 'underwear' },
  { name: 'Towel', icon: 'towel' },
  { name: 'Bedsheet', icon: 'bedsheet' },
  { name: 'Pillowcase', icon: 'pillow' },
  { name: 'Duvet Cover', icon: 'duvet' },
];

export const DEFAULT_OWNERS = [
  { id: 'own-shi', name: 'Shi', color: OWNER_COLORS[1] },
  { id: 'own-don', name: 'Don', color: OWNER_COLORS[0] },
  { id: 'own-na', name: 'N/A', color: '#6c7789' },
];

// Household linens default to the N/A owner instead of a person.
const HOUSEHOLD_PRESET_NAMES = ['Bedsheet', 'Pillowcase', 'Duvet Cover'];

// Seed every preset in both lights and darks per owner so the grid starts populated.
const DEFAULT_ITEM_COLOR_TYPES = ['lights', 'darks'];

const PERSON_OWNERS = DEFAULT_OWNERS.filter((owner) => owner.id !== 'own-na');

const DEFAULT_ITEMS = PRESET_TYPES.flatMap((preset, index) => {
  const ownerId = HOUSEHOLD_PRESET_NAMES.includes(preset.name)
    ? 'own-na'
    : PERSON_OWNERS[index % PERSON_OWNERS.length].id;
  return DEFAULT_ITEM_COLOR_TYPES.map((colorType) => ({
    id: `itm-${preset.name}-${colorType}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: preset.name,
    icon: preset.icon,
    ownerId,
    colorType,
  }));
});

export const DEFAULT_STATE = {
  owners: DEFAULT_OWNERS,
  items: DEFAULT_ITEMS,
  counts: {},
  sessions: [],
};
