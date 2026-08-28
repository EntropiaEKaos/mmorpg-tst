from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

def replace_once(path, old, new, label):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

grand_ironwood = r'''// ===================================================================
// MOR'IA 9.38 — GRAND IRONWOOD AUTHORITATIVE CONTENT CONTRACT
// A forest-ring frontier capital. Exact legacy defaults migrate; custom
// administrator-authored dimensions, architecture and coordinates always win.
// ===================================================================

export const GRAND_IRONWOOD_VERSION = 1;
export const GRAND_CAPITAL_SCHEMA_VERSION = 4;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function samePoint(record, x, y, xKey = 'posX', yKey = 'posY') {
  return Number(record?.[xKey]) === x && Number(record?.[yKey]) === y;
}
function knownPair(x, y, pairs) {
  return pairs.some(pair => Number(x) === pair[0] && Number(y) === pair[1]);
}

const districts = Object.freeze([
  { id:'ironwood_marchwarden_crown', name:'Coroa dos Marchwardens', icon:'♜', x:80, y:48, radius:12, color:'#b48b4a' },
  { id:'ironwood_sacred_grove', name:'Bosque Sagrado Ironbark', icon:'❧', x:106, y:50, radius:12, color:'#6f9c55' },
  { id:'ironwood_timber_market', name:'Mercado da Madeira', icon:'⚖', x:54, y:76, radius:12, color:'#c59a58' },
  { id:'ironwood_hunters', name:'Bairro dos Caçadores', icon:'🏹', x:44, y:52, radius:11, color:'#7f9a56' },
  { id:'ironwood_tamers', name:'Enclave dos Domadores', icon:'🐺', x:112, y:78, radius:11, color:'#75a66d' },
  { id:'ironwood_carpenters', name:'Distrito dos Carpinteiros', icon:'⚒', x:56, y:104, radius:11, color:'#b3844f' },
  { id:'ironwood_tanners', name:'Distrito dos Curtidores', icon:'◩', x:96, y:108, radius:10, color:'#9a734c' },
  { id:'ironwood_commons', name:'Comuns Ironbark', icon:'⌂', x:80, y:96, radius:13, color:'#8fa25c' },
  { id:'ironwood_west_gate', name:'Portão do Poente', icon:'◇', x:30, y:78, radius:9, color:'#9a7a4c' },
  { id:'ironwood_frost_road', name:'Estrada da Geada', icon:'❄', x:80, y:28, radius:9, color:'#8da17a' },
  { id:'ironwood_sunreach_trail', name:'Trilha de Sunreach', icon:'⚓', x:80, y:128, radius:9, color:'#7ea187' },
  { id:'ironwood_canopy_heights', name:'Alturas da Copa', icon:'🌲', x:124, y:50, radius:10, color:'#5f8e4f' },
]);

const landmarks = Object.freeze([
  { id:'ironwood_marchwarden_hall', name:'Salão dos Marchwardens', kind:'keep', icon:'♜', x:72, y:32, w:16, h:12 },
  { id:'ironwood_mother_tree', name:'Árvore-Mãe Ironbark', kind:'temple', icon:'🌳', x:100, y:38, w:12, h:12 },
  { id:'ironwood_grand_timber_market', name:'Grande Mercado da Madeira', kind:'market', icon:'⚖', x:44, y:68, w:14, h:10 },
  { id:'ironwood_children_wild_hall', name:'Salão dos Filhos da Natureza', kind:'keep', icon:'❧', x:96, y:62, w:12, h:10 },
  { id:'ironwood_hunters_lodge', name:'Pavilhão dos Caçadores', kind:'lodge', icon:'🏹', x:34, y:48, w:12, h:9 },
  { id:'ironwood_tamers_enclave', name:'Enclave dos Domadores', kind:'lodge', icon:'🐺', x:116, y:70, w:12, h:10 },
  { id:'ironwood_grand_sawmill', name:'Grande Serraria', kind:'forge', icon:'🪚', x:38, y:94, w:14, h:10 },
  { id:'ironwood_carpenters_hall', name:'Salão dos Carpinteiros', kind:'forge', icon:'⚒', x:54, y:100, w:12, h:9 },
  { id:'ironwood_master_tannery', name:'Curtume Magistral', kind:'forge', icon:'◩', x:92, y:102, w:12, h:9 },
  { id:'ironwood_depot', name:'Depósito de Ironwood', kind:'depot', icon:'▣', x:74, y:104, w:10, h:8 },
  { id:'ironwood_wild_market', name:'Mercado Selvagem', kind:'market', icon:'◆', x:108, y:94, w:12, h:9 },
  { id:'ironwood_ranger_arena', name:'Arena dos Patrulheiros', kind:'arena', icon:'⚔', x:28, y:28, w:14, h:12 },
  { id:'ironwood_west_palisade', name:'Torre da Paliçada Oeste', kind:'tower', icon:'🛡', x:26, y:72, w:8, h:10 },
  { id:'ironwood_east_palisade', name:'Torre da Paliçada Leste', kind:'tower', icon:'🛡', x:126, y:72, w:8, h:10 },
  { id:'ironwood_frost_watch', name:'Vigília da Estrada da Geada', kind:'tower', icon:'❄', x:76, y:24, w:8, h:8 },
  { id:'ironwood_south_watch', name:'Vigília da Trilha Sul', kind:'tower', icon:'⚓', x:76, y:128, w:8, h:8 },
  { id:'ironwood_granary', name:'Grande Celeiro', kind:'depot', icon:'▤', x:30, y:112, w:12, h:9 },
  { id:'ironwood_forest_library', name:'Biblioteca da Floresta', kind:'library', icon:'📚', x:112, y:28, w:12, h:10 },
  { id:'ironwood_moonwell', name:'Santuário do Poço Lunar', kind:'temple', icon:'☾', x:106, y:116, w:10, h:9 },
  { id:'ironwood_green_crown_inn', name:'Estalagem da Coroa Verde', kind:'lodge', icon:'⌂', x:58, y:82, w:10, h:8 },
]);

export const GRAND_IRONWOOD_MINOR_ARCHITECTURE = Object.freeze([
  { id:'ironwood_home_01', name:'Casa dos Lenhadores I', kind:'house', icon:'⌂', x:48, y:38, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_02', name:'Casa dos Lenhadores II', kind:'house', icon:'⌂', x:58, y:40, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_03', name:'Vila dos Guardas', kind:'house', icon:'⌂', x:88, y:38, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_04', name:'Casa dos Caçadores I', kind:'house', icon:'⌂', x:30, y:60, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_05', name:'Casa dos Caçadores II', kind:'house', icon:'⌂', x:38, y:62, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_06', name:'Vila do Mercado I', kind:'house', icon:'⌂', x:58, y:62, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_07', name:'Vila do Mercado II', kind:'house', icon:'⌂', x:66, y:64, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_08', name:'Casa dos Domadores I', kind:'house', icon:'⌂', x:112, y:56, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_09', name:'Casa dos Domadores II', kind:'house', icon:'⌂', x:122, y:58, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_10', name:'Comuns do Anel I', kind:'house', icon:'⌂', x:68, y:88, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_11', name:'Comuns do Anel II', kind:'house', icon:'⌂', x:84, y:88, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_12', name:'Comuns do Anel III', kind:'house', icon:'⌂', x:96, y:86, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_workshop_01', name:'Oficina de Arcos', kind:'house', icon:'🏹', x:42, y:84, w:7, h:5, showOnMinimap:false },
  { id:'ironwood_workshop_02', name:'Oficina de Flechas', kind:'house', icon:'🏹', x:48, y:112, w:7, h:5, showOnMinimap:false },
  { id:'ironwood_workshop_03', name:'Oficina de Rodas', kind:'house', icon:'⚒', x:60, y:116, w:7, h:5, showOnMinimap:false },
  { id:'ironwood_workshop_04', name:'Oficina de Resina', kind:'house', icon:'◆', x:88, y:118, w:7, h:5, showOnMinimap:false },
  { id:'ironwood_home_13', name:'Casa dos Curtidores', kind:'house', icon:'⌂', x:100, y:94, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_14', name:'Vila do Bosque I', kind:'house', icon:'⌂', x:118, y:106, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_15', name:'Vila do Bosque II', kind:'house', icon:'⌂', x:124, y:116, w:6, h:5, showOnMinimap:false },
  { id:'ironwood_home_16', name:'Cabana da Trilha Sul', kind:'house', icon:'⌂', x:66, y:126, w:6, h:5, showOnMinimap:false },
]);

function buildProps() {
  const props = [];
  let serial = 1;
  const add = (kind, x, y, color = '#b48b4a', label) => props.push({ id:`ironwood_prop_${serial++}`, kind, x, y, color, ...(label ? { label } : {}) });
  for (let a = 0; a < 360; a += 20) {
    const rad = a * Math.PI / 180;
    add('pine', Math.round(80 + Math.cos(rad) * 47), Math.round(78 + Math.sin(rad) * 47), '#5f844c');
  }
  for (let x = 30; x <= 130; x += 10) { add('sign', x, 76, '#b48b4a'); add('lamp', x, 80, '#d2ad67'); }
  for (let y = 30; y <= 130; y += 10) { add('banner', 78, y, '#8d6a3e'); add('lamp', 82, y, '#d2ad67'); }
  for (const [x,y] of [[34,90],[40,92],[48,96],[54,98],[62,104],[96,104],[106,98],[116,94],[124,90]]) add('barrel',x,y,'#795738');
  for (const [x,y] of [[38,86],[52,90],[66,94],[98,92],[112,88],[122,84]]) add('cart',x,y,'#7c5b3c');
  for (const [x,y,label] of [[30,78,'Portão do Poente'],[80,30,'Estrada da Geada'],[80,126,'Trilha de Sunreach'],[54,76,'Mercado da Madeira'],[106,50,'Bosque Sagrado'],[112,78,'Enclave dos Domadores'],[56,104,'Distrito dos Carpinteiros'],[96,108,'Distrito dos Curtidores']]) add('sign',x,y,'#c59a58',label);
  for (const [x,y] of [[46,48],[50,52],[110,46],[114,52],[44,110],[50,114],[110,108],[116,112]]) add('pine',x,y,'#537a43');
  return props.slice(0, 120);
}

export const GRAND_IRONWOOD_MAP = Object.freeze({
  id:'ironwood', name:'Ironwood March', biome:'plains',
  description:'Capital florestal dos Marchwardens e dos Filhos da Natureza: anéis de trilhas, paliçadas vivas, bosques, mercado de madeira, domadores e oficinas do Ironbark.',
  width:160, height:160, settlementClass:'capital', urbanPlan:'forest-rings', urbanBounds:{ x:24, y:22, width:112, height:116 },
  levelRequired:10, seed:31415, spawnX:80, spawnY:88, townX:80, townY:78, townRange:18,
  cityStyle:'ironwood', cityAccent:'#b48b4a', roofColor:'#4a3324', wallColor:'#8f8066', roadColor:'#755b42',
  residentialRingEnabled:false, residentialRingDensity:0,
  districts, landmarks:Object.freeze([...landmarks, ...GRAND_IRONWOOD_MINOR_ARCHITECTURE]), props:Object.freeze(buildProps()), access:'public',
  portals:Object.freeze([
    { x:24, y:78, targetMap:'eldoria', targetX:130, targetY:80, label:'🏰 Estrada de Eldoria' },
    { x:80, y:22, targetMap:'frostpeak', targetX:68, targetY:40, label:'❄ Estrada da Geada' },
    { x:80, y:137, targetMap:'sunreach_coast', targetX:135, targetY:70, label:'⚓ Trilha Mercante de Sunreach' },
  ]),
});

export const GRAND_IRONWOOD_BUILTIN_WORLD_CONFIG = Object.freeze({
  ...GRAND_IRONWOOD_MAP,
  spawnPoint:{ x:GRAND_IRONWOOD_MAP.spawnX, y:GRAND_IRONWOOD_MAP.spawnY },
  townCenter:{ x:GRAND_IRONWOOD_MAP.townX, y:GRAND_IRONWOOD_MAP.townY },
  portals:GRAND_IRONWOOD_MAP.portals.map(portal => ({
    pos:{x:portal.x,y:portal.y}, targetMap:portal.targetMap,
    targetSpawn:{x:portal.targetX,y:portal.targetY}, label:portal.label,
  })),
});

export const GRAND_IRONWOOD_NPC_MOVES = Object.freeze({
  quest_ironwood:{ from:[18,40], to:[70,82] },
  merchant_ironwood:{ from:[22,40], to:[58,78] },
  warden_ironwood:{ from:[20,42], to:[128,78] },
});

export const GRAND_IRONWOOD_MONSTER_MOVES = Object.freeze({
  ironwood_ironwood_stag:{ from:[18,34], to:[18,110] },
  ironwood_timber_wolf:{ from:[26,41], to:[16,58] },
  ironwood_barkhide_brute:{ from:[34,48], to:[142,118] },
  ironwood_poacher:{ from:[42,55], to:[142,54] },
  ironwood_ancient_ent:{ from:[50,20], to:[42,146] },
  ironwood_ironbark_behemoth:{ from:[58,27], to:[118,146] },
});

function patchExactPosition(record, move, xKey = 'posX', yKey = 'posY') {
  if (!move || !samePoint(record, move.from[0], move.from[1], xKey, yKey)) return false;
  record[xKey] = move.to[0]; record[yKey] = move.to[1]; return true;
}

function legacyPortalSet(portals) {
  if (!Array.isArray(portals) || portals.length !== 2) return false;
  let eldoria = false, frostpeak = false;
  for (const portal of portals) {
    if (portal?.targetMap === 'eldoria'
      && knownPair(portal.x ?? portal.pos?.x, portal.y ?? portal.pos?.y, [[8,40]])
      && knownPair(portal.targetX ?? portal.targetSpawn?.x, portal.targetY ?? portal.targetSpawn?.y, [[68,40],[130,80]])) eldoria = true;
    if (portal?.targetMap === 'frostpeak'
      && knownPair(portal.x ?? portal.pos?.x, portal.y ?? portal.pos?.y, [[40,8]])
      && knownPair(portal.targetX ?? portal.targetSpawn?.x, portal.targetY ?? portal.targetSpawn?.y, [[68,40]])) frostpeak = true;
  }
  return eldoria && frostpeak;
}

function patchPortalShape(portal, source, target) {
  if ('x' in portal || !portal.pos) {
    portal.x=source[0]; portal.y=source[1]; portal.targetX=target[0]; portal.targetY=target[1];
  } else {
    portal.pos={...portal.pos,x:source[0],y:source[1]};
    portal.targetSpawn={...(portal.targetSpawn||{}),x:target[0],y:target[1]};
  }
}

function patchMap(map) {
  const width = map.width === undefined ? 80 : Number(map.width);
  const height = map.height === undefined ? 80 : Number(map.height);
  const legacyCoordinates = width === 80 && height === 80
    && Number(map.spawnX ?? 20) === 20 && Number(map.spawnY ?? 40) === 40
    && Number(map.townX ?? 20) === 20 && Number(map.townY ?? 40) === 40;
  if (!legacyCoordinates) return false;

  let changed = false;
  const set = (key, value) => {
    if (JSON.stringify(map[key]) !== JSON.stringify(value)) {
      map[key] = clone(value); changed = true;
    }
  };
  set('width',160); set('height',160); set('settlementClass','capital'); set('urbanPlan','forest-rings'); set('urbanBounds',GRAND_IRONWOOD_MAP.urbanBounds);
  set('spawnX',80); set('spawnY',88); set('townX',80); set('townY',78); set('townRange',18);
  if (!map.cityStyle || map.cityStyle === 'ironwood') set('cityStyle','ironwood');
  if (!map.cityAccent) set('cityAccent',GRAND_IRONWOOD_MAP.cityAccent);
  if (!map.roofColor) set('roofColor',GRAND_IRONWOOD_MAP.roofColor);
  if (!map.wallColor) set('wallColor',GRAND_IRONWOOD_MAP.wallColor);
  if (!map.roadColor) set('roadColor',GRAND_IRONWOOD_MAP.roadColor);
  if (!Array.isArray(map.districts) || map.districts.length === 0) set('districts',GRAND_IRONWOOD_MAP.districts);
  if (!Array.isArray(map.landmarks) || map.landmarks.length === 0) set('landmarks',GRAND_IRONWOOD_MAP.landmarks);
  if (!Array.isArray(map.props) || map.props.length === 0) set('props',GRAND_IRONWOOD_MAP.props);
  if (map.residentialRingEnabled === undefined || map.residentialRingEnabled === true) set('residentialRingEnabled',false);
  if (map.residentialRingDensity === undefined || Number(map.residentialRingDensity) <= 5) set('residentialRingDensity',0);

  const portals = Array.isArray(map.portals) ? map.portals : [];
  if (!portals.length || legacyPortalSet(portals)) {
    set('portals',GRAND_IRONWOOD_MAP.portals);
  } else {
    for (const portal of portals) {
      const sx=Number(portal?.x ?? portal?.pos?.x), sy=Number(portal?.y ?? portal?.pos?.y);
      const tx=Number(portal?.targetX ?? portal?.targetSpawn?.x), ty=Number(portal?.targetY ?? portal?.targetSpawn?.y);
      if (portal?.targetMap === 'eldoria' && sx === 8 && sy === 40 && knownPair(tx,ty,[[68,40],[130,80]])) {
        patchPortalShape(portal,[24,78],[130,80]); portal.label='🏰 Estrada de Eldoria'; changed=true;
      }
      if (portal?.targetMap === 'frostpeak' && sx === 40 && sy === 8 && tx === 68 && ty === 40) {
        patchPortalShape(portal,[80,22],[68,40]); portal.label='❄ Estrada da Geada'; changed=true;
      }
    }
  }
  return changed;
}

export function migrateGrandIronwoodData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const maps = Array.isArray(data.maps) ? data.maps : [];
  const ironwood = maps.find(map => map?.id === 'ironwood');
  if (!ironwood) return false;

  let changed = patchMap(ironwood);
  const grandTopology = Number(ironwood.width) === 160 && Number(ironwood.height) === 160
    && ironwood.settlementClass === 'capital' && ironwood.urbanPlan === 'forest-rings';
  if (!changed && !grandTopology) return false;

  const eldoria = maps.find(map => map?.id === 'eldoria');
  for (const portal of Array.isArray(eldoria?.portals) ? eldoria.portals : []) {
    if (portal?.targetMap === 'ironwood' && knownPair(portal.targetX ?? portal.targetSpawn?.x, portal.targetY ?? portal.targetSpawn?.y, [[10,40]])) {
      if ('targetX' in portal || !portal.targetSpawn) { portal.targetX=26; portal.targetY=78; }
      else portal.targetSpawn={...portal.targetSpawn,x:26,y:78};
      changed=true;
    }
  }

  const sunreach = maps.find(map => map?.id === 'sunreach_coast');
  for (const portal of Array.isArray(sunreach?.portals) ? sunreach.portals : []) {
    if (portal?.targetMap === 'ironwood' && knownPair(portal.targetX ?? portal.targetSpawn?.x, portal.targetY ?? portal.targetSpawn?.y, [[12,40]])) {
      if ('targetX' in portal || !portal.targetSpawn) { portal.targetX=80; portal.targetY=134; }
      else portal.targetSpawn={...portal.targetSpawn,x:80,y:134};
      changed=true;
    }
  }

  for (const npc of Array.isArray(data.npcs) ? data.npcs : []) {
    if (npc?.mapId === 'ironwood' && patchExactPosition(npc, GRAND_IRONWOOD_NPC_MOVES[npc.id])) changed=true;
  }
  for (const monster of Array.isArray(data.monsters) ? data.monsters : []) {
    if (monster?.mapId === 'ironwood' && patchExactPosition(monster, GRAND_IRONWOOD_MONSTER_MOVES[monster.id])) changed=true;
  }
  for (const node of Array.isArray(data.nodes) ? data.nodes : []) {
    if (node?.id === 'node_ironwood' && node?.mapId === 'ironwood' && samePoint(node,20,40,'x','y')) {
      node.x=80; node.y=78; changed=true;
    }
  }
  return changed;
}
'''
write('server/engine/GrandIronwood.mjs', grand_ironwood)

