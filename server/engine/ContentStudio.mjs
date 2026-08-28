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
const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'ring2', 'amulet', 'cloak', 'belt', 'gloves', 'relic']);
const MAP_ACCESS = Object.freeze(['public', 'gm']);
const EVENT_TYPES = Object.freeze(['invasion', 'boss', 'hunt', 'defense']);
const MONSTER_TYPES = Object.freeze(['normal', 'elite', 'boss']);
const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest', 'taskmaster', 'stablemaster', 'outfitter', 'realtor']);
const SPELL_TYPES = Object.freeze(['attack', 'heal', 'aoe', 'buff']);
const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);
const SPELL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);
const ALLY_EFFECTS = Object.freeze(['none', 'heal', 'buff']);
const ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);
const CITY_STYLES = Object.freeze(['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']);
const CITY_LANDMARK_KINDS = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower','house']);
const CITY_PROP_KINDS = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);
const NAMEPLATE_MODES = Object.freeze(['nearby','always','hidden']);

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
    field('lootTableId', 'Loot table', 'select', { optionKey: 'lootTables', allowEmpty: true }),
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
    field('targetMode', 'Target mode', 'select', { optionKey: 'spellTargetModes' }),
    field('allyEffect', 'Ally effect', 'select', { optionKey: 'allyEffects' }), field('enemyEffect', 'Enemy effect', 'select', { optionKey: 'enemyEffects' }),
    field('allyMultiplier', 'Ally multiplier', 'number'), field('enemyMultiplier', 'Enemy multiplier', 'number'), field('selfMultiplier', 'Self multiplier', 'number'),
    field('dayMultiplier', 'Day multiplier', 'number'), field('nightMultiplier', 'Night multiplier', 'number'), field('drainPercent', 'Drain %', 'number'),
  ]),
  quests: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('npcId', 'Quest NPC', 'select', { optionKey: 'npcs', allowEmpty: true }),
    field('description', 'Description', 'textarea'), field('target', 'Target'), field('count', 'Count', 'number'),
    field('rewardGold', 'Reward gold', 'number'), field('rewardXp', 'Reward XP', 'number'), field('levelRequired', 'Required level', 'number'),
    field('requires', 'Prerequisite quest IDs', 'json'), field('rewardItem', 'Reward item', 'json'),
  ]),
  maps: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('biome', 'Biome', 'select', { optionKey: 'biomes' }), field('description', 'Description', 'textarea'),
    field('levelRequired', 'Required level', 'number'), field('seed', 'Seed', 'number'), field('spawnX', 'Spawn X', 'number'), field('spawnY', 'Spawn Y', 'number'),
    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'),
    field('cityStyle', 'City style', 'select', { optionKey: 'cityStyles' }), field('cityAccent', 'City accent'), field('roofColor', 'Roof color'), field('wallColor', 'Wall color'), field('roadColor', 'Road color'),
    field('nameplateOffsetY', 'Nameplate Y offset', 'number'), field('nameplateScale', 'Nameplate scale', 'number'),
    field('nameplateBarWidth', 'Nameplate bar width', 'number'), field('nameplateBarHeight', 'Nameplate bar height', 'number'), field('nameplateFontSize', 'Name font size', 'number'),
    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('nameplateHeadClearance', 'Head clearance px', 'number'), field('nameplateStackGap', 'Name/bar gap px', 'number'), field('residentialRingEnabled', 'Decorative residential ring', 'boolean'), field('residentialRingDensity', 'Residential density', 'number'),
    field('npcNameplateMode', 'NPC labels', 'select', { optionKey: 'nameplateModes' }), field('npcNameplateDistance', 'NPC label distance', 'number'),
    field('monsterNameplateMode', 'Monster labels', 'select', { optionKey: 'nameplateModes' }), field('monsterNameplateDistance', 'Monster label distance', 'number'), field('monsterBarDistance', 'Monster HP bar distance', 'number'),
    field('monsterNameplateFontSize', 'Monster name font', 'number'), field('monsterNameplateBarWidth', 'Monster HP width', 'number'), field('monsterNameplateBarHeight', 'Monster HP height', 'number'),
    field('monsterNameplateShowLevel', 'Show monster level', 'boolean'), field('monsterNameplateShowValues', 'Show monster HP values', 'boolean'),
    field('bossNameplateScale', 'Boss plate scale', 'number'), field('bossNameplateAlwaysVisible', 'Boss labels always visible', 'boolean'),
    field('nameplateCollisionPadding', 'Label collision padding', 'number'), field('nameplateFadeStart', 'Label fade start ratio', 'number'),
    field('districts', 'Districts', 'json'), field('landmarks', 'Landmarks', 'json'), field('props', 'Street props', 'json'),
    field('access', 'Access', 'select', { optionKey: 'mapAccess' }), field('portals', 'Portals', 'json'),
  ]),
  events: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),
    field('type', 'Event type', 'select', { optionKey: 'eventTypes' }), field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),
    field('rewardXp', 'Reward XP', 'number'), field('rewardCoins', 'Reward coins', 'number'),
    field('mapId', 'Map', 'select', { optionKey: 'maps', allowEmpty: true }), field('durationMs', 'Duration ms', 'number'),
  ]),
  shops: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('npcId', 'Merchant NPC', 'select', { optionKey: 'npcs' }),
    field('description', 'Description', 'textarea'), field('entries', 'Shop entries', 'json'),
  ]),
  lootTables: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('rolls', 'Rolls', 'number'),
    field('description', 'Description', 'textarea'), field('entries', 'Loot entries', 'json'),
  ]),
  gmRoster: Object.freeze([
    field('id', 'ID'), field('name', 'Character name'), field('note', 'GM note', 'textarea'),
  ]),
  taskQuests: Object.freeze([
    field('id','ID'), field('name','Name'), field('npcId','Task master','select',{optionKey:'npcs'}), field('mapId','Map','select',{optionKey:'maps'}),
    field('description','Description','textarea'), field('target','Monster target'), field('targetName','Target label'), field('count','Kills','number'),
    field('minLevel','Min level','number'), field('maxLevel','Max level','number'), field('repeatLimit','Repeat limit','number'), field('taskPoints','Task points','number'),
    field('rewardGold','Reward gold','number'), field('rewardXp','Reward XP','number'), field('bossUnlock','Boss unlock ID'),
  ]),
  houses: Object.freeze([
    field('id','ID'), field('name','Name'), field('mapId','Map','select',{optionKey:'maps'}), field('style','Style'),
    field('x','Interior X','number'), field('y','Interior Y','number'), field('width','Width','number'), field('height','Height','number'),
    field('entranceX','Door X','number'), field('entranceY','Door Y','number'), field('price','Purchase price','number'), field('weeklyRent','Weekly rent','number'), field('levelRequired','Required level','number'),
  ]),
  housingDecor: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('kind','Kind'), field('color','Color'), field('price','Price','number'),
  ]),
  outfits: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('style','Renderer style'), field('price','Price','number'), field('levelRequired','Required level','number'),
    field('defaultUnlocked','Default unlocked','boolean'), field('addon1Name','Addon 1'), field('addon2Name','Addon 2'), field('addonPrice','Addon price','number'),
  ]),
  mounts: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('color','Color'), field('description','Description','textarea'),
    field('speedBonus','Speed bonus %','number'), field('price','Price','number'), field('levelRequired','Required level','number'),
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
    if (record.targetMode !== undefined && record.targetMode !== '' && !SPELL_TARGET_MODES.includes(String(record.targetMode))) return 'targetMode is not supported';
    if (record.allyEffect !== undefined && record.allyEffect !== '' && !ALLY_EFFECTS.includes(String(record.allyEffect))) return 'allyEffect is not supported';
    if (record.enemyEffect !== undefined && record.enemyEffect !== '' && !ENEMY_EFFECTS.includes(String(record.enemyEffect))) return 'enemyEffect is not supported';
    for (const key of ['allyMultiplier','enemyMultiplier','selfMultiplier']) { const error = numberIn(record, key, 0, 5); if (error) return error; }
    for (const key of ['dayMultiplier','nightMultiplier']) { const error = numberIn(record, key, 0.25, 3); if (error) return error; }
    { const error = numberIn(record, 'drainPercent', 0, 100); if (error) return error; }
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

  if (type === 'taskQuests') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key,min,max] of [['count',1,1000000],['minLevel',1,100000],['maxLevel',1,100000],['repeatLimit',1,1000],['taskPoints',0,100000],['rewardGold',0,100000000],['rewardXp',0,100000000]]) {
      const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error;
    }
    if (Number(record.maxLevel) < Number(record.minLevel)) return 'maxLevel cannot be lower than minLevel';
    return null;
  }

  if (type === 'houses') {
    for (const key of ['x','y','entranceX','entranceY']) { const error=playableCoord(record,key); if(error)return error; }
    for (const [key,min,max] of [['width',2,12],['height',2,12],['price',0,100000000],['weeklyRent',0,10000000],['levelRequired',1,100000]]) { const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error; }
    if (Number(record.x)+Number(record.width)>MAP_WIDTH-1 || Number(record.y)+Number(record.height)>MAP_HEIGHT-1) return 'house interior exceeds map bounds';
    const nearBox=Number(record.entranceX)>=Number(record.x)-2&&Number(record.entranceX)<=Number(record.x)+Number(record.width)+1&&Number(record.entranceY)>=Number(record.y)-2&&Number(record.entranceY)<=Number(record.y)+Number(record.height)+1;
    if(!nearBox)return 'house entrance must stay beside its footprint';
    return null;
  }

  if (type === 'housingDecor') { const e=numberIn(record,'price',0,100000000,{required:true,integer:true}); return e||optionalColor(record); }
  if (type === 'outfits') {
    let e=numberIn(record,'price',0,100000000,{required:true,integer:true}); if(e)return e;
    e=numberIn(record,'levelRequired',1,100000,{required:true,integer:true}); if(e)return e;
    return numberIn(record,'addonPrice',0,100000000,{required:true,integer:true});
  }
  if (type === 'mounts') {
    let e=numberIn(record,'speedBonus',0,50,{required:true}); if(e)return e;
    e=numberIn(record,'price',0,100000000,{required:true,integer:true}); if(e)return e;
    e=numberIn(record,'levelRequired',1,100000,{required:true,integer:true}); if(e)return e;
    return optionalColor(record);
  }

  if (type === 'maps') {
    const biome = String(record.biome || '').toLowerCase();
    if (!BIOMES.has(biome)) return 'biome is not supported';
    for (const key of ['spawnX','spawnY','townX','townY']) { const error = playableCoord(record, key); if (error) return error; }
    let error = numberIn(record, 'levelRequired', 1, 100_000, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'seed', 1, 2_147_483_646, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'townRange', 0, 20, { required: true, integer: true }); if (error) return error;
    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';
    if (record.cityStyle !== undefined && record.cityStyle !== '' && !CITY_STYLES.includes(String(record.cityStyle))) return 'cityStyle is not supported';
    for (const key of ['cityAccent','roofColor','wallColor','roadColor']) if (record[key] !== undefined && record[key] !== '' && !COLOR_RE.test(String(record[key]))) return `${key} must be a CSS hex color`;
    for (const [key,min,max] of [['nameplateOffsetY',-32,12],['nameplateScale',0.55,1.5],['nameplateBarWidth',18,64],['nameplateBarHeight',2,8],['nameplateFontSize',7,14],['nameplateHeadClearance',4,24],['nameplateStackGap',1,8],['residentialRingDensity',0,10],['npcNameplateDistance',2,20],['monsterNameplateDistance',2,24],['monsterBarDistance',1,20],['monsterNameplateFontSize',7,14],['monsterNameplateBarWidth',18,72],['monsterNameplateBarHeight',2,8],['bossNameplateScale',0.8,1.8],['nameplateCollisionPadding',0,10],['nameplateFadeStart',0.2,0.95]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }
    if (record.npcNameplateMode !== undefined && !NAMEPLATE_MODES.includes(String(record.npcNameplateMode))) return 'npcNameplateMode is not supported';
    if (record.monsterNameplateMode !== undefined && !NAMEPLATE_MODES.includes(String(record.monsterNameplateMode))) return 'monsterNameplateMode is not supported';
    if (record.nameplateShowValues !== undefined && typeof record.nameplateShowValues !== 'boolean') return 'nameplateShowValues must be boolean';
    if (record.residentialRingEnabled !== undefined && typeof record.residentialRingEnabled !== 'boolean') return 'residentialRingEnabled must be boolean';
    for (const key of ['monsterNameplateShowLevel','monsterNameplateShowValues','bossNameplateAlwaysVisible']) if (record[key] !== undefined && typeof record[key] !== 'boolean') return `${key} must be boolean`;
    if (record.districts !== undefined) {
      if (!Array.isArray(record.districts) || record.districts.length > 8) return 'districts must be a JSON array with at most 8 entries';
      for (const entry of record.districts) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'district entries must be objects'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `district ${e}`; } const e=numberIn(entry,'radius',1,12,{required:true,integer:true}); if(e)return `district ${e}`; if(entry.color && !COLOR_RE.test(String(entry.color))) return 'district color must be a CSS hex color'; }
    }
    if (record.landmarks !== undefined) {
      if (!Array.isArray(record.landmarks) || record.landmarks.length > 12) return 'landmarks must be a JSON array with at most 12 entries';
      for (const entry of record.landmarks) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'landmark entries must be objects'; if (!CITY_LANDMARK_KINDS.has(String(entry.kind||''))) return 'landmark kind is not supported'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `landmark ${e}`; } for (const key of ['w','h']) { const e=numberIn(entry,key,1,10,{required:true,integer:true}); if(e)return `landmark ${e}`; } }
    }
    if (record.props !== undefined) {
      if (!Array.isArray(record.props) || record.props.length > 80) return 'props must be a JSON array with at most 80 entries';
      for (const entry of record.props) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'prop entries must be objects'; if (!CITY_PROP_KINDS.has(String(entry.kind||''))) return 'prop kind is not supported'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `prop ${e}`; } if(entry.color && !COLOR_RE.test(String(entry.color))) return 'prop color must be a CSS hex color'; }
    }
    if (!MAP_ACCESS.includes(String(record.access || 'public'))) return 'map access is not supported';
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

  if (type === 'shops') {
    if (!String(record.npcId || '').trim()) return 'npcId is required';
    if (!Array.isArray(record.entries) || record.entries.length < 1 || record.entries.length > 100) return 'entries must contain 1-100 shop entries';
    for (const entry of record.entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !String(entry.itemId || '').trim()) return 'shop entries require itemId';
      const error = numberIn(entry, 'price', 1, 100_000_000, { required: true, integer: true }); if (error) return error;
    }
    return null;
  }

  if (type === 'lootTables') {
    let error = numberIn(record, 'rolls', 1, 10, { required: true, integer: true }); if (error) return error;
    if (!Array.isArray(record.entries) || record.entries.length < 1 || record.entries.length > 100) return 'entries must contain 1-100 loot entries';
    for (const entry of record.entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'loot entries must be objects';
      if (!String(entry.itemId || entry.name || '').trim()) return 'loot entries require itemId or name';
      const chance = Number(entry.chance); if (!Number.isFinite(chance) || chance <= 0 || chance > 1) return 'loot chance must be > 0 and <= 1';
      const min = Number(entry.min ?? 1), max = Number(entry.max ?? min);
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 9999) return 'loot min/max are invalid';
    }
    return null;
  }

  if (type === 'gmRoster') {
    if (String(record.name || '').trim().length > 80) return 'GM character name is too long';
    return null;
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
    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], spellTargetModes: [...SPELL_TARGET_MODES], allyEffects: [...ALLY_EFFECTS], enemyEffects: [...ENEMY_EFFECTS], vocations: Object.keys(VOCATIONS).sort(),
    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], eventTypes: [...EVENT_TYPES], nameplateModes: [...NAMEPLATE_MODES],
    npcs: contentDB.get('npcs').map(entry => entry.id).filter(Boolean).sort(),
    quests: contentDB.get('quests').map(entry => entry.id).filter(Boolean).sort(),
    items: contentDB.get('items').map(entry => entry.id).filter(Boolean).sort(),
    lootTables: contentDB.get('lootTables').map(entry => entry.id).filter(Boolean).sort(),
  };
  const runtimeNotes = {
    items: 'Published item stats feed the authoritative loot pool and procedural 8.4 itemization.',
    monsters: 'Monsters with mapId become authoritative live overlays after publish.',
    npcs: 'NPCs are synchronized to online clients and gate linked quests/services by server proximity.',
    spells: 'Published spells merge into vocation spell slots and execute server-side.',
    quests: 'Quest NPCs, prerequisites and kill targets are checked before publish.',
    maps: 'Map edits rebuild deterministic terrain and live portal travel. City style, palette, districts, landmarks, street props, nameplates and residential presentation controls drive the runtime presentation and minimap. Built-in maps cannot be deleted.',
    events: 'World events rotate and reward participants from authoritative server state.',
    shops: 'Content shops extend the authoritative alpha merchant catalog and can be edited without a client rebuild.',
    lootTables: 'Loot tables are rolled server-side by monsters that reference them.',
    gmRoster: 'Characters listed here may enter maps whose access is set to gm. This is server-enforced.',
    taskQuests: 'Tibia-style tasks are persistent, repeatable, award task points/rank and progress only from authoritative monster kills.',
    houses: 'House geometry, price and rent are admin content; ownership, guests and decoration are global server state.',
    housingDecor: 'Decor can be purchased and placed only inside an accessible owned house.',
    outfits: 'Outfits and addons are unlockable appearance content rendered for nearby players.',
    mounts: 'Mount ownership, selection and speed are server authoritative; this catalog controls stable inventory.',
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
