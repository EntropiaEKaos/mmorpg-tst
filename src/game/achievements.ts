import type { Achievement, Player } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Kill your first monster', icon: '🗡', category: 'combat', condition: (p) => p.stats.monstersKilled >= 1, reward: { xp: 50 } },
  { id: 'hunter_10', name: 'Novice Hunter', description: 'Kill 10 monsters', icon: '🏹', category: 'combat', condition: (p) => p.stats.monstersKilled >= 10, reward: { xp: 150, gold: 50 } },
  { id: 'hunter_100', name: 'Master Hunter', description: 'Kill 100 monsters', icon: '⚔', category: 'combat', condition: (p) => p.stats.monstersKilled >= 100, reward: { xp: 1000, gold: 500 } },
  { id: 'slayer', name: 'Slayer', description: 'Kill 500 monsters', icon: '💀', category: 'combat', condition: (p) => p.stats.monstersKilled >= 500, reward: { xp: 5000, title: 'Slayer' } },
  { id: 'first_boss', name: 'Boss Killer', description: 'Defeat your first boss', icon: '👑', category: 'combat', condition: (p) => p.stats.bossesKilled >= 1, reward: { xp: 500, gold: 300, title: 'Champion' } },
  { id: 'dragon_slayer', name: 'Dragon Slayer', description: 'Defeat the Dragon Lord', icon: '🐉', category: 'combat', condition: (p) => p.achievements.includes('dragon_slayer_temp'), reward: { xp: 10000, title: 'Dragon Slayer' } },
  { id: 'level_5', name: 'Adventurer', description: 'Reach level 5', icon: '⭐', category: 'progress', condition: (p) => p.level >= 5, reward: { xp: 100, gold: 100 } },
  { id: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🌟', category: 'progress', condition: (p) => p.level >= 10, reward: { xp: 500, gold: 300, title: 'Veteran' } },
  { id: 'level_20', name: 'Hero', description: 'Reach level 20', icon: '✨', category: 'progress', condition: (p) => p.level >= 20, reward: { xp: 2000, gold: 1000, title: 'Hero' } },
  { id: 'level_30', name: 'Legend', description: 'Reach level 30', icon: '👑', category: 'progress', condition: (p) => p.level >= 30, reward: { xp: 10000, gold: 5000, title: 'Legend' } },
  { id: 'rich', name: 'Wealthy', description: 'Accumulate 1000 gold', icon: '💰', category: 'collection', condition: (p) => p.gold + p.bankGold >= 1000, reward: { title: 'Wealthy' } },
  { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 10000 gold', icon: '💎', category: 'collection', condition: (p) => p.gold + p.bankGold >= 10000, reward: { title: 'Millionaire' } },
  { id: 'walker', name: 'Explorer', description: 'Walk 500 tiles', icon: '🥾', category: 'exploration', condition: (p) => p.stats.distanceWalked >= 500, reward: { xp: 200 } },
  { id: 'wanderer', name: 'Wanderer', description: 'Walk 2000 tiles', icon: '🗺', category: 'exploration', condition: (p) => p.stats.distanceWalked >= 2000, reward: { xp: 1000, title: 'Wanderer' } },
  { id: 'tank', name: 'Iron Hide', description: 'Take 1000 damage', icon: '🛡', category: 'combat', condition: (p) => p.stats.damageTaken >= 1000, reward: { xp: 500 } },
  { id: 'destroyer', name: 'Destroyer', description: 'Deal 5000 damage', icon: '💥', category: 'combat', condition: (p) => p.stats.damageDealt >= 5000, reward: { xp: 1000, title: 'Destroyer' } },
  { id: 'healer', name: 'Healer', description: 'Heal 500 HP', icon: '💚', category: 'combat', condition: (p) => p.stats.healingDone >= 500, reward: { xp: 300 } },
  { id: 'survivor', name: 'Survivor', description: 'Die 3 times', icon: '☠', category: 'combat', condition: (p) => p.stats.deaths >= 3, reward: { xp: 100, title: 'Survivor' } },
  { id: 'mage', name: 'Spellcaster', description: 'Cast 100 spells', icon: '🔮', category: 'combat', condition: (p) => p.stats.spellsCast >= 100, reward: { xp: 500, title: 'Mage' } },
];

export function checkAchievements(player: Player): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !player.achievements.includes(a.id) && a.condition(player)
  );
}
