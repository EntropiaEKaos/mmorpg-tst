import type { Tile, Position } from './types';
import { CITY_STYLES, withCityDefaults, type CityStyle, type CityDistrict, type CityLandmark, type CityProp } from './cityIdentity';

export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
export const MIN_MAP_DIMENSION = 40;
export const MAX_MAP_DIMENSION = 192;
export const TILE_SIZE = 32;

export type SettlementClass = 'wilderness' | 'town' | 'city' | 'capital';
export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards';
export interface UrbanBounds { x: number; y: number; width: number; height: number; }

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
  width?: number;
  height?: number;
  settlementClass?: SettlementClass;
  urbanPlan?: UrbanPlan;
  urbanBounds?: UrbanBounds;
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
  nameplateHeadClearance?: number;
  nameplateStackGap?: number;
  residentialRingEnabled?: boolean;
  residentialRingDensity?: number;
  npcNameplateMode?: 'nearby' | 'always' | 'hidden';
  npcNameplateDistance?: number;
  monsterNameplateMode?: 'nearby' | 'always' | 'hidden';
  monsterNameplateDistance?: number;
  monsterBarDistance?: number;
  monsterNameplateFontSize?: number;
  monsterNameplateBarWidth?: number;
  monsterNameplateBarHeight?: number;
  monsterNameplateShowLevel?: boolean;
  monsterNameplateShowValues?: boolean;
  bossNameplateScale?: number;
  bossNameplateAlwaysVisible?: boolean;
  nameplateCollisionPadding?: number;
  nameplateFadeStart?: number;
}

