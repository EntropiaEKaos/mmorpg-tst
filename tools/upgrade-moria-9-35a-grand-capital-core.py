from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str):
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'{label} anchor not found in {path}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')

# -----------------------------------------------------------------------------
# Authoritative World: per-map dimensions, settlement class and urban bounds.
# -----------------------------------------------------------------------------
WORLD = Path('server/engine/World.mjs')
world = WORLD.read_text(encoding='utf-8')
world = world.replace(
    "const MAP_WIDTH = 80;\nconst MAP_HEIGHT = 80;",
    "const MAP_WIDTH = 80;\nconst MAP_HEIGHT = 80;\nconst MIN_MAP_DIMENSION = 40;\nconst MAX_MAP_DIMENSION = 192;\nconst SETTLEMENT_CLASSES = Object.freeze(['wilderness','town','city','capital']);\nconst SETTLEMENT_CLASS_SET = new Set(SETTLEMENT_CLASSES);",
    1,
)
old_portal = """function normalizePortal(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = integer(raw.x ?? raw.pos?.x, 1, MAP_WIDTH - 2, -1);
  const y = integer(raw.y ?? raw.pos?.y, 1, MAP_HEIGHT - 2, -1);
  const targetX = integer(raw.targetX ?? raw.targetSpawn?.x, 1, MAP_WIDTH - 2, -1);
  const targetY = integer(raw.targetY ?? raw.targetSpawn?.y, 1, MAP_HEIGHT - 2, -1);
  const targetMap = typeof raw.targetMap === 'string' ? raw.targetMap.trim().slice(0, 50) : '';
  if (x < 0 || y < 0 || targetX < 0 || targetY < 0 || !targetMap) return null;
  return {
    pos: { x, y }, targetMap, targetSpawn: { x: targetX, y: targetY },
    label: typeof raw.label === 'string' ? raw.label.trim().slice(0, 80) : '',
  };
}
"""
new_portal = """function normalizePortal(raw, width = MAP_WIDTH, height = MAP_HEIGHT) {
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
"""
if old_portal not in world:
    raise SystemExit('World portal anchor not found')
world = world.replace(old_portal, new_portal, 1)
world = world.replace(
    "function cityCoord(value, fallback) { return integer(value, 1, MAP_WIDTH - 2, fallback); }\nfunction defaultCityIdentity(id, biome, townCenter, record = {}, base = null) {",
    "function cityCoord(value, fallback, dimension = MAP_WIDTH) { return integer(value, 1, dimension - 2, fallback); }\nfunction defaultCityIdentity(id, biome, townCenter, record = {}, base = null, width = MAP_WIDTH, height = MAP_HEIGHT, settlementClass = 'city') {\n  const isCapital = settlementClass === 'capital';\n  const districtLimit = isCapital ? 24 : 8;\n  const landmarkLimit = isCapital ? 64 : 12;\n  const propLimit = isCapital ? 320 : 80;\n  const districtRadiusLimit = isCapital ? 24 : 12;\n  const landmarkSizeLimit = isCapital ? 20 : 10;",
    1,
)
world = world.replace("slice(0,12).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),w:integer(x.w,1,10,4),h:integer(x.h,1,10,4)}))", "slice(0,landmarkLimit).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),w:integer(x.w,1,landmarkSizeLimit,4),h:integer(x.h,1,landmarkSizeLimit,4)}))", 1)
world = world.replace("slice(0,8).map((x,index)=>({id:String(x.id||`${id}_district_${index+1}`).slice(0,60),name:String(x.name||`District ${index+1}`).slice(0,60),icon:String(x.icon||'◇').slice(0,8),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),radius:integer(x.radius,1,12,4),color:cityColor(x.color,accent)}))", "slice(0,districtLimit).map((x,index)=>({id:String(x.id||`${id}_district_${index+1}`).slice(0,60),name:String(x.name||`District ${index+1}`).slice(0,60),icon:String(x.icon||'◇').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),radius:integer(x.radius,1,districtRadiusLimit,4),color:cityColor(x.color,accent)}))", 1)
world = world.replace("slice(0,80).map((x,index)=>({id:String(x.id||`${id}_prop_${index+1}`).slice(0,60),kind:String(x.kind||'banner').slice(0,20),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),color:cityColor(x.color,accent),label:typeof x.label==='string'?x.label.slice(0,60):undefined}))", "slice(0,propLimit).map((x,index)=>({id:String(x.id||`${id}_prop_${index+1}`).slice(0,60),kind:String(x.kind||'banner').slice(0,20),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),color:cityColor(x.color,accent),label:typeof x.label==='string'?x.label.slice(0,60):undefined}))", 1)
old_norm = """  const requestedBiome = typeof record?.biome === 'string' ? record.biome.trim().toLowerCase() : '';
  const biome = BIOMES.has(requestedBiome) ? requestedBiome : (base?.biome || 'plains');
  const baseSpawn = base?.spawnPoint || { x: 40, y: 40 };
  const baseTown = base?.townCenter || { x: 40, y: 40 };
  const rawPortals = Array.isArray(record?.portals) ? record.portals : (base?.portals || []);
  const portals = rawPortals.map(normalizePortal).filter(Boolean).slice(0, 20);
  const townCenter = {
    x: integer(record?.townX ?? record?.townCenter?.x, 1, MAP_WIDTH - 2, baseTown.x),
    y: integer(record?.townY ?? record?.townCenter?.y, 1, MAP_HEIGHT - 2, baseTown.y),
  };
  const cityIdentity = defaultCityIdentity(id, biome, townCenter, record || {}, base);
"""
new_norm = """  const requestedBiome = typeof record?.biome === 'string' ? record.biome.trim().toLowerCase() : '';
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
"""
if old_norm not in world:
    raise SystemExit('World normalizeConfig anchor not found')