replace_once(
    'server/engine/World.mjs',
    "import { GRAND_SUNREACH_BUILTIN_WORLD_CONFIG } from './GrandSunreach.mjs';",
    "import { GRAND_SUNREACH_BUILTIN_WORLD_CONFIG } from './GrandSunreach.mjs';\nimport { GRAND_IRONWOOD_BUILTIN_WORLD_CONFIG } from './GrandIronwood.mjs';",
    'World Ironwood import'
)
replace_once(
    'server/engine/World.mjs',
    "const URBAN_PLANS = new Set(['royal-grid','harbor-crescent']);",
    "const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings']);",
    'World urban plans'
)
replace_once(
    'server/engine/World.mjs',
    "  sunreach_coast: GRAND_SUNREACH_BUILTIN_WORLD_CONFIG,\n  frostpeak:",
    "  sunreach_coast: GRAND_SUNREACH_BUILTIN_WORLD_CONFIG,\n  ironwood: GRAND_IRONWOOD_BUILTIN_WORLD_CONFIG,\n  frostpeak:",
    'World map config Ironwood'
)
replace_once(
    'server/engine/World.mjs',
    "  const requestedUrbanPlan = String(record?.urbanPlan || base?.urbanPlan || (id === 'sunreach_coast' ? 'harbor-crescent' : 'royal-grid'));",
    "  const defaultUrbanPlan = id === 'sunreach_coast' ? 'harbor-crescent' : id === 'ironwood' ? 'forest-rings' : 'royal-grid';\n  const requestedUrbanPlan = String(record?.urbanPlan || base?.urbanPlan || defaultUrbanPlan);",
    'World default urban plan'
)