const BIOME_SEEDS: Record<BiomeType, number> = { plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 };
const VALID_BIOMES = new Set<BiomeType>(['plains', 'snow', 'swamp', 'desert', 'shadow']);
const VALID_CITY_STYLES = new Set<CityStyle>(CITY_STYLES);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function cityCoord(value: unknown, fallback: number, dimension = MAP_WIDTH): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(dimension - 2, Math.round(n))) : fallback;
}
function cityColor(value: unknown, fallback: string): string { return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback; }
function settlementClassOf(value: unknown, mapId = ''): SettlementClass {
  const requested = String(value || (mapId === 'eldoria' ? 'capital' : 'city'));
  return (['wilderness','town','city','capital'] as const).includes(requested as SettlementClass) ? requested as SettlementClass : 'city';
}
function mapDimension(value: unknown, fallback = MAP_WIDTH): number { return integer(value, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, fallback); }
function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' ? requested : 'royal-grid'; }
function normalizeUrbanBounds(raw: unknown, width: number, height: number, townCenter: Position, settlementClass: SettlementClass): UrbanBounds {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Partial<UrbanBounds> : {};
  const radius = settlementClass === 'capital' ? Math.min(36, Math.floor(Math.min(width, height) / 3)) : Math.min(14, Math.floor(Math.min(width, height) / 4));
  const x = integer(source.x, 1, width - 3, Math.max(1, townCenter.x - radius));
  const y = integer(source.y, 1, height - 3, Math.max(1, townCenter.y - radius));
  const maxWidth = Math.max(2, width - x - 1);
  const maxHeight = Math.max(2, height - y - 1);
  return { x, y, width: integer(source.width, 2, maxWidth, Math.min(maxWidth, radius * 2)), height: integer(source.height, 2, maxHeight, Math.min(maxHeight, radius * 2)) };
}
function cityBudgets(settlementClass: SettlementClass) {
  const capital = settlementClass === 'capital';
  return { districtLimit: capital ? 24 : 8, landmarkLimit: capital ? 64 : 12, propLimit: capital ? 320 : 80, districtRadiusLimit: capital ? 24 : 12, landmarkSizeLimit: capital ? 20 : 10 };
}
function normalizeDistricts(raw: unknown, width: number, height: number, settlementClass: SettlementClass): CityDistrict[] {
  if (!Array.isArray(raw)) return [];
  const { districtLimit, districtRadiusLimit } = cityBudgets(settlementClass);
  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, districtLimit).map((entry: any, index) => ({
    id: String(entry.id || `district_${index + 1}`).slice(0, 60), name: String(entry.name || `District ${index + 1}`).slice(0, 60), icon: String(entry.icon || '◇').slice(0, 8),
    x: cityCoord(entry.x, Math.floor(width / 2), width), y: cityCoord(entry.y, Math.floor(height / 2), height), radius: Math.max(1, Math.min(districtRadiusLimit, Math.round(Number(entry.radius) || 4))), color: cityColor(entry.color, '#d8b45a'),
  }));
}
function normalizeLandmarks(raw: unknown, width: number, height: number, settlementClass: SettlementClass): CityLandmark[] {
  const kinds = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower','house']);
  if (!Array.isArray(raw)) return [];
  const { landmarkLimit, landmarkSizeLimit } = cityBudgets(settlementClass);
  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, landmarkLimit).map((entry: any, index) => ({
    id: String(entry.id || `landmark_${index + 1}`).slice(0, 60), name: String(entry.name || `Landmark ${index + 1}`).slice(0, 60),
    kind: (kinds.has(String(entry.kind)) ? String(entry.kind) : 'market') as CityLandmark['kind'], icon: String(entry.icon || '◆').slice(0, 8),
    x: cityCoord(entry.x, Math.floor(width / 2), width), y: cityCoord(entry.y, Math.floor(height / 2), height), w: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.w) || 4))), h: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.h) || 4))),
    ...(entry.showOnMinimap === false ? { showOnMinimap: false } : {}),
  }));
}
function normalizeProps(raw: unknown, width: number, height: number, settlementClass: SettlementClass): CityProp[] {
  const kinds = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);
  if (!Array.isArray(raw)) return [];
  const { propLimit } = cityBudgets(settlementClass);
  return raw.filter((entry: any) => entry && typeof entry === 'object' && kinds.has(String(entry.kind))).slice(0, propLimit).map((entry: any, index) => ({
    id: String(entry.id || `prop_${index + 1}`).slice(0, 60), kind: String(entry.kind) as CityProp['kind'], x: cityCoord(entry.x, Math.floor(width / 2), width), y: cityCoord(entry.y, Math.floor(height / 2), height),
    color: typeof entry.color === 'string' && HEX_COLOR.test(entry.color) ? entry.color : undefined, label: typeof entry.label === 'string' ? entry.label.slice(0, 60) : undefined,
  }));
}
function hydrateMapIdentity(map: GameMap): GameMap {
  const width = mapDimension(map.width, MAP_WIDTH);
  const height = mapDimension(map.height, MAP_HEIGHT);
  const settlementClass = settlementClassOf(map.settlementClass, map.id);
  const urbanPlan = urbanPlanOf(map.urbanPlan, map.id);
  const townCenter = { x: cityCoord(map.townCenter?.x, Math.floor(width / 2), width), y: cityCoord(map.townCenter?.y, Math.floor(height / 2), height) };
  const style = VALID_CITY_STYLES.has(map.cityStyle) ? map.cityStyle : undefined;
  const hydrated = withCityDefaults({
    id: map.id, name: map.name, style, biome: map.biome, townCenter, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor,
    districts: normalizeDistricts(map.districts, width, height, settlementClass), landmarks: normalizeLandmarks(map.landmarks, width, height, settlementClass), props: normalizeProps(map.props, width, height, settlementClass),
  });
  return { ...map, width, height, settlementClass, urbanPlan, urbanBounds: normalizeUrbanBounds(map.urbanBounds, width, height, townCenter, settlementClass), townCenter, cityStyle: hydrated.style, cityAccent: hydrated.cityAccent, roofColor: hydrated.roofColor, wallColor: hydrated.wallColor, roadColor: hydrated.roadColor, districts: hydrated.districts, landmarks: hydrated.landmarks, props: hydrated.props };
}