world = world.replace(old_norm, new_norm, 1)
world = world.replace("    id,\n    name:", "    id, width, height, settlementClass, urbanBounds,\n    name:", 1)
world = world.replace("x: integer(record?.spawnX ?? record?.spawnPoint?.x, 1, MAP_WIDTH - 2, baseSpawn.x),\n      y: integer(record?.spawnY ?? record?.spawnPoint?.y, 1, MAP_HEIGHT - 2, baseSpawn.y)", "x: integer(record?.spawnX ?? record?.spawnPoint?.x, 1, width - 2, baseSpawn.x),\n      y: integer(record?.spawnY ?? record?.spawnPoint?.y, 1, height - 2, baseSpawn.y)", 1)
old_known = """    const known = new Set(next.keys());
    for (const config of next.values()) config.portals = config.portals.filter(portal => known.has(portal.targetMap));
"""
new_known = """    const known = new Set(next.keys());
    for (const config of next.values()) {
      config.portals = config.portals.filter(portal => {
        if (!known.has(portal.targetMap)) return false;
        const target = next.get(portal.targetMap);
        return Boolean(target)
          && portal.targetSpawn.x >= 1 && portal.targetSpawn.x <= target.width - 2
          && portal.targetSpawn.y >= 1 && portal.targetSpawn.y <= target.height - 2;
      });
    }
"""
if old_known not in world:
    raise SystemExit('World portal graph anchor not found')
world = world.replace(old_known, new_known, 1)
world = world.replace("id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',", "id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',\n      width: config.width, height: config.height, settlementClass: config.settlementClass, urbanBounds: { ...config.urbanBounds },", 1)
world = world.replace("for (let y = 0; y < MAP_HEIGHT; y++)", "for (let y = 0; y < config.height; y++)", 1)
world = world.replace("for (let x = 0; x < MAP_WIDTH; x++)", "for (let x = 0; x < config.width; x++)", 1)
world = world.replace("x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1", "x === config.width - 1 || y === config.height - 1", 1)
world = world.replace("...config, width: MAP_WIDTH, height: MAP_HEIGHT, tiles,", "...config, width: config.width, height: config.height, tiles,", 1)
world = world.replace("const x = 5 + Math.floor(Math.random() * 70);\n      const y = 5 + Math.floor(Math.random() * 70);", "const x = 1 + Math.floor(Math.random() * Math.max(1, (map?.width || MAP_WIDTH) - 2));\n      const y = 1 + Math.floor(Math.random() * Math.max(1, (map?.height || MAP_HEIGHT) - 2));", 1)
world = world.replace("export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, BIOMES };", "export { Monster, WorldManager, MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, BIOMES };", 1)
for required in ['MIN_MAP_DIMENSION', 'MAX_MAP_DIMENSION', 'settlementClass', 'urbanBounds', 'config.width', 'config.height']:
    if required not in world:
        raise SystemExit(f'World 9.35A marker missing: {required}')