forest_world = r'''
function forestCapitalTile(config, x, y) {
  const bounds = config.urbanBounds;
  if (!bounds) return null;
  const minX = Number(bounds.x), minY = Number(bounds.y);
  const maxX = minX + Number(bounds.width) - 1, maxY = minY + Number(bounds.height) - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  const cx = config.townCenter.x, cy = config.townCenter.y;
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

'''
replace_once(
    'server/engine/World.mjs',
    "\nfunction capitalUrbanTile(config, x, y) {\n",
    "\n" + forest_world + "function capitalUrbanTile(config, x, y) {\n",
    'World forest generator insertion'
)
replace_once(
    'server/engine/World.mjs',
    "  if (config.urbanPlan === 'harbor-crescent') return harborCapitalTile(config, x, y);",
    "  if (config.urbanPlan === 'harbor-crescent') return harborCapitalTile(config, x, y);\n  if (config.urbanPlan === 'forest-rings') return forestCapitalTile(config, x, y);",
    'World forest dispatch'
)
replace_once(
    'server/engine/World.mjs',
    "export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, BIOMES };",
    "export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, URBAN_PLANS, BIOMES };",
    'World urban plans export'
)

replace_once(
    'server/engine/GrandEldoria.mjs',
    ".filter(portal => portal.targetMap === 'frostpeak' || portal.targetMap === 'shadowfen')",
    ".filter(portal => portal.targetMap === 'frostpeak' || portal.targetMap === 'shadowfen' || portal.targetMap === 'ironwood')",
    'Eldoria built-in Ironwood route'
)
replace_once(
    'server/engine/GrandSunreach.mjs',
    ".filter(portal => portal.targetMap === 'eldoria')",
    ".filter(portal => portal.targetMap === 'eldoria' || portal.targetMap === 'ironwood')",
    'Sunreach built-in Ironwood route'
)

