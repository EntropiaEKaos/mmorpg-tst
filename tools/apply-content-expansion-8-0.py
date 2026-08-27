from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

CONTENT_PACKS = r'''// ===================================================================
// MOR'IA — BUNDLED CONTENT PACKS
// Versioned, one-shot content migrations for existing persistent servers.
// Admin edits win when an ID already exists; deleted pack content is not
// resurrected after the pack ID has been recorded as applied.
// ===================================================================

const clone = value => structuredClone(value);

const ELDORIA_BASE_PORTALS = Object.freeze([
  { x: 10, y: 40, targetMap: 'frostpeak', targetX: 70, targetY: 40, label: '❄ To Frostpeak' },
  { x: 70, y: 10, targetMap: 'shadowfen', targetX: 40, targetY: 70, label: '🍄 To Shadowfen' },
]);
const SHADOWFEN_BASE_PORTALS = Object.freeze([
  { x: 40, y: 75, targetMap: 'eldoria', targetX: 70, targetY: 12, label: '🌳 To Eldoria' },
  { x: 10, y: 10, targetMap: 'voidlands', targetX: 70, targetY: 70, label: '☠ To Voidlands' },
]);
const VOIDLANDS_BASE_PORTALS = Object.freeze([
  { x: 75, y: 75, targetMap: 'shadowfen', targetX: 12, targetY: 12, label: '🍄 To Shadowfen' },
]);

export const SHATTERED_FRONTIER_PACK_ID = 'shattered_frontier_8_0';

export const SHATTERED_FRONTIER_PACK = Object.freeze({
  id: SHATTERED_FRONTIER_PACK_ID,
  label: 'Shattered Frontier',
  collections: Object.freeze({
    maps: Object.freeze([
      { id: 'ironvale', name: 'Ironvale', biome: 'plains', description: 'A fortified mining frontier split by bandit roads and ancient stoneworks.', levelRequired: 18, seed: 80421, spawnX: 10, spawnY: 40, townX: 15, townY: 40, townRange: 7, portals: [
        { x: 5, y: 40, targetMap: 'eldoria', targetX: 68, targetY: 40, label: '🌳 To Eldoria' },
        { x: 70, y: 40, targetMap: 'ashenmoor', targetX: 10, targetY: 40, label: '🕯 To Ashenmoor' },
      ] },
      { id: 'ashenmoor', name: 'Ashenmoor', biome: 'swamp', description: 'A plague-soaked marsh where drowned fortresses and witch-lights hide old crimes.', levelRequired: 30, seed: 190731, spawnX: 10, spawnY: 40, townX: 15, townY: 40, townRange: 7, portals: [
        { x: 5, y: 40, targetMap: 'ironvale', targetX: 68, targetY: 40, label: '⛏ To Ironvale' },
        { x: 40, y: 75, targetMap: 'shadowfen', targetX: 68, targetY: 40, label: '🍄 To Shadowfen' },
        { x: 70, y: 10, targetMap: 'starfall', targetX: 10, targetY: 70, label: '🌠 To Starfall' },
      ] },
      { id: 'starfall', name: 'Starfall Expanse', biome: 'shadow', description: 'A broken observatory realm where rifts bleed starlight into the earth.', levelRequired: 45, seed: 778899, spawnX: 10, spawnY: 70, townX: 15, townY: 65, townRange: 7, portals: [
        { x: 5, y: 70, targetMap: 'voidlands', targetX: 40, targetY: 73, label: '☠ To Voidlands' },
        { x: 10, y: 75, targetMap: 'ashenmoor', targetX: 68, targetY: 10, label: '🕯 To Ashenmoor' },
      ] },
    ]),
    items: Object.freeze([
      { id: 'ironvale_sabre', name: 'Ironvale Sabre', icon: '⚔', slot: 'weapon', attack: 18, critChance: 2, rarity: 'rare', level: 18, value: 900 },
      { id: 'warden_plate', name: 'Warden Plate', icon: '🥋', slot: 'armor', armor: 20, defense: 5, hp: 30, rarity: 'rare', level: 20, value: 1300 },
      { id: 'deepdelver_helm', name: 'Deepdelver Helm', icon: '⛑', slot: 'helmet', armor: 10, hp: 20, rarity: 'rare', level: 20, value: 850 },
      { id: 'quarry_guard', name: 'Quarry Guard', icon: '🛡', slot: 'shield', defense: 14, armor: 8, rarity: 'epic', level: 22, value: 1800 },
      { id: 'ironstep_boots', name: 'Ironstep Boots', icon: '🥾', slot: 'boots', armor: 5, moveSpeed: 8, rarity: 'rare', level: 20, value: 950 },
      { id: 'forgeheart_ring', name: 'Forgeheart Ring', icon: '💍', slot: 'ring', attack: 7, hp: 15, rarity: 'epic', level: 22, value: 1900 },
      { id: 'mirefang_blade', name: 'Mirefang Blade', icon: '🗡', slot: 'weapon', attack: 28, lifesteal: 2, rarity: 'epic', level: 30, value: 2800 },
      { id: 'plaguewarden_mail', name: 'Plaguewarden Mail', icon: '🛡', slot: 'armor', armor: 28, defense: 7, damageReduction: 4, rarity: 'epic', level: 32, value: 3600 },
      { id: 'witchglass_focus', name: 'Witchglass Focus', icon: '🔮', slot: 'weapon', attack: 16, magic: 15, mana: 40, rarity: 'epic', level: 30, value: 3400 },
      { id: 'bogwalker_boots', name: 'Bogwalker Boots', icon: '👢', slot: 'boots', armor: 6, moveSpeed: 12, rarity: 'epic', level: 30, value: 2600 },
      { id: 'rotguard_amulet', name: 'Rotguard Amulet', icon: '📿', slot: 'amulet', hp: 60, damageReduction: 3, rarity: 'epic', level: 34, value: 4200 },
      { id: 'hydra_scale_shield', name: 'Hydra Scale Shield', icon: '🛡', slot: 'shield', defense: 18, armor: 12, hp: 30, rarity: 'epic', level: 35, value: 4800 },
      { id: 'starforged_greatblade', name: 'Starforged Greatblade', icon: '⚔', slot: 'weapon', attack: 42, critChance: 6, rarity: 'legendary', level: 45, value: 7600 },
      { id: 'astral_scepter', name: 'Astral Scepter', icon: '🪄', slot: 'weapon', attack: 24, magic: 20, mana: 70, rarity: 'legendary', level: 45, value: 7900 },
      { id: 'revenant_plate', name: 'Revenant Plate', icon: '🥋', slot: 'armor', armor: 38, defense: 10, hp: 90, rarity: 'legendary', level: 46, value: 9000 },
      { id: 'riftwalker_boots', name: 'Riftwalker Boots', icon: '🥾', slot: 'boots', armor: 8, moveSpeed: 18, rarity: 'legendary', level: 44, value: 6800 },
      { id: 'celestial_circlet', name: 'Celestial Circlet', icon: '👑', slot: 'helmet', armor: 16, magic: 12, mana: 50, rarity: 'legendary', level: 47, value: 8400 },
      { id: 'voidheart_amulet', name: 'Voidheart Amulet', icon: '📿', slot: 'amulet', hp: 80, mana: 60, lifesteal: 4, rarity: 'legendary', level: 50, value: 11000 },
    ]),
    monsters: Object.freeze([
      { id: 'ironfang_wolf', name: 'Ironfang Wolf', emoji: '🐺', mapId: 'ironvale', count: 6, hp: 220, attack: 32, defense: 10, xp: 120, level: 18, color: '#6f7480', size: 0.95, type: 'normal', goldMin: 18, goldMax: 45 },
      { id: 'road_bandit', name: 'Road Bandit', emoji: '🥷', mapId: 'ironvale', count: 6, hp: 240, attack: 36, defense: 11, xp: 135, level: 19, color: '#805f4a', size: 1.0, type: 'normal', goldMin: 22, goldMax: 55 },
      { id: 'stone_golem', name: 'Stone Golem', emoji: '🗿', mapId: 'ironvale', count: 4, hp: 400, attack: 42, defense: 20, xp: 220, level: 22, color: '#77736a', size: 1.25, type: 'elite', goldMin: 40, goldMax: 90 },
      { id: 'bandit_captain', name: 'Bandit Captain', emoji: '⚔', mapId: 'ironvale', count: 2, hp: 550, attack: 50, defense: 18, xp: 350, level: 24, color: '#7b2f2f', size: 1.15, type: 'elite', goldMin: 80, goldMax: 160 },
      { id: 'mine_wyrm', name: 'Mine Wyrm', emoji: '🐲', mapId: 'ironvale', count: 1, hp: 900, attack: 62, defense: 24, xp: 650, level: 26, color: '#8c684a', size: 1.5, type: 'boss', goldMin: 180, goldMax: 420 },
      { id: 'mireling', name: 'Mireling', emoji: '🧟', mapId: 'ashenmoor', count: 6, hp: 420, attack: 55, defense: 18, xp: 260, level: 30, color: '#60754f', size: 1.0, type: 'normal', goldMin: 45, goldMax: 90 },
      { id: 'plague_hound', name: 'Plague Hound', emoji: '🐕', mapId: 'ashenmoor', count: 5, hp: 480, attack: 60, defense: 20, xp: 300, level: 31, color: '#586c3b', size: 1.05, type: 'normal', goldMin: 50, goldMax: 105 },
      { id: 'bog_witch', name: 'Bog Witch', emoji: '🧙', mapId: 'ashenmoor', count: 4, hp: 520, attack: 68, defense: 17, xp: 360, level: 33, color: '#6d3d78', size: 1.05, type: 'elite', goldMin: 65, goldMax: 130 },
      { id: 'rot_knight', name: 'Rot Knight', emoji: '🧟', mapId: 'ashenmoor', count: 3, hp: 700, attack: 75, defense: 30, xp: 480, level: 35, color: '#465743', size: 1.2, type: 'elite', goldMin: 90, goldMax: 180 },
      { id: 'mire_hydra', name: 'Mire Hydra', emoji: '🐍', mapId: 'ashenmoor', count: 1, hp: 1400, attack: 88, defense: 34, xp: 1100, level: 38, color: '#3b7047', size: 1.65, type: 'boss', goldMin: 260, goldMax: 650 },
      { id: 'voidling', name: 'Voidling', emoji: '👾', mapId: 'starfall', count: 6, hp: 700, attack: 85, defense: 30, xp: 500, level: 45, color: '#544080', size: 1.0, type: 'normal', goldMin: 90, goldMax: 180 },
      { id: 'rift_stalker', name: 'Rift Stalker', emoji: '🐆', mapId: 'starfall', count: 5, hp: 820, attack: 94, defense: 32, xp: 600, level: 47, color: '#31314f', size: 1.1, type: 'normal', goldMin: 110, goldMax: 220 },
      { id: 'star_revenant', name: 'Star Revenant', emoji: '👻', mapId: 'starfall', count: 4, hp: 950, attack: 105, defense: 36, xp: 720, level: 49, color: '#8797ff', size: 1.2, type: 'elite', goldMin: 130, goldMax: 260 },
      { id: 'astral_warlock', name: 'Astral Warlock', emoji: '🧙', mapId: 'starfall', count: 3, hp: 1100, attack: 118, defense: 34, xp: 850, level: 52, color: '#9d61e8', size: 1.2, type: 'elite', goldMin: 160, goldMax: 320 },
      { id: 'fallen_seraph', name: 'Fallen Seraph', emoji: '👼', mapId: 'starfall', count: 1, hp: 2400, attack: 140, defense: 48, xp: 2200, level: 55, color: '#c9b7ff', size: 1.75, type: 'boss', goldMin: 500, goldMax: 1200 },
    ]),
    npcs: Object.freeze([
      { id: 'warden_elara', name: 'Warden Elara', emoji: '🛡', color: '#d2b48c', role: 'guard', posX: 17, posY: 40, mapId: 'ironvale', dialogue: 'The frontier survives because someone stands the road.' },
      { id: 'smith_bran', name: 'Smith Bran', emoji: '⚒', color: '#d98245', role: 'merchant', posX: 13, posY: 42, mapId: 'ironvale', dialogue: 'Iron remembers every hammer that shaped it.' },
      { id: 'chronicler_orsin', name: 'Chronicler Orsin', emoji: '📜', color: '#cdb7ff', role: 'guard', posX: 15, posY: 44, mapId: 'ironvale', dialogue: 'The stones below Ironvale predate its mines.' },
      { id: 'sister_mirelle', name: 'Sister Mirelle', emoji: '🕯', color: '#d4c98a', role: 'guard', posX: 17, posY: 40, mapId: 'ashenmoor', dialogue: 'Do not drink the water. Do not trust the lights.' },
      { id: 'alchemist_voss', name: 'Alchemist Voss', emoji: '⚗', color: '#88c070', role: 'merchant', posX: 13, posY: 42, mapId: 'ashenmoor', dialogue: 'Poison and medicine are siblings separated by dosage.' },
      { id: 'ferryman_dane', name: 'Ferryman Dane', emoji: '🚣', color: '#8aa4b8', role: 'guard', posX: 15, posY: 44, mapId: 'ashenmoor', dialogue: 'The dead pay no fare, but they still board.' },
      { id: 'archivist_nyra', name: 'Archivist Nyra', emoji: '📚', color: '#9d8cff', role: 'guard', posX: 17, posY: 65, mapId: 'starfall', dialogue: 'Every falling star is a message. Most are warnings.' },
      { id: 'gatekeeper_orren', name: 'Gatekeeper Orren', emoji: '🗝', color: '#baa7e8', role: 'guard', posX: 13, posY: 66, mapId: 'starfall', dialogue: 'The rifts open for everyone. They close for very few.' },
      { id: 'stargazer_lyra', name: 'Stargazer Lyra', emoji: '🔭', color: '#87cefa', role: 'guard', posX: 15, posY: 68, mapId: 'starfall', dialogue: 'Tonight the stars are moving in the wrong direction.' },
    ]),
    quests: Object.freeze([
      { id: 'frontier_wolves', name: 'Teeth on the Road', npcId: 'warden_elara', description: 'Thin the Ironfang packs stalking Ironvale caravans.', target: 'ironfang_wolf', count: 8, rewardGold: 650, rewardXp: 900, levelRequired: 18, requires: [], rewardItem: null },
      { id: 'frontier_bandits', name: 'The Broken Road', npcId: 'warden_elara', description: 'Drive the road bandits away from the eastern trade route.', target: 'road_bandit', count: 10, rewardGold: 900, rewardXp: 1200, levelRequired: 19, requires: ['frontier_wolves'], rewardItem: null },
      { id: 'frontier_golems', name: 'Stone That Walks', npcId: 'chronicler_orsin', description: 'Destroy the awakened golems before they reach the settlement.', target: 'stone_golem', count: 4, rewardGold: 1200, rewardXp: 1700, levelRequired: 22, requires: ['frontier_bandits'], rewardItem: { name: 'Runed Stone', icon: '🪨', value: 450 } },
      { id: 'frontier_captains', name: 'Cut Off the Head', npcId: 'warden_elara', description: 'Break the bandit command by eliminating their captains.', target: 'bandit_captain', count: 2, rewardGold: 1600, rewardXp: 2200, levelRequired: 24, requires: ['frontier_golems'], rewardItem: null },
      { id: 'frontier_wyrm', name: 'The Wyrm Below', npcId: 'smith_bran', description: 'The deepest mine has opened into a wyrm nest. End it.', target: 'mine_wyrm', count: 1, rewardGold: 2600, rewardXp: 3600, levelRequired: 26, requires: ['frontier_captains'], rewardItem: { name: 'Wyrm Heart', icon: '❤️‍🔥', value: 900 } },
      { id: 'ashen_mirelings', name: 'Something in the Reeds', npcId: 'sister_mirelle', description: 'Burn back the mirelings gathering around the chapel.', target: 'mireling', count: 10, rewardGold: 1800, rewardXp: 2600, levelRequired: 30, requires: ['frontier_wyrm'], rewardItem: null },
      { id: 'ashen_hounds', name: 'Plague Hounds', npcId: 'sister_mirelle', description: 'Cull the hounds spreading rot between settlements.', target: 'plague_hound', count: 8, rewardGold: 2200, rewardXp: 3200, levelRequired: 31, requires: ['ashen_mirelings'], rewardItem: null },
      { id: 'ashen_witches', name: 'Witch-Lights', npcId: 'alchemist_voss', description: 'Silence the witches feeding the false lights in the marsh.', target: 'bog_witch', count: 5, rewardGold: 2800, rewardXp: 3900, levelRequired: 33, requires: ['ashen_hounds'], rewardItem: { name: 'Witchglass', icon: '🔮', value: 1100 } },
      { id: 'ashen_knights', name: 'The Drowned Guard', npcId: 'ferryman_dane', description: 'Lay the Rot Knights to rest before they reclaim the ferry road.', target: 'rot_knight', count: 4, rewardGold: 3400, rewardXp: 4700, levelRequired: 35, requires: ['ashen_witches'], rewardItem: null },
      { id: 'ashen_hydra', name: 'Many Mouths, One Hunger', npcId: 'sister_mirelle', description: 'Slay the Mire Hydra poisoning the entire watershed.', target: 'mire_hydra', count: 1, rewardGold: 5200, rewardXp: 7000, levelRequired: 38, requires: ['ashen_knights'], rewardItem: { name: 'Hydra Core', icon: '💚', value: 1800 } },
      { id: 'starfall_voidlings', name: 'Static in the Dark', npcId: 'archivist_nyra', description: 'Destroy voidlings clustering around the broken observatories.', target: 'voidling', count: 12, rewardGold: 4200, rewardXp: 6200, levelRequired: 45, requires: ['ashen_hydra'], rewardItem: null },
      { id: 'starfall_stalkers', name: 'Between Two Steps', npcId: 'gatekeeper_orren', description: 'Hunt the Rift Stalkers phasing through the gate roads.', target: 'rift_stalker', count: 8, rewardGold: 5200, rewardXp: 7600, levelRequired: 47, requires: ['starfall_voidlings'], rewardItem: null },
      { id: 'starfall_revenants', name: 'Names in Starlight', npcId: 'stargazer_lyra', description: 'Release the revenants trapped beneath the fallen stars.', target: 'star_revenant', count: 6, rewardGold: 6400, rewardXp: 9000, levelRequired: 49, requires: ['starfall_stalkers'], rewardItem: { name: 'Star Shard', icon: '🌟', value: 2400 } },
      { id: 'starfall_warlocks', name: 'The Astral Cabal', npcId: 'archivist_nyra', description: 'Break the warlocks holding the rift lattice open.', target: 'astral_warlock', count: 4, rewardGold: 7800, rewardXp: 11000, levelRequired: 52, requires: ['starfall_revenants'], rewardItem: null },
      { id: 'starfall_seraph', name: 'When Heaven Fell', npcId: 'gatekeeper_orren', description: 'Defeat the Fallen Seraph at the heart of Starfall.', target: 'fallen_seraph', count: 1, rewardGold: 12500, rewardXp: 18000, levelRequired: 55, requires: ['starfall_warlocks'], rewardItem: { name: 'Seraph Feather', icon: '🪽', value: 5000 } },
    ]),
    spells: Object.freeze([
      { id: 'iron_tempest', name: 'Iron Tempest', icon: '🌪', mana: 28, cooldown: 3000, damage: 110, range: 2, color: '#b7bec8', type: 'aoe', vocation: 'knight', levelRequired: 18, scalingCoeff: 1.1 },
      { id: 'vanguard_ward', name: 'Vanguard Ward', icon: '🛡', mana: 32, cooldown: 12000, damage: 0, range: 0, color: '#d0d8e0', type: 'buff', buffType: 'shield', buffDuration: 9000, buffValue: 35, vocation: 'knight', levelRequired: 24 },
      { id: 'sunlance', name: 'Sunlance', icon: '☀', mana: 26, cooldown: 2400, damage: 125, range: 8, color: '#ffe36a', type: 'attack', vocation: 'paladin', levelRequired: 20, scalingCoeff: 1.15 },
      { id: 'zephyr_step', name: 'Zephyr Step', icon: '💨', mana: 30, cooldown: 11000, damage: 0, range: 0, color: '#b8f0ff', type: 'buff', buffType: 'haste', buffDuration: 8500, buffValue: 42, vocation: 'paladin', levelRequired: 26 },
      { id: 'starfire_nova', name: 'Starfire Nova', icon: '🌠', mana: 48, cooldown: 3800, damage: 175, range: 3, color: '#b56cff', type: 'aoe', vocation: 'sorcerer', levelRequired: 30, scalingCoeff: 1.35 },
      { id: 'arcane_frenzy', name: 'Arcane Frenzy', icon: '✨', mana: 44, cooldown: 14000, damage: 0, range: 0, color: '#e089ff', type: 'buff', buffType: 'frenzy', buffDuration: 9000, buffValue: 38, vocation: 'sorcerer', levelRequired: 35 },
      { id: 'mire_bloom', name: 'Mire Bloom', icon: '🌺', mana: 38, cooldown: 2400, damage: 190, range: 0, color: '#76d884', type: 'heal', vocation: 'druid', levelRequired: 28, scalingCoeff: 1.25 },
      { id: 'veil_of_mists', name: 'Veil of Mists', icon: '🌫', mana: 36, cooldown: 13000, damage: 0, range: 0, color: '#c5e6e8', type: 'buff', buffType: 'invisible', buffDuration: 8000, buffValue: 1, vocation: 'druid', levelRequired: 34 },
    ]),
    worldEvents: Object.freeze([
      { id: 'frontier_road_war', name: 'War on the Broken Road', icon: '⚔', description: 'Bandit companies descend on Ironvale.', mapId: 'ironvale', type: 'invasion', target: 'road_bandit', needed: 35, rewardGold: 1800, rewardXp: 2200, rewardCoins: 18, durationMs: 900000 },
      { id: 'frontier_golem_quake', name: 'Golem Quake', icon: '🗿', description: 'Ancient stoneworks awaken beneath the mines.', mapId: 'ironvale', type: 'invasion', target: 'stone_golem', needed: 16, rewardGold: 2200, rewardXp: 2800, rewardCoins: 20, durationMs: 900000 },
      { id: 'ashen_plague_run', name: 'The Plague Run', icon: '☣', description: 'Plague hounds overrun the marsh roads.', mapId: 'ashenmoor', type: 'invasion', target: 'plague_hound', needed: 30, rewardGold: 3200, rewardXp: 4200, rewardCoins: 24, durationMs: 900000 },
      { id: 'ashen_witchmoon', name: 'Witchmoon', icon: '🌙', description: 'Bog witches gather under a sickly moon.', mapId: 'ashenmoor', type: 'invasion', target: 'bog_witch', needed: 20, rewardGold: 3800, rewardXp: 5200, rewardCoins: 28, durationMs: 900000 },
      { id: 'starfall_riftstorm', name: 'Riftstorm', icon: '🌌', description: 'Voidlings pour from fractures in the sky.', mapId: 'starfall', type: 'invasion', target: 'voidling', needed: 40, rewardGold: 6000, rewardXp: 8500, rewardCoins: 36, durationMs: 900000 },
      { id: 'starfall_seraph_hunt', name: 'Fall of the Seraphs', icon: '👼', description: 'Fallen seraphs manifest at the rift heart.', mapId: 'starfall', type: 'boss', target: 'fallen_seraph', needed: 3, rewardGold: 10000, rewardXp: 14000, rewardCoins: 50, durationMs: 1200000 },
    ]),
  }),
  mapPatches: Object.freeze([
    { mapId: 'eldoria', basePortals: ELDORIA_BASE_PORTALS, additions: [{ x: 70, y: 40, targetMap: 'ironvale', targetX: 10, targetY: 40, label: '⛏ To Ironvale' }] },
    { mapId: 'shadowfen', basePortals: SHADOWFEN_BASE_PORTALS, additions: [{ x: 70, y: 40, targetMap: 'ashenmoor', targetX: 10, targetY: 40, label: '🕯 To Ashenmoor' }] },
    { mapId: 'voidlands', basePortals: VOIDLANDS_BASE_PORTALS, additions: [{ x: 40, y: 75, targetMap: 'starfall', targetX: 10, targetY: 70, label: '🌠 To Starfall' }] },
  ]),
});

export const BUNDLED_CONTENT_PACKS = Object.freeze([SHATTERED_FRONTIER_PACK]);

function portalKey(portal) {
  return [portal?.x ?? portal?.pos?.x, portal?.y ?? portal?.pos?.y, portal?.targetMap, portal?.targetX ?? portal?.targetSpawn?.x, portal?.targetY ?? portal?.targetSpawn?.y].join(':');
}

function mergeMapPortals(data, patch) {
  const map = Array.isArray(data.maps) ? data.maps.find(entry => entry?.id === patch.mapId) : null;
  if (!map) return;
  const source = Array.isArray(map.portals) ? map.portals.map(clone) : patch.basePortals.map(clone);
  const seen = new Set(source.map(portalKey));
  for (const portal of patch.additions) {
    const key = portalKey(portal);
    if (seen.has(key)) continue;
    source.push(clone(portal));
    seen.add(key);
  }
  map.portals = source.slice(0, 20);
}

export function applyContentPack(data, pack) {
  if (!data || typeof data !== 'object' || !pack?.id) return { changed: false, applied: [] };
  if (!Array.isArray(data.appliedPacks)) data.appliedPacks = [];
  if (data.appliedPacks.includes(pack.id)) return { changed: false, applied: [] };

  for (const [collection, records] of Object.entries(pack.collections || {})) {
    if (!Array.isArray(data[collection])) data[collection] = [];
    const ids = new Set(data[collection].map(record => record?.id).filter(Boolean));
    for (const record of records || []) {
      if (!record?.id || ids.has(record.id)) continue;
      data[collection].push(clone(record));
      ids.add(record.id);
    }
  }
  for (const patch of pack.mapPatches || []) mergeMapPortals(data, patch);
  data.appliedPacks.push(pack.id);
  return { changed: true, applied: [pack.id] };
}

export function applyBundledContentPacks(data, packs = BUNDLED_CONTENT_PACKS) {
  const applied = [];
  let changed = false;
  for (const pack of packs) {
    const result = applyContentPack(data, pack);
    changed ||= result.changed;
    applied.push(...result.applied);
  }
  return { changed, applied };
}
'''

