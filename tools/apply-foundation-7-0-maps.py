from pathlib import Path

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, content):
    (ROOT / path).write_text(content, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))


WORLD = r'''// ===================================================================
//  MOR'IA SERVER WORLD — deterministic and authoritative
//  Built-in maps are safe defaults; ContentDB can overlay them and add maps.
// ===================================================================

class Monster {
  constructor(data) {
    Object.assign(this, data);
  }
}

const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;
const BIOMES = new Set(['plains', 'snow', 'swamp', 'desert', 'shadow']);
const BIOME_SEEDS = Object.freeze({ plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 });

const MAP_CONFIG = Object.freeze({
  eldoria: {
    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains',
    spawnPoint: { x: 40, y: 40 }, townCenter: { x: 40, y: 40 }, townRange: 10, seed: 42,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' },
    ],
  },
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow',
    spawnPoint: { x: 70, y: 40 }, townCenter: { x: 65, y: 40 }, townRange: 8, seed: 1337,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },
  shadowfen: {
    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp',
    spawnPoint: { x: 40, y: 70 }, townCenter: { x: 40, y: 65 }, townRange: 8, seed: 7,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 }, label: '☠ To Voidlands' },
    ],
  },
  emberhold: {
    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert',
    spawnPoint: { x: 70, y: 10 }, townCenter: { x: 65, y: 15 }, townRange: 8, seed: 999,
    portals: [
      { pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 }, label: '❄ To Frostpeak' },
    ],
  },
  voidlands: {
    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow',
    spawnPoint: { x: 70, y: 70 }, townCenter: { x: 40, y: 40 }, townRange: 6, levelRequired: 25, seed: 666,
    portals: [
      { pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' },
    ],
  },
});

function seededRandom(seed) {
  let s = Math.max(1, Math.floor(Number(seed) || 1)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function integer(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}

function seedFor(id, biome) {
  let hash = 0;
  for (const char of String(id || 'map')) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return Math.max(1, (hash + (BIOME_SEEDS[biome] || 42)) % 2_147_483_647);
}

function normalizePortal(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = integer(raw.x ?? raw.pos?.x, 1, MAP_WIDTH - 2, -1);
  const y = integer(raw.y ?? raw.pos?.y, 1, MAP_HEIGHT - 2, -1);
  const targetX = integer(raw.targetX ?? raw.targetSpawn?.x, 1, MAP_WIDTH - 2, -1);
  const targetY = integer(raw.targetY ?? raw.targetSpawn?.y, 1, MAP_HEIGHT - 2, -1);
  const targetMap = typeof raw.targetMap === 'string' ? raw.targetMap.trim().slice(0, 50) : '';
  if (x < 0 || y < 0 || targetX < 0 || targetY < 0 || !targetMap) return null;
  return {
    pos: { x, y }, targetMap, targetSpawn: { x: targetX, y: targetY },
    label: typeof raw.label === 'string' ? raw.label.trim().slice(0, 80) : '',
  };
}

function normalizeConfig(record, base = null) {
  const id = typeof record?.id === 'string' && record.id.trim() ? record.id.trim().slice(0, 50) : base?.id;
  if (!id) return null;
  const requestedBiome = typeof record?.biome === 'string' ? record.biome.trim().toLowerCase() : '';
  const biome = BIOMES.has(requestedBiome) ? requestedBiome : (base?.biome || 'plains');
  const baseSpawn = base?.spawnPoint || { x: 40, y: 40 };
  const baseTown = base?.townCenter || { x: 40, y: 40 };
  const rawPortals = Array.isArray(record?.portals) ? record.portals : (base?.portals || []);
  const portals = rawPortals.map(normalizePortal).filter(Boolean).slice(0, 20);
  return {
    id,
    name: typeof record?.name === 'string' && record.name.trim() ? record.name.trim().slice(0, 80) : (base?.name || id.charAt(0).toUpperCase() + id.slice(1)),
    description: typeof record?.description === 'string' ? record.description.trim().slice(0, 300) : (base?.description || ''),
    biome,
    seed: integer(record?.seed, 1, 2_147_483_646, base?.seed || seedFor(id, biome)),
    spawnPoint: {
      x: integer(record?.spawnX ?? record?.spawnPoint?.x, 1, MAP_WIDTH - 2, baseSpawn.x),
      y: integer(record?.spawnY ?? record?.spawnPoint?.y, 1, MAP_HEIGHT - 2, baseSpawn.y),
    },
    townCenter: {
      x: integer(record?.townX ?? record?.townCenter?.x, 1, MAP_WIDTH - 2, baseTown.x),
      y: integer(record?.townY ?? record?.townCenter?.y, 1, MAP_HEIGHT - 2, baseTown.y),
    },
    townRange: integer(record?.townRange, 0, 20, base?.townRange ?? 8),
    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),
    portals,
  };
}

class WorldManager {
  constructor() {
    this.maps = new Map();
    this.configs = new Map();
    this.init();
  }

  init() {
    this.configs.clear();
    for (const [id, base] of Object.entries(MAP_CONFIG)) this.configs.set(id, normalizeConfig({ id }, base));
    this.rebuildMaps();
  }

  syncContentMaps(mapContent = []) {
    const records = Array.isArray(mapContent)
      ? mapContent.filter(record => record && typeof record === 'object' && typeof record.id === 'string' && record.id.trim())
      : [];
    const byId = new Map(records.map(record => [record.id.trim().slice(0, 50), record]));
    const next = new Map();

    for (const [id, base] of Object.entries(MAP_CONFIG)) {
      next.set(id, normalizeConfig(byId.get(id) || { id }, base));
    }
    for (const record of records) {
      const id = record.id.trim().slice(0, 50);
      if (next.has(id)) continue;
      if (!/^[a-z0-9_-]{2,50}$/i.test(id)) continue;
      const config = normalizeConfig(record, null);
      if (config) next.set(id, config);
    }

    const known = new Set(next.keys());
    for (const config of next.values()) config.portals = config.portals.filter(portal => known.has(portal.targetMap));
    this.configs = next;
    this.rebuildMaps();
    return this.getDefinitions();
  }

  rebuildMaps() {
    this.maps.clear();
    for (const [id, config] of this.configs) this.maps.set(id, this.generateFromConfig(config));

    // Source portal tiles, destination arrival tiles and map spawns must always
    // be walkable on both client and server regardless of procedural terrain.
    for (const config of this.configs.values()) {
      const ownMap = this.maps.get(config.id);
      this.forcePath(ownMap, config.spawnPoint.x, config.spawnPoint.y);
      for (const portal of config.portals) {
        this.forcePath(ownMap, portal.pos.x, portal.pos.y);
        this.forcePath(this.maps.get(portal.targetMap), portal.targetSpawn.x, portal.targetSpawn.y);
      }
    }
  }

  forcePath(map, x, y) {
    const tile = map?.tiles?.[y]?.[x];
    if (!tile) return;
    tile.type = 'path'; tile.walkable = true; tile.blocksSight = false;
  }

  getMapIds() { return Array.from(this.maps.keys()); }
  getMap(id) { return this.maps.get(id); }

  getDefinitions() {
    return Array.from(this.configs.values()).map(config => ({
      id: config.id, name: config.name, description: config.description, biome: config.biome,
      levelRequired: config.levelRequired, seed: config.seed,
      spawnX: config.spawnPoint.x, spawnY: config.spawnPoint.y,
      townX: config.townCenter.x, townY: config.townCenter.y, townRange: config.townRange,
      portals: config.portals.map(portal => ({
        x: portal.pos.x, y: portal.pos.y, targetMap: portal.targetMap,
        targetX: portal.targetSpawn.x, targetY: portal.targetSpawn.y, label: portal.label || '',
      })),
    }));
  }

  generate(id) {
    const config = this.configs.get(id) || this.configs.get('eldoria') || normalizeConfig({ id: 'eldoria' }, MAP_CONFIG.eldoria);
    return this.generateFromConfig(config);
  }

  generateFromConfig(config) {
    const rand = seededRandom(config.seed);
    const tiles = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        let type = 'grass'; let walkable = true; let blocksSight = false;
        if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
          type = 'wall'; walkable = false; blocksSight = true;
        } else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) {
          type = 'floor';
        } else if ((config.spawnPoint.x === x && config.spawnPoint.y === y) || config.portals.some(portal => portal.pos.x === x && portal.pos.y === y)) {
          type = 'path';
        } else {
          const r = rand();
          if (config.biome === 'snow') {
            if (r < 0.15) { type = 'tree'; walkable = false; blocksSight = true; }
            else if (r < 0.20) { type = 'rock'; walkable = false; }
            else if (r < 0.22) { type = 'stone'; walkable = false; }
          } else if (config.biome === 'swamp') {
            if (r < 0.10) { type = 'bush'; walkable = false; }
            else if (r < 0.25) { type = 'water'; walkable = false; }
            else if (r < 0.30) { type = 'tree'; walkable = false; blocksSight = true; }
          } else if (config.biome === 'desert') {
            if (r < 0.08) { type = 'rock'; walkable = false; }
            else if (r < 0.12) { type = 'stone'; walkable = false; }
            else if (r < 0.20 && (Math.pow(x - 10, 2) + Math.pow(y - 10, 2) < 40)) { type = 'lava'; walkable = false; }
          } else if (config.biome === 'shadow') {
            if (r < 0.18) { type = 'rock'; walkable = false; blocksSight = true; }
            else if (r < 0.30 && (Math.pow(x - 40, 2) + Math.pow(y - 40, 2) < 100)) { type = 'lava'; walkable = false; }
          } else {
            if (r < 0.04) { type = 'bush'; walkable = false; }
            else if (r < 0.06) { type = 'stone'; walkable = false; }
            else if (r < 0.18 && ((x < 25 && y < 30) || (x > 50 && y < 30))) { type = 'tree'; walkable = false; blocksSight = true; }
          }
        }
        row.push({ walkable, type, blocksSight });
      }
      tiles.push(row);
    }
    return {
      ...config, width: MAP_WIDTH, height: MAP_HEIGHT, tiles,
      spawnPoint: { ...config.spawnPoint }, townCenter: { ...config.townCenter },
      portals: config.portals.map(portal => ({
        pos: { ...portal.pos }, targetMap: portal.targetMap, targetSpawn: { ...portal.targetSpawn }, label: portal.label || '',
      })),
    };
  }

  findWalkableSpawn(map, preferred) {
    if (preferred && map?.tiles?.[preferred.y]?.[preferred.x]?.walkable) return { ...preferred };
    for (let attempt = 0; attempt < 300; attempt++) {
      const x = 5 + Math.floor(Math.random() * 70);
      const y = 5 + Math.floor(Math.random() * 70);
      if (map?.tiles?.[y]?.[x]?.walkable) return { x, y };
    }
    return map?.spawnPoint ? { ...map.spawnPoint } : { x: 40, y: 40 };
  }

  spawnMonsters(mapId) {
    const templates = {
      eldoria: [
        { name: 'Rat', emoji: '🐀', hp: 20, attack: 4, defense: 1, xp: 10, level: 1, color: '#8b6f47', size: 0.7, count: 10 },
        { name: 'Snake', emoji: '🐍', hp: 35, attack: 7, defense: 2, xp: 18, level: 3, color: '#4a7c3a', size: 0.8, count: 8 },
      ],
      frostpeak: [
        { name: 'Wolf', emoji: '🐺', hp: 60, attack: 12, defense: 4, xp: 30, level: 7, color: '#5a5a5a', size: 0.9, count: 8 },
        { name: 'Bear', emoji: '🐻', hp: 120, attack: 20, defense: 6, xp: 55, level: 10, color: '#5a3a1e', size: 1.05, count: 5 },
      ],
      shadowfen: [
        { name: 'Orc', emoji: '👹', hp: 100, attack: 18, defense: 5, xp: 55, level: 10, color: '#4a5d23', size: 1.0, count: 8 },
        { name: 'Skeleton', emoji: '💀', hp: 80, attack: 15, defense: 4, xp: 45, level: 8, color: '#d4d4c8', size: 0.95, count: 8 },
      ],
      emberhold: [
        { name: 'Demon', emoji: '😈', hp: 400, attack: 50, defense: 15, xp: 300, level: 25, color: '#c13030', size: 1.3, count: 3 },
        { name: 'Dragon Lord', emoji: '🐉', hp: 1500, attack: 85, defense: 30, xp: 2000, level: 40, color: '#8b0000', size: 1.8, count: 1, type: 'boss' },
      ],
      voidlands: [
        { name: 'Ghost', emoji: '👻', hp: 90, attack: 22, defense: 3, xp: 65, level: 12, color: '#ccccff', size: 1.0, count: 8 },
        { name: 'Lich', emoji: '🧙', hp: 1000, attack: 75, defense: 25, xp: 1500, level: 35, color: '#4a0a4a', size: 1.4, count: 1, type: 'boss' },
      ],
    };
    const map = this.getMap(mapId);
    if (!map) return [];
    const list = templates[mapId] || [];
    const monsters = [];
    let id = 0;
    for (const template of list) {
      for (let i = 0; i < template.count; i++) {
        const pos = this.findWalkableSpawn(map);
        monsters.push({
          id: `${mapId}_m_${id++}`, name: template.name, emoji: template.emoji,
          x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,
          hp: template.hp, maxHp: template.hp, attack: template.attack, defense: template.defense,
          xp: template.xp, level: template.level, color: template.color, size: template.size || 1,
          type: template.type || 'normal', dead: false, respawnAt: 0,
          lastMove: 0, lastAttack: 0, speed: 1200,
        });
      }
    }
    return monsters;
  }
}

export const WORLD = new WorldManager();
export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, BIOMES };
'''
write('server/engine/World.mjs', WORLD)

