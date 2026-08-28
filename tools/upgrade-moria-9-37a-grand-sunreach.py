from pathlib import Path


def replace_once(path: str, old: str, new: str, marker: str):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if marker in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: anchor not found for {marker}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

sunreach = r'''// ===================================================================
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
    .filter(portal => portal.targetMap === 'eldoria')
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
'''
Path('server/engine/GrandSunreach.mjs').write_text(sunreach, encoding='utf-8')

# ---- Server world: explicit urbanPlan + harbor-crescent terrain ----
p = Path('server/engine/World.mjs')
text = p.read_text(encoding='utf-8')
if "GrandSunreach.mjs" not in text:
    text = text.replace("import { GRAND_ELDORIA_BUILTIN_WORLD_CONFIG } from './GrandEldoria.mjs';", "import { GRAND_ELDORIA_BUILTIN_WORLD_CONFIG } from './GrandEldoria.mjs';\nimport { GRAND_SUNREACH_BUILTIN_WORLD_CONFIG } from './GrandSunreach.mjs';")
if "const URBAN_PLANS" not in text:
    text = text.replace("const SETTLEMENT_CLASS_SET = new Set(SETTLEMENT_CLASSES);", "const SETTLEMENT_CLASS_SET = new Set(SETTLEMENT_CLASSES);\nconst URBAN_PLANS = new Set(['royal-grid','harbor-crescent']);")
if "sunreach_coast: GRAND_SUNREACH_BUILTIN_WORLD_CONFIG" not in text:
    text = text.replace("  eldoria: GRAND_ELDORIA_BUILTIN_WORLD_CONFIG,", "  eldoria: GRAND_ELDORIA_BUILTIN_WORLD_CONFIG,\n  sunreach_coast: GRAND_SUNREACH_BUILTIN_WORLD_CONFIG,")
if "const requestedUrbanPlan" not in text:
    anchor = "  const settlementClass = SETTLEMENT_CLASS_SET.has(requestedSettlement) ? requestedSettlement : 'city';\n"
    addition = anchor + "  const requestedUrbanPlan = String(record?.urbanPlan || base?.urbanPlan || (id === 'sunreach_coast' ? 'harbor-crescent' : 'royal-grid'));\n  const urbanPlan = settlementClass === 'capital' && URBAN_PLANS.has(requestedUrbanPlan) ? requestedUrbanPlan : 'royal-grid';\n"
    if anchor not in text: raise SystemExit('World urbanPlan normalize anchor missing')
    text = text.replace(anchor, addition, 1)
text = text.replace("    id, width, height, settlementClass, urbanBounds,", "    id, width, height, settlementClass, urbanPlan, urbanBounds,")
if "function harborShoreY(config, x)" not in text:
    old = r'''function capitalUrbanTile(config, x, y) {
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
'''
    new = r'''function harborShoreY(config, x) {
  return Math.round(config.townCenter.y + 32 + Math.abs(x - config.townCenter.x) * 0.16);
}

function harborCapitalTile(config, x, y) {
  const bounds = config.urbanBounds;
  if (!bounds) return null;
  const minX = Number(bounds.x), minY = Number(bounds.y);
  const maxX = minX + Number(bounds.width) - 1, maxY = minY + Number(bounds.height) - 1;
  const cx = config.townCenter.x, cy = config.townCenter.y;
  const shoreY = harborShoreY(config, x);
  const pierXs = [cx - 30, cx - 12, cx + 12, cx + 30];
  const pier = pierXs.some(px => Math.abs(x - px) <= 1) && y >= shoreY - 1 && y <= shoreY + 18;
  const breakwater = Math.abs(y - (cy + 62)) <= 1 && x >= cx - 36 && x <= cx + 36 && Math.abs(x - cx) > 5;
  if (pier || breakwater) return { type:'bridge', walkable:true, blocksSight:false };
  if (y >= shoreY) return { type:'water', walkable:false, blocksSight:false };
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  const landWall = y === minY || ((x === minX || x === maxX) && y < shoreY - 3);
  if (landWall) return { type:'wall', walkable:false, blocksSight:true };
  const quay = y >= shoreY - 3 && y < shoreY;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const merchant = Math.abs(y - (cy + 18)) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1;
  return { type:(quay || major || merchant || secondary) ? 'path' : 'floor', walkable:true, blocksSight:false };
}

function capitalUrbanTile(config, x, y) {
  if (config?.settlementClass !== 'capital') return null;
  if (config.urbanPlan === 'harbor-crescent') return harborCapitalTile(config, x, y);
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
'''
    if old not in text: raise SystemExit('World capitalUrbanTile anchor missing')
    text = text.replace(old,new,1)