EXPANSION_CATALOGS = r'''// ===================================================================
// MOR'IA — SHATTERED FRONTIER 8.0 OFFICIAL CATALOG EXTENSIONS
// ===================================================================

export const EXPANSION_8_PETS = Object.freeze([
  { id: 'iron_mastiff', name: 'Iron Mastiff', icon: '🐕', color: '#8b8f98', attack: 48, price: 22000, levelRequired: 18 },
  { id: 'mire_drake', name: 'Mire Drake', icon: '🐲', color: '#4c7a55', attack: 65, price: 36000, levelRequired: 32 },
  { id: 'star_wisp', name: 'Star Wisp', icon: '🌟', color: '#9da7ff', attack: 82, price: 52000, levelRequired: 45 },
  { id: 'void_griffin', name: 'Void Griffin', icon: '🦅', color: '#7654a8', attack: 100, price: 80000, levelRequired: 55 },
]);

export const EXPANSION_8_GEMS = Object.freeze([
  { id: 'iron_opal', name: 'Iron Opal', icon: '⚙', color: '#aeb2b8', stat: 'defense', value: 18, tier: 3, rarity: 'epic' },
  { id: 'mire_emerald', name: 'Mire Emerald', icon: '💚', color: '#55c878', stat: 'hp', value: 70, tier: 3, rarity: 'epic' },
  { id: 'witch_amethyst', name: 'Witch Amethyst', icon: '🟣', color: '#b050d0', stat: 'magic', value: 24, tier: 4, rarity: 'legendary' },
  { id: 'rift_diamond', name: 'Rift Diamond', icon: '💎', color: '#c7d5ff', stat: 'crit', value: 9, tier: 4, rarity: 'legendary' },
  { id: 'seraph_ruby', name: 'Seraph Ruby', icon: '🔶', color: '#ff8066', stat: 'attack', value: 32, tier: 5, rarity: 'legendary' },
  { id: 'void_pearl', name: 'Void Pearl', icon: '⚫', color: '#8270a8', stat: 'lifesteal', value: 7, tier: 5, rarity: 'legendary' },
]);

export const EXPANSION_8_RECIPES = Object.freeze([
  { id: 'ironvale_ingot', name: 'Ironvale Ingot', icon: '🔩', levelRequired: 18, ingredients: [{ name: 'Ore', quantity: 6 }, { name: 'Wood', quantity: 2 }], result: { name: 'Ironvale Ingot', icon: '🔩', type: 'material', quantity: 1, value: 180 } },
  { id: 'warden_edge', name: 'Warden Edge', icon: '⚔', levelRequired: 22, ingredients: [{ name: 'Ironvale Ingot', quantity: 2 }, { name: 'Gold', quantity: 350 }], result: { name: 'Warden Edge', icon: '⚔', type: 'equipment', quantity: 1, value: 1800, equipment: { id: 'crafted_warden_edge', name: 'Warden Edge', icon: '⚔', slot: 'weapon', attack: 23, rarity: 'epic', level: 22, value: 1800, sockets: 1, socketedGems: [] } } },
  { id: 'mireward_charm', name: 'Mireward Charm', icon: '📿', levelRequired: 32, ingredients: [{ name: 'Herb', quantity: 8 }, { name: 'Fish', quantity: 4 }, { name: 'Gold', quantity: 600 }], result: { name: 'Mireward Charm', icon: '📿', type: 'equipment', quantity: 1, value: 3200, equipment: { id: 'crafted_mireward_charm', name: 'Mireward Charm', icon: '📿', slot: 'amulet', hp: 55, damageReduction: 3, rarity: 'epic', level: 32, value: 3200, sockets: 1, socketedGems: [] } } },
  { id: 'witchglass_tonic', name: 'Witchglass Tonic', icon: '🧪', levelRequired: 34, ingredients: [{ name: 'Herb', quantity: 10 }, { name: 'Magic Rune', quantity: 1 }], result: { name: 'Witchglass Tonic', icon: '🧪', type: 'material', quantity: 2, value: 350, description: 'A potent reagent used in frontier crafting.' } },
  { id: 'starforged_core', name: 'Starforged Core', icon: '🌟', levelRequired: 45, ingredients: [{ name: 'Ore', quantity: 12 }, { name: 'Magic Rune', quantity: 2 }, { name: 'Gold', quantity: 1200 }], result: { name: 'Starforged Core', icon: '🌟', type: 'material', quantity: 1, value: 1400 } },
  { id: 'astral_focus', name: 'Astral Focus', icon: '🔮', levelRequired: 48, ingredients: [{ name: 'Starforged Core', quantity: 1 }, { name: 'Wood', quantity: 8 }, { name: 'Gold', quantity: 1800 }], result: { name: 'Astral Focus', icon: '🔮', type: 'equipment', quantity: 1, value: 7800, equipment: { id: 'crafted_astral_focus', name: 'Astral Focus', icon: '🔮', slot: 'weapon', attack: 22, magic: 19, mana: 65, rarity: 'legendary', level: 48, value: 7800, sockets: 2, socketedGems: [] } } },
]);

export const EXPANSION_8_BOOKS = Object.freeze([
  { id: 'ironvale_foundry', title: 'Foundry Oaths of Ironvale', icon: '📙', author: 'Smith Bran', pages: ['Ironvale was founded where the first hammer rang against a door of black stone.', 'Wardens still swear their oaths facing the sealed mine beneath the eastern road.'] },
  { id: 'broken_road_ledger', title: 'Ledger of the Broken Road', icon: '📒', author: 'Warden Elara', pages: ['The bandit companies are too disciplined to be ordinary thieves.', 'Every captured order bears the same star-shaped wax seal.'] },
  { id: 'ashenmoor_herbarium', title: 'Herbarium of Ashenmoor', icon: '📗', author: 'Alchemist Voss', pages: ['Most marsh plants cure the same fever they can cause.', 'Witchglass grows only where moonlight touches stagnant water.'] },
  { id: 'ferryman_last_route', title: 'The Ferryman’s Last Route', icon: '📘', author: 'Dane', pages: ['There used to be seven islands in the mire.', 'The eighth appears only when the bells ring beneath the water.'] },
  { id: 'starfall_observatory', title: 'Starfall Observatory Notes', icon: '📓', author: 'Archivist Nyra', pages: ['The rifts are not holes. They are lenses.', 'Something on the other side is looking back through every fallen star.'] },
]);

export const EXPANSION_8_MYSTERIES = Object.freeze([
  { id: 'sealed_foundry', name: 'The Sealed Foundry', icon: '⚒', requiredLevel: 20, rewardGold: 1800, rewardXp: 2400, rewardItem: { name: 'Foundry Sigil', icon: '🔩', value: 900 }, intro: 'A locked foundry beneath Ironvale responds to three phrases carved into its anvils.', chapters: [
    { clue: 'I eat stone, breathe smoke, and leave a road behind.', riddle: 'What am I?', answer: 'mine', hint: 'Ironvale is built around one.' },
    { clue: 'I become stronger each time I am struck.', riddle: 'What am I?', answer: 'iron', hint: 'The smith works it with a hammer.' },
    { clue: 'The wardens speak this before battle.', riddle: 'What do they protect?', answer: 'frontier', hint: 'It is the name of the lands beyond the capital.' },
  ] },
  { id: 'bells_below', name: 'Bells Below the Mire', icon: '🔔', requiredLevel: 33, rewardGold: 3600, rewardXp: 5200, rewardItem: { name: 'Drowned Bell', icon: '🔔', value: 1600 }, intro: 'At midnight, bells ring beneath waters too shallow to hide a tower.', chapters: [
    { clue: 'I have no lungs, yet I sing when struck.', riddle: 'What am I?', answer: 'bell', hint: 'You can hear it beneath the marsh.' },
    { clue: 'I cover the earth but drown no one until disturbed.', riddle: 'What am I?', answer: 'mist', hint: 'It hangs over Ashenmoor.' },
    { clue: 'The ferryman crosses it without road or bridge.', riddle: 'What does he cross?', answer: 'water', hint: 'His boat needs it.' },
  ] },
  { id: 'eye_between_stars', name: 'The Eye Between Stars', icon: '👁', requiredLevel: 48, rewardGold: 8000, rewardXp: 12000, rewardItem: { name: 'Astral Lens', icon: '🔭', value: 4200 }, intro: 'Nyra found a lens that shows a constellation absent from every sky chart.', chapters: [
    { clue: 'I shine after dying and travel long after I am gone.', riddle: 'What am I?', answer: 'star', hint: 'Look upward.' },
    { clue: 'I divide two places while touching both.', riddle: 'What am I?', answer: 'gate', hint: 'Orren guards one.' },
    { clue: 'The darkness has one request.', riddle: 'What must you never give it?', answer: 'name', hint: 'The Void Testament warned you.' },
  ] },
]);

export const EXPANSION_8_ACHIEVEMENTS = Object.freeze([
  { id: 'frontier_bound', name: 'Frontier Bound', icon: '🧭', test: p => (p.level || 0) >= 18, coins: 6 },
  { id: 'veteran_30', name: 'Veteran of the Moor', icon: '🕯', test: p => (p.level || 0) >= 30, coins: 10 },
  { id: 'starwalker_45', name: 'Starwalker', icon: '🌠', test: p => (p.level || 0) >= 45, coins: 16 },
  { id: 'ascendant_55', name: 'Ascendant', icon: '👼', test: p => (p.level || 0) >= 55, coins: 24 },
  { id: 'slayer_250', name: 'Relentless Hunter', icon: '⚔', test: p => (p.stats?.monstersKilled || 0) >= 250, coins: 12 },
  { id: 'boss_10', name: 'Breaker of Crowns', icon: '👑', test: p => (p.stats?.bossesKilled || 0) >= 10, coins: 18 },
  { id: 'spell_500', name: 'Spellweaver', icon: '✨', test: p => (p.stats?.spellsCast || 0) >= 500, coins: 15 },
  { id: 'road_10000', name: 'Ten Thousand Steps', icon: '🥾', test: p => (p.stats?.distanceWalked || 0) >= 10000, coins: 14 },
]);
'''

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB } from '../engine/ContentDB.mjs';
import { SHATTERED_FRONTIER_PACK_ID } from '../engine/ContentPacks.mjs';
import { WorldManager } from '../engine/World.mjs';
import { OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_RECIPES, OFFICIAL_BOOKS, MYSTERIES, ACHIEVEMENTS } from '../engine/OfficialCatalogs.mjs';

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-expansion-8-'));
  return { dir, file: path.join(dir, 'content.json') };
}

