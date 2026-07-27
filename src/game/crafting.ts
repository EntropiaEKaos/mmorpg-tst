export interface Recipe {
  id: string;
  name: string;
  icon: string;
  ingredients: Array<{ name: string; quantity: number }>;
  result: { name: string; icon: string; quantity: number; description?: string; value: number };
  profession?: 'miner' | 'herbalist' | 'fisher';
  levelRequired: number;
}

export const RECIPES: Recipe[] = [
  // Basic
  {
    id: 'health_potion',
    name: 'Health Potion',
    icon: '🧪',
    ingredients: [{ name: 'Cheese', quantity: 2 }],
    result: { name: 'Health Potion', icon: '🧪', quantity: 1, description: 'Restores 50 HP', value: 50 },
    levelRequired: 1,
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    icon: '🧴',
    ingredients: [{ name: 'Snake Skin', quantity: 2 }],
    result: { name: 'Mana Potion', icon: '🧴', quantity: 1, description: 'Restores 50 Mana', value: 50 },
    levelRequired: 1,
  },
  // Advanced
  {
    id: 'greater_health',
    name: 'Greater Health Potion',
    icon: '🍷',
    ingredients: [
      { name: 'Health Potion', quantity: 2 },
      { name: 'Meat', quantity: 1 },
    ],
    result: { name: 'Greater Health Potion', icon: '🍷', quantity: 1, description: 'Restores 200 HP', value: 150 },
    levelRequired: 5,
  },
  {
    id: 'amulet_loss',
    name: 'Amulet of Loss',
    icon: '📿',
    ingredients: [
      { name: 'Magic Rune', quantity: 2 },
      { name: 'Dragon Scale', quantity: 1 },
      { name: 'Gold', quantity: 1000 },
    ],
    result: { name: 'Amulet of Loss', icon: '📿', quantity: 1, description: 'Prevents XP loss on death', value: 2500 },
    levelRequired: 15,
  },
  {
    id: 'gold_conversion',
    name: 'Gold Bar',
    icon: '🟨',
    ingredients: [{ name: 'Gold', quantity: 100 }],
    result: { name: 'Gold Bar', icon: '🟨', quantity: 1, description: '100 gold compressed', value: 100 },
    levelRequired: 1,
  },
  {
    id: 'trophy_orc',
    name: 'Orc Trophy',
    icon: '🏆',
    ingredients: [
      { name: 'Orc Tooth', quantity: 5 },
    ],
    result: { name: 'Orc Trophy', icon: '🏆', quantity: 1, description: 'Proof of your prowess', value: 200 },
    levelRequired: 10,
  },
];

export function canCraft(recipe: Recipe, inventory: Array<{ name: string; quantity: number }>, level: number): boolean {
  if (level < recipe.levelRequired) return false;
  for (const ing of recipe.ingredients) {
    const have = inventory.find((i) => i.name === ing.name);
    if (!have || have.quantity < ing.quantity) return false;
  }
  return true;
}
