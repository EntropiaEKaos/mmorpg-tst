// ===================================================================
// MOR'IA 9.37 — GRAND SUNREACH COAST AUTHORITATIVE CONTENT CONTRACT
// A maritime capital with an open harbor. Migration only moves exact known
// legacy defaults; administrator-authored coordinates and architecture win.
// ===================================================================

export const GRAND_SUNREACH_VERSION = 1;
export const GRAND_CAPITAL_SCHEMA_VERSION = 3;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function samePoint(record, x, y, xKey = 'posX', yKey = 'posY') { return Number(record?.[xKey]) === x && Number(record?.[yKey]) === y; }

const districts = Object.freeze([
  { id:'sunreach_tidewatch', name:'Alturas de Tidewatch', icon:'⚓', x:80, y:38, radius:13, color:'#55b9d8' },
  { id:'sunreach_west_gate', name:'Portão do Poente', icon:'◇', x:32, y:68, radius:9, color:'#76c9dd' },
  { id:'sunreach_salt_market', name:'Mercado do Sal', icon:'⚖', x:52, y:72, radius:12, color:'#e0c27c' },
  { id:'sunreach_free_league', name:'Bairro da Liga Livre', icon:'⚑', x:84, y:66, radius:11, color:'#69c5dc' },
  { id:'sunreach_sea_chapel', name:'Bairro da Capela do Mar', icon:'✦', x:112, y:56, radius:10, color:'#a7d9e5' },
  { id:'sunreach_sailmakers', name:'Bairro dos Veleiros', icon:'⌁', x:108, y:80, radius:11, color:'#68b4c7' },
  { id:'sunreach_shipwrights', name:'Distrito dos Estaleiros', icon:'⚒', x:104, y:96, radius:11, color:'#b68b5b' },
  { id:'sunreach_warehouse', name:'Cais dos Armazéns', icon:'▣', x:70, y:94, radius:11, color:'#9f8b70' },
  { id:'sunreach_fisherfolk', name:'Bairro dos Pescadores', icon:'◈', x:36, y:92, radius:11, color:'#73b7c9' },
  { id:'sunreach_east_bastion', name:'Bastião Leste', icon:'🛡', x:128, y:70, radius:9, color:'#62b9ce' },
  { id:'sunreach_lighthouse', name:'Ponta do Farol', icon:'✺', x:126, y:98, radius:9, color:'#f0d88e' },
  { id:'sunreach_harbor_basin', name:'Bacia do Grande Porto', icon:'⚓', x:80, y:116, radius:18, color:'#3b91bd' },
]);

const landmarks = Object.freeze([
  { id:'sunreach_tidewatch_hall', name:'Cidadela Tidewatch', kind:'keep', icon:'⚓', x:72, y:28, w:16, h:12 },
  { id:'sunreach_cartographers', name:'Arquivo dos Cartógrafos', kind:'library', icon:'⌖', x:98, y:30, w:12, h:9 },
  { id:'sunreach_tide_arena', name:'Arena das Marés', kind:'arena', icon:'⚔', x:34, y:34, w:14, h:12 },
  { id:'sunreach_salt_market', name:'Grande Mercado do Sal', kind:'market', icon:'⚖', x:44, y:64, w:14, h:10 },
  { id:'sunreach_harbor_authority', name:'Autoridade Portuária', kind:'house', icon:'§', x:64, y:62, w:10, h:8 },
  { id:'sunreach_free_league_hall', name:'Salão da Liga Livre', kind:'keep', icon:'⚑', x:82, y:58, w:12, h:10 },
  { id:'sunreach_sea_chapel', name:'Capela do Mar Aberto', kind:'temple', icon:'✦', x:106, y:48, w:12, h:10 },
  { id:'sunreach_west_bastion', name:'Bastião do Poente', kind:'tower', icon:'🛡', x:26, y:62, w:8, h:10 },
  { id:'sunreach_east_bastion', name:'Bastião do Levante', kind:'tower', icon:'🛡', x:126, y:62, w:8, h:10 },
  { id:'sunreach_maritime_bank', name:'Banco Marítimo', kind:'house', icon:'¤', x:56, y:78, w:10, h:8 },
  { id:'sunreach_mariners_inn', name:'Estalagem do Navegante', kind:'lodge', icon:'⌂', x:84, y:76, w:10, h:8 },
  { id:'sunreach_sailmakers_hall', name:'Salão dos Veleiros', kind:'house', icon:'⌁', x:104, y:76, w:12, h:8 },
  { id:'sunreach_fisher_guild', name:'Guilda dos Pescadores', kind:'lodge', icon:'◈', x:28, y:88, w:12, h:8 },
  { id:'sunreach_dock_exchange', name:'Bolsa das Docas', kind:'market', icon:'⚖', x:42, y:88, w:12, h:8 },
  { id:'sunreach_fleet_depot', name:'Depósito da Frota', kind:'depot', icon:'▣', x:64, y:90, w:10, h:8 },
  { id:'sunreach_customs_house', name:'Casa da Alfândega', kind:'house', icon:'◆', x:80, y:90, w:10, h:8 },
  { id:'sunreach_grand_shipyard', name:'Grande Estaleiro', kind:'forge', icon:'⚒', x:100, y:90, w:14, h:8 },
  { id:'sunreach_lighthouse', name:'Farol de Sunreach', kind:'tower', icon:'✺', x:124, y:94, w:8, h:10 },
  { id:'sunreach_west_quay', name:'Administração do Cais Oeste', kind:'dock', icon:'⚓', x:48, y:99, w:10, h:6 },
  { id:'sunreach_east_quay', name:'Administração do Cais Leste', kind:'dock', icon:'⚓', x:102, y:99, w:10, h:6 },
]);

