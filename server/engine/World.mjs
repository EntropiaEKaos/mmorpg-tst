// ===================================================================
//  MOR'IA SERVER WORLD — deterministic and authoritative
//  Built-in maps are safe defaults; ContentDB can overlay them and add maps.
// ===================================================================

import { GRAND_ELDORIA_BUILTIN_WORLD_CONFIG } from './GrandEldoria.mjs';

class Monster {
  constructor(data) {
    Object.assign(this, data);
  }
}

const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;
const MIN_MAP_DIMENSION = 40;
const MAX_MAP_DIMENSION = 192;
const SETTLEMENT_CLASSES = Object.freeze(['wilderness','town','city','capital']);
const SETTLEMENT_CLASS_SET = new Set(SETTLEMENT_CLASSES);
const BIOMES = new Set(['plains', 'snow', 'swamp', 'desert', 'shadow']);
const BIOME_SEEDS = Object.freeze({ plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 });
const CITY_STYLES = new Set(['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']);
const CITY_STYLE_BY_MAP = Object.freeze({ eldoria:'royal',sunreach_coast:'harbor',ironwood:'ironwood',frostpeak:'alpine',shadowfen:'marsh',emberhold:'forge',crystal_deep:'crystal',stormwatch_isle:'storm',voidlands:'void',nightfall_citadel:'nightfall',gm_sanctum:'sanctum' });
const CITY_PALETTES = Object.freeze({
  royal:['#d8b45a','#7e2f34','#c9b68d','#9b8764'], harbor:['#55b9d8','#326177','#c2bda5','#8f8068'], ironwood:['#b48b4a','#4a3324','#8f8066','#755b42'],
  alpine:['#9dd8ff','#334b67','#cbd4d8','#7f8c92'], marsh:['#8fb85a','#334229','#76755c','#5f6048'], forge:['#ff9b45','#7c3923','#aa7950','#744a38'],
  crystal:['#74e1ff','#443d72','#8582a5','#56536e'], storm:['#8ddcff','#405169','#aab4bf','#657180'], void:['#a86dff','#21192d','#4c4259','#342c42'],
  nightfall:['#e85b75','#201b24','#55515b','#39343d'], sanctum:['#f5de8f','#d8d9e7','#d5d0c2','#a79f8d'],
});
const CITY_LANDMARKS = Object.freeze({
  royal:['Sunspire Keep','Grand Market','Temple of Dawn','Royal Depot','Oath Fountain'], harbor:['Tidewatch Hall','Salt Market','Sea Chapel','Harbor Depot','Mariner Gate'],
  ironwood:['Marchwarden Hall','Timber Exchange','Grove Shrine','Ironwood Depot','East Palisade'], alpine:['Frostguard Keep','Anvil Hall','Ice Chapel','Expedition Depot','Northwatch Gate'],
  marsh:['Mirewatch Hall','Lantern Market','Witch Shrine','Fen Depot','Ferryman Dock'], forge:['Ember Citadel','Great Foundry','Ash Bazaar','Flame Shrine','Cinder Arena'],
  crystal:['Prism Hall','Shard Exchange','Resonance Shrine','Deep Depot','Crystal Spire'], storm:['Tempest Bastion','Gale Exchange','Storm Chapel','Fleet Depot','Thunderwatch'],
  void:['Black Obelisk','Bone Market','Silent Sanctum','Rift Depot','Necropolis Gate'], nightfall:['Regent Keep','Blacksteel Market','Moonless Chapel','Citadel Depot','Dread Gate'],
  sanctum:['Astral Command','Review Forum','Aether Shrine','GM Vault','Event Gate'],
});
const CITY_KINDS = ['keep','market','temple','depot','gate'];