INTEGRITY = r'''import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, BIOMES } from './World.mjs';

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

function validCoordinate(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAP_WIDTH - 2;
}

export function validateContentReferences(contentDB, type, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Invalid content record';

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

  if (type === 'spells') {
    const vocation = typeof record.vocation === 'string' ? record.vocation.trim().toLowerCase() : '';
    if (!vocation || !VOCATIONS[vocation]) return `Spell references unknown vocation: ${vocation || '(empty)'}`;
  }

  if (type === 'maps') {
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    if (!/^[A-Za-z0-9_-]{2,50}$/.test(id)) return 'Map id must be 2-50 letters, numbers, dash or underscore';
    const biome = typeof record.biome === 'string' ? record.biome.trim().toLowerCase() : '';
    if (!BIOMES.has(biome)) return `Map has unsupported biome: ${biome || '(empty)'}`;
    for (const field of ['spawnX', 'spawnY', 'townX', 'townY']) {
      if (record[field] !== undefined && record[field] !== '' && !validCoordinate(Number(record[field]))) return `Map ${field} must be an integer from 1 to ${MAP_WIDTH - 2}`;
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
        if (![x, y, tx, ty].every(value => validCoordinate(Number(value)))) return 'Map portal coordinates must be inside the playable area';
        const targetMap = typeof portal.targetMap === 'string' ? portal.targetMap.trim() : '';
        if (!hasMap(contentDB, targetMap, id)) return `Map portal references unknown map: ${targetMap || '(empty)'}`;
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
  }

  if (type === 'events' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {
    const mapId = String(record.mapId).trim();
    if (!hasMap(contentDB, mapId)) return `World event references unknown map: ${mapId}`;
  }

  return null;
}

export function findBlockingContentReferences(contentDB, type, id) {
  const canonicalId = typeof id === 'string' ? id.trim() : '';
  if (!canonicalId) return [];
  const blockers = [];

  if (type === 'npcs') {
    for (const quest of contentDB.get('quests')) if (quest.npcId === canonicalId) blockers.push({ type: 'quest', id: quest.id, field: 'npcId' });
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
    }
  }

  if (type === 'maps') {
    if (Object.hasOwn(MAP_CONFIG, canonicalId)) blockers.push({ type: 'runtime', id: canonicalId, field: 'builtin-map' });
    for (const npc of contentDB.get('npcs')) if (npc.mapId === canonicalId) blockers.push({ type: 'npc', id: npc.id, field: 'mapId' });
    for (const monster of contentDB.get('monsters')) if (monster.mapId === canonicalId) blockers.push({ type: 'monster', id: monster.id, field: 'mapId' });
    for (const event of contentDB.get('events')) if (event.mapId === canonicalId) blockers.push({ type: 'event', id: event.id, field: 'mapId' });
    for (const map of contentDB.get('maps')) {
      if (map.id === canonicalId || !Array.isArray(map.portals)) continue;
      for (const portal of map.portals) if (portal?.targetMap === canonicalId) blockers.push({ type: 'map', id: map.id, field: 'portals.targetMap' });
    }
  }

  return blockers;
}
'''
write('server/engine/ContentIntegrity.mjs', INTEGRITY)

