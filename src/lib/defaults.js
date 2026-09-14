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

export const DEFAULT_STATE = {
  owners: [{ id: 'own-me', name: 'Me', color: OWNER_COLORS[0] }],
  items: [
    { id: 'itm-1', name: 'T-Shirt', icon: 'tshirt', ownerId: 'own-me', colorType: 'whites' },
    { id: 'itm-2', name: 'T-Shirt', icon: 'tshirt', ownerId: 'own-me', colorType: 'darks' },
    { id: 'itm-3', name: 'Pants', icon: 'pants', ownerId: 'own-me', colorType: 'darks' },
    { id: 'itm-4', name: 'Towel', icon: 'towel', ownerId: 'own-me', colorType: 'colors' },
  ],
  counts: {},
  sessions: [],
};