const MAP_CONFIG = Object.freeze({
  eldoria: GRAND_ELDORIA_BUILTIN_WORLD_CONFIG,
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow',
    spawnPoint: { x: 70, y: 40 }, townCenter: { x: 65, y: 40 }, townRange: 8, seed: 1337,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 30, y: 80 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },
  shadowfen: {
    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp',
    spawnPoint: { x: 40, y: 70 }, townCenter: { x: 40, y: 65 }, townRange: 8, seed: 7,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 130, y: 120 }, label: '🌳 To Eldoria' },
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

function boundedNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function seedFor(id, biome) {
  let hash = 0;
  for (const char of String(id || 'map')) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return Math.max(1, (hash + (BIOME_SEEDS[biome] || 42)) % 2_147_483_647);
}

function normalizePortal(raw, width = MAP_WIDTH, height = MAP_HEIGHT) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = integer(raw.x ?? raw.pos?.x, 1, width - 2, -1);
  const y = integer(raw.y ?? raw.pos?.y, 1, height - 2, -1);
  // Destination bounds are checked after every map config is known.
  const targetX = integer(raw.targetX ?? raw.targetSpawn?.x, 1, MAX_MAP_DIMENSION - 2, -1);
  const targetY = integer(raw.targetY ?? raw.targetSpawn?.y, 1, MAX_MAP_DIMENSION - 2, -1);
  const targetMap = typeof raw.targetMap === 'string' ? raw.targetMap.trim().slice(0, 50) : '';
  if (x < 0 || y < 0 || targetX < 0 || targetY < 0 || !targetMap) return null;
  return {
    pos: { x, y }, targetMap, targetSpawn: { x: targetX, y: targetY },
    label: typeof raw.label === 'string' ? raw.label.trim().slice(0, 80) : '',
  };
}

function normalizeUrbanBounds(raw, width, height, townCenter, settlementClass) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const radius = settlementClass === 'capital' ? Math.min(36, Math.floor(Math.min(width, height) / 3)) : Math.min(14, Math.floor(Math.min(width, height) / 4));
  const fallbackX = Math.max(1, townCenter.x - radius);
  const fallbackY = Math.max(1, townCenter.y - radius);
  const x = integer(source.x, 1, width - 3, fallbackX);
  const y = integer(source.y, 1, height - 3, fallbackY);
  const maxWidth = Math.max(2, width - x - 1);
  const maxHeight = Math.max(2, height - y - 1);
  return {
    x,
    y,
    width: integer(source.width, 2, maxWidth, Math.min(maxWidth, radius * 2)),
    height: integer(source.height, 2, maxHeight, Math.min(maxHeight, radius * 2)),
  };
}