WORLD.write_text(world, encoding='utf-8')

# -----------------------------------------------------------------------------
# Content integrity: map/source/target coordinates use each map's dimensions.
# -----------------------------------------------------------------------------
INTEGRITY = Path('server/engine/ContentIntegrity.mjs')
integrity = INTEGRITY.read_text(encoding='utf-8')
integrity = integrity.replace(
    "import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, BIOMES } from './World.mjs';",
    "import { MAP_CONFIG, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, BIOMES } from './World.mjs';",
    1,
)
old_valid = """function validCoordinate(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAP_WIDTH - 2;
}
"""
new_valid = """function mapRecord(contentDB, mapId, extraRecord = null) {
  if (extraRecord?.id === mapId) return extraRecord;
  const custom = contentDB.get('maps').find(map => map?.id === mapId);
  return custom || MAP_CONFIG[mapId] || null;
}

function mapDimensions(contentDB, mapId, extraRecord = null) {
  const map = mapRecord(contentDB, mapId, extraRecord);
  const width = Number(map?.width ?? MAP_WIDTH);
  const height = Number(map?.height ?? MAP_HEIGHT);
  return {
    width: Number.isInteger(width) && width >= MIN_MAP_DIMENSION && width <= MAX_MAP_DIMENSION ? width : MAP_WIDTH,
    height: Number.isInteger(height) && height >= MIN_MAP_DIMENSION && height <= MAX_MAP_DIMENSION ? height : MAP_HEIGHT,
  };
}

function validCoordinate(value, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max - 2;
}
"""
if old_valid not in integrity:
    raise SystemExit('ContentIntegrity coordinate anchor not found')
integrity = integrity.replace(old_valid, new_valid, 1)
old_map_block = """    for (const field of ['spawnX', 'spawnY', 'townX', 'townY']) {
      if (record[field] !== undefined && record[field] !== '' && !validCoordinate(Number(record[field]))) return `Map ${field} must be an integer from 1 to ${MAP_WIDTH - 2}`;
    }
"""
new_map_block = """    const width = Number(record.width ?? MAP_WIDTH);
    const height = Number(record.height ?? MAP_HEIGHT);
    if (!Number.isInteger(width) || width < MIN_MAP_DIMENSION || width > MAX_MAP_DIMENSION) return `Map width must be an integer from ${MIN_MAP_DIMENSION} to ${MAX_MAP_DIMENSION}`;
    if (!Number.isInteger(height) || height < MIN_MAP_DIMENSION || height > MAX_MAP_DIMENSION) return `Map height must be an integer from ${MIN_MAP_DIMENSION} to ${MAX_MAP_DIMENSION}`;
    const settlementClass = String(record.settlementClass || (id === 'eldoria' ? 'capital' : 'city'));
    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return `Map settlementClass is not supported: ${settlementClass}`;
    for (const [field, dimension] of [['spawnX', width], ['spawnY', height], ['townX', width], ['townY', height]]) {
      if (record[field] !== undefined && record[field] !== '' && !validCoordinate(Number(record[field]), dimension)) return `Map ${field} must be an integer from 1 to ${dimension - 2}`;
    }
    if (record.urbanBounds !== undefined) {
      const box = record.urbanBounds;
      if (!box || typeof box !== 'object' || Array.isArray(box)) return 'Map urbanBounds must be an object';
      for (const key of ['x','y','width','height']) if (!Number.isInteger(Number(box[key]))) return `Map urbanBounds.${key} must be an integer`;
      if (Number(box.x) < 1 || Number(box.y) < 1 || Number(box.width) < 2 || Number(box.height) < 2 || Number(box.x) + Number(box.width) > width - 1 || Number(box.y) + Number(box.height) > height - 1) return 'Map urbanBounds must stay inside the playable area';
    }
"""
if old_map_block not in integrity:
    raise SystemExit('ContentIntegrity map coordinate block not found')
