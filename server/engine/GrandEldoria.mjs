// ===================================================================
// MOR'IA 9.36 — GRAND ELDORIA AUTHORITATIVE CONTENT CONTRACT
// The capital layout is data. Migration only moves exact known legacy defaults;
// administrator-authored coordinates and architecture always win.
// ===================================================================

export const GRAND_ELDORIA_VERSION = 2;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function samePoint(record, x, y, xKey = 'posX', yKey = 'posY') { return Number(record?.[xKey]) === x && Number(record?.[yKey]) === y; }

const districts = Object.freeze([
  { id:'eldoria_crown_ward', name:'Bairro da Coroa', icon:'♜', x:80, y:48, radius:15, color:'#d8b45a' },
  { id:'eldoria_westwatch', name:'Vigília Oeste', icon:'🛡', x:44, y:54, radius:12, color:'#c49a54' },
  { id:'eldoria_scholars', name:'Distrito dos Sábios', icon:'📚', x:108, y:48, radius:12, color:'#b7a0dd' },
  { id:'eldoria_market_ward', name:'Bairro do Grande Mercado', icon:'⚖', x:58, y:82, radius:12, color:'#e1b85d' },
  { id:'eldoria_civic_ward', name:'Centro Cívico', icon:'◆', x:80, y:84, radius:11, color:'#f0d88e' },
  { id:'eldoria_dawn_ward', name:'Bairro da Aurora', icon:'✦', x:104, y:76, radius:11, color:'#f0cf78' },
  { id:'eldoria_noble_heights', name:'Alturas Nobres', icon:'♛', x:112, y:96, radius:11, color:'#d7b9e7' },
  { id:'eldoria_artisan_ward', name:'Bairro dos Artesãos', icon:'⚒', x:54, y:110, radius:12, color:'#c98752' },
  { id:'eldoria_commons', name:'Jardins Comuns', icon:'❧', x:80, y:116, radius:12, color:'#7eaa62' },
  { id:'eldoria_eastgate', name:'Portão Leste', icon:'◇', x:122, y:82, radius:8, color:'#d8b45a' },
  { id:'eldoria_riverside', name:'Residencial Ribeirinho', icon:'⌂', x:112, y:122, radius:10, color:'#8bb8a3' },
]);

const landmarks = Object.freeze([
  { id:'eldoria_sunspire_keep', name:'Fortaleza Pináculo Solar', kind:'keep', icon:'♜', x:72, y:34, w:16, h:14 },
  { id:'eldoria_royal_library', name:'Biblioteca Real', kind:'library', icon:'📚', x:100, y:38, w:14, h:10 },
  { id:'eldoria_westwatch_barracks', name:'Quartel da Vigília Oeste', kind:'tower', icon:'🛡', x:38, y:42, w:14, h:10 },
  { id:'eldoria_grand_market', name:'Grande Mercado de Eldoria', kind:'market', icon:'⚖', x:48, y:72, w:14, h:10 },
  { id:'eldoria_royal_bank', name:'Banco Real', kind:'house', icon:'¤', x:66, y:72, w:10, h:8 },
  { id:'eldoria_dawn_temple', name:'Templo da Aurora', kind:'temple', icon:'✦', x:98, y:64, w:12, h:12 },
  { id:'eldoria_magistracy', name:'Magistratura Real', kind:'house', icon:'§', x:112, y:72, w:10, h:8 },
  { id:'eldoria_adventurers_guild', name:'Guilda dos Aventureiros', kind:'lodge', icon:'⚔', x:40, y:84, w:12, h:10 },
  { id:'eldoria_post_office', name:'Correio da Coroa', kind:'house', icon:'✉', x:66, y:88, w:8, h:8 },
  { id:'eldoria_royal_inn', name:'Estalagem Coroa Dourada', kind:'lodge', icon:'⌂', x:86, y:88, w:10, h:8 },
  { id:'eldoria_tailors_hall', name:'Salão dos Alfaiates', kind:'house', icon:'✂', x:112, y:88, w:10, h:8 },
  { id:'eldoria_grand_arena', name:'Grande Arena', kind:'arena', icon:'⚔', x:34, y:98, w:16, h:14 },
  { id:'eldoria_great_forge', name:'Grande Forja', kind:'forge', icon:'⚒', x:54, y:106, w:12, h:10 },
  { id:'eldoria_royal_depot', name:'Depósito Real', kind:'depot', icon:'▣', x:78, y:98, w:10, h:8 },
  { id:'eldoria_greenhouse', name:'Conservatório Real', kind:'house', icon:'❧', x:76, y:110, w:12, h:10 },
  { id:'eldoria_royal_stables', name:'Estábulos Reais', kind:'lodge', icon:'♞', x:98, y:108, w:14, h:10 },
]);