MAPS_TS = r'''import type { Tile, Position } from './types';

export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
export const TILE_SIZE = 32;

export type BiomeType = 'plains' | 'snow' | 'swamp' | 'desert' | 'shadow';

export interface Portal {
  pos: Position;
  targetMap: string;
  targetSpawn: Position;
  label: string;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  biome: BiomeType;
  seed?: number;
  spawnPoint: Position;
  portals: Portal[];
  townCenter: Position;
  townRange: number;
  levelRequired?: number;
  dangerLevel?: string;
}

const BIOME_SEEDS: Record<BiomeType, number> = { plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 };
const VALID_BIOMES = new Set<BiomeType>(['plains', 'snow', 'swamp', 'desert', 'shadow']);

const BASE_MAPS: Record<string, GameMap> = {
  eldoria: {
    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains', seed: 42,
    spawnPoint: { x: 40, y: 40 }, townCenter: { x: 40, y: 40 }, townRange: 10,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' },
    ],
  },
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow', seed: 1337,
    spawnPoint: { x: 70, y: 40 }, townCenter: { x: 65, y: 40 }, townRange: 8,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },
  shadowfen: {
    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp', seed: 7,
    spawnPoint: { x: 40, y: 70 }, townCenter: { x: 40, y: 65 }, townRange: 8,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 }, label: '☠ To Voidlands' },
    ],
  },
  emberhold: {
    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert', seed: 999,
    spawnPoint: { x: 70, y: 10 }, townCenter: { x: 65, y: 15 }, townRange: 8,
    portals: [{ pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 }, label: '❄ To Frostpeak' }],
  },
  voidlands: {
    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow', seed: 666,
    spawnPoint: { x: 70, y: 70 }, townCenter: { x: 40, y: 40 }, townRange: 6, levelRequired: 25, dangerLevel: 'Nightmare',
    portals: [{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' }],
  },
};

function cloneMap(map: GameMap): GameMap {
  return {
    ...map, spawnPoint: { ...map.spawnPoint }, townCenter: { ...map.townCenter },
    portals: map.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })),
  };
}

export const MAPS: Record<string, GameMap> = Object.fromEntries(Object.entries(BASE_MAPS).map(([id, map]) => [id, cloneMap(map)]));

function integer(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}

function seedFor(id: string, biome: BiomeType): number {
  let hash = 0;
  for (const char of id || 'map') hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return Math.max(1, (hash + BIOME_SEEDS[biome]) % 2_147_483_647);
}

function normalizePortal(raw: any): Portal | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = integer(raw.x ?? raw.pos?.x, 1, MAP_WIDTH - 2, -1);
  const y = integer(raw.y ?? raw.pos?.y, 1, MAP_HEIGHT - 2, -1);
  const targetX = integer(raw.targetX ?? raw.targetSpawn?.x, 1, MAP_WIDTH - 2, -1);
  const targetY = integer(raw.targetY ?? raw.targetSpawn?.y, 1, MAP_HEIGHT - 2, -1);
  const targetMap = typeof raw.targetMap === 'string' ? raw.targetMap.trim().slice(0, 50) : '';
  if (x < 0 || y < 0 || targetX < 0 || targetY < 0 || !targetMap) return null;
  return {
    pos: { x, y }, targetMap, targetSpawn: { x: targetX, y: targetY },
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim().slice(0, 80) : `🌀 To ${targetMap}`,
  };
}

export function syncServerMaps(rawMaps: unknown): void {
  const records = Array.isArray(rawMaps) ? rawMaps.filter((raw: any) => raw && typeof raw === 'object' && typeof raw.id === 'string') : [];
  const next: Record<string, GameMap> = Object.fromEntries(Object.entries(BASE_MAPS).map(([id, map]) => [id, cloneMap(map)]));

  for (const raw of records as any[]) {
    const id = raw.id.trim().slice(0, 50);
    if (!/^[A-Za-z0-9_-]{2,50}$/.test(id)) continue;
    const base = next[id];
    const requestedBiome = typeof raw.biome === 'string' ? raw.biome.trim().toLowerCase() as BiomeType : undefined;
    const biome = requestedBiome && VALID_BIOMES.has(requestedBiome) ? requestedBiome : (base?.biome || 'plains');
    const spawnBase = base?.spawnPoint || { x: 40, y: 40 };
    const townBase = base?.townCenter || { x: 40, y: 40 };
    const portals = Array.isArray(raw.portals)
      ? raw.portals.map(normalizePortal).filter((portal: Portal | null): portal is Portal => Boolean(portal)).slice(0, 20)
      : (base?.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })) || []);
    next[id] = {
      id,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : (base?.name || id),
      description: typeof raw.description === 'string' ? raw.description.trim().slice(0, 300) : (base?.description || ''),
      biome,
      seed: integer(raw.seed, 1, 2_147_483_646, base?.seed || seedFor(id, biome)),
      spawnPoint: {
        x: integer(raw.spawnX ?? raw.spawnPoint?.x, 1, MAP_WIDTH - 2, spawnBase.x),
        y: integer(raw.spawnY ?? raw.spawnPoint?.y, 1, MAP_HEIGHT - 2, spawnBase.y),
      },
      townCenter: {
        x: integer(raw.townX ?? raw.townCenter?.x, 1, MAP_WIDTH - 2, townBase.x),
        y: integer(raw.townY ?? raw.townCenter?.y, 1, MAP_HEIGHT - 2, townBase.y),
      },
      townRange: integer(raw.townRange, 0, 20, base?.townRange ?? 8),
      levelRequired: integer(raw.levelRequired, 1, 100_000, base?.levelRequired ?? 1),
      dangerLevel: typeof raw.dangerLevel === 'string' ? raw.dangerLevel.slice(0, 40) : base?.dangerLevel,
      portals,
    };
  }

  const known = new Set(Object.keys(next));
  for (const map of Object.values(next)) map.portals = map.portals.filter(portal => known.has(portal.targetMap));
  for (const key of Object.keys(MAPS)) delete MAPS[key];
  Object.assign(MAPS, next);
}

function seededRandom(seed: number) {
  let s = Math.max(1, Math.floor(seed || 1)) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function isInboundTarget(mapId: string, x: number, y: number): boolean {
  return Object.values(MAPS).some(map => map.portals.some(portal => portal.targetMap === mapId && portal.targetSpawn.x === x && portal.targetSpawn.y === y));
}

export function generateMap(mapId: string): Tile[][] {
  const mapData = MAPS[mapId] || MAPS.eldoria;
  const biome = mapData.biome;
  const rand = seededRandom(mapData.seed || seedFor(mapData.id, biome));
  const map: Tile[][] = [];
  const tc = mapData.townCenter;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: Tile['type'] = 'grass'; let walkable = true; let blocksSight = false;
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        type = 'wall'; walkable = false; blocksSight = true;
      } else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {
        type = 'floor';
      } else if ((mapData.spawnPoint.x === x && mapData.spawnPoint.y === y) || mapData.portals.some(portal => portal.pos.x === x && portal.pos.y === y) || isInboundTarget(mapId, x, y)) {
        type = 'path';
      } else {
        const r = rand();
        if (biome === 'snow') {
          if (r < 0.15) { type = 'tree'; walkable = false; blocksSight = true; }
          else if (r < 0.20) { type = 'rock'; walkable = false; }
          else if (r < 0.22) { type = 'stone'; walkable = false; }
        } else if (biome === 'swamp') {
          if (r < 0.10) { type = 'bush'; walkable = false; }
          else if (r < 0.25) { type = 'water'; walkable = false; }
          else if (r < 0.30) { type = 'tree'; walkable = false; blocksSight = true; }
        } else if (biome === 'desert') {
          if (r < 0.08) { type = 'rock'; walkable = false; }
          else if (r < 0.12) { type = 'stone'; walkable = false; }
          else if (r < 0.20 && (Math.pow(x - 10, 2) + Math.pow(y - 10, 2) < 40)) { type = 'lava'; walkable = false; }
        } else if (biome === 'shadow') {
          if (r < 0.18) { type = 'rock'; walkable = false; blocksSight = true; }
          else if (r < 0.30 && (Math.pow(x - 40, 2) + Math.pow(y - 40, 2) < 100)) { type = 'lava'; walkable = false; }
        } else {
          if (r < 0.04) { type = 'bush'; walkable = false; }
          else if (r < 0.06) { type = 'stone'; walkable = false; }
          else if (r < 0.18 && ((x < 25 && y < 30) || (x > 50 && y < 30))) { type = 'tree'; walkable = false; blocksSight = true; }
        }
      }
      row.push({ type, walkable, blocksSight });
    }
    map.push(row);
  }
  return map;
}

export function getBiomeTint(biome: BiomeType): { ground: string; groundDark: string; overlay?: string; overlayAlpha?: number } {
  switch (biome) {
    case 'snow': return { ground: '#dfe8ee', groundDark: '#c2cdd6', overlay: '#ffffff', overlayAlpha: 0 };
    case 'swamp': return { ground: '#4a5a3a', groundDark: '#38452c', overlay: '#2a3a1a', overlayAlpha: 0.3 };
    case 'desert': return { ground: '#e8d7a1', groundDark: '#d4c08a', overlay: '#c89060', overlayAlpha: 0 };
    case 'shadow': return { ground: '#2a2535', groundDark: '#1e1a28', overlay: '#000000', overlayAlpha: 0.35 };
    default: return { ground: '#4a7c3a', groundDark: '#3d6a2f' };
  }
}
'''
write('src/game/maps.ts', MAPS_TS)