text = text.replace("      id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',\n      width: config.width, height: config.height, settlementClass: config.settlementClass, urbanBounds: { ...config.urbanBounds },", "      id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',\n      width: config.width, height: config.height, settlementClass: config.settlementClass, urbanPlan: config.urbanPlan, urbanBounds: { ...config.urbanBounds },")
p.write_text(text, encoding='utf-8')

# ---- Client map model and the exact same harbor algorithm ----
p = Path('src/game/maps.ts')
text = p.read_text(encoding='utf-8')
if "export type UrbanPlan" not in text:
    text = text.replace("export type SettlementClass = 'wilderness' | 'town' | 'city' | 'capital';", "export type SettlementClass = 'wilderness' | 'town' | 'city' | 'capital';\nexport type UrbanPlan = 'royal-grid' | 'harbor-crescent';")
if "urbanPlan?: UrbanPlan;" not in text:
    text = text.replace("  settlementClass?: SettlementClass;\n  urbanBounds?: UrbanBounds;", "  settlementClass?: SettlementClass;\n  urbanPlan?: UrbanPlan;\n  urbanBounds?: UrbanBounds;")
if "function urbanPlanOf" not in text:
    anchor = "function mapDimension(value: unknown, fallback = MAP_WIDTH): number { return integer(value, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, fallback); }"
    new = anchor + "\nfunction urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const requested = String(value || (mapId === 'sunreach_coast' ? 'harbor-crescent' : 'royal-grid')); return requested === 'harbor-crescent' ? 'harbor-crescent' : 'royal-grid'; }"
    if anchor not in text: raise SystemExit('maps.ts urbanPlan helper anchor missing')
    text=text.replace(anchor,new,1)
if "const urbanPlan = urbanPlanOf" not in text:
    text=text.replace("  const settlementClass = settlementClassOf(map.settlementClass, map.id);\n  const townCenter", "  const settlementClass = settlementClassOf(map.settlementClass, map.id);\n  const urbanPlan = urbanPlanOf(map.urbanPlan, map.id);\n  const townCenter",1)
text=text.replace("  return { ...map, width, height, settlementClass, urbanBounds:", "  return { ...map, width, height, settlementClass, urbanPlan, urbanBounds:")
if "const urbanPlan = urbanPlanOf(raw.urbanPlan" not in text:
    text=text.replace("    const settlementClass = settlementClassOf(raw.settlementClass ?? base?.settlementClass, id);", "    const settlementClass = settlementClassOf(raw.settlementClass ?? base?.settlementClass, id);\n    const urbanPlan = urbanPlanOf(raw.urbanPlan ?? base?.urbanPlan, id);")
text=text.replace("      width, height, settlementClass, urbanBounds: normalizeUrbanBounds", "      width, height, settlementClass, urbanPlan, urbanBounds: normalizeUrbanBounds")
if "function harborShoreY(map: GameMap, x: number)" not in text:
    old = r'''function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
  if (map.settlementClass !== 'capital' || !map.urbanBounds) return null;
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };
}
'''
    new = r'''function harborShoreY(map: GameMap, x: number): number {
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
  const landWall = y === minY || ((x === minX || x === maxX) && y < shoreY - 3);
  if (landWall) return { type:'wall', walkable:false, blocksSight:true };
  const quay = y >= shoreY - 3 && y < shoreY;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const merchant = Math.abs(y - (cy + 18)) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1;
  return { type:(quay || major || merchant || secondary) ? 'path' : 'floor', walkable:true, blocksSight:false };
}

function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
  if (map.settlementClass !== 'capital' || !map.urbanBounds) return null;
  if (map.urbanPlan === 'harbor-crescent') return harborCapitalTile(map, x, y);
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };
}
'''
    if old not in text: raise SystemExit('maps.ts capitalUrbanTile anchor missing')
    text=text.replace(old,new,1)
p.write_text(text, encoding='utf-8')

# ---- Content DB: global capital migration schema 3 ----
p=Path('server/engine/ContentDB.mjs')
text=p.read_text(encoding='utf-8')
if "GrandSunreach.mjs" not in text:
    text=text.replace("import { GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from './GrandEldoria.mjs';", "import { GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from './GrandEldoria.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandSunreachData } from './GrandSunreach.mjs';")
old_migration = r'''  migrateGrandCapitalV1() {
    if (Number(this.data.grandCapitalVersion) >= GRAND_ELDORIA_VERSION) return false;
    migrateGrandEldoriaData(this.data);
    this.data.grandCapitalVersion = GRAND_ELDORIA_VERSION;
    this.save();
    return true;
  }
'''
new_migration = r'''  migrateGrandCapitalV1() {
    if (Number(this.data.grandCapitalVersion) >= GRAND_CAPITAL_SCHEMA_VERSION) return false;
    // Eldoria remains idempotent; schema 3 adds the first independent harbor capital.
    migrateGrandEldoriaData(this.data);
    migrateGrandSunreachData(this.data);
    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;
    this.save();
    return true;
  }
'''
if 'GRAND_CAPITAL_SCHEMA_VERSION) return false' not in text:
    if old_migration not in text: raise SystemExit('ContentDB grand migration anchor missing')
    text=text.replace(old_migration,new_migration,1)
