// ===================================================================
// MOR'IA 8.6 — AUTHORITATIVE CONTENT STUDIO DOMAIN
// Declarative schemas, semantic validation and non-mutating diagnostics.
// ===================================================================

import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT } from './World.mjs';
import { validateContentReferences } from './ContentIntegrity.mjs';

const ID_RE = /^[A-Za-z0-9_-]{2,100}$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const RARITIES = Object.freeze(['common', 'uncommon', 'rare', 'epic', 'legendary']);
const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet']);
const MONSTER_TYPES = Object.freeze(['normal', 'elite', 'boss']);
const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest']);
const SPELL_TYPES = Object.freeze(['attack', 'heal', 'aoe', 'buff']);
const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);

const field = (id, label = id, kind = 'text', extra = {}) => Object.freeze({ id, label, kind, ...extra });

export const CONTENT_STUDIO_SCHEMAS = Object.freeze({
  items: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('slot', 'Slot', 'select', { optionKey: 'slots' }),
    field('attack', 'Attack', 'number'), field('defense', 'Defense', 'number'), field('armor', 'Armor', 'number'),
    field('hp', 'HP', 'number'), field('mana', 'Mana', 'number'), field('magic', 'Magic', 'number'),
    field('critChance', 'Crit %', 'number'), field('lifesteal', 'Lifesteal %', 'number'), field('thorns', 'Thorns', 'number'),
    field('moveSpeed', 'Move speed %', 'number'), field('xpBonus', 'XP bonus %', 'number'), field('goldBonus', 'Gold bonus %', 'number'),
    field('damageReduction', 'Damage reduction %', 'number'), field('rarity', 'Rarity', 'select', { optionKey: 'rarities' }),
    field('level', 'Required level', 'number'), field('value', 'Value', 'number'), field('description', 'Description', 'textarea'),
  ]),
  monsters: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('emoji', 'Emoji'), field('hp', 'HP', 'number'),
    field('attack', 'Attack', 'number'), field('defense', 'Defense', 'number'), field('xp', 'XP', 'number'),
    field('level', 'Level', 'number'), field('type', 'Type', 'select', { optionKey: 'monsterTypes' }), field('color', 'Color'),
    field('size', 'Size', 'number'), field('goldMin', 'Gold min', 'number'), field('goldMax', 'Gold max', 'number'),
    field('mapId', 'Runtime map', 'select', { optionKey: 'maps', allowEmpty: true }), field('count', 'Spawn count', 'number'),
    field('posX', 'Spawn X', 'number'), field('posY', 'Spawn Y', 'number'), field('speed', 'Move delay', 'number'),
  ]),
  npcs: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('emoji', 'Emoji'), field('color', 'Color'),
    field('role', 'Role', 'select', { optionKey: 'npcRoles' }), field('posX', 'X', 'number'), field('posY', 'Y', 'number'),
    field('mapId', 'Map', 'select', { optionKey: 'maps' }), field('dialogue', 'Dialogue', 'textarea'),
  ]),
  spells: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('mana', 'Mana', 'number'),
    field('cooldown', 'Cooldown ms', 'number'), field('damage', 'Base power', 'number'), field('range', 'Range', 'number'),
    field('color', 'Color'), field('type', 'Type', 'select', { optionKey: 'spellTypes' }),
    field('vocation', 'Vocation', 'select', { optionKey: 'vocations' }), field('levelRequired', 'Required level', 'number'),
    field('buffType', 'Buff type', 'select', { optionKey: 'buffTypes', allowEmpty: true }),
    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('scalingCoeff', 'Scaling', 'number'),
  ]),
  quests: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('npcId', 'Quest NPC', 'select', { optionKey: 'npcs', allowEmpty: true }),
    field('description', 'Description', 'textarea'), field('target', 'Target'), field('count', 'Count', 'number'),
    field('rewardGold', 'Reward gold', 'number'), field('rewardXp', 'Reward XP', 'number'), field('levelRequired', 'Required level', 'number'),
    field('requires', 'Prerequisite quest IDs', 'json'),
  ]),
  maps: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('biome', 'Biome', 'select', { optionKey: 'biomes' }), field('description', 'Description', 'textarea'),
    field('levelRequired', 'Required level', 'number'), field('seed', 'Seed', 'number'), field('spawnX', 'Spawn X', 'number'), field('spawnY', 'Spawn Y', 'number'),
    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'), field('portals', 'Portals', 'json'),
  ]),
  events: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),
    field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),
    field('rewardXp', 'Reward XP', 'number'), field('rewardCoins', 'Reward coins', 'number'),
    field('mapId', 'Map', 'select', { optionKey: 'maps', allowEmpty: true }), field('durationMs', 'Duration ms', 'number'),
  ]),
});