integrity = integrity.replace(old_map_block, new_map_block, 1)
old_portal_coords = """        if (![x, y, tx, ty].every(value => validCoordinate(Number(value)))) return 'Map portal coordinates must be inside the playable area';
        const targetMap = typeof portal.targetMap === 'string' ? portal.targetMap.trim() : '';
        if (!hasMap(contentDB, targetMap, id)) return `Map portal references unknown map: ${targetMap || '(empty)'}`;
"""
new_portal_coords = """        if (!validCoordinate(Number(x), width) || !validCoordinate(Number(y), height)) return 'Map portal source coordinates must be inside the source playable area';
        const targetMap = typeof portal.targetMap === 'string' ? portal.targetMap.trim() : '';
        if (!hasMap(contentDB, targetMap, id)) return `Map portal references unknown map: ${targetMap || '(empty)'}`;
        const targetDimensions = mapDimensions(contentDB, targetMap, targetMap === id ? record : null);
        if (!validCoordinate(Number(tx), targetDimensions.width) || !validCoordinate(Number(ty), targetDimensions.height)) return 'Map portal target coordinates must be inside the destination playable area';
"""
if old_portal_coords not in integrity:
    raise SystemExit('ContentIntegrity portal coordinate block not found')
integrity = integrity.replace(old_portal_coords, new_portal_coords, 1)
INTEGRITY.write_text(integrity, encoding='utf-8')

# -----------------------------------------------------------------------------
# Content Studio: map-aware semantic coordinates + capital authoring limits.
# -----------------------------------------------------------------------------
STUDIO = Path('server/engine/ContentStudio.mjs')
studio = STUDIO.read_text(encoding='utf-8')
studio = studio.replace(
    "import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT } from './World.mjs';",
    "import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES } from './World.mjs';",
    1,
)
studio = studio.replace(
    "field('id', 'ID'), field('name', 'Name'), field('biome', 'Biome', 'select', { optionKey: 'biomes' }), field('description', 'Description', 'textarea'),",
    "field('id', 'ID'), field('name', 'Name'), field('biome', 'Biome', 'select', { optionKey: 'biomes' }), field('description', 'Description', 'textarea'),\n    field('width', 'Map width', 'number'), field('height', 'Map height', 'number'), field('settlementClass', 'Settlement class', 'select', { optionKey: 'settlementClasses' }), field('urbanBounds', 'Urban bounds', 'json'),",
    1,
)
old_playable = """function playableCoord(record, key) {
  return numberIn(record, key, 1, MAP_WIDTH - 2, { integer: true });
}

export function validateStudioRecord(type, record) {
"""
new_playable = """function dimensionsForMap(contentDB, mapId, ownRecord = null) {
  const custom = ownRecord?.id === mapId ? ownRecord : contentDB?.get?.('maps')?.find?.(entry => entry?.id === mapId);
  const base = MAP_CONFIG[mapId];
  const width = Number(custom?.width ?? base?.width ?? MAP_WIDTH);
  const height = Number(custom?.height ?? base?.height ?? MAP_HEIGHT);
  return {
    width: Number.isInteger(width) && width >= MIN_MAP_DIMENSION && width <= MAX_MAP_DIMENSION ? width : MAP_WIDTH,
    height: Number.isInteger(height) && height >= MIN_MAP_DIMENSION && height <= MAX_MAP_DIMENSION ? height : MAP_HEIGHT,
  };
}

function playableCoord(record, key, dimension = MAP_WIDTH) {
  return numberIn(record, key, 1, dimension - 2, { integer: true });
}

export function validateStudioRecord(type, record, contentDB = null) {
"""
if old_playable not in studio:
    raise SystemExit('ContentStudio playableCoord anchor not found')
