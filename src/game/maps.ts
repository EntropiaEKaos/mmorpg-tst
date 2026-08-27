import type { Tile, Position } from './types';

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
