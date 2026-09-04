export const COLOR_TYPES = [
  { id: 'whites', label: 'Whites', tint: '#e8edf5' },
  { id: 'lights', label: 'Lights', tint: '#f4c77e' },
  { id: 'colors', label: 'Colors', tint: '#6ec1a8' },
  { id: 'darks', label: 'Darks', tint: '#7b8cff' },
  { id: 'delicates', label: 'Delicates', tint: '#f08fb6' },
];

export const OWNER_COLORS = ['#7b8cff', '#f08fb6', '#6ec1a8', '#f4c77e', '#8fd0f0', '#c89bf5', '#f79b72', '#9ad46a'];

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