studio = studio.replace(old_playable, new_playable, 1)
old_nodes = """    for (const [key,min,max] of [['x',1,78],['y',1,78],['radius',2,30],['maxHp',500,1000000],['taxRate',0,25]]) { const e=numberIn(record,key,min,max,{required:true}); if(e)return e; }
"""
new_nodes = """    const nodeDimensions = dimensionsForMap(contentDB, String(record.mapId || ''));
    let e=playableCoord(record,'x',nodeDimensions.width); if(e)return e;
    e=playableCoord(record,'y',nodeDimensions.height); if(e)return e;
    for (const [key,min,max] of [['radius',2,30],['maxHp',500,1000000],['taxRate',0,25]]) { const error=numberIn(record,key,min,max,{required:true}); if(error)return error; }
"""
if old_nodes not in studio:
    raise SystemExit('ContentStudio nodes anchor not found')
studio = studio.replace(old_nodes, new_nodes, 1)
old_mon_coords = """    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
"""
new_mon_coords = """    const monsterDimensions = dimensionsForMap(contentDB, String(record.mapId || ''));
    for (const [key,dimension] of [['posX',monsterDimensions.width],['posY',monsterDimensions.height]]) { const error = playableCoord(record, key, dimension); if (error) return error; }
"""
if old_mon_coords not in studio:
    raise SystemExit('ContentStudio monster coords anchor not found')
studio = studio.replace(old_mon_coords, new_mon_coords, 1)
old_npc_coords = """    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
    const role = String(record.role || '');
"""
new_npc_coords = """    const npcDimensions = dimensionsForMap(contentDB, String(record.mapId || ''));
    for (const [key,dimension] of [['posX',npcDimensions.width],['posY',npcDimensions.height]]) { const error = playableCoord(record, key, dimension); if (error) return error; }
    const role = String(record.role || '');
"""
if old_npc_coords not in studio:
    raise SystemExit('ContentStudio npc coords anchor not found')
studio = studio.replace(old_npc_coords, new_npc_coords, 1)
old_house = """  if (type === 'houses') {
    for (const key of ['x','y','entranceX','entranceY']) { const error=playableCoord(record,key); if(error)return error; }
    for (const [key,min,max] of [['width',2,12],['height',2,12],['price',0,100000000],['weeklyRent',0,10000000],['levelRequired',1,100000]]) { const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error; }
    if (Number(record.x)+Number(record.width)>MAP_WIDTH-1 || Number(record.y)+Number(record.height)>MAP_HEIGHT-1) return 'house interior exceeds map bounds';
"""
new_house = """  if (type === 'houses') {
    const houseDimensions = dimensionsForMap(contentDB, String(record.mapId || ''));
    for (const [key,dimension] of [['x',houseDimensions.width],['entranceX',houseDimensions.width],['y',houseDimensions.height],['entranceY',houseDimensions.height]]) { const error=playableCoord(record,key,dimension); if(error)return error; }
    for (const [key,min,max] of [['width',2,12],['height',2,12],['price',0,100000000],['weeklyRent',0,10000000],['levelRequired',1,100000]]) { const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error; }
    if (Number(record.x)+Number(record.width)>houseDimensions.width-1 || Number(record.y)+Number(record.height)>houseDimensions.height-1) return 'house interior exceeds map bounds';
"""
if old_house not in studio:
    raise SystemExit('ContentStudio house anchor not found')
studio = studio.replace(old_house, new_house, 1)
old_map_start = """  if (type === 'maps') {
    const biome = String(record.biome || '').toLowerCase();
    if (!BIOMES.has(biome)) return 'biome is not supported';
    for (const key of ['spawnX','spawnY','townX','townY']) { const error = playableCoord(record, key); if (error) return error; }
"""
new_map_start = """  if (type === 'maps') {
    const biome = String(record.biome || '').toLowerCase();
    if (!BIOMES.has(biome)) return 'biome is not supported';
    let error = numberIn(record, 'width', MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, { required: false, integer: true }); if (error) return error;
    error = numberIn(record, 'height', MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, { required: false, integer: true }); if (error) return error;
    const width = Number(record.width ?? MAP_WIDTH);
    const height = Number(record.height ?? MAP_HEIGHT);
    const settlementClass = String(record.settlementClass || (record.id === 'eldoria' ? 'capital' : 'city'));
    if (!SETTLEMENT_CLASSES.includes(settlementClass)) return 'settlementClass is not supported';
    for (const [key,dimension] of [['spawnX',width],['spawnY',height],['townX',width],['townY',height]]) { const coordError = playableCoord(record, key, dimension); if (coordError) return coordError; }
    if (record.urbanBounds !== undefined) {
      const box = record.urbanBounds;
      if (!box || typeof box !== 'object' || Array.isArray(box)) return 'urbanBounds must be a JSON object';
      for (const key of ['x','y','width','height']) { const boxError = numberIn(box,key,key === 'width' || key === 'height' ? 2 : 1,key === 'width' ? width - 2 : key === 'height' ? height - 2 : key === 'x' ? width - 3 : height - 3,{required:true,integer:true}); if(boxError)return `urbanBounds ${boxError}`; }
      if (Number(box.x)+Number(box.width)>width-1 || Number(box.y)+Number(box.height)>height-1) return 'urbanBounds must stay inside map bounds';
    }
    const capital = settlementClass === 'capital';
    const districtLimit = capital ? 24 : 8;
    const landmarkLimit = capital ? 64 : 12;
    const propLimit = capital ? 320 : 80;
    const districtRadiusLimit = capital ? 24 : 12;
    const landmarkSizeLimit = capital ? 20 : 10;
"""
if old_map_start not in studio:
    raise SystemExit('ContentStudio map start anchor not found')