replace_once('server/engine/GameState.mjs',
"  init() {\n    WORLD.init();\n    for (const mapId of WORLD.getMapIds()) {",
"  init() {\n    WORLD.syncContentMaps(contentDB.get('maps'));\n    for (const mapId of WORLD.getMapIds()) {")

replace_once('server/engine/GameState.mjs',
"  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }\n\n  syncContentItems(itemContent = []) {",
"  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }\n\n  syncContentMaps(mapContent = []) {\n    const previousIds = new Set(WORLD.getMapIds());\n    WORLD.syncContentMaps(mapContent);\n    const nextIds = new Set(WORLD.getMapIds());\n\n    for (const mapId of nextIds) {\n      if (!this.monstersByMap.has(mapId)) this.monstersByMap.set(mapId, WORLD.spawnMonsters(mapId));\n      if (!this.groundItemsByMap.has(mapId)) this.groundItemsByMap.set(mapId, []);\n      if (!this.pendingEvents.has(mapId)) this.pendingEvents.set(mapId, []);\n      const map = WORLD.getMap(mapId);\n      const monsters = this.monstersByMap.get(mapId) || [];\n      for (const monster of monsters) {\n        if (!map?.tiles?.[monster.y]?.[monster.x]?.walkable) {\n          const pos = WORLD.findWalkableSpawn(map, map?.spawnPoint);\n          monster.x = pos.x; monster.y = pos.y; monster.spawnX = pos.x; monster.spawnY = pos.y;\n        }\n      }\n    }\n\n    for (const player of this.players.values()) {\n      let map = WORLD.getMap(player.mapId);\n      if (!map) { player.mapId = 'eldoria'; map = WORLD.getMap('eldoria'); player.targetId = null; }\n      if (!map?.tiles?.[player.y]?.[player.x]?.walkable) {\n        const pos = WORLD.findWalkableSpawn(map, map?.spawnPoint);\n        player.x = pos.x; player.y = pos.y; player.targetId = null;\n      }\n    }\n\n    for (const mapId of previousIds) {\n      if (nextIds.has(mapId)) continue;\n      this.monstersByMap.delete(mapId); this.groundItemsByMap.delete(mapId); this.pendingEvents.delete(mapId);\n    }\n    return WORLD.getMapIds();\n  }\n\n  syncContentItems(itemContent = []) {")

