import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, URBAN_PLANS, BIOMES } from './World.mjs';

export function objectiveKey(value) {
  return String(value ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function hasMap(contentDB, mapId, extraMapId = '') {
  if (typeof mapId !== 'string' || !mapId.trim()) return false;
  const id = mapId.trim();
  return id === extraMapId || Object.hasOwn(MAP_CONFIG, id) || contentDB.get('maps').some(map => map.id === id);
}

function mapRecord(contentDB, mapId, extraRecord = null) {
  if (extraRecord?.id === mapId) return extraRecord;
  const custom = contentDB.get('maps').find(map => map?.id === mapId);
  return custom || MAP_CONFIG[mapId] || null;
}

function mapDimensions(contentDB, mapId, extraRecord = null) {
  const map = mapRecord(contentDB, mapId, extraRecord);
  const width = Number(map?.width ?? MAP_WIDTH);
  const height = Number(map?.height ?? MAP_HEIGHT);
  return {
    width: Number.isInteger(width) && width >= MIN_MAP_DIMENSION && width <= MAX_MAP_DIMENSION ? width : MAP_WIDTH,
    height: Number.isInteger(height) && height >= MIN_MAP_DIMENSION && height <= MAX_MAP_DIMENSION ? height : MAP_HEIGHT,
  };
}

function validCoordinate(value, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max - 2;
}

export function validateContentReferences(contentDB, type, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Invalid content record';


  if (type === 'nodes') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Node references unknown map: ${mapId || '(empty)'}`;
  }
  if (type === 'factions') {
    const mapId=typeof record.hqMapId==='string'?record.hqMapId.trim():'';
    if(mapId&&!hasMap(contentDB,mapId)) return `Faction references unknown HQ map: ${mapId}`;
    for(const enemy of Array.isArray(record.enemies)?record.enemies:[]){if(enemy===record.id)return 'Faction cannot list itself as an enemy';if(!contentDB.get('factions').some(f=>f.id===enemy))return `Faction references unknown enemy: ${enemy}`;}
  }
  if (type === 'tamingSpecies') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Taming species references unknown map: ${mapId || '(empty)'}`;
    if(!contentDB.get('monsters').some(m=>m.id===record.monsterId)) return `Taming species references unknown monster: ${record.monsterId || '(empty)'}`;
  }
  if (type === 'craftingRecipes') {
    const materialNames=new Set(contentDB.get('materials').map(m=>m.name));
    for(const input of Array.isArray(record.inputs)?record.inputs:[]){if(!input?.name||!Number.isFinite(Number(input.quantity))||Number(input.quantity)<=0)return 'Crafting input must have a positive quantity';if(!materialNames.has(input.name)&&input.name!=='Dragon Scale')return `Crafting recipe references unknown material: ${input.name}`;}
  }

  if (type === 'quests') {
    const npcId = typeof record.npcId === 'string' ? record.npcId.trim() : '';
    if (npcId && !contentDB.get('npcs').some(npc => npc.id === npcId)) return `Quest references unknown NPC: ${npcId}`;
    if (record.requires !== undefined) {
      if (!Array.isArray(record.requires)) return 'Quest prerequisites must be an array of quest IDs';
      const questId = typeof record.id === 'string' ? record.id : '';
      const seen = new Set();
      for (const raw of record.requires) {
        if (typeof raw !== 'string' || !raw.trim()) return 'Quest prerequisite IDs must be non-empty strings';
        const requiredId = raw.trim();
        if (requiredId === questId) return 'Quest cannot require itself';
        if (seen.has(requiredId)) return `Duplicate quest prerequisite: ${requiredId}`;
        seen.add(requiredId);
        if (!contentDB.get('quests').some(quest => quest.id === requiredId)) return `Quest prerequisite does not exist: ${requiredId}`;
      }
    }
  }

  if (type === 'taskQuests') {
    const npcId=typeof record.npcId==='string'?record.npcId.trim():'';
    if(!contentDB.get('npcs').some(npc=>npc.id===npcId)) return `Task references unknown NPC: ${npcId || '(empty)'}`;
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Task references unknown map: ${mapId || '(empty)'}`;
    const wanted=objectiveKey(record.target); const match=contentDB.get('monsters').some(monster=>objectiveKey(monster.id)===wanted||objectiveKey(monster.name)===wanted);
    if(!match) return `Task references unknown monster target: ${record.target || '(empty)'}`;
  }

  if (type === 'houses') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `House references unknown map: ${mapId || '(empty)'}`;
  }

  if (type === 'spells') {
    const vocation = typeof record.vocation === 'string' ? record.vocation.trim().toLowerCase() : '';
    if (!vocation || !VOCATIONS[vocation]) return `Spell references unknown vocation: ${vocation || '(empty)'}`;
  }

  if (type === 'maps') {
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    if (!/^[A-Za-z0-9_-]{2,50}$/.test(id)) return 'Map id must be 2-50 letters, numbers, dash or underscore';
    const biome = typeof record.biome === 'string' ? record.biome.trim().toLowerCase() : '';
    if (!BIOMES.has(biome)) return `Map has unsupported biome: ${biome || '(empty)'}`;
    const width = Number(record.width ?? MAP_WIDTH);
    const height = Number(record.height ?? MAP_HEIGHT);
    if (!Number.isInteger(width) || width < MIN_MAP_DIMENSION || width > MAX_MAP_DIMENSION) return `Map width must be an integer from ${MIN_MAP_DIMENSION} to ${MAX_MAP_DIMENSION}`;
    if (!Number.isInteger(height) || height < MIN_MAP_DIMENSION || height > MAX_MAP_DIMENSION) return `Map height must be an integer from ${MIN_MAP_DIMENSION} to ${MAX_MAP_DIMENSION}`;
    const settlementClass = String(record.settlementClass || (id === 'eldoria' ? 'capital' : 'city'));
    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return `Map settlementClass is not supported: ${settlementClass}`;
    if (record.urbanPlan !== undefined && record.urbanPlan !== '' && !URBAN_PLANS.has(String(record.urbanPlan))) return `Map urbanPlan is not supported: ${record.urbanPlan}`;
    for (const [field, dimension] of [['spawnX', width], ['spawnY', height], ['townX', width], ['townY', height]]) {
      if (record[field] !== undefined && record[field] !== '' && !validCoordinate(Number(record[field]), dimension)) return `Map ${field} must be an integer from 1 to ${dimension - 2}`;
    }
    if (record.urbanBounds !== undefined) {
      const box = record.urbanBounds;
      if (!box || typeof box !== 'object' || Array.isArray(box)) return 'Map urbanBounds must be an object';
      for (const key of ['x','y','width','height']) if (!Number.isInteger(Number(box[key]))) return `Map urbanBounds.${key} must be an integer`;
      if (Number(box.x) < 1 || Number(box.y) < 1 || Number(box.width) < 2 || Number(box.height) < 2 || Number(box.x) + Number(box.width) > width - 1 || Number(box.y) + Number(box.height) > height - 1) return 'Map urbanBounds must stay inside the playable area';
    }
    if (record.townRange !== undefined && record.townRange !== '') {
      const range = Number(record.townRange);
      if (!Number.isInteger(range) || range < 0 || range > 20) return 'Map townRange must be an integer from 0 to 20';
    }
    if (record.levelRequired !== undefined && record.levelRequired !== '') {
      const level = Number(record.levelRequired);
      if (!Number.isInteger(level) || level < 1 || level > 100000) return 'Map levelRequired must be a positive integer';
    }
    if (record.portals !== undefined) {
      if (!Array.isArray(record.portals)) return 'Map portals must be a JSON array';
      if (record.portals.length > 20) return 'Map cannot contain more than 20 portals';
      for (const portal of record.portals) {
        if (!portal || typeof portal !== 'object' || Array.isArray(portal)) return 'Map portal entries must be objects';
        const x = portal.x ?? portal.pos?.x; const y = portal.y ?? portal.pos?.y;
        const tx = portal.targetX ?? portal.targetSpawn?.x; const ty = portal.targetY ?? portal.targetSpawn?.y;
        if (!validCoordinate(Number(x), width) || !validCoordinate(Number(y), height)) return 'Map portal source coordinates must be inside the source playable area';
        const targetMap = typeof portal.targetMap === 'string' ? portal.targetMap.trim() : '';
        if (!hasMap(contentDB, targetMap, id)) return `Map portal references unknown map: ${targetMap || '(empty)'}`;
        const targetDimensions = mapDimensions(contentDB, targetMap, targetMap === id ? record : null);
        if (!validCoordinate(Number(tx), targetDimensions.width) || !validCoordinate(Number(ty), targetDimensions.height)) return 'Map portal target coordinates must be inside the destination playable area';
      }
    }
  }

  if (type === 'npcs') {
    const mapId = typeof record.mapId === 'string' ? record.mapId.trim() : '';
    if (!hasMap(contentDB, mapId)) return `NPC references unknown map: ${mapId || '(empty)'}`;
  }

  if (type === 'monsters' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {
    const mapId = String(record.mapId).trim();
    if (!hasMap(contentDB, mapId)) return `Monster references unknown map: ${mapId}`;
    const lootTableId = typeof record.lootTableId === 'string' ? record.lootTableId.trim() : '';
    if (lootTableId && !contentDB.get('lootTables').some(table => table.id === lootTableId)) return `Monster references unknown loot table: ${lootTableId}`;
  }

  if (type === 'events' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {
    const mapId = String(record.mapId).trim();
    if (!hasMap(contentDB, mapId)) return `World event references unknown map: ${mapId}`;
  }

  if (type === 'shops') {
    if (!contentDB.get('npcs').some(npc => npc.id === record.npcId)) return `Shop references unknown NPC: ${record.npcId}`;
    for (const entry of Array.isArray(record.entries) ? record.entries : []) {
      if (!contentDB.get('items').some(item => item.id === entry.itemId)) return `Shop references unknown item: ${entry.itemId}`;
    }
  }

  if (type === 'lootTables') {
    for (const entry of Array.isArray(record.entries) ? record.entries : []) {
      if (entry.itemId && !contentDB.get('items').some(item => item.id === entry.itemId)) return `Loot table references unknown item: ${entry.itemId}`;
    }
  }

  return null;
}

export function findBlockingContentReferences(contentDB, type, id) {
  const canonicalId = typeof id === 'string' ? id.trim() : '';
  if (!canonicalId) return [];
  const blockers = [];

  if (type === 'npcs') {
    for (const quest of contentDB.get('quests')) if (quest.npcId === canonicalId) blockers.push({ type: 'quest', id: quest.id, field: 'npcId' });
    for (const shop of contentDB.get('shops')) if (shop.npcId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'npcId' });
    for (const task of contentDB.get('taskQuests')) if (task.npcId === canonicalId) blockers.push({ type: 'taskQuest', id: task.id, field: 'npcId' });
  }

  if (type === 'items') {
    for (const shop of contentDB.get('shops')) for (const entry of shop.entries || []) if (entry.itemId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'entries.itemId' });
    for (const table of contentDB.get('lootTables')) for (const entry of table.entries || []) if (entry.itemId === canonicalId) blockers.push({ type: 'lootTable', id: table.id, field: 'entries.itemId' });
  }

  if (type === 'lootTables') {
    for (const monster of contentDB.get('monsters')) if (monster.lootTableId === canonicalId) blockers.push({ type: 'monster', id: monster.id, field: 'lootTableId' });
  }

  if (type === 'quests') {
    for (const quest of contentDB.get('quests')) {
      if (quest.id !== canonicalId && Array.isArray(quest.requires) && quest.requires.includes(canonicalId)) blockers.push({ type: 'quest', id: quest.id, field: 'requires' });
    }
  }

  if (type === 'monsters') {
    const monster = contentDB.get('monsters').find(entry => entry.id === canonicalId);
    if (monster?.mapId) {
      const targetKeys = new Set([objectiveKey(monster.id), objectiveKey(monster.name)].filter(Boolean));
      for (const quest of contentDB.get('quests')) if (targetKeys.has(objectiveKey(quest.target))) blockers.push({ type: 'quest', id: quest.id, field: 'target' });
      for (const task of contentDB.get('taskQuests')) if (targetKeys.has(objectiveKey(task.target))) blockers.push({ type: 'taskQuest', id: task.id, field: 'target' });
    }
  }

  if (type === 'maps') {
    if (Object.hasOwn(MAP_CONFIG, canonicalId)) blockers.push({ type: 'runtime', id: canonicalId, field: 'builtin-map' });
    for (const npc of contentDB.get('npcs')) if (npc.mapId === canonicalId) blockers.push({ type: 'npc', id: npc.id, field: 'mapId' });
    for (const monster of contentDB.get('monsters')) if (monster.mapId === canonicalId) blockers.push({ type: 'monster', id: monster.id, field: 'mapId' });
    for (const event of contentDB.get('events')) if (event.mapId === canonicalId) blockers.push({ type: 'event', id: event.id, field: 'mapId' });
    for (const task of contentDB.get('taskQuests')) if (task.mapId === canonicalId) blockers.push({ type: 'taskQuest', id: task.id, field: 'mapId' });
    for (const house of contentDB.get('houses')) if (house.mapId === canonicalId) blockers.push({ type: 'house', id: house.id, field: 'mapId' });
    for (const map of contentDB.get('maps')) {
      if (map.id === canonicalId || !Array.isArray(map.portals)) continue;
      for (const portal of map.portals) if (portal?.targetMap === canonicalId) blockers.push({ type: 'map', id: map.id, field: 'portals.targetMap' });
    }
  }

  return blockers;
}


const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts', 'nodes', 'factions', 'materials', 'craftingRecipes', 'tamingSpecies']);

export function auditContentReferences(contentDB) {
  const issues = [];
  const counts = {};
  for (const type of AUDIT_TYPES) {
    const records = contentDB.get(type);
    counts[type] = Array.isArray(records) ? records.length : 0;
    const seen = new Set();
    for (const record of Array.isArray(records) ? records : []) {
      const id = typeof record?.id === 'string' ? record.id.trim() : '';
      if (!id) {
        issues.push({ severity: 'error', type, id: '(missing)', message: 'Content record has no valid id.' });
        continue;
      }
      if (seen.has(id)) issues.push({ severity: 'error', type, id, message: `Duplicate ${type} id: ${id}` });
      seen.add(id);
      const error = validateContentReferences(contentDB, type, record);
      if (error) issues.push({ severity: 'error', type, id, message: error });
    }
  }

  // Cross-catalog warnings that are legal but commonly indicate unpublished content.
  for (const monster of contentDB.get('monsters')) {
    if (!monster?.mapId) issues.push({ severity: 'warning', type: 'monsters', id: monster?.id || '(missing)', message: 'Monster is catalog-only because mapId is empty.' });
  }
  for (const event of contentDB.get('events')) {
    if (!event?.mapId) issues.push({ severity: 'warning', type: 'events', id: event?.id || '(missing)', message: 'World event has no mapId and cannot target a regional runtime.' });
  }

  const errors = issues.filter(issue => issue.severity === 'error').length;
  const warnings = issues.filter(issue => issue.severity === 'warning').length;
  return { healthy: errors === 0, errors, warnings, issues, counts };
}