studio = studio.replace(old_map_start, new_map_start, 1)
studio = studio.replace("    let error = numberIn(record, 'levelRequired'", "    error = numberIn(record, 'levelRequired'", 1)
studio = studio.replace("record.districts.length > 8", "record.districts.length > districtLimit", 1).replace("'districts must be a JSON array with at most 8 entries'", "`districts must be a JSON array with at most ${districtLimit} entries`", 1)
studio = studio.replace("for (const key of ['x','y']) { const e=playableCoord(entry,key);", "for (const [key,dimension] of [['x',width],['y',height]]) { const e=playableCoord(entry,key,dimension);", 1).replace("numberIn(entry,'radius',1,12", "numberIn(entry,'radius',1,districtRadiusLimit", 1)
studio = studio.replace("record.landmarks.length > 12", "record.landmarks.length > landmarkLimit", 1).replace("'landmarks must be a JSON array with at most 12 entries'", "`landmarks must be a JSON array with at most ${landmarkLimit} entries`", 1)
studio = studio.replace("for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `landmark ${e}`; } for (const key of ['w','h']) { const e=numberIn(entry,key,1,10", "for (const [key,dimension] of [['x',width],['y',height]]) { const e=playableCoord(entry,key,dimension); if(e)return `landmark ${e}`; } for (const key of ['w','h']) { const e=numberIn(entry,key,1,landmarkSizeLimit", 1)
studio = studio.replace("record.props.length > 80", "record.props.length > propLimit", 1).replace("'props must be a JSON array with at most 80 entries'", "`props must be a JSON array with at most ${propLimit} entries`", 1)
studio = studio.replace("for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `prop ${e}`; }", "for (const [key,dimension] of [['x',width],['y',height]]) { const e=playableCoord(entry,key,dimension); if(e)return `prop ${e}`; }", 1)
studio = studio.replace("biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES]", "biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], settlementClasses: [...SETTLEMENT_CLASSES]", 1)
studio = studio.replace("maps: 'Map edits rebuild deterministic terrain and live portal travel. City style, palette, districts, landmarks, street props, nameplates and residential presentation controls drive the runtime presentation and minimap. Built-in maps cannot be deleted.'", "maps: 'Map edits rebuild deterministic terrain and live portal travel. Width, height, settlement class and urban bounds are authoritative; capital maps receive higher city-authoring budgets while townRange remains a local service radius. Built-in maps cannot be deleted.'", 1)
studio = studio.replace("const semantic = validateStudioRecord(type, record);", "const semantic = validateStudioRecord(type, record, contentDB);", 1)
STUDIO.write_text(studio, encoding='utf-8')

# Server write path must pass the repository so semantic coordinates know map size.
SERVER = Path('server/server.js')
server = SERVER.read_text(encoding='utf-8')
anchor = "const semanticError = validateStudioRecord(type, candidate);"
if anchor not in server:
    raise SystemExit('server validateStudioRecord anchor not found')
server = server.replace(anchor, "const semanticError = validateStudioRecord(type, candidate, contentDB);", 1)
SERVER.write_text(server, encoding='utf-8')