replace_once('server/server.js',
"const READ_ONLY_ADMIN_TYPES = new Set(['maps']);",
"const READ_ONLY_ADMIN_TYPES = new Set();")

replace_once('server/server.js',
"// ContentDB is persistent; reconcile server-owned catalogs into the already-\n// initialized authoritative runtime at server boot.\nengine.syncContentItems(contentDB.get('items'));",
"// ContentDB is persistent; reconcile server-owned catalogs into the already-\n// initialized authoritative runtime at server boot. Maps go first because\n// monsters, NPC references, portals and travel all depend on the world graph.\nengine.syncContentMaps(contentDB.get('maps'));\nengine.syncContentItems(contentDB.get('items'));")

replace_once('server/server.js',
"      maps: ['id','name','biome','description','levelRequired'],",
"      maps: ['id','name','biome','description','levelRequired','seed','spawnX','spawnY','townX','townY','townRange','portals'],")

replace_once('server/server.js',
"    const runtimeNote = type === 'maps'\n      ? 'Reference catalog only: authoritative terrain, portals and map lifecycle are still defined by World.mjs.'\n      : '';\n    return json(res, 200, { items: contentDB.get(type), fields: fieldsMap[type] || [], readOnly, runtimeNote });",
"    const runtimeNote = type === 'maps'\n      ? 'Authoritative runtime: edits regenerate deterministic terrain and synchronize the live world. Built-in maps cannot be deleted.'\n      : '';\n    const items = type === 'maps' ? WORLD.getDefinitions() : contentDB.get(type);\n    return json(res, 200, { items, fields: fieldsMap[type] || [], readOnly, runtimeNote });")