export function getMapDimensions(map: Pick<GameMap, 'width' | 'height'> | undefined): { width: number; height: number } {
  return { width: mapDimension(map?.width, MAP_WIDTH), height: mapDimension(map?.height, MAP_HEIGHT) };
}

const BASE_MAPS: Record<string, GameMap> = {
  eldoria: {
    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains', seed: 42,
    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 40, y: 40 }, townCenter: { x: 40, y: 40 }, townRange: 10,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 80, y: 138 }, label: '🍄 To Shadowfen' },
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
    portals: [{ pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 130, y: 112 }, label: '❄ To Frostpeak' }],
  },
  voidlands: {
    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow', seed: 666,
    cityStyle: 'void', cityAccent: '#a86dff', roofColor: '#21192d', wallColor: '#4c4259', roadColor: '#342c42', districts: [], landmarks: [], props: [],
    spawnPoint: { x: 70, y: 70 }, townCenter: { x: 40, y: 40 }, townRange: 6, levelRequired: 25, dangerLevel: 'Nightmare',
    portals: [{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 22, y: 34 }, label: '🍄 To Shadowfen' }],
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

function normalizePortal(raw: any, width = MAP_WIDTH, height = MAP_HEIGHT): Portal | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = integer(raw.x ?? raw.pos?.x, 1, width - 2, -1);
  const y = integer(raw.y ?? raw.pos?.y, 1, height - 2, -1);
  const targetX = integer(raw.targetX ?? raw.targetSpawn?.x, 1, MAX_MAP_DIMENSION - 2, -1);
  const targetY = integer(raw.targetY ?? raw.targetSpawn?.y, 1, MAX_MAP_DIMENSION - 2, -1);
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
    const width = mapDimension(raw.width, base?.width || MAP_WIDTH);
    const height = mapDimension(raw.height, base?.height || MAP_HEIGHT);
    const settlementClass = settlementClassOf(raw.settlementClass ?? base?.settlementClass, id);
    const urbanPlan = urbanPlanOf(raw.urbanPlan ?? base?.urbanPlan, id);
    const spawnBase = base?.spawnPoint || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    const townBase = base?.townCenter || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    const portals = Array.isArray(raw.portals)
      ? raw.portals.map((portal: any) => normalizePortal(portal, width, height)).filter((portal: Portal | null): portal is Portal => Boolean(portal)).slice(0, 20)
      : (base?.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })) || []);
    const townCenter = {
      x: integer(raw.townX ?? raw.townCenter?.x, 1, width - 2, townBase.x),
      y: integer(raw.townY ?? raw.townCenter?.y, 1, height - 2, townBase.y),
    };
    next[id] = hydrateMapIdentity({
      id,
      width, height, settlementClass, urbanPlan, urbanBounds: normalizeUrbanBounds(raw.urbanBounds ?? base?.urbanBounds, width, height, townCenter, settlementClass),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : (base?.name || id),
      description: typeof raw.description === 'string' ? raw.description.trim().slice(0, 300) : (base?.description || ''),
      biome,
      seed: integer(raw.seed, 1, 2_147_483_646, base?.seed || seedFor(id, biome)),
      spawnPoint: {
        x: integer(raw.spawnX ?? raw.spawnPoint?.x, 1, width - 2, spawnBase.x),
        y: integer(raw.spawnY ?? raw.spawnPoint?.y, 1, height - 2, spawnBase.y),
      },
      townCenter,
      townRange: integer(raw.townRange, 0, 20, base?.townRange ?? 8),
      levelRequired: integer(raw.levelRequired, 1, 100_000, base?.levelRequired ?? 1),
      dangerLevel: typeof raw.dangerLevel === 'string' ? raw.dangerLevel.slice(0, 40) : base?.dangerLevel,
      cityStyle: (typeof raw.cityStyle === 'string' ? raw.cityStyle : base?.cityStyle) as CityStyle,
      cityAccent: cityColor(raw.cityAccent, base?.cityAccent || '#d8b45a'), roofColor: cityColor(raw.roofColor, base?.roofColor || '#7e2f34'),
      wallColor: cityColor(raw.wallColor, base?.wallColor || '#c9b68d'), roadColor: cityColor(raw.roadColor, base?.roadColor || '#9b8764'),
      districts: Array.isArray(raw.districts) ? normalizeDistricts(raw.districts, width, height, settlementClass) : (base?.districts || []),
      landmarks: Array.isArray(raw.landmarks) ? normalizeLandmarks(raw.landmarks, width, height, settlementClass) : (base?.landmarks || []),
      props: Array.isArray(raw.props) ? normalizeProps(raw.props, width, height, settlementClass) : (base?.props || []),
      nameplateOffsetY: Number.isFinite(Number(raw.nameplateOffsetY)) ? Math.max(-32, Math.min(12, Number(raw.nameplateOffsetY))) : base?.nameplateOffsetY,
      nameplateScale: Number.isFinite(Number(raw.nameplateScale)) ? Math.max(.55, Math.min(1.5, Number(raw.nameplateScale))) : base?.nameplateScale,
      nameplateBarWidth: Number.isFinite(Number(raw.nameplateBarWidth)) ? Math.max(18, Math.min(64, Number(raw.nameplateBarWidth))) : base?.nameplateBarWidth,
      nameplateBarHeight: Number.isFinite(Number(raw.nameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.nameplateBarHeight))) : base?.nameplateBarHeight,
      nameplateFontSize: Number.isFinite(Number(raw.nameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.nameplateFontSize))) : base?.nameplateFontSize,
      nameplateShowValues: typeof raw.nameplateShowValues === 'boolean' ? raw.nameplateShowValues : base?.nameplateShowValues,
      nameplateHeadClearance: Number.isFinite(Number(raw.nameplateHeadClearance)) ? Math.max(4, Math.min(24, Number(raw.nameplateHeadClearance))) : base?.nameplateHeadClearance,
      nameplateStackGap: Number.isFinite(Number(raw.nameplateStackGap)) ? Math.max(1, Math.min(8, Number(raw.nameplateStackGap))) : base?.nameplateStackGap,
      residentialRingEnabled: typeof raw.residentialRingEnabled === 'boolean' ? raw.residentialRingEnabled : (base?.residentialRingEnabled ?? false),
      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),
      npcNameplateMode: ['nearby','always','hidden'].includes(String(raw.npcNameplateMode)) ? raw.npcNameplateMode : (base?.npcNameplateMode ?? 'nearby'),
      npcNameplateDistance: Number.isFinite(Number(raw.npcNameplateDistance)) ? Math.max(2, Math.min(20, Number(raw.npcNameplateDistance))) : base?.npcNameplateDistance,
      monsterNameplateMode: ['nearby','always','hidden'].includes(String(raw.monsterNameplateMode)) ? raw.monsterNameplateMode : (base?.monsterNameplateMode ?? 'nearby'),
      monsterNameplateDistance: Number.isFinite(Number(raw.monsterNameplateDistance)) ? Math.max(2, Math.min(24, Number(raw.monsterNameplateDistance))) : base?.monsterNameplateDistance,
      monsterBarDistance: Number.isFinite(Number(raw.monsterBarDistance)) ? Math.max(1, Math.min(20, Number(raw.monsterBarDistance))) : base?.monsterBarDistance,
      monsterNameplateFontSize: Number.isFinite(Number(raw.monsterNameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.monsterNameplateFontSize))) : base?.monsterNameplateFontSize,
      monsterNameplateBarWidth: Number.isFinite(Number(raw.monsterNameplateBarWidth)) ? Math.max(18, Math.min(72, Number(raw.monsterNameplateBarWidth))) : base?.monsterNameplateBarWidth,
      monsterNameplateBarHeight: Number.isFinite(Number(raw.monsterNameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.monsterNameplateBarHeight))) : base?.monsterNameplateBarHeight,
      monsterNameplateShowLevel: typeof raw.monsterNameplateShowLevel === 'boolean' ? raw.monsterNameplateShowLevel : base?.monsterNameplateShowLevel,
      monsterNameplateShowValues: typeof raw.monsterNameplateShowValues === 'boolean' ? raw.monsterNameplateShowValues : base?.monsterNameplateShowValues,
      bossNameplateScale: Number.isFinite(Number(raw.bossNameplateScale)) ? Math.max(.8, Math.min(1.8, Number(raw.bossNameplateScale))) : base?.bossNameplateScale,
      bossNameplateAlwaysVisible: typeof raw.bossNameplateAlwaysVisible === 'boolean' ? raw.bossNameplateAlwaysVisible : base?.bossNameplateAlwaysVisible,
      nameplateCollisionPadding: Number.isFinite(Number(raw.nameplateCollisionPadding)) ? Math.max(0, Math.min(10, Number(raw.nameplateCollisionPadding))) : base?.nameplateCollisionPadding,
      nameplateFadeStart: Number.isFinite(Number(raw.nameplateFadeStart)) ? Math.max(.2, Math.min(.95, Number(raw.nameplateFadeStart))) : base?.nameplateFadeStart,
      portals,
    });
  }

  const known = new Set(Object.keys(next));
  for (const map of Object.values(next)) {
    map.portals = map.portals.filter(portal => {
      if (!known.has(portal.targetMap)) return false;
      const target = next[portal.targetMap];
      const targetWidth = target?.width || MAP_WIDTH;
      const targetHeight = target?.height || MAP_HEIGHT;
      return portal.targetSpawn.x >= 1 && portal.targetSpawn.x <= targetWidth - 2 && portal.targetSpawn.y >= 1 && portal.targetSpawn.y <= targetHeight - 2;
    });
  }
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

