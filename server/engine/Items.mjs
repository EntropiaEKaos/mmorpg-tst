// ===================================================================
//  MOR'IA SERVER — ITEMS & LOOT (Authoritative)
//  The server decides what drops and what stats items have.
// ===================================================================

import { rollEquipmentAffixes, rollRegionalMaterial } from './Itemization.mjs';

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

const VALID_EQUIPMENT_SLOTS = new Set(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'ring2', 'amulet', 'cloak', 'belt', 'gloves', 'relic']);
const VALID_RARITIES = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary']);

function finiteStat(value, fallback = 0, max = 1_000_000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;
}

export function buildEquipmentLootPool(contentItems = []) {
  const byId = new Map(EQUIPMENT_LOOT.map(item => [item.id, { ...item }]));
  if (!Array.isArray(contentItems)) return Array.from(byId.values());

  for (const raw of contentItems) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) continue;
    if (typeof raw.slot !== 'string' || !VALID_EQUIPMENT_SLOTS.has(raw.slot)) continue;
    const id = raw.id.trim().slice(0, 100);
    const rarity = typeof raw.rarity === 'string' && VALID_RARITIES.has(raw.rarity) ? raw.rarity : 'common';
    const item = {
      id,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 100) : id,
      icon: typeof raw.icon === 'string' && raw.icon ? raw.icon.slice(0, 8) : '⚔',
      slot: raw.slot,
      rarity,
      level: Math.max(1, Math.floor(finiteStat(raw.level, 1, 100_000))),
      value: Math.floor(finiteStat(raw.value, 0, 100_000_000)),
    };
    for (const stat of ['attack', 'defense', 'armor', 'hp', 'mana', 'magic', 'critChance', 'lifesteal', 'thorns', 'moveSpeed', 'xpBonus', 'goldBonus', 'damageReduction']) {
      const value = finiteStat(raw[stat], 0, 1_000_000);
      if (value > 0) item[stat] = value;
    }
    if (typeof raw.description === 'string' && raw.description.trim()) item.description = raw.description.trim().slice(0, 500);
    byId.set(id, item);
  }
  return Array.from(byId.values());
}

export function rollContentLootTable(monster, contentItems = [], lootTables = [], random = Math.random) {
  const tableId = typeof monster?.lootTableId === 'string' ? monster.lootTableId : '';
  const table = Array.isArray(lootTables) ? lootTables.find(entry => entry?.id === tableId) : null;
  if (!table || !Array.isArray(table.entries)) return [];
  const pool = buildEquipmentLootPool(contentItems);
  const drops = [];
  const rolls = Math.max(1, Math.min(10, Math.floor(Number(table.rolls) || 1)));
  for (let roll = 0; roll < rolls; roll++) {
    for (const entry of table.entries) {
      const chance = Math.max(0, Math.min(1, Number(entry?.chance) || 0));
      if (chance <= 0 || random() >= chance) continue;
      const min = Math.max(1, Math.floor(Number(entry.min) || 1));
      const max = Math.max(min, Math.min(9999, Math.floor(Number(entry.max) || min)));
      const quantity = min + Math.floor(random() * (max - min + 1));
      const base = entry.itemId ? pool.find(item => item.id === entry.itemId) : null;
      if (base) {
        const item = rollEquipmentAffixes(base, monster.level, random);
        drops.push({ id:`loot_${Date.now()}_${random()}`, name:item.name, icon:item.icon, quantity:1, value:item.value, type:'equipment', rarity:item.rarity, description:item.description, equipment:{...item,sockets:item.rarity==='legendary'?1:0,socketedGems:[]} });
      } else {
        const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0,100) : 'Regional Material';
        drops.push({ id:`loot_${Date.now()}_${random()}`, name, icon:typeof entry.icon==='string'&&entry.icon?entry.icon.slice(0,8):'📦', quantity, value:Math.max(0,Math.floor(Number(entry.value)||0)), type:typeof entry.type==='string'&&entry.type?entry.type:'misc' });
      }
    }
  }
  return drops.slice(0, 12);
}

export function rollLoot(monster, goldBonus = 0, contentItems = [], mapId = monster?.mapId, lootTables = []) {
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

  const beastLike=/wolf|stag|boar|bear|hound|raven|stalker/i.test(String(monster?.name||''));
  if(beastLike && Math.random()<0.30) drops.push({id:`hide_${Date.now()}_${Math.random()}`,name:'Beast Hide',icon:'◩',quantity:monster.type==='boss'?3:monster.type==='elite'?2:1,value:24,type:'material'});

  const equipChance = monster.type === 'boss' ? 0.8 : monster.type === 'elite' ? 0.3 : 0.04;
  if (Math.random() < equipChance) {
    // Pick a valid item based on monster level
    const eligible = buildEquipmentLootPool(contentItems).filter(e => e.level <= monster.level + 3);
    if (eligible.length > 0) {
      const baseDrop = eligible[Math.floor(Math.random() * eligible.length)];
      const drop = rollEquipmentAffixes(baseDrop, monster.level, Math.random);
      drops.push({
        id: `eq_${Date.now()}_${Math.random()}`, name: drop.name, icon: drop.icon, quantity: 1, value: drop.value, type: 'equipment',
        rarity: drop.rarity, description: drop.description,
        equipment: { ...drop, sockets: drop.rarity === 'legendary' ? 1 : 0, socketedGems: [] }
      });
    }
  }
  const regional = rollRegionalMaterial(mapId, monster, Math.random);
  if (regional) drops.push(regional);
  drops.push(...rollContentLootTable(monster, contentItems, lootTables, Math.random));
  return drops;
}