sync_block = "      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));"
sync_new = "      if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }\n      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));"
replace_once('server/server.js', sync_block, sync_new)

replace_once('server/server.js',
"    const blockers = findBlockingContentReferences(contentDB, type, id);",
"    if (type === 'maps' && Array.from(engine.players.values()).some(player => player.mapId === id)) {\n      return json(res, 409, { error: 'Map has online players and cannot be deleted' });\n    }\n    const blockers = findBlockingContentReferences(contentDB, type, id);")

replace_once('server/server.js', sync_block, sync_new)

replace_once('server/server.js',
"      content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length },",
"      content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length, maps: WORLD.getMapIds().length },")

replace_once('server/adminPanel.mjs',
"    if (readOnly) {\n      html += '<div class=\"catalog-note\"><strong>READ-ONLY CATALOG</strong><br>' + escapeHtml(data.runtimeNote || 'This catalog is not connected to the authoritative runtime yet.') + '</div>';\n    }",
"    if (data.runtimeNote) {\n      html += '<div class=\"catalog-note\"><strong>' + (readOnly ? 'READ-ONLY CATALOG' : 'AUTHORITATIVE RUNTIME') + '</strong><br>' + escapeHtml(data.runtimeNote) + '</div>';\n    }")

replace_once('server/adminPanel.mjs',
"      const item = editing === 'new'\n        ? (currentTab === 'monsters'\n          ? { mapId: 'eldoria', count: 1, speed: 1200 }\n          : currentTab === 'spells'\n            ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }\n            : {})",
"      const item = editing === 'new'\n        ? (currentTab === 'maps'\n          ? { biome: 'plains', levelRequired: 1, seed: Date.now() % 2147483646, spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, portals: [] }\n          : currentTab === 'monsters'\n            ? { mapId: 'eldoria', count: 1, speed: 1200 }\n            : currentTab === 'spells'\n              ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }\n              : {})")