function harborShoreY(map: GameMap, x: number): number {
  return Math.round(map.townCenter.y + 32 + Math.abs(x - map.townCenter.x) * 0.16);
}

function harborCapitalTile(map: GameMap, x: number, y: number): Tile | null {
  if (!map.urbanBounds) return null;
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const shoreY = harborShoreY(map, x);
  const pierXs = [cx - 30, cx - 12, cx + 12, cx + 30];
  const pier = pierXs.some(px => Math.abs(x - px) <= 1) && y >= shoreY - 1 && y <= shoreY + 18;
  const breakwater = Math.abs(y - (cy + 62)) <= 1 && x >= cx - 36 && x <= cx + 36 && Math.abs(x - cx) > 5;
  if (pier || breakwater) return { type:'bridge', walkable:true, blocksSight:false };
  if (y >= shoreY) return { type:'water', walkable:false, blocksSight:false };
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  const gate = (y === minY && Math.abs(x - cx) <= 2) || (x === maxX && Math.abs(y - cy) <= 2);
  if (gate) return { type:'path', walkable:true, blocksSight:false };
  const landWall = y === minY || ((x === minX || x === maxX) && y < shoreY - 3);
  if (landWall) return { type:'wall', walkable:false, blocksSight:true };
  const quay = y >= shoreY - 3 && y < shoreY;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const merchant = Math.abs(y - (cy + 18)) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1;
  return { type:(quay || major || merchant || secondary) ? 'path' : 'floor', walkable:true, blocksSight:false };
}