export const GRAND_SUNREACH_MINOR_ARCHITECTURE = Object.freeze([
  { id:'sunreach_residence_01', name:'Casario de Tidewatch I', kind:'house', icon:'⌂', x:54, y:38, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_02', name:'Casario de Tidewatch II', kind:'house', icon:'⌂', x:62, y:40, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_03', name:'Vila dos Cartógrafos', kind:'house', icon:'⌂', x:112, y:34, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_04', name:'Casario do Poente I', kind:'house', icon:'⌂', x:38, y:52, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_05', name:'Casario do Poente II', kind:'house', icon:'⌂', x:48, y:52, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_06', name:'Residência da Liga I', kind:'house', icon:'⌂', x:78, y:46, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_07', name:'Residência da Liga II', kind:'house', icon:'⌂', x:88, y:46, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_08', name:'Vila da Capela', kind:'house', icon:'⌂', x:118, y:48, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_09', name:'Casario Mercantil I', kind:'house', icon:'⌂', x:42, y:76, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_10', name:'Casario Mercantil II', kind:'house', icon:'⌂', x:48, y:82, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_11', name:'Casa dos Navegantes', kind:'house', icon:'⌂', x:72, y:78, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_residence_12', name:'Vila dos Veleiros', kind:'house', icon:'⌂', x:116, y:76, w:6, h:5, showOnMinimap:false },
  { id:'sunreach_warehouse_01', name:'Armazém de Sal I', kind:'house', icon:'▣', x:46, y:96, w:7, h:5, showOnMinimap:false },
  { id:'sunreach_warehouse_02', name:'Armazém de Sal II', kind:'house', icon:'▣', x:56, y:98, w:7, h:5, showOnMinimap:false },
  { id:'sunreach_warehouse_03', name:'Armazém da Frota I', kind:'house', icon:'▣', x:74, y:100, w:7, h:5, showOnMinimap:false },
  { id:'sunreach_warehouse_04', name:'Armazém da Frota II', kind:'house', icon:'▣', x:84, y:100, w:7, h:5, showOnMinimap:false },
  { id:'sunreach_warehouse_05', name:'Armazém dos Estaleiros', kind:'house', icon:'▣', x:94, y:102, w:7, h:5, showOnMinimap:false },
  { id:'sunreach_residence_13', name:'Casario do Farol', kind:'house', icon:'⌂', x:116, y:88, w:6, h:5, showOnMinimap:false },
]);

function buildProps() {
  const props = [];
  let serial = 1;
  const add = (kind, x, y, color = '#55b9d8', label) => props.push({ id:`sunreach_prop_${serial++}`, kind, x, y, color, ...(label ? { label } : {}) });
  for (let x = 30; x <= 130; x += 10) { add('lamp', x, 68, '#9edced'); add('lamp', x, 72, '#9edced'); }
  for (let y = 30; y <= 94; y += 8) { add('lamp', 78, y, '#9edced'); add('lamp', 82, y, '#9edced'); }
  for (const [x,y] of [[38,70],[54,72],[88,66],[110,82],[124,72],[36,92],[72,96],[108,96]]) add('sign',x,y,'#d2b174');
  for (const [x,y] of [[44,92],[48,94],[54,94],[60,96],[70,100],[88,102],[98,104],[108,100],[116,98]]) add('barrel',x,y,'#8c6747');
  for (const [x,y] of [[42,88],[58,90],[92,88],[112,90]]) add('cart',x,y,'#8c6747');
  for (const [x,y,label] of [[52,100,'Cais do Sal'],[68,104,'Píer Mercante'],[92,104,'Píer da Frota'],[110,102,'Cais dos Estaleiros'],[126,100,'Ponta do Farol']]) add('anchor',x,y,'#6c8b96',label);
  for (const [x,y] of [[30,56],[32,80],[128,54],[130,82],[78,42],[82,42]]) add('banner',x,y,'#3c8eaa');
  return props.slice(0, 110);
}

export const GRAND_SUNREACH_MAP = Object.freeze({
  id:'sunreach_coast', name:'Sunreach Coast', biome:'plains',
  description:'Capital marítima da Liga Livre: muralhas terrestres, mercados, estaleiros, cais, píeres, farol e uma grande bacia portuária aberta ao sul.',
  width:160, height:160, settlementClass:'capital', urbanPlan:'harbor-crescent', urbanBounds:{ x:22, y:20, width:116, height:116 },
  levelRequired:5, seed:2048, spawnX:80, spawnY:78, townX:80, townY:70, townRange:18,
  cityStyle:'harbor', cityAccent:'#55b9d8', roofColor:'#326177', wallColor:'#c2bda5', roadColor:'#8f8068',
  residentialRingEnabled:false, residentialRingDensity:0,
  districts, landmarks:Object.freeze([...landmarks, ...GRAND_SUNREACH_MINOR_ARCHITECTURE]), props:Object.freeze(buildProps()), access:'public',
  portals:Object.freeze([
    { x:80, y:20, targetMap:'eldoria', targetX:80, targetY:26, label:'🏰 Estrada Real de Eldoria' },
    { x:137, y:70, targetMap:'ironwood', targetX:12, targetY:40, label:'🌲 Estrada de Ironwood' },
  ]),
});

export const GRAND_SUNREACH_BUILTIN_WORLD_CONFIG = Object.freeze({
  ...GRAND_SUNREACH_MAP,
  spawnPoint:{ x:GRAND_SUNREACH_MAP.spawnX, y:GRAND_SUNREACH_MAP.spawnY },
  townCenter:{ x:GRAND_SUNREACH_MAP.townX, y:GRAND_SUNREACH_MAP.townY },
  portals:GRAND_SUNREACH_MAP.portals
    .filter(portal => portal.targetMap === 'eldoria' || portal.targetMap === 'ironwood')
    .map(portal => ({ pos:{x:portal.x,y:portal.y}, targetMap:portal.targetMap, targetSpawn:{x:portal.targetX,y:portal.targetY}, label:portal.label })),
});

export const GRAND_SUNREACH_NPC_MOVES = Object.freeze({
  quest_sunreach_coast:{ from:[38,58], to:[54,72] },
  merchant_sunreach_coast:{ from:[42,58], to:[52,76] },
  warden_sunreach_coast:{ from:[40,60], to:[124,72] },
});

export const GRAND_SUNREACH_MONSTER_MOVES = Object.freeze({
  sunreach_coast_reef_crab:{ from:[18,27], to:[18,58] },
  sunreach_coast_saltfang_serpent:{ from:[26,34], to:[18,88] },
  sunreach_coast_corsair_deckhand:{ from:[34,41], to:[142,52] },
  sunreach_coast_tide_wisp:{ from:[42,48], to:[142,84] },
  sunreach_coast_drowned_reaver:{ from:[50,55], to:[20,30] },
  sunreach_coast_leviathan_spawn:{ from:[58,20], to:[140,30] },
});

function patchExactPosition(record, move, xKey = 'posX', yKey = 'posY') {
  if (!move || !samePoint(record, move.from[0], move.from[1], xKey, yKey)) return false;
  record[xKey] = move.to[0]; record[yKey] = move.to[1]; return true;
}

function knownPair(x, y, pairs) { return pairs.some(pair => Number(x) === pair[0] && Number(y) === pair[1]); }

function patchMap(map) {
  const width = map.width === undefined ? 80 : Number(map.width);
  const height = map.height === undefined ? 80 : Number(map.height);
  const legacyCoordinates = width === 80 && height === 80
    && Number(map.spawnX ?? 40) === 40 && Number(map.spawnY ?? 58) === 58
    && Number(map.townX ?? 40) === 40 && Number(map.townY ?? 58) === 58;
  if (!legacyCoordinates) return false;

  let changed = false;
  const set = (key, value) => { if (JSON.stringify(map[key]) !== JSON.stringify(value)) { map[key] = clone(value); changed = true; } };
  set('width',160); set('height',160); set('settlementClass','capital'); set('urbanPlan','harbor-crescent'); set('urbanBounds',GRAND_SUNREACH_MAP.urbanBounds);
  set('spawnX',80); set('spawnY',78); set('townX',80); set('townY',70); set('townRange',18);
  if (!map.cityStyle || map.cityStyle === 'harbor') set('cityStyle','harbor');
  if (!map.cityAccent) set('cityAccent',GRAND_SUNREACH_MAP.cityAccent);
  if (!map.roofColor) set('roofColor',GRAND_SUNREACH_MAP.roofColor);
  if (!map.wallColor) set('wallColor',GRAND_SUNREACH_MAP.wallColor);
  if (!map.roadColor) set('roadColor',GRAND_SUNREACH_MAP.roadColor);
  if (!Array.isArray(map.districts) || map.districts.length === 0) set('districts',GRAND_SUNREACH_MAP.districts);
  if (!Array.isArray(map.landmarks) || map.landmarks.length === 0) set('landmarks',GRAND_SUNREACH_MAP.landmarks);
  if (!Array.isArray(map.props) || map.props.length === 0) set('props',GRAND_SUNREACH_MAP.props);
  if (map.residentialRingEnabled === undefined || map.residentialRingEnabled === true) set('residentialRingEnabled',false);
  if (map.residentialRingDensity === undefined || Number(map.residentialRingDensity) <= 5) set('residentialRingDensity',0);

  const portals = Array.isArray(map.portals) ? map.portals : [];
  if (!portals.length) set('portals',GRAND_SUNREACH_MAP.portals);
  else {
    for (const portal of portals) {
      if (portal?.targetMap === 'eldoria'
          && knownPair(portal.x, portal.y, [[40,72]])
          && knownPair(portal.targetX, portal.targetY, [[40,12],[80,26]])) {
        portal.x=80; portal.y=20; portal.targetX=80; portal.targetY=26; portal.label='🏰 Estrada Real de Eldoria'; changed=true;
      }
      if (portal?.targetMap === 'ironwood'
          && knownPair(portal.x, portal.y, [[72,40]])
          && knownPair(portal.targetX, portal.targetY, [[12,40]])) {
        portal.x=137; portal.y=70; portal.targetX=12; portal.targetY=40; portal.label='🌲 Estrada de Ironwood'; changed=true;
      }
    }
  }
  return changed;
}

export function migrateGrandSunreachData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const maps = Array.isArray(data.maps) ? data.maps : [];
  const sunreach = maps.find(map => map?.id === 'sunreach_coast');
  if (!sunreach) return false;
  let changed = patchMap(sunreach);
  const grandTopology = Number(sunreach.width) === 160 && Number(sunreach.height) === 160 && sunreach.settlementClass === 'capital' && sunreach.urbanPlan === 'harbor-crescent';
  if (!changed && !grandTopology) return false;

  const eldoria = maps.find(map => map?.id === 'eldoria');
  for (const portal of Array.isArray(eldoria?.portals) ? eldoria.portals : []) {
    if (portal?.targetMap === 'sunreach_coast' && knownPair(portal.targetX, portal.targetY, [[40,68]])) {
      portal.targetX=80; portal.targetY=24; changed=true;
    }
  }

  for (const npc of Array.isArray(data.npcs) ? data.npcs : []) {
    if (npc?.mapId !== 'sunreach_coast') continue;
    if (patchExactPosition(npc, GRAND_SUNREACH_NPC_MOVES[npc.id])) changed=true;
  }
  for (const monster of Array.isArray(data.monsters) ? data.monsters : []) {
    if (monster?.mapId !== 'sunreach_coast') continue;
    if (patchExactPosition(monster, GRAND_SUNREACH_MONSTER_MOVES[monster.id])) changed=true;
  }
  for (const node of Array.isArray(data.nodes) ? data.nodes : []) {
    if (node?.id === 'node_sunreach' && node?.mapId === 'sunreach_coast' && samePoint(node,40,58,'x','y')) {
      node.x=80; node.y=70; changed=true;
    }
  }
  return changed;
}
