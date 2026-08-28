from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} anchor not found')
    return text.replace(old, new, 1)


# -----------------------------------------------------------------------------
# Shared authoritative Grand Eldoria contract and migration policy.
# -----------------------------------------------------------------------------
Path('server/engine/GrandEldoria.mjs').write_text(r'''// ===================================================================
// MOR'IA 9.36 — GRAND ELDORIA AUTHORITATIVE CONTENT CONTRACT
// The capital layout is data. Migration only moves exact known legacy defaults;
// administrator-authored coordinates and architecture always win.
// ===================================================================

export const GRAND_ELDORIA_VERSION = 1;

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
  residentialRingEnabled:true, residentialRingDensity:5,
  districts, landmarks, props:Object.freeze(buildProps()), access:'public',
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
''', encoding='utf-8')


# -----------------------------------------------------------------------------
# World: Grand Eldoria is the built-in fallback and capitals generate real city.
# -----------------------------------------------------------------------------
WORLD = Path('server/engine/World.mjs')
world = WORLD.read_text(encoding='utf-8')
world = replace_once(world, "// ===================================================================\n\nclass Monster", "// ===================================================================\n\nimport { GRAND_ELDORIA_BUILTIN_WORLD_CONFIG } from './GrandEldoria.mjs';\n\nclass Monster", 'World Grand Eldoria import')
old_eldoria = """  eldoria: {
    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains',
    spawnPoint: { x: 40, y: 40 }, townCenter: { x: 40, y: 40 }, townRange: 10, seed: 42,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' },
    ],
  },"""
world = replace_once(world, old_eldoria, "  eldoria: GRAND_ELDORIA_BUILTIN_WORLD_CONFIG,", 'World built-in Eldoria')
world = replace_once(world, "{ pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 }, label: '🌳 To Eldoria' }", "{ pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 30, y: 80 }, label: '🌳 To Eldoria' }", 'Frostpeak built-in Grand Eldoria arrival')
world = replace_once(world, "{ pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 }, label: '🌳 To Eldoria' }", "{ pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 130, y: 120 }, label: '🌳 To Eldoria' }", 'Shadowfen built-in Grand Eldoria arrival')
helper_anchor = "class WorldManager {"
urban_helper = r'''function capitalUrbanTile(config, x, y) {
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
if helper_anchor not in world:
    raise SystemExit('World class anchor missing')
world = world.replace(helper_anchor, urban_helper + helper_anchor, 1)
old_generation = """        } else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) {
          type = 'floor';
        } else {
          const r = rand();"""
new_generation = """        } else {
          const urban = capitalUrbanTile(config, x, y);
          if (urban) { type = urban.type; walkable = urban.walkable; blocksSight = urban.blocksSight; }
          else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) type = 'floor';
          else {
          const r = rand();"""
world = replace_once(world, old_generation, new_generation, 'World capital urban generation opening')
# Close the extra else before the existing generation branch closes.
old_tail = """          }
        }
        row.push({ walkable, type, blocksSight });"""
new_tail = """          }
          }
        }
        row.push({ walkable, type, blocksSight });"""
world = replace_once(world, old_tail, new_tail, 'World capital urban generation closing')
for required in ['GRAND_ELDORIA_BUILTIN_WORLD_CONFIG', 'function capitalUrbanTile', "settlementClass !== 'capital'", "type:(major || secondary || innerRing) ? 'path' : 'floor'"]:
    if required not in world:
        raise SystemExit(f'World Grand Eldoria marker missing: {required}')
WORLD.write_text(world, encoding='utf-8')


# -----------------------------------------------------------------------------
# Alpha map source: fresh content publishes the Grand Eldoria map record.
# -----------------------------------------------------------------------------
ALPHA = Path('server/engine/AlphaContent.mjs')
alpha = ALPHA.read_text(encoding='utf-8')
alpha = replace_once(alpha, "// ===================================================================\n\nconst clamp", "// ===================================================================\n\nimport { GRAND_ELDORIA_MAP } from './GrandEldoria.mjs';\n\nconst clamp", 'Alpha Grand Eldoria import')
alpha = replace_once(alpha, "const maps = REGIONS.map(region => {\n  const [townX,townY] = mapCenters[region.id];\n  return {", "const maps = REGIONS.map(region => {\n  if (region.id === 'eldoria') return { ...GRAND_ELDORIA_MAP, portals: GRAND_ELDORIA_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_ELDORIA_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_ELDORIA_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_ELDORIA_MAP.props.map(entry => ({ ...entry })) };\n  const [townX,townY] = mapCenters[region.id];\n  return {", 'Alpha Grand Eldoria map source')
ALPHA.write_text(alpha, encoding='utf-8')


# -----------------------------------------------------------------------------
# ContentDB: versioned, idempotent Grand Eldoria migration.
# -----------------------------------------------------------------------------
DB = Path('server/engine/ContentDB.mjs')
db = DB.read_text(encoding='utf-8')
db = replace_once(db, "import { ROAD_TO_TEN_CONTENT } from './RoadToTenContent.mjs';", "import { ROAD_TO_TEN_CONTENT } from './RoadToTenContent.mjs';\nimport { GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from './GrandEldoria.mjs';", 'ContentDB Grand Eldoria import')
db = replace_once(db, "    version: 1, livingRealmVersion: 0, roadToTenVersion: 0,", "    version: 1, livingRealmVersion: 0, roadToTenVersion: 0, grandCapitalVersion: 0,", 'ContentDB grand capital marker default')
db = replace_once(db, "  normalized.roadToTenVersion = Number.isInteger(Number(raw.roadToTenVersion)) && Number(raw.roadToTenVersion) > 0 ? Number(raw.roadToTenVersion) : 0;", "  normalized.roadToTenVersion = Number.isInteger(Number(raw.roadToTenVersion)) && Number(raw.roadToTenVersion) > 0 ? Number(raw.roadToTenVersion) : 0;\n  normalized.grandCapitalVersion = Number.isInteger(Number(raw.grandCapitalVersion)) && Number(raw.grandCapitalVersion) > 0 ? Number(raw.grandCapitalVersion) : 0;", 'ContentDB grand capital marker normalization')
db = replace_once(db, "    else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV1(); this.migrateRoadToTenV1(); }", "    else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV1(); this.migrateRoadToTenV1(); this.migrateGrandCapitalV1(); }", 'ContentDB Grand Eldoria migration chain')
method_anchor = "  save() {"
migration_method = r'''  migrateGrandCapitalV1() {
    if (Number(this.data.grandCapitalVersion) >= GRAND_ELDORIA_VERSION) return false;
    migrateGrandEldoriaData(this.data);
    this.data.grandCapitalVersion = GRAND_ELDORIA_VERSION;
    this.save();
    return true;
  }