# -----------------------------------------------------------------------------
# Regression tests for 80 legacy, 160 capital and 192 hard ceiling.
# -----------------------------------------------------------------------------
TEST = Path('server/test/grand-capital-foundation-9-35.test.mjs')
TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldManager, MAP_WIDTH, MAP_HEIGHT, MAX_MAP_DIMENSION } from '../engine/World.mjs';
import { validateStudioRecord } from '../engine/ContentStudio.mjs';
import { validateContentReferences } from '../engine/ContentIntegrity.mjs';

function capital(id = 'qa_grand_capital', overrides = {}) {
  return {
    id, name: 'QA Grand Capital', description: 'Synthetic capital for dimension contracts.', biome: 'plains',
    width: 160, height: 160, settlementClass: 'capital', urbanBounds: { x: 18, y: 18, width: 124, height: 124 },
    levelRequired: 1, seed: 935, spawnX: 80, spawnY: 80, townX: 80, townY: 80, townRange: 10,
    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
    districts: Array.from({ length: 16 }, (_, i) => ({ id: `d${i}`, name: `District ${i}`, icon: '◇', x: 20 + i * 6, y: 50 + (i % 3) * 8, radius: 8, color: '#d8b45a' })),
    landmarks: Array.from({ length: 20 }, (_, i) => ({ id: `l${i}`, name: `Landmark ${i}`, kind: i % 2 ? 'house' : 'market', icon: '◆', x: 15 + (i % 10) * 12, y: 20 + Math.floor(i / 10) * 30, w: 5, h: 5 })),
    props: Array.from({ length: 120 }, (_, i) => ({ id: `p${i}`, kind: i % 2 ? 'lamp' : 'banner', x: 10 + (i % 20) * 7, y: 90 + Math.floor(i / 20) * 5, color: '#d8b45a' })),
    access: 'public', portals: [], ...overrides,
  };
}

function contentDB(maps = []) {
  return { get(type) { return type === 'maps' ? maps : []; } };
}

test('9.35A legacy maps stay 80x80 while a declared grand capital generates 160x160', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').width, MAP_WIDTH);
  assert.equal(world.getMap('eldoria').height, MAP_HEIGHT);
  world.syncContentMaps([capital()]);
  const map = world.getMap('qa_grand_capital');
  assert.equal(map.width, 160);
  assert.equal(map.height, 160);
  assert.equal(map.tiles.length, 160);
  assert.equal(map.tiles[0].length, 160);
  assert.equal(map.spawnPoint.x, 80);
  assert.equal(map.settlementClass, 'capital');
  assert.deepEqual(map.urbanBounds, { x: 18, y: 18, width: 124, height: 124 });
});

test('9.35A Studio accepts capital-scale authoring but preserves normal city budgets', () => {
  const record = capital();
  const db = contentDB([record]);
  assert.equal(validateStudioRecord('maps', record, db), null);
  const normal = capital('qa_city', { settlementClass: 'city', width: 80, height: 80, urbanBounds: { x: 10, y: 10, width: 60, height: 60 }, spawnX: 40, spawnY: 40, townX: 40, townY: 40, districts: [], landmarks: [], props: Array.from({ length: 81 }, (_, i) => ({ id: `p${i}`, kind: 'lamp', x: 20, y: 20 })) });
  assert.match(validateStudioRecord('maps', normal, contentDB([normal])), /at most 80/);
});

test('9.35A map-aware Studio permits houses, NPCs and monsters beyond legacy coordinate 78', () => {
  const record = capital();
  const db = contentDB([record]);
  const house = { id: 'qa_house', name: 'Far Ward House', mapId: record.id, x: 120, y: 120, width: 6, height: 6, entranceX: 123, entranceY: 127, price: 1000, weeklyRent: 100, levelRequired: 1 };
  assert.equal(validateStudioRecord('houses', house, db), null);
  const npc = { id: 'qa_npc', name: 'Far Banker', mapId: record.id, posX: 130, posY: 125, role: 'banker' };
  assert.equal(validateStudioRecord('npcs', npc, db), null);
  const monster = { id: 'qa_monster', name: 'Outer Rat', mapId: record.id, posX: 140, posY: 140, hp: 10, attack: 1, defense: 0, xp: 1, level: 1, type: 'normal', count: 1, speed: 1000 };
  assert.equal(validateStudioRecord('monsters', monster, db), null);
});