const expansionMonsterIds = ['ironfang_wolf','road_bandit','stone_golem','bandit_captain','mine_wyrm','mireling','plague_hound','bog_witch','rot_knight','mire_hydra','voidling','rift_stalker','star_revenant','astral_warlock','fallen_seraph'];

test('Shattered Frontier applies once to an existing content database', () => {
  const { dir, file } = tempFile();
  try {
    const db = new ContentDB(file, { applyBundledPacks: true });
    assert.ok(db.data.appliedPacks.includes(SHATTERED_FRONTIER_PACK_ID));
    assert.ok(db.get('maps').some(map => map.id === 'ironvale'));
    assert.ok(db.get('maps').some(map => map.id === 'ashenmoor'));
    assert.ok(db.get('maps').some(map => map.id === 'starfall'));
    assert.ok(db.get('maps').find(map => map.id === 'eldoria').portals.some(portal => portal.targetMap === 'ironvale'));
    assert.equal(expansionMonsterIds.every(id => db.get('monsters').some(monster => monster.id === id)), true);

    const counts = Object.fromEntries(['items','monsters','npcs','quests','spells','maps','worldEvents'].map(key => [key, db.get(key).length]));
    const reloaded = new ContentDB(file, { applyBundledPacks: true });
    for (const [key, count] of Object.entries(counts)) assert.equal(reloaded.get(key).length, count, `${key} duplicated after reload`);
    assert.equal(reloaded.data.appliedPacks.filter(id => id === SHATTERED_FRONTIER_PACK_ID).length, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('applied pack marker prevents admin-deleted expansion content from resurrecting', () => {
  const { dir, file } = tempFile();
  try {
    const db = new ContentDB(file, { applyBundledPacks: true });
    assert.equal(db.remove('items', 'ironvale_sabre'), true);
    const reloaded = new ContentDB(file, { applyBundledPacks: true });
    assert.equal(reloaded.get('items').some(item => item.id === 'ironvale_sabre'), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('Shattered Frontier references are playable and maps synchronize into runtime', () => {
  const { dir, file } = tempFile();
  try {
    const db = new ContentDB(file, { applyBundledPacks: true });
    const npcIds = new Set(db.get('npcs').map(npc => npc.id));
    const monsterIds = new Set(db.get('monsters').map(monster => monster.id));
    const questIds = new Set(db.get('quests').map(quest => quest.id));
    for (const quest of db.get('quests').filter(quest => /^(frontier|ashen|starfall)_/.test(quest.id))) {
      assert.ok(npcIds.has(quest.npcId), `missing NPC ${quest.npcId}`);
      assert.ok(monsterIds.has(quest.target), `missing target ${quest.target}`);
      for (const dependency of quest.requires || []) assert.ok(questIds.has(dependency), `missing prerequisite ${dependency}`);
    }

    const world = new WorldManager();
    world.syncContentMaps(db.get('maps'));
    for (const id of ['ironvale','ashenmoor','starfall']) {
      const map = world.getMap(id);
      assert.ok(map, `missing runtime map ${id}`);
      assert.equal(map.tiles[map.spawnPoint.y][map.spawnPoint.x].walkable, true);
    }
    assert.ok(world.getMap('eldoria').portals.some(portal => portal.targetMap === 'ironvale'));
    assert.ok(world.getMap('shadowfen').portals.some(portal => portal.targetMap === 'ashenmoor'));
    assert.ok(world.getMap('voidlands').portals.some(portal => portal.targetMap === 'starfall'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('official Shattered Frontier catalogs are exposed without duplicate IDs', () => {
  const checks = [
    [OFFICIAL_PETS, ['iron_mastiff','mire_drake','star_wisp','void_griffin']],
    [OFFICIAL_GEMS, ['iron_opal','mire_emerald','witch_amethyst','rift_diamond','seraph_ruby','void_pearl']],
    [OFFICIAL_RECIPES, ['ironvale_ingot','warden_edge','mireward_charm','witchglass_tonic','starforged_core','astral_focus']],
    [OFFICIAL_BOOKS, ['ironvale_foundry','broken_road_ledger','ashenmoor_herbarium','ferryman_last_route','starfall_observatory']],
    [MYSTERIES, ['sealed_foundry','bells_below','eye_between_stars']],
    [ACHIEVEMENTS, ['frontier_bound','veteran_30','starwalker_45','ascendant_55','slayer_250','boss_10','spell_500','road_10000']],
  ];
  for (const [catalog, expected] of checks) {
    assert.equal(new Set(catalog.map(entry => entry.id)).size, catalog.length);
    for (const id of expected) assert.ok(catalog.some(entry => entry.id === id), `missing catalog entry ${id}`);
  }
});
'''

DOC = '''# Content Expansion 8.0 — Shattered Frontier\n\nShattered Frontier is the first versioned bundled content pack for MOR'IA. It is applied once to persistent ContentDB installations and then recorded in `appliedPacks`, so later admin deletions/edits are respected.\n\n## Playable expansion\n- 3 authoritative procedural regions: Ironvale (18+), Ashenmoor (30+), Starfall Expanse (45+).\n- Portal links from Eldoria, Shadowfen and Voidlands plus return/progression links.\n- 15 runtime monster templates including 3 bosses.\n- 9 NPCs placed in the new settlements.\n- 15 chained quests forming one campaign from level 18 to 55.\n- 18 equipment templates entering authoritative content/item pools.\n- 8 vocation spells including supported server-owned buffs.\n- 6 world events using the official event domain.\n\n## Official catalog expansion\n- 4 pets.\n- 6 gems.\n- 6 crafting recipes.\n- 5 lore books.\n- 3 multi-chapter mysteries.\n- 8 achievements.\n\nThe pack intentionally skips an existing ID rather than overwriting admin-authored content. The pack marker is persistent and prevents deleted expansion content from being resurrected on subsequent restarts.\n'''

write('server/engine/ContentPacks.mjs', CONTENT_PACKS)
write('server/engine/ExpansionCatalogs8.mjs', EXPANSION_CATALOGS)
write('server/test/content-expansion-8.test.mjs', TEST)
write('docs/CONTENT_EXPANSION_8_0.md', DOC)

content = read('server/engine/ContentDB.mjs')
content = replace_once(content,
"import { fileURLToPath } from 'url';\n",
"import { fileURLToPath } from 'url';\nimport { applyBundledContentPacks } from './ContentPacks.mjs';\n",
'ContentDB import')
content = replace_once(content,
"    version: 1,\n    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],\n",
"    version: 1, appliedPacks: [],\n    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],\n",
'empty content pack metadata')
content = replace_once(content,
"  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;\n",
"  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;\n  normalized.appliedPacks = Array.isArray(raw.appliedPacks)\n    ? [...new Set(raw.appliedPacks.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim().slice(0, 100)))].slice(0, 100)\n    : [];\n",
'normalize applied packs')
content = replace_once(content,
"  constructor(dbFile = DB_FILE) {\n    this.dbFile = dbFile;\n    this.data = emptyContentData();\n    // Only seed a brand-new or unrecoverably corrupt database. A valid empty\n    // collection is intentional admin state and must stay empty after restart.\n    if (!this.load()) this.seedDefaults();\n  }\n",
"  constructor(dbFile = DB_FILE, { applyBundledPacks = false } = {}) {\n    this.dbFile = dbFile;\n    this.data = emptyContentData();\n    // Only seed a brand-new or unrecoverably corrupt database. A valid empty\n    // collection is intentional admin state and must stay empty after restart.\n    if (!this.load()) this.seedDefaults();\n    if (applyBundledPacks) this.applyBundledPacks();\n  }\n",
'ContentDB constructor')
insert_anchor = "  // ===== CRUD for all content types =====\n"
method = """  applyBundledPacks() {\n    const candidate = normalizeContentData(structuredClone(this.data));\n    const result = applyBundledContentPacks(candidate);\n    if (!result.changed) return result;\n    const previous = this.data;\n    this.data = candidate;\n    if (!this.save()) {\n      this.data = previous;\n      return { changed: false, applied: [], error: 'Failed to persist bundled content pack.' };\n    }\n    return result;\n  }\n\n"""
content = replace_once(content, insert_anchor, method + insert_anchor, 'ContentDB apply method')
content = replace_once(content,
"export const contentDB = new ContentDB();",
"export const contentDB = new ContentDB(DB_FILE, { applyBundledPacks: process.env.MORIA_DISABLE_CONTENT_PACKS !== '1' });",
'ContentDB singleton pack enable')
write('server/engine/ContentDB.mjs', content)

catalogs = read('server/engine/OfficialCatalogs.mjs')
header = """import {\n  EXPANSION_8_PETS, EXPANSION_8_GEMS, EXPANSION_8_RECIPES,\n  EXPANSION_8_BOOKS, EXPANSION_8_MYSTERIES, EXPANSION_8_ACHIEVEMENTS,\n} from './ExpansionCatalogs8.mjs';\n\n"""
marker = "// ===================================================================\n\nexport const OFFICIAL_PETS"
catalogs = replace_once(catalogs, marker, "// ===================================================================\n\n" + header + "export const OFFICIAL_PETS", 'catalog import')
for name, spread in [
    ('OFFICIAL_PETS', 'EXPANSION_8_PETS'),
    ('OFFICIAL_GEMS', 'EXPANSION_8_GEMS'),
    ('OFFICIAL_RECIPES', 'EXPANSION_8_RECIPES'),
    ('OFFICIAL_BOOKS', 'EXPANSION_8_BOOKS'),
    ('MYSTERIES', 'EXPANSION_8_MYSTERIES'),
    ('ACHIEVEMENTS', 'EXPANSION_8_ACHIEVEMENTS'),
]:
    catalogs = replace_once(catalogs, f"export const {name} = Object.freeze([\n", f"export const {name} = Object.freeze([\n  ...{spread},\n", f'{name} expansion')
write('server/engine/OfficialCatalogs.mjs', catalogs)

print('Shattered Frontier 8.0 source migration prepared successfully.')
