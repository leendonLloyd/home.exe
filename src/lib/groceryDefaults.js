// Aisles rather than food groups: the list is read while walking a shop, so
// the order that matters is the order you pass things.
export const AISLES = [
  { id: 'produce', label: 'Produce', tint: '#2a9d80' },
  { id: 'meat', label: 'Meat & Fish', tint: '#d0642c' },
  { id: 'dairy', label: 'Dairy & Eggs', tint: '#2f8fc4' },
  { id: 'bakery', label: 'Bakery', tint: '#c88413' },
  { id: 'pantry', label: 'Pantry', tint: '#8a4fd6' },
  { id: 'frozen', label: 'Frozen', tint: '#4d5fe3' },
  { id: 'household', label: 'Household', tint: '#6c7789' },
];

export const GROCERY_PRESETS = [
  { name: 'Milk', icon: 'milk', aisle: 'dairy' },
  { name: 'Eggs', icon: 'egg', aisle: 'dairy' },
  { name: 'Bread', icon: 'bread', aisle: 'bakery' },
  { name: 'Rice', icon: 'can', aisle: 'pantry' },
  { name: 'Chicken', icon: 'meat', aisle: 'meat' },
  { name: 'Pork', icon: 'meat', aisle: 'meat' },
  { name: 'Fish', icon: 'meat', aisle: 'meat' },
  { name: 'Bananas', icon: 'apple', aisle: 'produce' },
  { name: 'Onions', icon: 'veg', aisle: 'produce' },
  { name: 'Garlic', icon: 'veg', aisle: 'produce' },
  { name: 'Tomatoes', icon: 'veg', aisle: 'produce' },
  { name: 'Cooking Oil', icon: 'bottle', aisle: 'pantry' },
  { name: 'Coffee', icon: 'can', aisle: 'pantry' },
  { name: 'Dish Soap', icon: 'bottle', aisle: 'household' },
  { name: 'Detergent', icon: 'bottle', aisle: 'household' },
  { name: 'Tissue', icon: 'can', aisle: 'household' },
];
