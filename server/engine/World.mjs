// ===================================================================
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
    access: record?.access === 'gm' ? 'gm' : (base?.access === 'gm' ? 'gm' : 'public'),
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
      id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',
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