function forestCapitalTile(map: GameMap, x: number, y: number): Tile | null {
  const bounds = map.urbanBounds;
  if (!bounds) return null;
  const minX = bounds.x, minY = bounds.y;
  const maxX = minX + bounds.width - 1, maxY = minY + bounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const gate = (x === minX && Math.abs(y - cy) <= 2)
    || (x === maxX && Math.abs(y - cy) <= 2)
    || (y === minY && Math.abs(x - cx) <= 2)
    || (y === maxY && Math.abs(x - cx) <= 2);
  if (gate) return { type:'path', walkable:true, blocksSight:false };
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'tree', walkable:false, blocksSight:true };

  const dx = x - cx, dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const cardinal = Math.abs(dx) <= 1 || Math.abs(dy) <= 1;
  const trailRings = Math.abs(distance - 20) <= 1.2 || Math.abs(distance - 38) <= 1.2;
  const lumberRoads = Math.abs(x - (cx - 26)) <= 1 || Math.abs(x - (cx + 26)) <= 1;
  const hunterRoads = Math.abs(y - (cy - 24)) <= 1 || Math.abs(y - (cy + 24)) <= 1;
  const centralClearing = Math.abs(dx) <= 7 && Math.abs(dy) <= 7;
  const roads = cardinal || trailRings || lumberRoads || hunterRoads || centralClearing;
  if (roads) return { type:'path', walkable:true, blocksSight:false };

  const groves = [[cx-31,cy-28],[cx+31,cy-30],[cx-32,cy+31],[cx+32,cy+30]];
  const groveTree = groves.some(([gx,gy]) => {
    const gxDelta = x - gx, gyDelta = y - gy;
    return gxDelta * gxDelta + gyDelta * gyDelta <= 34 && ((x * 17 + y * 31) % 5 !== 0);
  });
  if (groveTree) return { type:'tree', walkable:false, blocksSight:true };
  return { type:'grass', walkable:true, blocksSight:false };
}