function cityStyleFor(id, biome, requested) {
  if (CITY_STYLES.has(String(requested || ''))) return String(requested);
  if (CITY_STYLE_BY_MAP[id]) return CITY_STYLE_BY_MAP[id];
  return biome === 'snow' ? 'alpine' : biome === 'swamp' ? 'marsh' : biome === 'desert' ? 'forge' : biome === 'shadow' ? 'void' : 'royal';
}
function cityColor(value, fallback) { return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback; }
function cityCoord(value, fallback, dimension = MAP_WIDTH) { return integer(value, 1, dimension - 2, fallback); }
function defaultCityIdentity(id, biome, townCenter, record = {}, base = null, width = MAP_WIDTH, height = MAP_HEIGHT, settlementClass = 'city') {
  const isCapital = settlementClass === 'capital';
  const districtLimit = isCapital ? 24 : 8;
  const landmarkLimit = isCapital ? 64 : 12;
  const propLimit = isCapital ? 320 : 80;
  const districtRadiusLimit = isCapital ? 24 : 12;
  const landmarkSizeLimit = isCapital ? 20 : 10;
  const cityStyle = cityStyleFor(id, biome, record.cityStyle ?? base?.cityStyle);
  const [accent, roof, wall, road] = CITY_PALETTES[cityStyle];
  const offsets=[[-3,-8],[-9,-1],[5,-7],[6,1],[0,5]], sizes=[[6,5],[5,4],[4,5],[5,4],[3,3]], icons=['♜','⚖','✦','▣','◆'];
  const sourceLandmarks = Array.isArray(record.landmarks) && record.landmarks.length ? record.landmarks : (Array.isArray(base?.landmarks) && base.landmarks.length ? base.landmarks : CITY_LANDMARKS[cityStyle].map((name,index)=>({id:`${id}_landmark_${index+1}`,name,kind:CITY_KINDS[index],icon:icons[index],x:townCenter.x+offsets[index][0],y:townCenter.y+offsets[index][1],w:sizes[index][0],h:sizes[index][1]})));
  const landmarks = sourceLandmarks.filter(x=>x&&typeof x==='object').slice(0,landmarkLimit).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),w:integer(x.w,1,landmarkSizeLimit,4),h:integer(x.h,1,landmarkSizeLimit,4)}));
  const districtOffsets=[[-5,-2],[5,-2],[-4,5],[5,5]];
  const sourceDistricts = Array.isArray(record.districts) && record.districts.length ? record.districts : (Array.isArray(base?.districts) && base.districts.length ? base.districts : districtOffsets.map((offset,index)=>({id:`${id}_district_${index+1}`,name:['Civic Ward','Market Ward','Temple Ward','Commons'][index],icon:['♜','⚖','✦','⌂'][index],x:townCenter.x+offset[0],y:townCenter.y+offset[1],radius:index===0?5:4,color:accent})));
  const districts = sourceDistricts.filter(x=>x&&typeof x==='object').slice(0,districtLimit).map((x,index)=>({id:String(x.id||`${id}_district_${index+1}`).slice(0,60),name:String(x.name||`District ${index+1}`).slice(0,60),icon:String(x.icon||'◇').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),radius:integer(x.radius,1,districtRadiusLimit,4),color:cityColor(x.color,accent)}));
  const propKinds={royal:['banner','lamp','statue','barrel','cart'],harbor:['anchor','lamp','barrel','cart','sign'],ironwood:['sign','barrel','cart','pine','banner'],alpine:['brazier','pine','banner','sign','barrel'],marsh:['lamp','mushroom','sign','barrel','grave'],forge:['brazier','banner','barrel','cart','sign'],crystal:['crystal','rune','lamp','crystal','sign'],storm:['banner','lamp','anchor','brazier','sign'],void:['grave','rune','brazier','statue','grave'],nightfall:['banner','brazier','grave','statue','sign'],sanctum:['rune','crystal','banner','lamp','statue']};
  const propOffsets=[[-8,5],[-5,4],[-2,4],[2,4],[5,4],[8,5],[-8,-5],[-5,-4],[-2,-4],[2,-4],[5,-4],[8,-5],[-10,0],[10,0],[0,7],[0,-10]];
  const sourceProps=Array.isArray(record.props)&&record.props.length?record.props:(Array.isArray(base?.props)&&base.props.length?base.props:propOffsets.map((offset,index)=>({id:`${id}_prop_${index+1}`,kind:propKinds[cityStyle][index%propKinds[cityStyle].length],x:townCenter.x+offset[0],y:townCenter.y+offset[1],color:accent})));
  const props=sourceProps.filter(x=>x&&typeof x==='object').slice(0,propLimit).map((x,index)=>({id:String(x.id||`${id}_prop_${index+1}`).slice(0,60),kind:String(x.kind||'banner').slice(0,20),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),color:cityColor(x.color,accent),label:typeof x.label==='string'?x.label.slice(0,60):undefined}));
  return {cityStyle,cityAccent:cityColor(record.cityAccent??base?.cityAccent,accent),roofColor:cityColor(record.roofColor??base?.roofColor,roof),wallColor:cityColor(record.wallColor??base?.wallColor,wall),roadColor:cityColor(record.roadColor??base?.roadColor,road),districts,landmarks,props};
}