export const GRAND_ELDORIA_RESIDENTIAL = Object.freeze([
  { id:'eldoria_residence_01', name:'Residência da Coroa I', kind:'house', icon:'⌂', x:54, y:42, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_02', name:'Residência da Coroa II', kind:'house', icon:'⌂', x:62, y:42, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_03', name:'Vila dos Escribas I', kind:'house', icon:'⌂', x:54, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_04', name:'Vila dos Escribas II', kind:'house', icon:'⌂', x:62, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_05', name:'Vila dos Escribas III', kind:'house', icon:'⌂', x:70, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_06', name:'Casario da Vigília', kind:'house', icon:'⌂', x:44, y:58, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_07', name:'Solar dos Sábios I', kind:'house', icon:'⌂', x:84, y:54, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_08', name:'Solar dos Sábios II', kind:'house', icon:'⌂', x:92, y:54, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_09', name:'Casario da Aurora I', kind:'house', icon:'⌂', x:110, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_10', name:'Casario da Aurora II', kind:'house', icon:'⌂', x:86, y:66, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_11', name:'Casario da Aurora III', kind:'house', icon:'⌂', x:88, y:72, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_12', name:'Vila Mercantil I', kind:'house', icon:'⌂', x:54, y:88, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_13', name:'Vila Mercantil II', kind:'house', icon:'⌂', x:54, y:96, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_14', name:'Vila Mercantil III', kind:'house', icon:'⌂', x:62, y:96, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_15', name:'Casario dos Artesãos I', kind:'house', icon:'⌂', x:44, y:114, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_16', name:'Casario dos Artesãos II', kind:'house', icon:'⌂', x:52, y:116, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_17', name:'Casario dos Artesãos III', kind:'house', icon:'⌂', x:62, y:118, w:6, h:3, showOnMinimap:false },
  { id:'eldoria_residence_18', name:'Residência Nobre I', kind:'house', icon:'⌂', x:90, y:100, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_19', name:'Residência Nobre II', kind:'house', icon:'⌂', x:110, y:100, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_20', name:'Residência dos Jardins', kind:'house', icon:'⌂', x:90, y:116, w:6, h:5, showOnMinimap:false },
]);

function buildProps() {
  const props = [];
  let serial = 1;
  const add = (kind, x, y, color = '#d8b45a', label) => props.push({ id:`eldoria_prop_${serial++}`, kind, x, y, color, ...(label ? { label } : {}) });
  for (let x = 34; x <= 126; x += 8) { add('lamp', x, 78, '#e8c86a'); add('lamp', x, 82, '#e8c86a'); }
  for (let y = 30; y <= 130; y += 8) { add('lamp', 78, y, '#e8c86a'); add('lamp', 82, y, '#e8c86a'); }
  for (const [x,y] of [[44,58],[108,54],[58,88],[104,82],[112,100],[54,118],[80,124],[122,88]]) add('banner',x,y,'#b98a3f');
  for (const [x,y,label] of [[80,54,'Heróis da Coroa'],[80,86,'Fundadores de Eldoria'],[58,68,'Mercadores do Reino'],[104,60,'Aurora Eterna']]) add('statue',x,y,'#c9b68d',label);
  for (const [x,y] of [[44,116],[48,116],[68,108],[70,108],[116,104],[120,104]]) add('cart',x,y,'#8f704d');
  for (const [x,y] of [[52,84],[56,84],[60,84],[54,102],[58,102],[104,120],[108,120]]) add('barrel',x,y,'#8a6546');
  for (const [x,y] of [[70,122],[74,124],[88,124],[92,122],[90,116],[70,116]]) add('pine',x,y,'#6e9b5a');
  return props.slice(0, 96);
}

export const GRAND_ELDORIA_MAP = Object.freeze({
  id:'eldoria', name:'Eldoria', biome:'plains',
  description:'Capital da Coroa de Mor\'ia: uma cidade muralhada de grandes distritos, serviços, comércio, templos, moradias e vias reais.',
  width:160, height:160, settlementClass:'capital', urbanBounds:{ x:28, y:24, width:105, height:113 },
  levelRequired:1, seed:42, spawnX:80, spawnY:88, townX:80, townY:80, townRange:18,
  cityStyle:'royal', cityAccent:'#d8b45a', roofColor:'#7e2f34', wallColor:'#c9b68d', roadColor:'#9b8764',
  residentialRingEnabled:false, residentialRingDensity:0,
  districts, landmarks:Object.freeze([...landmarks, ...GRAND_ELDORIA_RESIDENTIAL]), props:Object.freeze(buildProps()), access:'public',
  portals:Object.freeze([
    { x:28, y:80, targetMap:'frostpeak', targetX:70, targetY:40, label:'❄ Passagem de Frostpeak' },
    { x:80, y:24, targetMap:'sunreach_coast', targetX:40, targetY:68, label:'🌊 Portão de Sunreach' },
    { x:132, y:80, targetMap:'ironwood', targetX:10, targetY:40, label:'🌲 Portão de Ironwood' },
    { x:132, y:120, targetMap:'shadowfen', targetX:40, targetY:70, label:'🍄 Estrada de Shadowfen' },
    { x:80, y:136, targetMap:'gm_sanctum', targetX:40, targetY:40, label:'🔒 Portão Astral' },
  ]),
});