old_seed = "    migrateGrandEldoriaData(this.data);\n    this.data.grandCapitalVersion = GRAND_ELDORIA_VERSION;"
new_seed = "    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;"
if 'migrateGrandSunreachData(this.data);' not in text.split('seedDefaults()',1)[-1]:
    if old_seed not in text: raise SystemExit('ContentDB fresh seed grand migration anchor missing')
    text=text.replace(old_seed,new_seed,1)
p.write_text(text,encoding='utf-8')

# ---- Tests ----
test = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorldManager } from '../engine/World.mjs';
import { GRAND_CAPITAL_SCHEMA_VERSION, GRAND_SUNREACH_MAP, GRAND_SUNREACH_VERSION, migrateGrandSunreachData } from '../engine/GrandSunreach.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');
const clone=value=>JSON.parse(JSON.stringify(value));

function legacyData(){return{
  maps:[
    {id:'sunreach_coast',width:80,height:80,spawnX:40,spawnY:58,townX:40,townY:58,townRange:8,cityStyle:'harbor',portals:[
      {x:40,y:72,targetMap:'eldoria',targetX:80,targetY:26,label:'🏰 Eldoria'},
      {x:72,y:40,targetMap:'ironwood',targetX:12,targetY:40,label:'🌲 Ironwood Trail'},
    ]},
    {id:'eldoria',width:160,height:160,portals:[{x:80,y:24,targetMap:'sunreach_coast',targetX:40,targetY:68,label:'🌊 Portão de Sunreach'}]},
    {id:'ironwood',width:80,height:80,portals:[]},
  ],
  npcs:[{id:'quest_sunreach_coast',mapId:'sunreach_coast',posX:38,posY:58},{id:'merchant_sunreach_coast',mapId:'sunreach_coast',posX:42,posY:58},{id:'warden_sunreach_coast',mapId:'sunreach_coast',posX:40,posY:60}],
  monsters:[
    {id:'sunreach_coast_reef_crab',mapId:'sunreach_coast',posX:18,posY:27},
    {id:'sunreach_coast_saltfang_serpent',mapId:'sunreach_coast',posX:26,posY:34},
    {id:'sunreach_coast_corsair_deckhand',mapId:'sunreach_coast',posX:34,posY:41},
    {id:'sunreach_coast_tide_wisp',mapId:'sunreach_coast',posX:42,posY:48},
    {id:'sunreach_coast_drowned_reaver',mapId:'sunreach_coast',posX:50,posY:55},
    {id:'sunreach_coast_leviathan_spawn',mapId:'sunreach_coast',posX:58,posY:20},
  ],
  nodes:[{id:'node_sunreach',mapId:'sunreach_coast',x:40,y:58}],
};}

test('9.37A Grand Sunreach is a 160x160 harbor capital distinct from royal Eldoria',()=>{
  const world=new WorldManager();
  const map=world.getMap('sunreach_coast');
  assert.equal(GRAND_SUNREACH_VERSION,1); assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,3);
  assert.equal(map.width,160); assert.equal(map.height,160); assert.equal(map.settlementClass,'capital'); assert.equal(map.urbanPlan,'harbor-crescent');
  assert.equal(map.districts.length,12); assert.equal(map.landmarks.length,38); assert.ok(map.props.length>=50);
  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');
  assert.equal(world.getMap('frostpeak').width,80);
});

test('9.37A harbor terrain has terrestrial walls, curved sea, quay, piers and breakwater',()=>{
  const world=new WorldManager(); const map=world.getMap('sunreach_coast');
  assert.equal(map.tiles[20][60].type,'wall'); assert.equal(map.tiles[20][60].walkable,false);
  assert.equal(map.tiles[20][80].type,'path'); assert.equal(map.tiles[20][80].walkable,true);
  assert.equal(map.tiles[100][80].type,'path');
  assert.equal(map.tiles[120][80].type,'water'); assert.equal(map.tiles[120][80].walkable,false);
  assert.equal(map.tiles[115][50].type,'bridge'); assert.equal(map.tiles[115][50].walkable,true);
  assert.equal(map.tiles[132][50].type,'bridge');
  assert.equal(map.tiles[132][80].type,'water','central breakwater entrance must remain open water');
});