function normalizeConfig(record, base = null) {
  const id = typeof record?.id === 'string' && record.id.trim() ? record.id.trim().slice(0, 50) : base?.id;
  if (!id) return null;
  const requestedBiome = typeof record?.biome === 'string' ? record.biome.trim().toLowerCase() : '';
  const biome = BIOMES.has(requestedBiome) ? requestedBiome : (base?.biome || 'plains');
  const width = integer(record?.width, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, base?.width || MAP_WIDTH);
  const height = integer(record?.height, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, base?.height || MAP_HEIGHT);
  const requestedSettlement = String(record?.settlementClass || base?.settlementClass || (id === 'eldoria' ? 'capital' : 'city'));
  const settlementClass = SETTLEMENT_CLASS_SET.has(requestedSettlement) ? requestedSettlement : 'city';
  const baseSpawn = base?.spawnPoint || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const baseTown = base?.townCenter || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const rawPortals = Array.isArray(record?.portals) ? record.portals : (base?.portals || []);
  const portals = rawPortals.map(portal => normalizePortal(portal, width, height)).filter(Boolean).slice(0, 20);
  const townCenter = {
    x: integer(record?.townX ?? record?.townCenter?.x, 1, width - 2, baseTown.x),
    y: integer(record?.townY ?? record?.townCenter?.y, 1, height - 2, baseTown.y),
  };
  const urbanBounds = normalizeUrbanBounds(record?.urbanBounds ?? base?.urbanBounds, width, height, townCenter, settlementClass);
  const cityIdentity = defaultCityIdentity(id, biome, townCenter, record || {}, base, width, height, settlementClass);
  return {
    id, width, height, settlementClass, urbanBounds,
    name: typeof record?.name === 'string' && record.name.trim() ? record.name.trim().slice(0, 80) : (base?.name || id.charAt(0).toUpperCase() + id.slice(1)),
    description: typeof record?.description === 'string' ? record.description.trim().slice(0, 300) : (base?.description || ''),
    biome,
    seed: integer(record?.seed, 1, 2_147_483_646, base?.seed || seedFor(id, biome)),
    spawnPoint: {
      x: integer(record?.spawnX ?? record?.spawnPoint?.x, 1, width - 2, baseSpawn.x),
      y: integer(record?.spawnY ?? record?.spawnPoint?.y, 1, height - 2, baseSpawn.y),
    },
    townCenter,
    ...cityIdentity,
    townRange: integer(record?.townRange, 0, 20, base?.townRange ?? 8),
    nameplateOffsetY: boundedNumber(record?.nameplateOffsetY, -32, 12, base?.nameplateOffsetY ?? 0),
    nameplateScale: boundedNumber(record?.nameplateScale, .55, 1.5, base?.nameplateScale ?? .82),
    nameplateBarWidth: boundedNumber(record?.nameplateBarWidth, 18, 64, base?.nameplateBarWidth ?? 30),
    nameplateBarHeight: boundedNumber(record?.nameplateBarHeight, 2, 8, base?.nameplateBarHeight ?? 3),
    nameplateFontSize: boundedNumber(record?.nameplateFontSize, 7, 14, base?.nameplateFontSize ?? 8),
    nameplateShowValues: typeof record?.nameplateShowValues === 'boolean' ? record.nameplateShowValues : (base?.nameplateShowValues ?? false),
    nameplateHeadClearance: boundedNumber(record?.nameplateHeadClearance, 4, 24, base?.nameplateHeadClearance ?? 7),
    nameplateStackGap: boundedNumber(record?.nameplateStackGap, 1, 8, base?.nameplateStackGap ?? 2),
    residentialRingEnabled: typeof record?.residentialRingEnabled === 'boolean' ? record.residentialRingEnabled : (base?.residentialRingEnabled ?? false),
    residentialRingDensity: integer(record?.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),
    npcNameplateMode: ['nearby','always','hidden'].includes(String(record?.npcNameplateMode)) ? String(record.npcNameplateMode) : (base?.npcNameplateMode ?? 'nearby'),
    npcNameplateDistance: boundedNumber(record?.npcNameplateDistance, 2, 20, base?.npcNameplateDistance ?? 7),
    monsterNameplateMode: ['nearby','always','hidden'].includes(String(record?.monsterNameplateMode)) ? String(record.monsterNameplateMode) : (base?.monsterNameplateMode ?? 'nearby'),
    monsterNameplateDistance: boundedNumber(record?.monsterNameplateDistance, 2, 24, base?.monsterNameplateDistance ?? 9),
    monsterBarDistance: boundedNumber(record?.monsterBarDistance, 1, 20, base?.monsterBarDistance ?? 7),
    monsterNameplateFontSize: boundedNumber(record?.monsterNameplateFontSize, 7, 14, base?.monsterNameplateFontSize ?? 8),
    monsterNameplateBarWidth: boundedNumber(record?.monsterNameplateBarWidth, 18, 72, base?.monsterNameplateBarWidth ?? 30),
    monsterNameplateBarHeight: boundedNumber(record?.monsterNameplateBarHeight, 2, 8, base?.monsterNameplateBarHeight ?? 3),
    monsterNameplateShowLevel: typeof record?.monsterNameplateShowLevel === 'boolean' ? record.monsterNameplateShowLevel : (base?.monsterNameplateShowLevel ?? true),
    monsterNameplateShowValues: typeof record?.monsterNameplateShowValues === 'boolean' ? record.monsterNameplateShowValues : (base?.monsterNameplateShowValues ?? false),
    bossNameplateScale: boundedNumber(record?.bossNameplateScale, .8, 1.8, base?.bossNameplateScale ?? 1.18),
    bossNameplateAlwaysVisible: typeof record?.bossNameplateAlwaysVisible === 'boolean' ? record.bossNameplateAlwaysVisible : (base?.bossNameplateAlwaysVisible ?? true),
    nameplateCollisionPadding: boundedNumber(record?.nameplateCollisionPadding, 0, 10, base?.nameplateCollisionPadding ?? 3),
    nameplateFadeStart: boundedNumber(record?.nameplateFadeStart, .2, .95, base?.nameplateFadeStart ?? .68),
    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),
    access: record?.access === 'gm' ? 'gm' : (base?.access === 'gm' ? 'gm' : 'public'),
    portals,
  };
}