function numberIn(record, key, min, max, { required = false, integer = false } = {}) {
  const raw = record?.[key];
  if ((raw === undefined || raw === null || raw === '') && !required) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return `${key} must be a number`;
  if (integer && !Number.isInteger(value)) return `${key} must be an integer`;
  if (value < min || value > max) return `${key} must be from ${min} to ${max}`;
  return null;
}

function requiredText(record, key, max = 100) {
  const value = typeof record?.[key] === 'string' ? record[key].trim() : '';
  if (!value) return `${key} is required`;
  if (value.length > max) return `${key} cannot exceed ${max} characters`;
  return null;
}

function optionalColor(record) {
  if (record?.color === undefined || record?.color === null || record.color === '') return null;
  return COLOR_RE.test(String(record.color)) ? null : 'color must be a CSS hex color';
}

function playableCoord(record, key) {
  return numberIn(record, key, 1, MAP_WIDTH - 2, { integer: true });
}

export function validateStudioRecord(type, record) {
  if (!CONTENT_STUDIO_SCHEMAS[type]) return `Unsupported content type: ${type}`;
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Content record must be an object';
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!ID_RE.test(id)) return 'id must be 2-100 letters, numbers, dash or underscore';
  const nameError = requiredText(record, 'name', 100);
  if (nameError) return nameError;

  if (type === 'items') {
    if (!ITEM_SLOTS.includes(String(record.slot || ''))) return 'slot is not supported';
    if (!RARITIES.includes(String(record.rarity || ''))) return 'rarity is not supported';
    for (const key of ['attack','defense','armor','hp','mana','magic','thorns','value']) {
      const error = numberIn(record, key, 0, 1_000_000); if (error) return error;
    }
    for (const key of ['critChance','lifesteal','moveSpeed','xpBonus','goldBonus','damageReduction']) {
      const error = numberIn(record, key, 0, 100); if (error) return error;
    }
    return numberIn(record, 'level', 1, 100_000, { required: true, integer: true });
  }

  if (type === 'monsters') {
    if (!MONSTER_TYPES.includes(String(record.type || 'normal'))) return 'monster type is not supported';
    for (const [key, min, max, required, integer] of [
      ['hp',1,10_000_000,true,true], ['attack',0,1_000_000,true,true], ['defense',0,1_000_000,true,true],
      ['xp',0,100_000_000,true,true], ['level',1,100_000,true,true], ['size',0.25,4,false,false],
      ['goldMin',0,100_000_000,false,true], ['goldMax',0,100_000_000,false,true], ['count',1,25,false,true], ['speed',50,600_000,false,true],
    ]) { const error = numberIn(record, key, min, max, { required, integer }); if (error) return error; }
    if (Number(record.goldMax || 0) < Number(record.goldMin || 0)) return 'goldMax cannot be lower than goldMin';
    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
    return optionalColor(record);
  }

  if (type === 'npcs') {
    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
    const role = String(record.role || '');
    if (role && !NPC_ROLES.includes(role)) return 'NPC role is not supported';
    return optionalColor(record);
  }

  if (type === 'spells') {
    const spellType = String(record.type || '');
    if (!SPELL_TYPES.includes(spellType)) return 'spell type is not supported';
    if (!VOCATIONS[String(record.vocation || '').toLowerCase()]) return 'vocation is not supported';
    for (const [key, min, max, required, integer] of [
      ['mana',0,100_000,true,true], ['cooldown',250,600_000,true,true], ['damage',0,10_000_000,true,true],
      ['range',0,20,true,false], ['levelRequired',1,100_000,true,true], ['buffDuration',1000,600_000,false,true],
      ['buffValue',0,100,false,false], ['scalingCoeff',0,20,false,false],
    ]) { const error = numberIn(record, key, min, max, { required, integer }); if (error) return error; }
    if (spellType === 'buff' && !BUFF_TYPES.includes(String(record.buffType || ''))) return 'buff spells require a supported buffType';
    return optionalColor(record);
  }

  if (type === 'quests') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['levelRequired',1,100_000]]) {
      const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error;
    }
    if (record.requires !== undefined && !Array.isArray(record.requires)) return 'requires must be a JSON array of quest IDs';
    return null;
  }

  if (type === 'maps') {
    const biome = String(record.biome || '').toLowerCase();
    if (!BIOMES.has(biome)) return 'biome is not supported';
    for (const key of ['spawnX','spawnY','townX','townY']) { const error = playableCoord(record, key); if (error) return error; }
    let error = numberIn(record, 'levelRequired', 1, 100_000, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'seed', 1, 2_147_483_646, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'townRange', 0, 20, { required: true, integer: true }); if (error) return error;
    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';
    return null;
  }

  if (type === 'events') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [
      ['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['rewardCoins',0,1_000_000],
    ]) { const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error; }
    const durationMs = record.durationMs !== undefined && record.durationMs !== null && record.durationMs !== ''
      ? Number(record.durationMs)
      : Number(record.duration) * 1000;
    if (!Number.isInteger(durationMs) || durationMs < 1_000 || durationMs > 604_800_000) return 'durationMs must be from 1000 to 604800000';
  }

  return null;
}