replace_once(
    'server/engine/AlphaContent.mjs',
    "import { GRAND_ELDORIA_MAP } from './GrandEldoria.mjs';",
    "import { GRAND_ELDORIA_MAP } from './GrandEldoria.mjs';\nimport { GRAND_SUNREACH_MAP } from './GrandSunreach.mjs';\nimport { GRAND_IRONWOOD_MAP } from './GrandIronwood.mjs';",
    'Alpha capital imports'
)
eldoria_special = "  if (region.id === 'eldoria') return { ...GRAND_ELDORIA_MAP, portals: GRAND_ELDORIA_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_ELDORIA_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_ELDORIA_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_ELDORIA_MAP.props.map(entry => ({ ...entry })) };"
capital_specials = eldoria_special + "\n  if (region.id === 'sunreach_coast') return { ...GRAND_SUNREACH_MAP, portals: GRAND_SUNREACH_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_SUNREACH_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_SUNREACH_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_SUNREACH_MAP.props.map(entry => ({ ...entry })) };\n  if (region.id === 'ironwood') return { ...GRAND_IRONWOOD_MAP, portals: GRAND_IRONWOOD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_IRONWOOD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_IRONWOOD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_IRONWOOD_MAP.props.map(entry => ({ ...entry })) };"
replace_once('server/engine/AlphaContent.mjs', eldoria_special, capital_specials, 'Alpha capital map specials')

