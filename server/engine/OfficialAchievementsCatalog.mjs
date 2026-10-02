// ===================================================================
// MOR'IA — AUTHORITATIVE ACHIEVEMENTS CATALOG
// Migration source of truth for legacy + ISO achievements.
// Conditions are evaluated only by the authoritative server domain.
// ===================================================================

const stat = (p, key) => Number(p?.stats?.[key] || 0);
const wealth = p => Number(p?.gold || 0) + Number(p?.bankGold || 0);

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_blood', name: 'First Blood', description: 'Kill your first monster', icon: '🗡', category: 'combat', test: p => stat(p, 'monstersKilled') >= 1, reward: { xp: 50 }, coins: 2 },
  { id: 'hunter_10', name: 'Novice Hunter', description: 'Kill 10 monsters', icon: '🏹', category: 'combat', test: p => stat(p, 'monstersKilled') >= 10, reward: { xp: 150, gold: 50 }, coins: 0 },
  { id: 'hunter_25', name: 'Monster Hunter', description: 'Kill 25 monsters', icon: '🏹', category: 'combat', test: p => stat(p, 'monstersKilled') >= 25, reward: {}, coins: 5 },
  { id: 'hunter_100', name: 'Master Hunter', description: 'Kill 100 monsters', icon: '⚔', category: 'combat', test: p => stat(p, 'monstersKilled') >= 100, reward: { xp: 1000, gold: 500 }, coins: 15 },
  { id: 'slayer', name: 'Slayer', description: 'Kill 500 monsters', icon: '💀', category: 'combat', test: p => stat(p, 'monstersKilled') >= 500, reward: { xp: 5000, title: 'Slayer' }, coins: 0 },
  { id: 'first_boss', name: 'Boss Killer', description: 'Defeat your first boss', icon: '👑', category: 'combat', test: p => stat(p, 'bossesKilled') >= 1, reward: { xp: 500, gold: 300, title: 'Champion' }, coins: 0 },
  { id: 'dragon_slayer', name: 'Dragon Slayer', description: 'Defeat the Dragon Lord', icon: '🐉', category: 'combat', test: p => Array.isArray(p?.achievements) && p.achievements.includes('dragon_slayer_temp'), reward: { xp: 10000, title: 'Dragon Slayer' }, coins: 0 },
  { id: 'level_5', name: 'Adventurer', description: 'Reach level 5', icon: '⭐', category: 'progress', test: p => Number(p?.level || 0) >= 5, reward: { xp: 100, gold: 100 }, coins: 0 },
  { id: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🌟', category: 'progress', test: p => Number(p?.level || 0) >= 10, reward: { xp: 500, gold: 300, title: 'Veteran' }, coins: 8 },
  { id: 'level_20', name: 'Hero', description: 'Reach level 20', icon: '✨', category: 'progress', test: p => Number(p?.level || 0) >= 20, reward: { xp: 2000, gold: 1000, title: 'Hero' }, coins: 0 },
  { id: 'level_30', name: 'Legend', description: 'Reach level 30', icon: '👑', category: 'progress', test: p => Number(p?.level || 0) >= 30, reward: { xp: 10000, gold: 5000, title: 'Legend' }, coins: 0 },
  { id: 'rich', name: 'Wealthy', description: 'Accumulate 1000 gold', icon: '💰', category: 'collection', test: p => wealth(p) >= 1000, reward: { title: 'Wealthy' }, coins: 0 },
  { id: 'rich_1000', name: 'Deep Pockets', description: 'Earn 1000 gold', icon: '🪙', category: 'collection', test: p => stat(p, 'goldEarned') >= 1000, reward: {}, coins: 6 },
  { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 10000 gold', icon: '💎', category: 'collection', test: p => wealth(p) >= 10000, reward: { title: 'Millionaire' }, coins: 0 },
  { id: 'walker', name: 'Explorer', description: 'Walk 500 tiles', icon: '🥾', category: 'exploration', test: p => stat(p, 'distanceWalked') >= 500, reward: { xp: 200 }, coins: 0 },
  { id: 'wanderer', name: 'Wanderer', description: 'Walk 2000 tiles', icon: '🗺', category: 'exploration', test: p => stat(p, 'distanceWalked') >= 2000, reward: { xp: 1000, title: 'Wanderer' }, coins: 0 },
  { id: 'tank', name: 'Iron Hide', description: 'Take 1000 damage', icon: '🛡', category: 'combat', test: p => stat(p, 'damageTaken') >= 1000, reward: { xp: 500 }, coins: 0 },
  { id: 'destroyer', name: 'Destroyer', description: 'Deal 5000 damage', icon: '💥', category: 'combat', test: p => stat(p, 'damageDealt') >= 5000, reward: { xp: 1000, title: 'Destroyer' }, coins: 0 },
  { id: 'healer', name: 'Healer', description: 'Heal 500 HP', icon: '💚', category: 'combat', test: p => stat(p, 'healingDone') >= 500, reward: { xp: 300 }, coins: 0 },
  { id: 'survivor', name: 'Survivor', description: 'Die 3 times', icon: '☠', category: 'combat', test: p => stat(p, 'deaths') >= 3, reward: { xp: 100, title: 'Survivor' }, coins: 0 },
  { id: 'mage', name: 'Spellcaster', description: 'Cast 100 spells', icon: '🔮', category: 'combat', test: p => stat(p, 'spellsCast') >= 100, reward: { xp: 500, title: 'Mage' }, coins: 0 },
  { id: 'dungeon_clear', name: 'Dungeon Delver', description: 'Clear three dungeon waves', icon: '🌀', category: 'dungeon', test: p => Number(p?.official?.dungeon?.highestWave || 0) >= 3, reward: {}, coins: 10 },
]);

export const ACHIEVEMENT_IDS = Object.freeze(ACHIEVEMENTS.map(entry => entry.id));