replace_once('server/adminPanel.mjs',
"        } else if (f === 'description' || f === 'dialogue') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';",
"        } else if (f === 'portals') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"5\">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';\n        } else if (f === 'description' || f === 'dialogue') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';")

replace_once('server/adminPanel.mjs',
"        let v = el.value;\n        if (typeof data.items[0]?.[f] === 'number' && f !== 'id') v = parseFloat(v) || 0;\n        body[f] = v;",
"        let v = el.value;\n        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);\n        if (f === 'portals') {\n          try { body[f] = JSON.parse(v || '[]'); } catch { alert('Portals must be valid JSON.'); return; }\n          continue;\n        }\n        if (numericFields.has(f)) v = parseFloat(v) || 0;\n        body[f] = v;")

replace_once('src/components/GameScreen.tsx',
"import { generateMap, MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';",
"import { generateMap, MAPS, MAP_WIDTH, MAP_HEIGHT, syncServerMaps } from '../game/maps';")

replace_once('src/components/GameScreen.tsx',
"            const content = msg.payload;\n            localStorage.setItem('moria_server_content', JSON.stringify(content));\n            const quests = Array.isArray(content.quests)",
"            const content = msg.payload;\n            localStorage.setItem('moria_server_content', JSON.stringify(content));\n            syncServerMaps(content.maps);\n            if (MAPS[currentMapIdRef.current]) {\n              worldRef.current = generateMap(currentMapIdRef.current);\n              buildingsRef.current = getTownBuildings(MAPS[currentMapIdRef.current].biome);\n            }\n            const quests = Array.isArray(content.quests)")

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { WORLD, MAP_CONFIG } from '../engine/World.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { validateContentReferences, findBlockingContentReferences } from '../engine/ContentIntegrity.mjs';

function flatPortal(portal) {
  return {
    x: portal.pos.x, y: portal.pos.y, targetMap: portal.targetMap,
    targetX: portal.targetSpawn.x, targetY: portal.targetSpawn.y, label: portal.label || '',
  };
}