replace_once(
    'server/engine/ContentDB.mjs',
    "import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandSunreachData } from './GrandSunreach.mjs';",
    "import { migrateGrandSunreachData } from './GrandSunreach.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandIronwoodData } from './GrandIronwood.mjs';",
    'ContentDB capital imports'
)
replace_once(
    'server/engine/ContentDB.mjs',
    "    // Eldoria remains idempotent; schema 3 adds the first independent harbor capital.\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
    "    // Every capital migration is idempotent and exact-default-only. Schema 4 adds Ironwood.\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
    'ContentDB loaded capital chain'
)
replace_once(
    'server/engine/ContentDB.mjs',
    "    this.data.tamingSpecies = mergeById(this.data.tamingSpecies, LIVING_REALM_CONTENT.tamingSpecies);\n    this.data.version = 3;\n    this.data.livingRealmVersion = 1;\n    migrateGrandEldoriaData(this.data);\n    this.data.grandCapitalVersion = GRAND_ELDORIA_VERSION;\n\n    this.save();",
    "    this.data.tamingSpecies = mergeById(this.data.tamingSpecies, LIVING_REALM_CONTENT.tamingSpecies);\n    for (const key of ['professionSpecializations','economyPolicies','factionPrograms','siegeAssets','dynamicWorldRules','dungeonBlueprints','questConsequences','housingUpgrades']) {\n      this.data[key] = mergeById(this.data[key], ROAD_TO_TEN_CONTENT[key]);\n    }\n    this.data.version = 3;\n    this.data.livingRealmVersion = 1;\n    this.data.roadToTenVersion = 1;\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;\n\n    this.save();",
    'ContentDB fresh convergence'
)
replace_once(
    'server/engine/ContentDB.mjs',
    "import { GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from './GrandEldoria.mjs';",
    "import { migrateGrandEldoriaData } from './GrandEldoria.mjs';",
    'ContentDB unused Eldoria version'
)

