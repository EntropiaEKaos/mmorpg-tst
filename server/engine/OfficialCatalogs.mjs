// ===================================================================
// MOR'IA — OFFICIAL IMMUTABLE CATALOGS
// Pure declarative game data shared by official domains. Runtime mutations,
// player state and persistence intentionally do not belong in this module.
// ===================================================================

export const OFFICIAL_PETS = Object.freeze([
  { id: 'wolf_pup', name: 'Wolf Pup', icon: '🐺', color: '#8a8a8a', attack: 8, price: 500, levelRequired: 3 },
  { id: 'boar', name: 'Wild Boar', icon: '🐗', color: '#6a4a3a', attack: 12, price: 1500, levelRequired: 8 },
  { id: 'panther', name: 'Shadow Panther', icon: '🐆', color: '#2a2a2a', attack: 18, price: 3000, levelRequired: 12 },
  { id: 'bear_cub', name: 'Bear Companion', icon: '🐻', color: '#5a3a1e', attack: 22, price: 5000, levelRequired: 16 },
  { id: 'phoenix', name: 'Phoenix', icon: '🔥', color: '#ff6a00', attack: 30, price: 8000, levelRequired: 20 },
  { id: 'mini_dragon', name: 'Baby Dragon', icon: '🐉', color: '#c13030', attack: 40, price: 15000, levelRequired: 25 },
]);