function mapOptions(contentDB) {
  const ids = new Set(Object.keys(MAP_CONFIG));
  for (const map of contentDB.get('maps')) if (typeof map?.id === 'string' && map.id.trim()) ids.add(map.id.trim());
  return [...ids].sort();
}

export function getContentStudioSchema(type, contentDB) {
  const schema = CONTENT_STUDIO_SCHEMAS[type] || [];
  const options = {
    rarities: [...RARITIES], slots: [...ITEM_SLOTS], monsterTypes: [...MONSTER_TYPES], npcRoles: [...NPC_ROLES],
    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], vocations: Object.keys(VOCATIONS).sort(),
    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB),
    npcs: contentDB.get('npcs').map(entry => entry.id).filter(Boolean).sort(),
    quests: contentDB.get('quests').map(entry => entry.id).filter(Boolean).sort(),
  };
  const runtimeNotes = {
    items: 'Published item stats feed the authoritative loot pool and procedural 8.4 itemization.',
    monsters: 'Monsters with mapId become authoritative live overlays after publish.',
    npcs: 'NPCs are synchronized to online clients and gate linked quests/services by server proximity.',
    spells: 'Published spells merge into vocation spell slots and execute server-side.',
    quests: 'Quest NPCs, prerequisites and kill targets are checked before publish.',
    maps: 'Map edits rebuild deterministic terrain and live portal travel. Built-in maps cannot be deleted.',
    events: 'World events rotate and reward participants from authoritative server state.',
  };
  return { schema, fields: schema.map(entry => entry.id), options, runtimeNote: runtimeNotes[type] || '' };
}

export function collectContentDiagnostics(contentDB) {
  const issues = [];
  const push = (severity, type, id, message) => { if (issues.length < 250) issues.push({ severity, type, id, message }); };
  for (const type of Object.keys(CONTENT_STUDIO_SCHEMAS)) {
    const records = contentDB.get(type);
    const seen = new Set();
    for (const record of records) {
      const id = typeof record?.id === 'string' ? record.id : '(missing)';
      if (seen.has(id)) push('error', type, id, 'Duplicate content id');
      seen.add(id);
      const semantic = validateStudioRecord(type, record);
      if (semantic) push('error', type, id, semantic);
      const reference = validateContentReferences(contentDB, type, record);
      if (reference) push('error', type, id, reference);
    }
  }
  const byType = {};
  for (const issue of issues) byType[issue.type] = (byType[issue.type] || 0) + 1;
  return { ok: issues.every(issue => issue.severity !== 'error'), total: issues.length, byType, issues };
}