test('9.35A dimensions hard-stop at 192 and townRange remains a local service radius', () => {
  const max = capital('qa_max', { width: MAX_MAP_DIMENSION, height: MAX_MAP_DIMENSION, spawnX: 190, spawnY: 190, townX: 96, townY: 96, urbanBounds: { x: 10, y: 10, width: 180, height: 180 } });
  assert.equal(validateStudioRecord('maps', max, contentDB([max])), null);
  assert.match(validateStudioRecord('maps', capital('qa_too_big', { width: 193 }), contentDB([])), /width must be from 40 to 192/);
  assert.match(validateStudioRecord('maps', capital('qa_remote_services', { townRange: 30 }), contentDB([])), /townRange must be from 0 to 20/);
});

test('9.35A portal targets are validated against destination dimensions', () => {
  const destination = capital('qa_destination', { width: 80, height: 80, spawnX: 40, spawnY: 40, townX: 40, townY: 40, urbanBounds: { x: 10, y: 10, width: 60, height: 60 }, districts: [], landmarks: [], props: [] });
  const source = capital('qa_source', { portals: [{ x: 120, y: 120, targetMap: destination.id, targetX: 120, targetY: 40, label: 'invalid target' }] });
  const db = contentDB([source, destination]);
  assert.match(validateContentReferences(db, 'maps', source), /destination playable area/);
  const valid = { ...source, portals: [{ x: 120, y: 120, targetMap: destination.id, targetX: 60, targetY: 40, label: 'valid target' }] };
  assert.equal(validateContentReferences(contentDB([valid, destination]), 'maps', valid), null);
});
''', encoding='utf-8')

DOC = Path('docs/MORIA_9_35_GRAND_CAPITAL_FOUNDATION.md')
DOC.write_text("""# Mor'ia 9.35 — Grand Capital Foundation

## 9.35A — contrato autoritativo

Este passe remove a suposição de que todo mapa do reino mede 80×80 sem alterar mapas legados. Mapas sem dimensões declaradas continuam exatamente em 80×80. Novos mapas podem declarar `width` e `height` entre 40 e 192 tiles; a escala-alvo para grandes capitais é 160×160.

### Novos contratos de mapa
- `width` / `height`: dimensões físicas autoritativas;
- `settlementClass`: `wilderness`, `town`, `city` ou `capital`;
- `urbanBounds`: retângulo da área urbana, separado do tamanho físico do mapa;
- `townRange`: continua limitado a 0–20 e representa alcance local de serviços, nunca o tamanho da capital.

### Orçamento de autoria
Mapas comuns preservam 8 distritos, 12 landmarks e 80 props. Capitais podem usar até 24 distritos, 64 landmarks e 320 props, landmarks de até 20×20 e distritos de raio até 24.

### Segurança espacial
Spawn, centro urbano, landmarks, distritos, props, NPCs, monstros e houses passam a respeitar as dimensões reais do mapa. Portais validam a origem contra o mapa de origem e o destino contra as dimensões reais do mapa de destino. O runtime também descarta portais cujo destino esteja fora da área jogável.

### Compatibilidade
Os mapas existentes continuam 80×80 se não declararem dimensões. Housing já consumia `map.width`/`map.height` no runtime e agora o Studio deixa de bloquear coordenadas válidas acima de 78 em mapas grandes.

## Gate 9.35A
A fundação é aceita somente com auditoria de segurança, typecheck/build do cliente, testes completos do servidor e novos testes de regressão para 80×80, 160×160, teto 192×192, housing/NPCs/monstros acima de 78 e portais entre mapas de tamanhos diferentes.

## Próximo passe — 9.35B
O cliente passa a consumir dimensões reais no `maps.ts`, minimapa e City Designer. Um mapa sintético 160×160 será renderizado e capturado antes de iniciar a 9.36 Grand Eldoria.
""", encoding='utf-8')

print("Mor'ia 9.35A Grand Capital authoritative core prepared")