export const OFFICIAL_GEMS = Object.freeze([
  { id: 'ruby_t1', name: 'Chipped Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'sapphire_t1', name: 'Chipped Sapphire', icon: '🔵', color: '#3030ff', stat: 'defense', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'emerald_t1', name: 'Chipped Emerald', icon: '🟢', color: '#30ff30', stat: 'magic', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'ruby_t2', name: 'Flawed Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 7, tier: 2, rarity: 'rare' },
  { id: 'topaz_t2', name: 'Flawed Topaz', icon: '🟡', color: '#ffd030', stat: 'crit', value: 4, tier: 2, rarity: 'rare' },
  { id: 'garnet_t2', name: 'Flawed Garnet', icon: '🔴', color: '#ff6060', stat: 'hp', value: 30, tier: 2, rarity: 'rare' },
  { id: 'ruby_t3', name: 'Flawless Ruby', icon: '♦', color: '#ff1010', stat: 'attack', value: 15, tier: 3, rarity: 'epic' },
  { id: 'amethyst_t3', name: 'Flawless Amethyst', icon: '🟣', color: '#a030ff', stat: 'lifesteal', value: 4, tier: 3, rarity: 'epic' },
  { id: 'diamond_t3', name: 'Flawless Diamond', icon: '💎', color: '#ffffff', stat: 'speed', value: 6, tier: 3, rarity: 'epic' },
  { id: 'soul_gem', name: 'Soul Gem', icon: '💠', color: '#00ffff', stat: 'magic', value: 20, tier: 4, rarity: 'legendary' },
  { id: 'star_ruby', name: 'Star Ruby', icon: '🌟', color: '#ff5050', stat: 'attack', value: 25, tier: 4, rarity: 'legendary' },
]);

export const OFFICIAL_SHOP = Object.freeze([
  { id: 'health_potion', name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' },
  { id: 'mana_potion', name: 'Mana Potion', icon: '🧴', type: 'potion', price: 50, description: 'Restores 50 Mana' },
  { id: 'greater_health', name: 'Greater Health Potion', icon: '🍷', type: 'potion', price: 150, levelRequired: 5, description: 'Restores 200 HP' },
  { id: 'cheese', name: 'Cheese', icon: '🧀', type: 'material', price: 15 },
  { id: 'snake_skin', name: 'Snake Skin', icon: '🐍', type: 'material', price: 25 },
  { id: 'magic_rune', name: 'Magic Rune', icon: '📜', type: 'material', price: 250, levelRequired: 10 },
]);

export const OFFICIAL_FOOD = Object.freeze([
  { id: 'war_stew', name: 'War Stew', icon: '🍲', price: 80, levelRequired: 1, buffType: 'official_attack', value: 10, description: '+10% attack for 10 minutes' },
  { id: 'guardian_bread', name: 'Guardian Bread', icon: '🥖', price: 80, levelRequired: 1, buffType: 'official_defense', value: 8, description: '+8% damage reduction for 10 minutes' },
  { id: 'sage_tea', name: 'Sage Tea', icon: '🍵', price: 120, levelRequired: 5, buffType: 'official_xp', value: 10, description: '+10% XP for 10 minutes' },
]);

export const OFFICIAL_RECIPES = Object.freeze([
  { id: 'health_potion', name: 'Health Potion', icon: '🧪', levelRequired: 1, ingredients: [{ name: 'Cheese', quantity: 2 }], result: { name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 1, value: 50, description: 'Restores 50 HP' } },
  { id: 'mana_potion', name: 'Mana Potion', icon: '🧴', levelRequired: 1, ingredients: [{ name: 'Snake Skin', quantity: 2 }], result: { name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 1, value: 50, description: 'Restores 50 Mana' } },
  { id: 'greater_health', name: 'Greater Health Potion', icon: '🍷', levelRequired: 5, ingredients: [{ name: 'Health Potion', quantity: 2 }, { name: 'Meat', quantity: 1 }], result: { name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 1, value: 150, description: 'Restores 200 HP' } },
  { id: 'gold_bar', name: 'Gold Bar', icon: '🟨', levelRequired: 1, ingredients: [{ name: 'Gold', quantity: 100 }], result: { name: 'Gold Bar', icon: '🟨', type: 'misc', quantity: 1, value: 100 } },
  { id: 'orc_trophy', name: 'Orc Trophy', icon: '🏆', levelRequired: 10, ingredients: [{ name: 'Orc Tooth', quantity: 5 }], result: { name: 'Orc Trophy', icon: '🏆', type: 'misc', quantity: 1, value: 200, description: 'Proof of your prowess' } },
  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', levelRequired: 15, ingredients: [{ name: 'Magic Rune', quantity: 2 }, { name: 'Dragon Scale', quantity: 1 }, { name: 'Gold', quantity: 1000 }], result: { name: 'Amulet of Loss', icon: '📿', type: 'equipment', quantity: 1, value: 2500, equipment: { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 15, value: 2500, sockets: 1, socketedGems: [] } } },
  { id: 'verdant_sapphire', name: 'Verdant Sapphire', icon: '🔵', levelRequired: 6, ingredients: [{ name: 'Verdant Fiber', quantity: 4 }, { name: 'Gold', quantity: 120 }], result: { name: 'Chipped Sapphire', icon: '🔵', type: 'gem', gemId: 'sapphire_t1', quantity: 1, value: 120 } },
  { id: 'frost_ruby', name: 'Frost-tempered Ruby', icon: '🔴', levelRequired: 10, ingredients: [{ name: 'Frost Crystal', quantity: 4 }, { name: 'Gold', quantity: 240 }], result: { name: 'Flawed Ruby', icon: '🔴', type: 'gem', gemId: 'ruby_t2', quantity: 1, value: 280 } },
  { id: 'bog_garnet', name: 'Bogheart Garnet', icon: '🔴', levelRequired: 12, ingredients: [{ name: 'Bog Essence', quantity: 4 }, { name: 'Gold', quantity: 300 }], result: { name: 'Flawed Garnet', icon: '🔴', type: 'gem', gemId: 'garnet_t2', quantity: 1, value: 340 } },
  { id: 'cinder_topaz', name: 'Cinder Topaz', icon: '🟡', levelRequired: 15, ingredients: [{ name: 'Cinder Ore', quantity: 5 }, { name: 'Gold', quantity: 450 }], result: { name: 'Flawed Topaz', icon: '🟡', type: 'gem', gemId: 'topaz_t2', quantity: 1, value: 500 } },
  { id: 'void_soul_gem', name: 'Void-forged Soul Gem', icon: '💠', levelRequired: 25, ingredients: [{ name: 'Void Shard', quantity: 6 }, { name: 'Frost Crystal', quantity: 2 }, { name: 'Cinder Ore', quantity: 2 }, { name: 'Gold', quantity: 1200 }], result: { name: 'Soul Gem', icon: '💠', type: 'gem', gemId: 'soul_gem', quantity: 1, value: 1500 } },
]);

export const OFFICIAL_COIN_STORE = Object.freeze([
  { id: 'supplies', name: 'Adventurer Supplies', icon: '🎒', price: 20, description: '5 Health + 5 Mana potions' },
  { id: 'equipment_cache', name: 'Equipment Cache', icon: '🎁', price: 100, description: 'Level-appropriate equipment with a chance for a socket' },
  { id: 'blessing', name: 'Blessing of Mor\'ia', icon: '✨', price: 60, description: '1 hour: +5% XP, +5% damage reduction, half death XP loss' },
  { id: 'title_shadow', name: 'Shadow Walker Title', icon: '🌑', price: 80, description: 'Permanent cosmetic title' },
]);

export const OFFICIAL_BOOKS = Object.freeze([
  { id: 'chronicle_eldoria', title: 'Chronicle of Eldoria', icon: '📕', author: 'The Chronicler', pages: ['Eldoria was raised around a spring older than the first crown.', 'Every road from the city eventually bends toward danger — and opportunity.'] },
  { id: 'frostpeak_watch', title: 'The Frostpeak Watch', icon: '📘', author: 'Captain Rime', pages: ['The mountain remembers every footprint.', 'Wolves are not the greatest danger in Frostpeak. Silence is.'] },
  { id: 'shadowfen_notes', title: 'Notes from Shadowfen', icon: '📗', author: 'Mara Vell', pages: ['The fen glows at night where old bones sleep.', 'Orcs mark safe ground with three cuts in dead trees.'] },
  { id: 'void_testament', title: 'Void Testament', icon: '📓', author: 'Unknown', pages: ['There are stars beneath the Voidlands.', 'Do not answer when the darkness speaks your name.'] },
]);

export const MYSTERIES = Object.freeze([
  {
    id: 'lost_tome', name: 'The Lost Tome of Eldoria', icon: '📖', requiredLevel: 5,
    rewardGold: 500, rewardXp: 800, rewardItem: { name: 'Ancient Rune', icon: '📜', value: 300 },
    intro: 'An ancient tome was hidden by the Archmage centuries ago. Its seal yields only to riddles.',
    chapters: [
      { clue: 'I am born of the heavens, yet I burn all I touch.', riddle: 'What am I?', answer: 'lightning', hint: 'It comes from storms in the sky.' },
      { clue: 'I have a heart that does not beat. A home but no doors.', riddle: 'What am I?', answer: 'artichoke', hint: 'It is a vegetable.' },
      { clue: 'I guard the tome. Speak the secret word of the realm.', riddle: 'What is the secret word?', answer: 'moria', hint: 'The realm itself.' },
    ],
  },
  {
    id: 'frostpeak_phantom', name: 'The Phantom of Frostpeak', icon: '👻', requiredLevel: 10,
    rewardGold: 750, rewardXp: 1000, rewardItem: { name: 'Frozen Heart', icon: '💙', value: 500 },
    intro: 'A wailing phantom haunts the frozen pass and asks travelers to remember what it forgot.',
    chapters: [
      { clue: 'The more you take, the more you leave behind.', riddle: 'What am I?', answer: 'footsteps', hint: 'You make them when you walk.' },
      { clue: 'Cold to the touch, warm to memory, melting in the hand.', riddle: 'What am I?', answer: 'snow', hint: 'It falls in Frostpeak.' },
      { clue: 'In life I kept the mountain pass.', riddle: 'What was I?', answer: 'guard', hint: 'One who watches and defends.' },
    ],
  },
]);

export const DUNGEON_WAVES = Object.freeze([
  { name: 'Dungeon Rat', emoji: '🐀', color: '#8b6f47', hp: 30, attack: 6, defense: 2, xp: 15, count: 3 },
  { name: 'Dungeon Bat', emoji: '🦇', color: '#3a2a3a', hp: 45, attack: 9, defense: 2, xp: 22, count: 4 },
  { name: 'Skeleton', emoji: '💀', color: '#d4d4c8', hp: 70, attack: 14, defense: 4, xp: 40, count: 4 },
  { name: 'Zombie', emoji: '🧟', color: '#4a6a3a', hp: 110, attack: 18, defense: 5, xp: 60, count: 5 },
  { name: 'Ghost', emoji: '👻', color: '#ccccff', hp: 130, attack: 24, defense: 4, xp: 80, count: 5 },
  { name: 'Orc Berserker', emoji: '👹', color: '#3a4d13', hp: 180, attack: 30, defense: 8, xp: 110, count: 5 },
  { name: 'Demon', emoji: '😈', color: '#c13030', hp: 260, attack: 42, defense: 12, xp: 180, count: 4 },
  { name: 'Hellhound', emoji: '🐕', color: '#8b0000', hp: 320, attack: 50, defense: 14, xp: 250, count: 5 },
  { name: 'Dragon', emoji: '🐉', color: '#c13030', hp: 450, attack: 60, defense: 18, xp: 400, count: 3 },
  { name: 'Dungeon Warden', emoji: '👹', color: '#8b0000', hp: 1200, attack: 80, defense: 25, xp: 2000, count: 1, boss: true },
]);

export const DEFAULT_EVENTS = Object.freeze([
  { id: 'eldoria_vermin', name: 'Vermin Tide', icon: '🐀', mapId: 'eldoria', target: 'rat', needed: 30, rewardGold: 300, rewardXp: 180, rewardCoins: 8 },
  { id: 'frostpeak_pack', name: 'Howl Over Frostpeak', icon: '🐺', mapId: 'frostpeak', target: 'wolf', needed: 25, rewardGold: 450, rewardXp: 260, rewardCoins: 10 },
  { id: 'shadowfen_raiders', name: 'Raiders of the Fen', icon: '👹', mapId: 'shadowfen', target: 'orc', needed: 24, rewardGold: 650, rewardXp: 400, rewardCoins: 12 },
  { id: 'emberhold_breach', name: 'Emberhold Breach', icon: '😈', mapId: 'emberhold', target: 'demon', needed: 14, rewardGold: 1000, rewardXp: 700, rewardCoins: 16 },
  { id: 'void_echoes', name: 'Echoes of the Void', icon: '👻', mapId: 'voidlands', target: 'ghost', needed: 20, rewardGold: 1200, rewardXp: 850, rewardCoins: 18 },
]);

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_blood', name: 'First Blood', icon: '⚔', test: (p) => (p.stats?.monstersKilled || 0) >= 1, coins: 2 },
  { id: 'hunter_25', name: 'Monster Hunter', icon: '🏹', test: (p) => (p.stats?.monstersKilled || 0) >= 25, coins: 5 },
  { id: 'hunter_100', name: 'Centurion', icon: '💯', test: (p) => (p.stats?.monstersKilled || 0) >= 100, coins: 15 },
  { id: 'level_10', name: 'Seasoned Adventurer', icon: '⭐', test: (p) => p.level >= 10, coins: 8 },
  { id: 'rich_1000', name: 'Deep Pockets', icon: '🪙', test: (p) => (p.stats?.goldEarned || 0) >= 1000, coins: 6 },
  { id: 'dungeon_clear', name: 'Dungeon Delver', icon: '🌀', test: (p) => (p.official?.dungeon?.highestWave || 0) >= 3, coins: 10 },
]);