replace_once(
    'server/engine/ContentStudio.mjs',
    "import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES } from './World.mjs';",
    "import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, URBAN_PLANS } from './World.mjs';",
    'Studio urban plans import'
)
replace_once(
    'server/engine/ContentStudio.mjs',
    "    field('width', 'Map width', 'number'), field('height', 'Map height', 'number'), field('settlementClass', 'Settlement class', 'select', { optionKey: 'settlementClasses' }), field('urbanBounds', 'Urban bounds', 'json'),",
    "    field('width', 'Map width', 'number'), field('height', 'Map height', 'number'), field('settlementClass', 'Settlement class', 'select', { optionKey: 'settlementClasses' }), field('urbanPlan', 'Urban plan', 'select', { optionKey: 'urbanPlans' }), field('urbanBounds', 'Urban bounds', 'json'),",
    'Studio urban plan field'
)
replace_once(
    'server/engine/ContentStudio.mjs',
    "    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return 'settlementClass is not supported';",
    "    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return 'settlementClass is not supported';\n    if (record.urbanPlan !== undefined && record.urbanPlan !== '' && !URBAN_PLANS.has(String(record.urbanPlan))) return 'urbanPlan is not supported';",
    'Studio urban plan validation'
)
replace_once(
    'server/engine/ContentStudio.mjs',
    "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], settlementClasses: [...SETTLEMENT_CLASSES], eventTypes: [...EVENT_TYPES], nameplateModes: [...NAMEPLATE_MODES],",
    "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], settlementClasses: [...SETTLEMENT_CLASSES], urbanPlans: [...URBAN_PLANS], eventTypes: [...EVENT_TYPES], nameplateModes: [...NAMEPLATE_MODES],",
    'Studio urban plan options'
)
replace_once(
    'server/engine/ContentStudio.mjs',
    "    maps: 'Map edits rebuild deterministic terrain and live portal travel. Width, height, settlement class and urban bounds are authoritative; capital maps receive higher city-authoring budgets while townRange remains a local service radius. Built-in maps cannot be deleted.',",
    "    maps: 'Map edits rebuild deterministic terrain and live portal travel. Width, height, settlement class, urban plan and urban bounds are authoritative; capital maps receive higher city-authoring budgets while townRange remains a local service radius. Built-in maps cannot be deleted.',",
    'Studio runtime note'
)

replace_once(
    'server/engine/ContentIntegrity.mjs',
    "import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, BIOMES } from './World.mjs';",
    "import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, URBAN_PLANS, BIOMES } from './World.mjs';",
    'Integrity urban plans import'
)
replace_once(
    'server/engine/ContentIntegrity.mjs',
    "    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return `Map settlementClass is not supported: ${settlementClass}`;",
    "    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return `Map settlementClass is not supported: ${settlementClass}`;\n    if (record.urbanPlan !== undefined && record.urbanPlan !== '' && !URBAN_PLANS.has(String(record.urbanPlan))) return `Map urbanPlan is not supported: ${record.urbanPlan}`;",
    'Integrity urban plan validation'
)

replace_once(
    'src/game/maps.ts',
    "export type UrbanPlan = 'royal-grid' | 'harbor-crescent';",
    "export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings';",
    'Client urban plan union'
)
replace_once(
    'src/game/maps.ts',
    "function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const requested = String(value || (mapId === 'sunreach_coast' ? 'harbor-crescent' : 'royal-grid')); return requested === 'harbor-crescent' ? 'harbor-crescent' : 'royal-grid'; }",
    "function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' ? requested : 'royal-grid'; }",
    'Client default urban plan'
)

forest_client = r'''
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

'''
replace_once(
    'src/game/maps.ts',
    "\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {\n",
    "\n" + forest_client + "function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {\n",
    'Client forest generator insertion'
)
replace_once(
    'src/game/maps.ts',
    "  if (map.urbanPlan === 'harbor-crescent') return harborCapitalTile(map, x, y);",
    "  if (map.urbanPlan === 'harbor-crescent') return harborCapitalTile(map, x, y);\n  if (map.urbanPlan === 'forest-rings') return forestCapitalTile(map, x, y);",
    'Client forest dispatch'
)

tests = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_IRONWOOD_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandIronwoodData } from '../engine/GrandIronwood.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { validateContentReferences } from '../engine/ContentIntegrity.mjs';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

test('9.38A Grand Ironwood is a 160x160 forest-ring capital with dense authored identity', () => {
  assert.equal(GRAND_IRONWOOD_MAP.width, 160);
  assert.equal(GRAND_IRONWOOD_MAP.height, 160);
  assert.equal(GRAND_IRONWOOD_MAP.settlementClass, 'capital');
  assert.equal(GRAND_IRONWOOD_MAP.urbanPlan, 'forest-rings');
  assert.equal(GRAND_IRONWOOD_MAP.districts.length, 12);
  assert.equal(GRAND_IRONWOOD_MAP.landmarks.length, 40);
  assert.ok(GRAND_IRONWOOD_MAP.props.length >= 90);
  assert.equal(MAP_CONFIG.ironwood.width, 160);
  assert.equal(MAP_CONFIG.ironwood.urbanPlan, 'forest-rings');
  assert.ok(URBAN_PLANS.has('royal-grid') && URBAN_PLANS.has('harbor-crescent') && URBAN_PLANS.has('forest-rings'));
});