export const GRAND_ELDORIA_BUILTIN_WORLD_CONFIG = Object.freeze({
  ...GRAND_ELDORIA_MAP,
  spawnPoint:{ x:GRAND_ELDORIA_MAP.spawnX, y:GRAND_ELDORIA_MAP.spawnY },
  townCenter:{ x:GRAND_ELDORIA_MAP.townX, y:GRAND_ELDORIA_MAP.townY },
  portals:GRAND_ELDORIA_MAP.portals
    .filter(portal => portal.targetMap === 'frostpeak' || portal.targetMap === 'shadowfen')
    .map(portal => ({ pos:{x:portal.x,y:portal.y}, targetMap:portal.targetMap, targetSpawn:{x:portal.targetX,y:portal.targetY}, label:portal.label })),
});

export const GRAND_ELDORIA_NPC_MOVES = Object.freeze({
  merchant_gorn:{ from:[38,38], to:[58,84] }, banker:{ from:[34,38], to:[68,84] }, innkeeper:{ from:[49,38], to:[92,98] },
  trainer:{ from:[43,40], to:[46,96] }, postmaster:{ from:[31,37], to:[70,98] }, librarian:{ from:[40,45], to:[106,50] },
  quest_eldoria:{ from:[38,40], to:[78,92] }, merchant_eldoria:{ from:[42,40], to:[58,86] }, warden_eldoria:{ from:[40,42], to:[80,100] },
  task_master_eldoria:{ from:[42,43], to:[46,116] }, stablemaster_eldoria:{ from:[44,38], to:[104,120] },
  outfitter_eldoria:{ from:[46,38], to:[116,98] }, realtor_eldoria:{ from:[48,38], to:[116,84] },
});

export const GRAND_ELDORIA_HOUSE_MOVES = Object.freeze({
  house_oakhearth:{ from:[27,31,29,35], to:[36,120,38,119] },
  house_goldleaf:{ from:[52,31,54,35], to:[116,54,118,53] },
  house_riverside:{ from:[27,45,29,44], to:[108,124,110,123] },
});

export const GRAND_ELDORIA_MONSTER_MOVES = Object.freeze({
  eldoria_field_rat:{ from:[18,20], to:[20,122] }, eldoria_briar_wolf:{ from:[26,27], to:[18,54] },
  eldoria_mossback_boar:{ from:[34,34], to:[140,116] }, eldoria_bandit_scout:{ from:[42,41], to:[140,42] },
  eldoria_verdant_marauder:{ from:[50,48], to:[42,144] }, eldoria_old_grove_colossus:{ from:[58,55], to:[20,24] },
});

const SOURCE_PORTAL_MOVES = Object.freeze({
  frostpeak:{ from:[10,40], to:[28,80] }, sunreach_coast:{ from:[40,10], to:[80,24] }, ironwood:{ from:[70,40], to:[132,80] },
  shadowfen:{ from:[70,10], to:[132,120] }, gm_sanctum:{ from:[40,70], to:[80,136] },
});
const INBOUND_PORTAL_MOVES = Object.freeze({
  frostpeak:{ from:[12,40], to:[30,80] }, sunreach_coast:{ from:[40,12], to:[80,26] }, ironwood:{ from:[68,40], to:[130,80] },
  shadowfen:{ from:[68,12], to:[130,120] }, gm_sanctum:{ from:[40,68], to:[80,134] },
});

function patchExactPosition(record, move, xKey = 'posX', yKey = 'posY') {
  if (!move || !samePoint(record, move.from[0], move.from[1], xKey, yKey)) return false;
  record[xKey] = move.to[0]; record[yKey] = move.to[1]; return true;
}