export const SETS = Object.freeze([
  { pieces: ['dragon_slayer', 'dragon_mail', 'dragon_shield'], bonuses: [{ at: 2, damage: 10 }, { at: 3, damage: 5, lifesteal: 5 }] },
  { pieces: ['excalibur', 'crown'], bonuses: [{ at: 2, xp: 15, gold: 10 }] },
  { pieces: ['magic_staff', 'scholar_belt', 'sage_ring', 'xp_amulet'], bonuses: [{ at: 2, magicPct: 12 }, { at: 3, xp: 15, mana: 50 }, { at: 4, crit: 10 }] },
  { pieces: ['boots_haste', 'swift_gloves', 'stealth_cloak', 'swift_legs'], bonuses: [{ at: 2, speed: 15 }, { at: 3, crit: 8 }, { at: 4, damage: 10 }] },
  { pieces: ['plate_armor', 'tower_shield', 'gauntlets', 'strength_belt'], bonuses: [{ at: 2, reduction: 10 }, { at: 3, thorns: 6 }, { at: 4, hp: 100 }] },
  { pieces: ['vamp_blade', 'vamp_cloak', 'vamp_ring'], bonuses: [{ at: 2, lifesteal: 8 }, { at: 3, crit: 10 }] },
  { pieces: ['greed_helm', 'gold_amulet', 'lucky_charm'], bonuses: [{ at: 2, gold: 20 }, { at: 3, xp: 10 }] },
]);