'''
if method_anchor not in db:
    raise SystemExit('ContentDB save anchor missing')
db = db.replace(method_anchor, migration_method + method_anchor, 1)
seed_anchor = "    this.data.version = 3;\n    this.data.livingRealmVersion = 1;\n\n    this.save();"
seed_replacement = "    this.data.version = 3;\n    this.data.livingRealmVersion = 1;\n    migrateGrandEldoriaData(this.data);\n    this.data.grandCapitalVersion = GRAND_ELDORIA_VERSION;\n\n    this.save();"
db = replace_once(db, seed_anchor, seed_replacement, 'ContentDB fresh Grand Eldoria seed')
for required in ['grandCapitalVersion', 'migrateGrandCapitalV1()', 'migrateGrandEldoriaData(this.data)']:
    if required not in db:
        raise SystemExit(f'ContentDB Grand Eldoria marker missing: {required}')
DB.write_text(db, encoding='utf-8')


# -----------------------------------------------------------------------------
# Client prediction mirrors the authoritative capital urban geometry.
# -----------------------------------------------------------------------------
MAPS = Path('src/game/maps.ts')
maps = MAPS.read_text(encoding='utf-8')
client_anchor = "export function generateMap(mapId: string): Tile[][] {"
client_helper = r'''function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
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
if client_anchor not in maps:
    raise SystemExit('client generateMap anchor missing')
maps = maps.replace(client_anchor, client_helper + client_anchor, 1)
old_client_generation = """      } else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {
        type = 'floor';
      } else {
        const r = rand();"""
new_client_generation = """      } else {
        const urban = capitalUrbanTile(mapData, x, y);
        if (urban) { type = urban.type; walkable = urban.walkable; blocksSight = Boolean(urban.blocksSight); }
        else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) type = 'floor';
        else {
        const r = rand();"""
maps = replace_once(maps, old_client_generation, new_client_generation, 'client capital urban generation opening')
old_client_tail = """        }
      }
      row.push({ type, walkable, blocksSight });"""
new_client_tail = """        }
        }
      }
      row.push({ type, walkable, blocksSight });"""
maps = replace_once(maps, old_client_tail, new_client_tail, 'client capital urban generation closing')
MAPS.write_text(maps, encoding='utf-8')