test('9.38A forest topology has living palisades, four gates, ring trails and real groves', () => {
  const world = new WorldManager();
  const map = world.getMap('ironwood');
  assert.equal(map.tiles[50][24].type, 'tree');
  for (const [x,y] of [[24,78],[135,78],[80,22],[80,137]]) {
    assert.equal(map.tiles[y][x].type, 'path', `gate ${x},${y} must be open`);
    assert.equal(map.tiles[y][x].walkable, true);
  }
  assert.equal(map.tiles[92][94].type, 'path');
  assert.equal(map.tiles[105][107].type, 'path');
  assert.equal(map.tiles[50][49].type, 'tree');
  assert.equal(map.tiles[62][90].type, 'grass');
});

test('9.38A legacy migration moves exact defaults and incoming travel once', () => {
  const data = {
    maps: [
      { id:'ironwood', width:80, height:80, spawnX:20, spawnY:40, townX:20, townY:40, townRange:8, cityStyle:'ironwood', portals:[
        {x:8,y:40,targetMap:'eldoria',targetX:130,targetY:80,label:'old'},
        {x:40,y:8,targetMap:'frostpeak',targetX:68,targetY:40,label:'old'},
      ]},
      { id:'eldoria', width:160, height:160, portals:[{x:132,y:80,targetMap:'ironwood',targetX:10,targetY:40}] },
      { id:'sunreach_coast', width:160, height:160, portals:[{x:137,y:70,targetMap:'ironwood',targetX:12,targetY:40}] },
    ],
    npcs:[
      {id:'quest_ironwood',mapId:'ironwood',posX:18,posY:40},
      {id:'merchant_ironwood',mapId:'ironwood',posX:22,posY:40},
      {id:'warden_ironwood',mapId:'ironwood',posX:20,posY:42},
    ],
    monsters:[
      {id:'ironwood_ironwood_stag',mapId:'ironwood',posX:18,posY:34},
      {id:'ironwood_timber_wolf',mapId:'ironwood',posX:26,posY:41},
      {id:'ironwood_barkhide_brute',mapId:'ironwood',posX:34,posY:48},
      {id:'ironwood_poacher',mapId:'ironwood',posX:42,posY:55},
      {id:'ironwood_ancient_ent',mapId:'ironwood',posX:50,posY:20},
      {id:'ironwood_ironbark_behemoth',mapId:'ironwood',posX:58,posY:27},
    ],
    nodes:[{id:'node_ironwood',mapId:'ironwood',x:20,y:40}],
  };
  assert.equal(migrateGrandIronwoodData(data), true);
  const ironwood = data.maps[0];
  assert.equal(ironwood.width,160);
  assert.equal(ironwood.height,160);
  assert.equal(ironwood.urbanPlan,'forest-rings');
  assert.equal(ironwood.portals.length,3);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[26,78]);
  assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[80,134]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[70,82]);
  assert.deepEqual([data.npcs[1].posX,data.npcs[1].posY],[58,78]);
  assert.deepEqual([data.npcs[2].posX,data.npcs[2].posY],[128,78]);
  assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[118,146]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,78]);
  const snapshot = JSON.stringify(data);
  assert.equal(migrateGrandIronwoodData(data), false);
  assert.equal(JSON.stringify(data), snapshot);
});

test('9.38A administrator-authored Ironwood geometry and coordinates are preserved', () => {
  const data = {
    maps:[{id:'ironwood',width:120,height:120,spawnX:61,spawnY:62,townX:60,townY:60,settlementClass:'city',urbanPlan:'royal-grid',districts:[{id:'custom'}],landmarks:[{id:'custom'}],props:[{id:'custom'}],portals:[{x:5,y:5,targetMap:'eldoria',targetX:90,targetY:90}]}],
    npcs:[{id:'quest_ironwood',mapId:'ironwood',posX:18,posY:40}],
    monsters:[{id:'ironwood_timber_wolf',mapId:'ironwood',posX:26,posY:41}],
    nodes:[{id:'node_ironwood',mapId:'ironwood',x:20,y:40}],
  };
  const before = JSON.stringify(data);
  assert.equal(migrateGrandIronwoodData(data), false);
  assert.equal(JSON.stringify(data), before);
});