test('custom map definitions are validated and referenced maps are protected', () => {
  const collections = {
    maps: [{ id: 'eldoria' }, { id: 'moon_keep', biome: 'shadow' }],
    npcs: [{ id: 'moon_sage', mapId: 'moon_keep' }], monsters: [], events: [], quests: [], spells: [],
  };
  const db = { get: type => collections[type] || [] };
  const record = {
    id: 'moon_keep', name: 'Moon Keep', biome: 'shadow', seed: 1234,
    spawnX: 30, spawnY: 30, townX: 30, townY: 30, townRange: 6, levelRequired: 5,
    portals: [{ x: 10, y: 10, targetMap: 'eldoria', targetX: 40, targetY: 40 }],
  };
  assert.equal(validateContentReferences(db, 'maps', record), null);
  assert.match(validateContentReferences(db, 'maps', { ...record, portals: [{ x: 10, y: 10, targetMap: 'missing', targetX: 40, targetY: 40 }] }), /unknown map/);
  assert.ok(findBlockingContentReferences(db, 'maps', 'moon_keep').some(entry => entry.type === 'npc'));
  assert.ok(findBlockingContentReferences(db, 'maps', 'eldoria').some(entry => entry.field === 'builtin-map'));
});

test('ContentDB maps become deterministic authoritative runtime maps with live portal travel', () => {
  const baseMaps = contentDB.get('maps').map(map => ({ ...map }));
  const custom = {
    id: 'test_realm', name: 'Test Realm', biome: 'snow', description: 'Runtime test map', seed: 424242,
    spawnX: 30, spawnY: 30, townX: 30, townY: 30, townRange: 5, levelRequired: 5,
    portals: [{ x: 12, y: 12, targetMap: 'eldoria', targetX: 40, targetY: 40, label: 'Back' }],
  };
  const eldoria = baseMaps.find(map => map.id === 'eldoria');
  const maps = baseMaps.map(map => map.id === 'eldoria' ? {
    ...map,
    portals: [...MAP_CONFIG.eldoria.portals.map(flatPortal), { x: 20, y: 20, targetMap: 'test_realm', targetX: 30, targetY: 30, label: 'Test Realm' }],
  } : map);
  maps.push(custom);

  engine.syncContentMaps(maps);
  engine.syncContentMonsters(contentDB.get('monsters'));
  const first = WORLD.getMap('test_realm');
  assert.ok(first);
  assert.equal(first.name, 'Test Realm');
  assert.equal(first.biome, 'snow');
  assert.equal(first.levelRequired, 5);
  assert.equal(first.tiles[30][30].walkable, true);
  const signature = [first.tiles[5][5].type, first.tiles[15][25].type, first.tiles[60][60].type];
  engine.syncContentMaps(maps);
  const second = WORLD.getMap('test_realm');
  assert.deepEqual([second.tiles[5][5].type, second.tiles[15][25].type, second.tiles[60][60].type], signature);

  const id = `map_test_${Date.now()}`;
  const player = engine.playerConnect(id, 'MapTester', 'knight', null);
  try {
    player.mapId = 'eldoria'; player.x = 20; player.y = 20; player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'test_realm' } }), false);
    player.level = 5;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'test_realm' } }), true);
    assert.equal(player.mapId, 'test_realm');
    assert.deepEqual({ x: player.x, y: player.y }, { x: 30, y: 30 });
  } finally {
    engine.playerDisconnect(id);
    engine.syncContentMaps(baseMaps);
    engine.syncContentMonsters(contentDB.get('monsters'));
  }
});
'''
write('server/test/map-runtime.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.0 — Expandable World Runtime

This foundation pass removes a major expansion bottleneck: maps are no longer a read-only catalog disconnected from the authoritative game world.

## Authoritative map content

- The server overlays built-in map defaults with `ContentDB.maps` and can create additional procedural maps at runtime.
- Map terrain is deterministic from `biome + seed`, and client/server use the same generator contract.
- Admin map fields include spawn point, town center/range, level requirement, seed and JSON portal definitions.
- Portal sources, destination arrival tiles and spawn points are forced walkable on both runtimes.
- Map level gates are server-enforced from content data.
- Existing five built-in maps remain protected from deletion so account spawns and legacy travel cannot be orphaned.
- Custom maps can be deleted only when no NPCs, monsters, events, portals or online players still reference them.
- Live map edits reconcile player/monster positions and immediately re-sync content monsters.
- `/health` now reports the authoritative runtime map count.

## Expansion contract

A new region can now be introduced from Admin by creating a map, assigning seed/biome/spawn/town metadata, linking portals, then placing ContentDB monsters and NPCs on the new `mapId`. No source-code change to `World.mjs` is required for new procedural regions.

Built-in maps still supply safe fallback metadata for old databases that predate these fields.
'''
write('docs/FOUNDATION_7_0.md', DOC)

print('Foundation 7.0 authoritative map runtime patch applied')