# -----------------------------------------------------------------------------
# 9.36A tests: city geometry, migration, admin preservation, housing and parity.
# -----------------------------------------------------------------------------
Path('server/test/grand-eldoria-9-36.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WorldManager, WORLD } from '../engine/World.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { GRAND_ELDORIA_MAP, GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from '../engine/GrandEldoria.mjs';
import { ALPHA_SYSTEMS_CONTENT } from '../engine/AlphaSystemsContent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const clone = value => JSON.parse(JSON.stringify(value));

function legacyData() {
  return {
    maps:[
      { id:'eldoria', width:80, height:80, spawnX:40, spawnY:40, townX:40, townY:40, townRange:8, portals:[
        {x:10,y:40,targetMap:'frostpeak',targetX:70,targetY:40},{x:70,y:10,targetMap:'shadowfen',targetX:40,targetY:70},
        {x:40,y:10,targetMap:'sunreach_coast',targetX:40,targetY:68},{x:70,y:40,targetMap:'ironwood',targetX:10,targetY:40},{x:40,y:70,targetMap:'gm_sanctum',targetX:40,targetY:40},
      ] },
      { id:'frostpeak', portals:[{x:75,y:40,targetMap:'eldoria',targetX:12,targetY:40}] },
      { id:'shadowfen', portals:[{x:40,y:75,targetMap:'eldoria',targetX:68,targetY:12}] },
      { id:'sunreach_coast', portals:[{x:40,y:72,targetMap:'eldoria',targetX:40,targetY:12}] },
      { id:'ironwood', portals:[{x:8,y:40,targetMap:'eldoria',targetX:68,targetY:40}] },
      { id:'gm_sanctum', portals:[{x:40,y:72,targetMap:'eldoria',targetX:40,targetY:68}] },
    ],
    npcs:[{id:'banker',mapId:'eldoria',posX:34,posY:38},{id:'librarian',mapId:'eldoria',posX:40,posY:45}],
    monsters:[{id:'eldoria_field_rat',mapId:'eldoria',posX:18,posY:20},{id:'eldoria_old_grove_colossus',mapId:'eldoria',posX:58,posY:55}],
    houses:clone(ALPHA_SYSTEMS_CONTENT.houses.filter(h=>h.mapId==='eldoria')),
    nodes:[{id:'node_eldoria',mapId:'eldoria',x:40,y:40}],
  };
}

test('9.36A Grand Eldoria is a 160x160 authored capital while other built-ins remain legacy-sized', () => {
  const world = new WorldManager();
  const eldoria = world.getMap('eldoria');
  const frostpeak = world.getMap('frostpeak');
  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');
  assert.equal(frostpeak.width,80); assert.equal(frostpeak.height,80);
  assert.ok(eldoria.districts.length >= 10); assert.ok(eldoria.landmarks.length >= 16); assert.ok(eldoria.props.length >= 60);
});

test('9.36A capital generation creates a walled city, gate openings, avenues and urban floor', () => {
  const world = new WorldManager(); const map = world.getMap('eldoria');
  assert.equal(map.tiles[60][28].type,'wall'); assert.equal(map.tiles[60][28].walkable,false);
  assert.equal(map.tiles[80][28].type,'path'); assert.equal(map.tiles[80][28].walkable,true);
  assert.equal(map.tiles[60][80].type,'path');
  assert.equal(map.tiles[60][70].type,'floor'); assert.equal(map.tiles[60][70].walkable,true);
  assert.equal(map.tiles[88][80].type,'path'); assert.deepEqual(map.spawnPoint,{x:80,y:88});
});

test('9.36A legacy migration moves exact defaults across map, inbound travel, NPCs, monsters, houses and living Node', () => {
  const data=legacyData(); assert.equal(migrateGrandEldoriaData(data),true);
  const map=data.maps.find(m=>m.id==='eldoria'); assert.equal(map.width,160); assert.equal(map.height,160); assert.equal(map.settlementClass,'capital');
  assert.deepEqual([map.spawnX,map.spawnY,map.townX,map.townY],[80,88,80,80]);
  assert.deepEqual([map.portals.find(p=>p.targetMap==='frostpeak').x,map.portals.find(p=>p.targetMap==='frostpeak').y],[28,80]);
  assert.deepEqual([data.maps.find(m=>m.id==='frostpeak').portals[0].targetX,data.maps.find(m=>m.id==='frostpeak').portals[0].targetY],[30,80]);
  assert.deepEqual([data.maps.find(m=>m.id==='shadowfen').portals[0].targetX,data.maps.find(m=>m.id==='shadowfen').portals[0].targetY],[130,120]);
  assert.deepEqual([data.npcs.find(n=>n.id==='banker').posX,data.npcs.find(n=>n.id==='banker').posY],[68,84]);
  assert.deepEqual([data.monsters.find(m=>m.id==='eldoria_field_rat').posX,data.monsters.find(m=>m.id==='eldoria_field_rat').posY],[20,122]);
  assert.deepEqual([data.houses.find(h=>h.id==='house_oakhearth').x,data.houses.find(h=>h.id==='house_oakhearth').y],[36,120]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,80]);
  assert.equal(migrateGrandEldoriaData(data),false, 'migration must be idempotent after exact defaults moved');
});

test('9.36A migration preserves administrator-authored dimensions, architecture and coordinates', () => {
  const data=legacyData(); const map=data.maps[0];
  map.width=120; map.height=120; map.spawnX=55; map.spawnY=56; map.landmarks=[{id:'admin_keep',name:'Admin Keep',kind:'keep',x:20,y:20,w:4,h:4}];
  data.npcs[0].posX=61; data.npcs[0].posY=62;
  assert.equal(migrateGrandEldoriaData(data),false);
  assert.equal(map.width,120); assert.equal(map.height,120); assert.deepEqual([map.spawnX,map.spawnY],[55,56]);
  assert.equal(map.landmarks[0].id,'admin_keep'); assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[61,62]);
});