test('9.38A fresh ContentDB converges Road-to-10 and all three grand-capital migrations', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'moria-938-'));
  const file = path.join(dir,'content.json');
  try {
    const db = new ContentDB(file);
    const data = db.getAllContent();
    assert.equal(data.grandCapitalVersion, GRAND_CAPITAL_SCHEMA_VERSION);
    assert.equal(data.roadToTenVersion, 1);
    assert.ok(data.professionSpecializations.length > 0);
    const sunreach = data.maps.find(map => map.id === 'sunreach_coast');
    const ironwood = data.maps.find(map => map.id === 'ironwood');
    assert.deepEqual([sunreach.width,sunreach.height,sunreach.urbanPlan],[160,160,'harbor-crescent']);
    assert.deepEqual([ironwood.width,ironwood.height,ironwood.urbanPlan],[160,160,'forest-rings']);
    const sunNpc = data.npcs.find(npc => npc.id === 'quest_sunreach_coast');
    const ironNpc = data.npcs.find(npc => npc.id === 'quest_ironwood');
    const sunNode = data.nodes.find(node => node.id === 'node_sunreach');
    const ironNode = data.nodes.find(node => node.id === 'node_ironwood');
    assert.deepEqual([sunNpc.posX,sunNpc.posY],[54,72]);
    assert.deepEqual([ironNpc.posX,ironNpc.posY],[70,82]);
    assert.deepEqual([sunNode.x,sunNode.y],[80,70]);
    assert.deepEqual([ironNode.x,ironNode.y],[80,78]);
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test('9.38A client and server share the forest-rings generation vocabulary', () => {
  const server = fs.readFileSync(new URL('../engine/World.mjs', import.meta.url),'utf8');
  const client = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url),'utf8');
  for (const marker of ['forestCapitalTile','trailRings','lumberRoads','hunterRoads','centralClearing','groveTree']) {
    assert.ok(server.includes(marker), `server missing ${marker}`);
    assert.ok(client.includes(marker), `client missing ${marker}`);
  }
  assert.ok(server.includes("config.urbanPlan === 'forest-rings'"));
  assert.ok(client.includes("map.urbanPlan === 'forest-rings'"));
});

test('9.38A Content Studio exposes urbanPlan and rejects unsupported topology at both boundaries', () => {
  const fakeDb = {
    get(type) {
      if (type === 'maps') return [clone(GRAND_IRONWOOD_MAP)];
      return [];
    }
  };
  const schema = getContentStudioSchema('maps', fakeDb);
  assert.ok(schema.fields.includes('urbanPlan'));
  assert.ok(schema.options.urbanPlans.includes('forest-rings'));
  const valid = { ...clone(GRAND_IRONWOOD_MAP), name:'Ironwood March' };
  assert.equal(validateStudioRecord('maps',valid,fakeDb),null);
  const invalid = { ...valid, urbanPlan:'impossible-spiral' };
  assert.match(validateStudioRecord('maps',invalid,fakeDb),/urbanPlan/);
  assert.match(validateContentReferences(fakeDb,'maps',invalid),/urbanPlan/);
});

test('9.38A previously approved royal and harbor capital algorithms remain reachable', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');
  assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');
  assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');
  assert.equal(world.getMap('eldoria').width,160);
  assert.equal(world.getMap('sunreach_coast').width,160);
});
'''
write('server/test/grand-ironwood-9-38.test.mjs', tests)

docs = r'''# Mor'ia 9.38 — Grand Ironwood

## 9.38A — Capital florestal autoritativa

Ironwood deixa de ser um assentamento 80×80 e passa a ser uma capital 160×160 com identidade própria. A composição não reutiliza o grid cerimonial de Eldoria nem o porto em crescente de Sunreach: o novo `urbanPlan: forest-rings` usa paliçadas vivas, quatro portões, eixos cardeais, duas trilhas circulares, vias de lenhadores/caçadores, clareira central e bosques internos com árvores de colisão real.

### Conteúdo urbano

- mapa 160×160, classe `capital`;
- 12 distritos;
- 40 footprints de arquitetura autoritativa;
- pelo menos 90 props de ambientação;
- Salão dos Marchwardens, Árvore-Mãe Ironbark, Grande Mercado da Madeira, Filhos da Natureza, caçadores, domadores, serraria, carpinteiros, curtume, depósito, arena, torres de paliçada, vigílias, biblioteca e Poço Lunar;
- `townRange` continua 18 e permanece somente como raio local de serviços.

### Migração segura

A migração só promove o mapa legado Ironwood 80×80 quando as coordenadas-base ainda correspondem ao conteúdo oficial. Dimensões administrativas customizadas (por exemplo 120×120) bloqueiam toda a promoção e também bloqueiam migrações colaterais de NPC, monstro e Node.

NPCs, monstros e Node mudam apenas quando ainda estão nas coordenadas legadas exatas. Portais administrativos são preservados. Apenas o conjunto oficial intacto de dois portais recebe automaticamente a terceira rota oficial de retorno para Sunreach.

Chegadas oficiais:
- Eldoria → Ironwood: 26,78;
- Sunreach → Ironwood: 80,134.

### Convergência de banco novo

A 9.38A também corrige uma assimetria de inicialização: um banco criado do zero agora percorre a mesma cadeia de Grand Capitals que um banco já existente. Eldoria, Sunreach e Ironwood são migradas de forma idempotente, e o seed inicial também materializa os catálogos Road-to-10 antes de gravar os marcadores de versão.

`grandCapitalVersion` avança para 4 sem alterar a versão-base de conteúdo.

### Studio e integridade

`urbanPlan` passa a fazer parte do schema declarativo do Content Studio, com opções autoritativas `royal-grid`, `harbor-crescent` e `forest-rings`. Tanto a validação semântica quanto a validação de referências falham de forma fechada para topologias desconhecidas.

### Paridade cliente/servidor

O algoritmo `forest-rings` é espelhado no servidor e no cliente para manter colisão, previsão e visual consistentes.

## Próxima etapa

A 9.38B fará a prova visual autoritativa com:
- minimapa 160×160;
- City Designer;
- panorâmica de produção;
- verificação de massa verde/árvores, trilhas circulares e principais marcos de Ironwood.
'''
write('docs/MORIA_9_38_GRAND_IRONWOOD.md', docs)

print("Mor'ia 9.38A Grand Ironwood applicator prepared")