function terracedBastionTile(map: GameMap, x: number, y: number): Tile | null {
  const bounds=map.urbanBounds; if(!bounds)return null;
  const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=map.townCenter.x;
  const portalGate=map.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const verticalGate=(y===minY||y===maxY)&&Math.abs(x-cx)<=2;
  if(portalGate||verticalGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const retaining=[42,66,90,114].includes(y);
  const ramp=Math.abs(x-cx)<=2||Math.abs(x-(cx-30))<=1||Math.abs(x-(cx+30))<=1;
  if(retaining&&!ramp)return {type:'wall',walkable:false,blocksSight:true};
  const vertical=ramp;
  const terraceRoad=[34,58,82,106,130].some(line=>Math.abs(y-line)<=1);
  const highCourt=x>=cx-16&&x<=cx+16&&y>=26&&y<=38;
  const forgeCourt=x>=42&&x<=62&&y>=72&&y<=86;
  const expeditionCourt=x>=98&&x<=122&&y>=72&&y<=86;
  const lowerCourt=x>=cx-14&&x<=cx+14&&y>=96&&y<=108;
  return {type:(vertical||terraceRoad||highCourt||forgeCourt||expeditionCourt||lowerCourt)?'path':'snow',walkable:true,blocksSight:false};
}


function marshWardsTile(map: GameMap, x: number, y: number): Tile | null {
  const bounds=map.urbanBounds;if(!bounds)return null;
  const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=map.townCenter.x,cy=map.townCenter.y;
  const portalGate=map.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const northGate=y===minY&&Math.abs(x-cx)<=2;
  const eastGate=x===maxX&&Math.abs(y-cy)<=2;
  if(portalGate||northGate||eastGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'water',walkable:false,blocksSight:false};

  const westCanal=cx-27+Math.round(Math.sin((y-minY)/10)*4);
  const eastCanal=cx+27+Math.round(Math.sin((y-minY)/12)*5);
  const crossCanal=cy+Math.round(Math.sin((x-minX)/13)*4);
  const inCanal=Math.abs(x-westCanal)<=3||Math.abs(x-eastCanal)<=3||Math.abs(y-crossCanal)<=2;
  const centralSpine=Math.abs(x-cx)<=1;
  const causeway=[54,82,110,136].some(line=>Math.abs(y-line)<=1);
  const wardWalk=Math.abs(x-40)<=1||Math.abs(x-120)<=1;
  const boardwalk=centralSpine||causeway||wardWalk;
  if(boardwalk&&inCanal)return {type:'bridge',walkable:true,blocksSight:false};
  if(boardwalk)return {type:'path',walkable:true,blocksSight:false};
  const fenCourt=x>=70&&x<=94&&y>=68&&y<=98;
  if(fenCourt)return {type:'path',walkable:true,blocksSight:false};
  if(inCanal)return {type:'water',walkable:false,blocksSight:false};
  const westReed=Math.abs(x-westCanal)<=5,eastReed=Math.abs(x-eastCanal)<=5,crossReed=Math.abs(y-crossCanal)<=4;
  if((westReed||eastReed||crossReed)&&((x*19+y*23)%7===0))return {type:'bush',walkable:false,blocksSight:false};
  return {type:'grass',walkable:true,blocksSight:false};
}

function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
  if (map.settlementClass !== 'capital' || !map.urbanBounds) return null;
  if (map.urbanPlan === 'harbor-crescent') return harborCapitalTile(map, x, y);
  if (map.urbanPlan === 'forest-rings') return forestCapitalTile(map, x, y);
  if (map.urbanPlan === 'terraced-bastion') return terracedBastionTile(map, x, y);
  if (map.urbanPlan === 'marsh-wards') return marshWardsTile(map, x, y);
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const royalAxes = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
  const secondaryBoulevards = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  const civicPlaza = Math.abs(x - cx) <= 7 && Math.abs(y - cy) <= 7;
  const crownForecourt = x >= cx - 12 && x <= cx + 12 && y >= cy - 28 && y <= cy - 20;
  const marketSquare = x >= cx - 36 && x <= cx - 14 && y >= cy - 14 && y <= cy + 8;
  const dawnSquare = x >= cx + 14 && x <= cx + 36 && y >= cy - 22 && y <= cy + 6;
  const gardenPromenade = x >= cx - 16 && x <= cx + 22 && y >= cy + 28 && y <= cy + 32;
  const ceremonial = royalAxes || secondaryBoulevards || innerRing || civicPlaza || crownForecourt || marketSquare || dawnSquare || gardenPromenade;
  return { type:ceremonial ? 'path' : 'floor', walkable:true, blocksSight:false };
}

