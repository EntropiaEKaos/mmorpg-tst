import type { Tile, Position } from './types';
import { CITY_STYLES, withCityDefaults, type CityStyle, type CityDistrict, type CityLandmark, type CityProp } from './cityIdentity';

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
  cityStyle: CityStyle;
  cityAccent: string;
  roofColor: string;
  wallColor: string;
  roadColor: string;
  districts: CityDistrict[];
  landmarks: CityLandmark[];
  props: CityProp[];
  nameplateOffsetY?: number;
  nameplateScale?: number;
  nameplateBarWidth?: number;
  nameplateBarHeight?: number;
  nameplateFontSize?: number;
  nameplateShowValues?: boolean;
  residentialRingEnabled?: boolean;
  residentialRingDensity?: number;
}

const BIOME_SEEDS: Record<BiomeType, number> = { plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 };
const VALID_BIOMES = new Set<BiomeType>(['plains', 'snow', 'swamp', 'desert', 'shadow']);
const VALID_CITY_STYLES = new Set<CityStyle>(CITY_STYLES);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function cityCoord(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(MAP_WIDTH - 2, Math.round(n))) : fallback;
}
function cityColor(value: unknown, fallback: string): string { return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback; }
function normalizeDistricts(raw: unknown): CityDistrict[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, 8).map((entry: any, index) => ({
    id: String(entry.id || `district_${index + 1}`).slice(0, 60), name: String(entry.name || `District ${index + 1}`).slice(0, 60), icon: String(entry.icon || '◇').slice(0, 8),
    x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40), radius: Math.max(1, Math.min(12, Math.round(Number(entry.radius) || 4))), color: cityColor(entry.color, '#d8b45a'),
  }));
}
function normalizeLandmarks(raw: unknown): CityLandmark[] {
  const kinds = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower','house']);
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, 12).map((entry: any, index) => ({
    id: String(entry.id || `landmark_${index + 1}`).slice(0, 60), name: String(entry.name || `Landmark ${index + 1}`).slice(0, 60),
    kind: (kinds.has(String(entry.kind)) ? String(entry.kind) : 'market') as CityLandmark['kind'], icon: String(entry.icon || '◆').slice(0, 8),
    x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40), w: Math.max(1, Math.min(10, Math.round(Number(entry.w) || 4))), h: Math.max(1, Math.min(10, Math.round(Number(entry.h) || 4))),
  }));
}
function normalizeProps(raw: unknown): CityProp[] {
  const kinds = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry: any) => entry && typeof entry === 'object' && kinds.has(String(entry.kind))).slice(0, 80).map((entry: any, index) => ({
    id: String(entry.id || `prop_${index + 1}`).slice(0, 60), kind: String(entry.kind) as CityProp['kind'], x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40),
    color: typeof entry.color === 'string' && HEX_COLOR.test(entry.color) ? entry.color : undefined, label: typeof entry.label === 'string' ? entry.label.slice(0, 60) : undefined,
  }));
}
function hydrateMapIdentity(map: GameMap): GameMap {
  const style = VALID_CITY_STYLES.has(map.cityStyle) ? map.cityStyle : undefined;
  const hydrated = withCityDefaults({
    id: map.id, name: map.name, style, biome: map.biome, townCenter: map.townCenter, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor,
    districts: normalizeDistricts(map.districts), landmarks: normalizeLandmarks(map.landmarks), props: normalizeProps(map.props),
  });
  return { ...map, cityStyle: hydrated.style, cityAccent: hydrated.cityAccent, roofColor: hydrated.roofColor, wallColor: hydrated.wallColor, roadColor: hydrated.roadColor, districts: hydrated.districts, landmarks: hydrated.landmarks, props: hydrated.props };
}

const BASE_MAPS: Record<string, GameMap> = {
  eldoria: {
    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains', seed: 42,
    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 40, y: 40 }, townCenter: { x: 40, y: 40 }, townRange: 10,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' },
    ],
  },
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow', seed: 1337,
    cityStyle: 'alpine', cityAccent: '#9dd8ff', roofColor: '#334b67', wallColor: '#cbd4d8', roadColor: '#7f8c92', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 70, y: 40 }, townCenter: { x: 65, y: 40 }, townRange: 8,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },
  shadowfen: {
    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp', seed: 7,
    cityStyle: 'marsh', cityAccent: '#8fb85a', roofColor: '#334229', wallColor: '#76755c', roadColor: '#5f6048', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 40, y: 70 }, townCenter: { x: 40, y: 65 }, townRange: 8,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 }, label: '☠ To Voidlands' },
    ],
  },
  emberhold: {
    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert', seed: 999,
    cityStyle: 'forge', cityAccent: '#ff9b45', roofColor: '#7c3923', wallColor: '#aa7950', roadColor: '#744a38', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 70, y: 10 }, townCenter: { x: 65, y: 15 }, townRange: 8,
    portals: [{ pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 }, label: '❄ To Frostpeak' }],
  },
  voidlands: {
    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow', seed: 666,
    cityStyle: 'void', cityAccent: '#a86dff', roofColor: '#21192d', wallColor: '#4c4259', roadColor: '#342c42', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 70, y: 70 }, townCenter: { x: 40, y: 40 }, townRange: 6, levelRequired: 25, dangerLevel: 'Nightmare',
    portals: [{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' }],
  },
};

