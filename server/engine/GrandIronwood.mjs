// ===================================================================
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
    { x:80, y:22, targetMap:'frostpeak', targetX:80, targetY:136, label:'❄ Estrada da Geada' },
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