export function generateMap(mapId: string): Tile[][] {
  const mapData = MAPS[mapId] || MAPS.eldoria;
  const biome = mapData.biome;
  const rand = seededRandom(mapData.seed || seedFor(mapData.id, biome));
  const map: Tile[][] = [];
  const tc = mapData.townCenter;
  const { width: mapWidth, height: mapHeight } = getMapDimensions(mapData);

  for (let y = 0; y < mapHeight; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < mapWidth; x++) {
      let type: Tile['type'] = 'grass'; let walkable = true; let blocksSight = false;
      if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) {
        type = 'wall'; walkable = false; blocksSight = true;
      } else if ((mapData.spawnPoint.x === x && mapData.spawnPoint.y === y) || mapData.portals.some(portal => portal.pos.x === x && portal.pos.y === y) || isInboundTarget(mapId, x, y)) {
        type = 'path';
      } else if (blocksByLandmark(mapData, x, y)) {
        // Client prediction mirrors authoritative landmark footprints exactly.
        type = 'wall'; walkable = false; blocksSight = true;
      } else {
        const urban = capitalUrbanTile(mapData, x, y);
        if (urban) { type = urban.type; walkable = urban.walkable; blocksSight = Boolean(urban.blocksSight); }
        else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) type = 'floor';
        else {
        const r = rand();
        if (biome === 'snow') {
          type = 'snow';
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
      }
      const variant: Tile['variant'] = biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;
      row.push({ type, walkable, blocksSight, ...(variant ? { variant } : {}) });
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
