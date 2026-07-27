// ===================================================================
//  MOR'IA SERVER — ITEMS & LOOT (Authoritative)
//  The server decides what drops and what stats items have.
// ===================================================================

export const RARITY_COLORS = {
  common: '#aaaaaa', uncommon: '#2ecc71', rare: '#3498db', epic: '#9b59ff', legendary: '#ff8c00',
};

export const EQUIPMENT_LOOT = [
  { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 },
  { id: 'magic_staff', name: 'Magic Staff', icon: '🪄', slot: 'weapon', attack: 8, magic: 5, mana: 20, rarity: 'rare', level: 8, value: 350 },
  { id: 'dragon_slayer', name: 'Dragon Slayer', icon: '🔪', slot: 'weapon', attack: 25, rarity: 'epic', level: 15, value: 1200 },
  { id: 'excalibur', name: 'Excalibur', icon: '⚔', slot: 'weapon', attack: 45, hp: 50, critChance: 5, lifesteal: 3, rarity: 'legendary', level: 25, value: 5000, description: 'The legendary sword of kings.' },
  { id: 'leather_armor', name: 'Leather Armor', icon: '🎽', slot: 'armor', armor: 8, rarity: 'uncommon', level: 3, value: 150 },
  { id: 'plate_armor', name: 'Plate Armor', icon: '🛡', slot: 'armor', armor: 15, defense: 3, rarity: 'rare', level: 10, value: 500 },
  { id: 'dragon_mail', name: 'Dragon Mail', icon: '🎽', slot: 'armor', armor: 28, hp: 40, damageReduction: 5, rarity: 'epic', level: 18, value: 2000 },
  { id: 'iron_helm', name: 'Iron Helmet', icon: '⛑', slot: 'helmet', armor: 5, rarity: 'common', level: 2, value: 80 },
  { id: 'crown', name: 'Crown of Kings', icon: '👑', slot: 'helmet', armor: 12, magic: 8, mana: 30, xpBonus: 5, goldBonus: 5, rarity: 'legendary', level: 20, value: 3500 },
  { id: 'steel_legs', name: 'Steel Legs', icon: '🦿', slot: 'legs', armor: 7, rarity: 'uncommon', level: 5, value: 180 },
  { id: 'boots_haste', name: 'Boots of Haste', icon: '👢', slot: 'boots', armor: 2, moveSpeed: 15, rarity: 'rare', level: 10, value: 400, description: '+15% movement speed' },
  { id: 'tower_shield', name: 'Tower Shield', icon: '🛡', slot: 'shield', defense: 10, armor: 5, rarity: 'rare', level: 8, value: 350 },
  { id: 'might_ring', name: 'Might Ring', icon: '💍', slot: 'ring', attack: 5, rarity: 'rare', level: 8, value: 400 },
  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 1, value: 2500, description: 'Prevents XP loss on death' },
];

export function getStarterInventory() {
  return [
    { id: `start_hp1`, name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 5, value: 50, description: 'Restores 50 HP' },
    { id: `start_mp1`, name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 3, value: 50, description: 'Restores 50 Mana' },
    {
      id: `start_sword`, name: 'Iron Sword', icon: '🗡', type: 'equipment', quantity: 1, value: 25,
      equipment: { id: 'iron_sword', name: 'Iron Sword', icon: '🗡', slot: 'weapon', attack: 5, rarity: 'common', level: 1, value: 25 }
    },
  ];
}

export function rollLoot(monster, goldBonus = 0) {
  const drops = [];
  const goldChance = monster.type === 'boss' ? 1 : monster.type === 'elite' ? 0.8 : 0.5;
  if (Math.random() < goldChance) {
    let goldAmount = monster.type === 'boss' ? monster.level * 100 : monster.level * 10;
    goldAmount = Math.floor(goldAmount * (1 + goldBonus / 100)); // apply gear/talent bonus
    drops.push({ id: `gold_${Date.now()}_${Math.random()}`, name: 'Gold', icon: '🪙', quantity: goldAmount, value: goldAmount, isGold: true, type: 'gold' });
  }

  if (Math.random() < 0.3) {
    const mats = ['Bone', 'Meat', 'Orc Tooth', 'Dragon Scale'];
    const mat = mats[Math.floor(Math.random() * mats.length)];
    drops.push({ id: `mat_${Date.now()}_${Math.random()}`, name: mat, icon: '🦴', quantity: 1, value: 10, type: 'misc' });
  }

  const equipChance = monster.type === 'boss' ? 0.8 : monster.type === 'elite' ? 0.3 : 0.04;
  if (Math.random() < equipChance) {
    // Pick a valid item based on monster level
    const eligible = EQUIPMENT_LOOT.filter(e => e.level <= monster.level + 3);
    if (eligible.length > 0) {
      const drop = eligible[Math.floor(Math.random() * eligible.length)];
      drops.push({
        id: `eq_${Date.now()}_${Math.random()}`, name: drop.name, icon: drop.icon, quantity: 1, value: drop.value, type: 'equipment',
        rarity: drop.rarity, description: drop.description,
        equipment: { ...drop, sockets: 0, socketedGems: [] }
      });
    }
  }
  return drops;
}