test('9.36A Grand Eldoria housing footprints remain valid against authoritative architecture', () => {
  const data=legacyData(); migrateGrandEldoriaData(data);
  WORLD.syncContentMaps(data.maps);
  const fakeDb={ get(type){ if(type==='houses')return data.houses; return []; } };
  const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'moria-eldoria-housing-')),'housing.json');
  const housing=new HousingSystem(fakeDb,temp);
  for(const house of data.houses) assert.equal(housing.validateDefinition(house,fakeDb),null,house.id);
});

test('9.36A client and server keep the same capital road algorithm', () => {
  const server=fs.readFileSync(path.join(root,'server/engine/World.mjs'),'utf8');
  const client=fs.readFileSync(path.join(root,'src/game/maps.ts'),'utf8');
  for(const marker of ['cx - 28','cx + 28','minX + 14','maxX - 14',"? 'path' : 'floor'"]) {
    assert.ok(server.includes(marker),`server missing ${marker}`); assert.ok(client.includes(marker),`client missing ${marker}`);
  }
  assert.match(client,/capitalUrbanTile\(mapData, x, y\)/);
});

test('9.36A ContentDB exposes a separate Grand Capital migration marker without changing legacy schema version', () => {
  const source=fs.readFileSync(path.join(root,'server/engine/ContentDB.mjs'),'utf8');
  assert.match(source,/grandCapitalVersion/); assert.match(source,/migrateGrandCapitalV1/); assert.match(source,/GRAND_ELDORIA_VERSION/);
  assert.match(source,/this\.data\.version = 3/);
  assert.equal(GRAND_ELDORIA_VERSION,1);
});
''', encoding='utf-8')


Path('docs/MORIA_9_36_GRAND_ELDORIA.md').write_text(r'''# Mor'ia 9.36 — Grand Eldoria

## 9.36A — autoridade, migração e geometria urbana

Eldoria deixa de ser uma praça de 80×80 e passa a ser a primeira capital real do alpha: **160×160**, `settlementClass=capital`, centro em 80,80 e área urbana muralhada declarada por `urbanBounds`.

A expansão não é um scale automático. O layout possui mais de dez distritos, dezesseis landmarks autoritativos, dezenas de props, cinco portões e uma malha de avenidas principais, secundárias e anel interno. Dentro da área urbana, o gerador produz `floor/path`; a borda produz muralha sólida, mas portais e chegadas autoritativas continuam abrindo passagens caminháveis. Fora da muralha permanece o bioma de planícies.

### Migração segura

`grandCapitalVersion` é um marcador separado das versões legadas de ContentDB. A migração só transforma Eldoria quando suas dimensões ainda são as históricas 80×80 (ou quando já está explicitamente 160×160). Coordenadas de NPCs, monstros, houses, Node e portais só são movidas quando coincidem **exatamente** com os defaults antigos conhecidos. Qualquer coordenada, arquitetura ou dimensão editada pelo administrador é preservada.

As chegadas de Frostpeak, Sunreach, Ironwood, Shadowfen e Astra Sanctum também são reposicionadas para os novos portões, evitando teleporte para o antigo quadrante central.

### Housing e serviços

Os três lotes residenciais iniciais de Eldoria são redistribuídos por bairros sem sobreposição com landmarks. O gate 9.36A valida seus footprints e entradas contra o `HousingSystem` real. Serviços deixam de ficar concentrados no quadrante 40×40 e passam a ocupar mercado, biblioteca, guilda, estábulos, alfaiataria e magistratura.

### Paridade cliente/servidor

A regra de cidade muralhada é implementada com os mesmos eixos (±28) e anel interno (14 tiles) no gerador autoritativo e na predição do cliente. O 9.36A inclui teste explícito contra divergência dessa fórmula.

## Próximo passe — 9.36B

A prova visual usará a Eldoria real, não a capital sintética: minimapa, City Designer e uma visão panorâmica gerada com `generateMap`, `drawTile` e `drawBuilding` de produção. O passe só será encerrado após screenshots e revisão humana.
''', encoding='utf-8')

print("Mor'ia 9.36A Grand Eldoria authoritative pass prepared")