function capitalUrbanTile(config, x, y) {
  if (config?.settlementClass !== 'capital') return null;
  const bounds = config.urbanBounds;
  if (!bounds) return null;
  const minX = Number(bounds.x), minY = Number(bounds.y);
  const maxX = minX + Number(bounds.width) - 1, maxY = minY + Number(bounds.height) - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = config.townCenter.x, cy = config.townCenter.y;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };
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
    for (const config of next.values()) {
      config.portals = config.portals.filter(portal => {
        if (!known.has(portal.targetMap)) return false;
        const target = next.get(portal.targetMap);
        return Boolean(target)
          && portal.targetSpawn.x >= 1 && portal.targetSpawn.x <= target.width - 2
          && portal.targetSpawn.y >= 1 && portal.targetSpawn.y <= target.height - 2;
      });
    }
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
      width: config.width, height: config.height, settlementClass: config.settlementClass, urbanBounds: { ...config.urbanBounds },
      levelRequired: config.levelRequired, seed: config.seed,
      spawnX: config.spawnPoint.x, spawnY: config.spawnPoint.y,
      townX: config.townCenter.x, townY: config.townCenter.y, townRange: config.townRange,
      cityStyle: config.cityStyle, cityAccent: config.cityAccent, roofColor: config.roofColor, wallColor: config.wallColor, roadColor: config.roadColor,
      nameplateOffsetY: config.nameplateOffsetY, nameplateScale: config.nameplateScale, nameplateBarWidth: config.nameplateBarWidth,
      nameplateBarHeight: config.nameplateBarHeight, nameplateFontSize: config.nameplateFontSize, nameplateShowValues: config.nameplateShowValues,
      nameplateHeadClearance: config.nameplateHeadClearance, nameplateStackGap: config.nameplateStackGap,
      residentialRingEnabled: config.residentialRingEnabled, residentialRingDensity: config.residentialRingDensity,
      npcNameplateMode: config.npcNameplateMode, npcNameplateDistance: config.npcNameplateDistance,
      monsterNameplateMode: config.monsterNameplateMode, monsterNameplateDistance: config.monsterNameplateDistance, monsterBarDistance: config.monsterBarDistance,
      monsterNameplateFontSize: config.monsterNameplateFontSize, monsterNameplateBarWidth: config.monsterNameplateBarWidth, monsterNameplateBarHeight: config.monsterNameplateBarHeight,
      monsterNameplateShowLevel: config.monsterNameplateShowLevel, monsterNameplateShowValues: config.monsterNameplateShowValues,
      bossNameplateScale: config.bossNameplateScale, bossNameplateAlwaysVisible: config.bossNameplateAlwaysVisible,
      nameplateCollisionPadding: config.nameplateCollisionPadding, nameplateFadeStart: config.nameplateFadeStart,
      districts: config.districts.map(entry => ({ ...entry })), landmarks: config.landmarks.map(entry => ({ ...entry })), props: config.props.map(entry => ({ ...entry })),
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
    for (let y = 0; y < config.height; y++) {
      const row = [];
      for (let x = 0; x < config.width; x++) {
        let type = 'grass'; let walkable = true; let blocksSight = false;
        if (x === 0 || y === 0 || x === config.width - 1 || y === config.height - 1) {
          type = 'wall'; walkable = false; blocksSight = true;
        } else if ((config.spawnPoint.x === x && config.spawnPoint.y === y) || config.portals.some(portal => portal.pos.x === x && portal.pos.y === y)) {
          type = 'path';
        } else if (config.landmarks.some(landmark => x >= landmark.x && x < landmark.x + landmark.w && y >= landmark.y && y < landmark.y + landmark.h)) {
          // Content Studio landmark geometry is authoritative: visual buildings and
          // movement collision now share the exact same authored rectangle.
          type = 'wall'; walkable = false; blocksSight = true;
        } else {
          const urban = capitalUrbanTile(config, x, y);
          if (urban) { type = urban.type; walkable = urban.walkable; blocksSight = urban.blocksSight; }
          else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) type = 'floor';
          else {
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
        }
        row.push({ walkable, type, blocksSight });
      }
      tiles.push(row);
    }
    return {
      ...config, width: config.width, height: config.height, tiles,
      spawnPoint: { ...config.spawnPoint }, townCenter: { ...config.townCenter },
      portals: config.portals.map(portal => ({
        pos: { ...portal.pos }, targetMap: portal.targetMap, targetSpawn: { ...portal.targetSpawn }, label: portal.label || '',
      })),
    };
  }

  findNearestWalkable(map, preferred, maxRadius = 14, reject = null) {
    const ox = Math.round(Number(preferred?.x) || 0), oy = Math.round(Number(preferred?.y) || 0);
    const ok = (x, y) => Boolean(map?.tiles?.[y]?.[x]?.walkable) && !(typeof reject === 'function' && reject(x, y));
    if (ok(ox, oy)) return { x: ox, y: oy };
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const dx = radius - Math.abs(dy);
        const xs = dx === 0 ? [ox] : [ox - dx, ox + dx];
        for (const x of xs) { const y = oy + dy; if (ok(x, y)) return { x, y }; }
      }
    }
    return null;
  }

  findWalkableSpawn(map, preferred) {
    const nearest = preferred ? this.findNearestWalkable(map, preferred, 14) : null;
    if (nearest) return nearest;
    for (let attempt = 0; attempt < 300; attempt++) {
      const x = 1 + Math.floor(Math.random() * Math.max(1, (map?.width || MAP_WIDTH) - 2));
      const y = 1 + Math.floor(Math.random() * Math.max(1, (map?.height || MAP_HEIGHT) - 2));
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
export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, BIOMES };