function cloneMap(map: GameMap): GameMap {
  const hydrated = hydrateMapIdentity(map);
  return {
    ...hydrated, spawnPoint: { ...hydrated.spawnPoint }, townCenter: { ...hydrated.townCenter },
    portals: hydrated.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })),
    districts: hydrated.districts.map(entry => ({ ...entry })), landmarks: hydrated.landmarks.map(entry => ({ ...entry })), props: hydrated.props.map(entry => ({ ...entry })),
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
    next[id] = hydrateMapIdentity({
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
      cityStyle: (typeof raw.cityStyle === 'string' ? raw.cityStyle : base?.cityStyle) as CityStyle,
      cityAccent: cityColor(raw.cityAccent, base?.cityAccent || '#d8b45a'), roofColor: cityColor(raw.roofColor, base?.roofColor || '#7e2f34'),
      wallColor: cityColor(raw.wallColor, base?.wallColor || '#c9b68d'), roadColor: cityColor(raw.roadColor, base?.roadColor || '#9b8764'),
      districts: Array.isArray(raw.districts) ? normalizeDistricts(raw.districts) : (base?.districts || []),
      landmarks: Array.isArray(raw.landmarks) ? normalizeLandmarks(raw.landmarks) : (base?.landmarks || []),
      props: Array.isArray(raw.props) ? normalizeProps(raw.props) : (base?.props || []),
      nameplateOffsetY: Number.isFinite(Number(raw.nameplateOffsetY)) ? Math.max(-32, Math.min(12, Number(raw.nameplateOffsetY))) : base?.nameplateOffsetY,
      nameplateScale: Number.isFinite(Number(raw.nameplateScale)) ? Math.max(.55, Math.min(1.5, Number(raw.nameplateScale))) : base?.nameplateScale,
      nameplateBarWidth: Number.isFinite(Number(raw.nameplateBarWidth)) ? Math.max(18, Math.min(64, Number(raw.nameplateBarWidth))) : base?.nameplateBarWidth,
      nameplateBarHeight: Number.isFinite(Number(raw.nameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.nameplateBarHeight))) : base?.nameplateBarHeight,
      nameplateFontSize: Number.isFinite(Number(raw.nameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.nameplateFontSize))) : base?.nameplateFontSize,
      nameplateShowValues: typeof raw.nameplateShowValues === 'boolean' ? raw.nameplateShowValues : base?.nameplateShowValues,
      residentialRingEnabled: typeof raw.residentialRingEnabled === 'boolean' ? raw.residentialRingEnabled : (base?.residentialRingEnabled ?? false),
      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),
      portals,
    });
  }

  const known = new Set(Object.keys(next));
  for (const map of Object.values(next)) map.portals = map.portals.filter(portal => known.has(portal.targetMap));
  for (const key of Object.keys(MAPS)) delete MAPS[key];
  Object.assign(MAPS, next);
}

// Offline City Designer drafts are presentation/content overrides only. Online
// server content always supersedes them when authoritative definitions arrive.
if (typeof localStorage !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem('moria_city_designer_maps') || 'null');
    if (Array.isArray(stored) && stored.length) syncServerMaps(stored);
  } catch { /* ignore malformed local drafts */ }
}

function seededRandom(seed: number) {
  let s = Math.max(1, Math.floor(seed || 1)) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function blocksByLandmark(map: GameMap, x: number, y: number): boolean {
  return map.landmarks.some((landmark) =>
    x >= landmark.x && x < landmark.x + landmark.w &&
    y >= landmark.y && y < landmark.y + landmark.h
  );
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
      } else if ((mapData.spawnPoint.x === x && mapData.spawnPoint.y === y) || mapData.portals.some(portal => portal.pos.x === x && portal.pos.y === y) || isInboundTarget(mapId, x, y)) {
        type = 'path';
      } else if (blocksByLandmark(mapData, x, y)) {
        // Client prediction mirrors authoritative landmark footprints exactly.
        type = 'wall'; walkable = false; blocksSight = true;
      } else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {
        type = 'floor';
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