test('9.37A legacy migration upgrades exact Sunreach defaults and Eldoria inbound arrival',()=>{
  const data=legacyData(); assert.equal(migrateGrandSunreachData(data),true);
  const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,78,80,70]);
  assert.equal(map.urbanPlan,'harbor-crescent'); assert.equal(map.landmarks.length,38); assert.equal(map.districts.length,12);
  assert.deepEqual([map.portals[0].x,map.portals[0].y,map.portals[0].targetX,map.portals[0].targetY],[80,20,80,26]);
  assert.deepEqual([map.portals[1].x,map.portals[1].y],[137,70]);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,24]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[54,72]);
  assert.deepEqual([data.monsters[0].posX,data.monsters[0].posY],[18,58]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,70]);
  assert.equal(migrateGrandSunreachData(data),false);
});

test('9.37A administrator-authored Sunreach geometry and coordinates are preserved',()=>{
  const data=legacyData(); const map=data.maps[0];
  map.width=120; map.height=120; map.spawnX=55; map.spawnY=75; map.landmarks=[{id:'admin_dock',name:'Admin Dock',kind:'dock',x:20,y:20,w:5,h:5}];
  data.npcs[0].posX=61; data.npcs[0].posY=62;
  assert.equal(migrateGrandSunreachData(data),false);
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY],[120,120,55,75]); assert.equal(map.landmarks[0].id,'admin_dock');
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[61,62]);
});

test('9.37A client and server implement the same explicit harbor-crescent plan',()=>{
  const server=fs.readFileSync(path.join(root,'server/engine/World.mjs'),'utf8');
  const client=fs.readFileSync(path.join(root,'src/game/maps.ts'),'utf8');
  for(const marker of ["harbor-crescent",'townCenter.y + 32','cx - 30','cx + 30','cy + 62',"type:'bridge'",'shoreY - 3']){
    assert.ok(server.includes(marker),`server missing ${marker}`); assert.ok(client.includes(marker),`client missing ${marker}`);
  }
  assert.match(server,/urbanPlan: config\.urbanPlan/); assert.match(client,/urbanPlanOf\(raw\.urbanPlan/);
});

test('9.37A global capital migration schema advances without changing base content schema',()=>{
  const source=fs.readFileSync(path.join(root,'server/engine/ContentDB.mjs'),'utf8');
  assert.match(source,/GRAND_CAPITAL_SCHEMA_VERSION/); assert.match(source,/migrateGrandEldoriaData\(this\.data\)/); assert.match(source,/migrateGrandSunreachData\(this\.data\)/);
  assert.match(source,/this\.data\.version = 3/); assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,3);
});
'''
Path('server/test/grand-sunreach-9-37.test.mjs').write_text(test,encoding='utf-8')

# ---- Documentation ----
doc = r'''# Mor'ia 9.37 — Grand Sunreach Coast

## Objetivo

A segunda capital gigante não reutiliza a malha real de Eldoria. Sunreach passa a ser uma capital marítima 160×160 governada por um plano urbano explícito `harbor-crescent`, sincronizado pelo servidor e reproduzido pelo cliente.

## Topologia autoritativa

- mapa 160×160; centro urbano em 80,70 e chegada em 80,78;
- 12 distritos, 20 marcos maiores e 18 volumes menores de moradia/armazéns, totalizando 38 footprints colidíveis;
- costa curva calculada a partir do centro, com mar não caminhável ao sul;
- quatro píeres `bridge` caminháveis, cais curvo e quebra-mar com canal central aberto;
- muralha apenas no lado terrestre, com estrada real ao norte e acesso de Ironwood a leste;
- mercado de sal, Liga Livre, capela marítima, estaleiro, alfândega, depósito da frota, guilda de pescadores, farol e bairros de armazéns;
- arquitetura menor usa `showOnMinimap:false` para preservar legibilidade.

## Migração

`GRAND_CAPITAL_SCHEMA_VERSION = 3`. Instalações na versão 2 reaplicam a migração idempotente de Eldoria e executam Sunreach. Somente o layout 80×80 com coordenadas legadas exatas é expandido. Dimensões, arquitetura, NPCs, monstros, nodes ou portais alterados pelo administrador não são sobrescritos.

O portal de Eldoria que chega a Sunreach é movido de 40,68 para 80,24 apenas quando ainda mantém o destino legado. Os três NPCs regionais, seis spawns do pack alpha e o node econômico também são movidos somente a partir de suas posições conhecidas.

## Paridade

O campo `urbanPlan` passa pelo ContentDB/World e chega ao cliente. `harborShoreY` e `harborCapitalTile` usam os mesmos marcadores e constantes nos dois lados. O gate 9.37A exige typecheck/build, auditoria, teste focado e suíte completa antes do commit automático.
'''
Path('docs/MORIA_9_37_GRAND_SUNREACH.md').write_text(doc,encoding='utf-8')

print("Mor'ia 9.37A Grand Sunreach Coast prepared")