function patchMap(map) {
  const width = map.width === undefined ? 80 : Number(map.width);
  const height = map.height === undefined ? 80 : Number(map.height);
  const legacyDimensions = width === 80 && height === 80;
  const alreadyGrand = width === 160 && height === 160;
  if (!legacyDimensions && !alreadyGrand) return false;
  let changed = false;
  const set = (key, value) => { if (JSON.stringify(map[key]) !== JSON.stringify(value)) { map[key] = clone(value); changed = true; } };
  if (legacyDimensions) { set('width',160); set('height',160); }
  if (!map.settlementClass || map.settlementClass === 'city') set('settlementClass','capital');
  if (!map.urbanBounds) set('urbanBounds',GRAND_ELDORIA_MAP.urbanBounds);
  if (samePoint(map,40,40,'spawnX','spawnY')) { map.spawnX=80; map.spawnY=88; changed=true; }
  if (samePoint(map,40,40,'townX','townY')) { map.townX=80; map.townY=80; changed=true; }
  if (map.townRange === undefined || Number(map.townRange) === 8 || Number(map.townRange) === 10) set('townRange',18);
  for (const key of ['cityStyle','cityAccent','roofColor','wallColor','roadColor','residentialRingEnabled','residentialRingDensity']) if (map[key] === undefined) set(key, GRAND_ELDORIA_MAP[key]);
  for (const key of ['districts','landmarks','props']) if (!Array.isArray(map[key]) || map[key].length === 0) set(key, GRAND_ELDORIA_MAP[key]);
  if (Array.isArray(map.portals)) {
    for (const portal of map.portals) {
      const move = SOURCE_PORTAL_MOVES[String(portal?.targetMap || '')];
      const x = Number(portal?.x ?? portal?.pos?.x), y = Number(portal?.y ?? portal?.pos?.y);
      if (!move || x !== move.from[0] || y !== move.from[1]) continue;
      if ('x' in portal || !portal.pos) { portal.x=move.to[0]; portal.y=move.to[1]; } else { portal.pos={...portal.pos,x:move.to[0],y:move.to[1]}; }
      changed=true;
    }
  } else set('portals', GRAND_ELDORIA_MAP.portals);
  return changed;
}

export function migrateGrandEldoriaData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const maps = Array.isArray(data.maps) ? data.maps : [];
  const eldoria = maps.find(map => map?.id === 'eldoria');
  if (!eldoria) return false;
  const width = eldoria.width === undefined ? 80 : Number(eldoria.width);
  const height = eldoria.height === undefined ? 80 : Number(eldoria.height);
  const eligible = (width === 80 && height === 80) || (width === 160 && height === 160);
  if (!eligible) return false;
  let changed = patchMap(eldoria);

  // 9.36C density upgrade. Only the untouched 9.36A/B landmark set is
  // expanded; administrator-authored architecture is never auto-filled.
  const currentLandmarks = Array.isArray(eldoria.landmarks) ? eldoria.landmarks : [];
  const untouchedV1Architecture = currentLandmarks.length === landmarks.length
    && currentLandmarks.every((entry, index) => JSON.stringify(entry) === JSON.stringify(landmarks[index]));
  if (untouchedV1Architecture) {
    eldoria.landmarks = [...currentLandmarks, ...clone(GRAND_ELDORIA_RESIDENTIAL)];
    if (eldoria.residentialRingEnabled === true && Number(eldoria.residentialRingDensity) === 5) {
      eldoria.residentialRingEnabled = false;
      eldoria.residentialRingDensity = 0;
    }
    changed = true;
  }

  for (const map of maps) {
    if (!map || map.id === 'eldoria' || !Array.isArray(map.portals)) continue;
    const move = INBOUND_PORTAL_MOVES[map.id];
    if (!move) continue;
    for (const portal of map.portals) {
      if (portal?.targetMap !== 'eldoria') continue;
      const tx = Number(portal.targetX ?? portal.targetSpawn?.x), ty = Number(portal.targetY ?? portal.targetSpawn?.y);
      if (tx !== move.from[0] || ty !== move.from[1]) continue;
      if ('targetX' in portal || !portal.targetSpawn) { portal.targetX=move.to[0]; portal.targetY=move.to[1]; }
      else portal.targetSpawn={...portal.targetSpawn,x:move.to[0],y:move.to[1]};
      changed=true;
    }
  }
  for (const npc of Array.isArray(data.npcs) ? data.npcs : []) if (npc?.mapId === 'eldoria') changed = patchExactPosition(npc, GRAND_ELDORIA_NPC_MOVES[npc.id]) || changed;
  for (const monster of Array.isArray(data.monsters) ? data.monsters : []) if (monster?.mapId === 'eldoria') changed = patchExactPosition(monster, GRAND_ELDORIA_MONSTER_MOVES[monster.id]) || changed;
  for (const house of Array.isArray(data.houses) ? data.houses : []) {
    if (house?.mapId !== 'eldoria') continue;
    const move = GRAND_ELDORIA_HOUSE_MOVES[house.id];
    if (!move) continue;
    if (Number(house.x) === move.from[0] && Number(house.y) === move.from[1] && Number(house.entranceX) === move.from[2] && Number(house.entranceY) === move.from[3]) {
      [house.x,house.y,house.entranceX,house.entranceY] = move.to; changed=true;
    }
  }
  for (const node of Array.isArray(data.nodes) ? data.nodes : []) if (node?.id === 'node_eldoria' && Number(node.x) === 40 && Number(node.y) === 40) { node.x=80; node.y=80; changed=true; }
  return changed;
}
