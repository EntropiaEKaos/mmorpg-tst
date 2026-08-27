from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# Client map contract: authoritative/editable visual identity per city.
# ---------------------------------------------------------------------------
path = root / 'src/game/maps.ts'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "import type { Tile, Position } from './types';\n",
    "import type { Tile, Position } from './types';\nimport { CITY_STYLES, withCityDefaults, type CityStyle, type CityDistrict, type CityLandmark, type CityProp } from './cityIdentity';\n",
    'maps identity import',
)
text = replace_once(
    text,
    "  dangerLevel?: string;\n}\n",
    "  dangerLevel?: string;\n  cityStyle: CityStyle;\n  cityAccent: string;\n  roofColor: string;\n  wallColor: string;\n  roadColor: string;\n  districts: CityDistrict[];\n  landmarks: CityLandmark[];\n  props: CityProp[];\n}\n",
    'GameMap identity fields',
)
identity_rows = {
    "    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains', seed: 42,\n": "    id: 'eldoria', name: 'Eldoria', description: 'The capital city. Lush plains and forests.', biome: 'plains', seed: 42,\n    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764', districts: [], landmarks: [], props: [],\n",
    "    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow', seed: 1337,\n": "    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow', seed: 1337,\n    cityStyle: 'alpine', cityAccent: '#9dd8ff', roofColor: '#334b67', wallColor: '#cbd4d8', roadColor: '#7f8c92', districts: [], landmarks: [], props: [],\n",
    "    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp', seed: 7,\n": "    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp', seed: 7,\n    cityStyle: 'marsh', cityAccent: '#8fb85a', roofColor: '#334229', wallColor: '#76755c', roadColor: '#5f6048', districts: [], landmarks: [], props: [],\n",
    "    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert', seed: 999,\n": "    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert', seed: 999,\n    cityStyle: 'forge', cityAccent: '#ff9b45', roofColor: '#7c3923', wallColor: '#aa7950', roadColor: '#744a38', districts: [], landmarks: [], props: [],\n",
    "    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow', seed: 666,\n": "    id: 'voidlands', name: 'Voidlands', description: 'The end of the world. Pure darkness and ancient evil.', biome: 'shadow', seed: 666,\n    cityStyle: 'void', cityAccent: '#a86dff', roofColor: '#21192d', wallColor: '#4c4259', roadColor: '#342c42', districts: [], landmarks: [], props: [],\n",
}
for old, new in identity_rows.items():
    text = replace_once(text, old, new, f'builtin identity {old.split(chr(39))[1]}')

text = replace_once(
    text,
    "const VALID_BIOMES = new Set<BiomeType>(['plains', 'snow', 'swamp', 'desert', 'shadow']);\n",
    "const VALID_BIOMES = new Set<BiomeType>(['plains', 'snow', 'swamp', 'desert', 'shadow']);\nconst VALID_CITY_STYLES = new Set<CityStyle>(CITY_STYLES);\nconst HEX_COLOR = /^#[0-9a-fA-F]{6}$/;\n\nfunction cityCoord(value: unknown, fallback: number): number {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(1, Math.min(MAP_WIDTH - 2, Math.round(n))) : fallback;\n}\nfunction cityColor(value: unknown, fallback: string): string { return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback; }\nfunction normalizeDistricts(raw: unknown): CityDistrict[] {\n  if (!Array.isArray(raw)) return [];\n  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, 8).map((entry: any, index) => ({\n    id: String(entry.id || `district_${index + 1}`).slice(0, 60), name: String(entry.name || `District ${index + 1}`).slice(0, 60), icon: String(entry.icon || '◇').slice(0, 8),\n    x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40), radius: Math.max(1, Math.min(12, Math.round(Number(entry.radius) || 4))), color: cityColor(entry.color, '#d8b45a'),\n  }));\n}\nfunction normalizeLandmarks(raw: unknown): CityLandmark[] {\n  const kinds = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower']);\n  if (!Array.isArray(raw)) return [];\n  return raw.filter((entry: any) => entry && typeof entry === 'object').slice(0, 12).map((entry: any, index) => ({\n    id: String(entry.id || `landmark_${index + 1}`).slice(0, 60), name: String(entry.name || `Landmark ${index + 1}`).slice(0, 60),\n    kind: (kinds.has(String(entry.kind)) ? String(entry.kind) : 'market') as CityLandmark['kind'], icon: String(entry.icon || '◆').slice(0, 8),\n    x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40), w: Math.max(1, Math.min(10, Math.round(Number(entry.w) || 4))), h: Math.max(1, Math.min(10, Math.round(Number(entry.h) || 4))),\n  }));\n}\nfunction normalizeProps(raw: unknown): CityProp[] {\n  const kinds = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);\n  if (!Array.isArray(raw)) return [];\n  return raw.filter((entry: any) => entry && typeof entry === 'object' && kinds.has(String(entry.kind))).slice(0, 80).map((entry: any, index) => ({\n    id: String(entry.id || `prop_${index + 1}`).slice(0, 60), kind: String(entry.kind) as CityProp['kind'], x: cityCoord(entry.x, 40), y: cityCoord(entry.y, 40),\n    color: typeof entry.color === 'string' && HEX_COLOR.test(entry.color) ? entry.color : undefined, label: typeof entry.label === 'string' ? entry.label.slice(0, 60) : undefined,\n  }));\n}\nfunction hydrateMapIdentity(map: GameMap): GameMap {\n  const style = VALID_CITY_STYLES.has(map.cityStyle) ? map.cityStyle : undefined;\n  const hydrated = withCityDefaults({\n    id: map.id, name: map.name, style, biome: map.biome, townCenter: map.townCenter, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor,\n    districts: normalizeDistricts(map.districts), landmarks: normalizeLandmarks(map.landmarks), props: normalizeProps(map.props),\n  });\n  return { ...map, cityStyle: hydrated.style, cityAccent: hydrated.cityAccent, roofColor: hydrated.roofColor, wallColor: hydrated.wallColor, roadColor: hydrated.roadColor, districts: hydrated.districts, landmarks: hydrated.landmarks, props: hydrated.props };\n}\n",
    'maps identity helpers',
)
old_clone = """function cloneMap(map: GameMap): GameMap {
  return {
    ...map, spawnPoint: { ...map.spawnPoint }, townCenter: { ...map.townCenter },
    portals: map.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })),
  };
}
"""
new_clone = """function cloneMap(map: GameMap): GameMap {
  const hydrated = hydrateMapIdentity(map);
  return {
    ...hydrated, spawnPoint: { ...hydrated.spawnPoint }, townCenter: { ...hydrated.townCenter },
    portals: hydrated.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })),
    districts: hydrated.districts.map(entry => ({ ...entry })), landmarks: hydrated.landmarks.map(entry => ({ ...entry })), props: hydrated.props.map(entry => ({ ...entry })),
  };
}
"""
text = replace_once(text, old_clone, new_clone, 'cloneMap identity')
text = replace_once(text, "    next[id] = {\n", "    next[id] = hydrateMapIdentity({\n", 'sync identity wrapper')
text = replace_once(
    text,
    "      dangerLevel: typeof raw.dangerLevel === 'string' ? raw.dangerLevel.slice(0, 40) : base?.dangerLevel,\n      portals,\n    };\n",
    "      dangerLevel: typeof raw.dangerLevel === 'string' ? raw.dangerLevel.slice(0, 40) : base?.dangerLevel,\n      cityStyle: (typeof raw.cityStyle === 'string' ? raw.cityStyle : base?.cityStyle) as CityStyle,\n      cityAccent: cityColor(raw.cityAccent, base?.cityAccent || '#d8b45a'), roofColor: cityColor(raw.roofColor, base?.roofColor || '#7e2f34'),\n      wallColor: cityColor(raw.wallColor, base?.wallColor || '#c9b68d'), roadColor: cityColor(raw.roadColor, base?.roadColor || '#9b8764'),\n      districts: Array.isArray(raw.districts) ? normalizeDistricts(raw.districts) : (base?.districts || []),\n      landmarks: Array.isArray(raw.landmarks) ? normalizeLandmarks(raw.landmarks) : (base?.landmarks || []),\n      props: Array.isArray(raw.props) ? normalizeProps(raw.props) : (base?.props || []),\n      portals,\n    });\n",
    'sync identity fields',
)
text = replace_once(
    text,
    "  Object.assign(MAPS, next);\n}\n\nfunction seededRandom",
    "  Object.assign(MAPS, next);\n}\n\n// Offline City Designer drafts are presentation/content overrides only. Online\n// server content always supersedes them when authoritative definitions arrive.\nif (typeof localStorage !== 'undefined') {\n  try {\n    const stored = JSON.parse(localStorage.getItem('moria_city_designer_maps') || 'null');\n    if (Array.isArray(stored) && stored.length) syncServerMaps(stored);\n  } catch { /* ignore malformed local drafts */ }\n}\n\nfunction seededRandom",
    'local city draft hydration',
)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# Building renderer: original classic silhouettes with editable architecture.
# ---------------------------------------------------------------------------
path = root / 'src/game/render.ts'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "  type: 'house' | 'tower' | 'shop' | 'temple' | 'castle' | 'inn' | 'well' | 'tree_deco';\n  roofColor?: string;\n",
    "  type: 'house' | 'tower' | 'shop' | 'temple' | 'castle' | 'inn' | 'well' | 'tree_deco' | 'market' | 'forge' | 'dock' | 'arena' | 'obelisk' | 'library' | 'graveyard';\n  roofColor?: string;\n  wallColor?: string;\n  accentColor?: string;\n  label?: string;\n  icon?: string;\n",
    'building identity interface',
)
text = replace_once(
    text,
    "  if (building.type === 'tree_deco') {\n    drawTile(ctx, { type: 'tree', walkable: false }, sx, sy, tileSize);\n    return;\n  }\n\n  // Shadow\n",
    "  if (building.type === 'tree_deco') {\n    drawTile(ctx, { type: 'tree', walkable: false }, sx, sy, tileSize);\n    return;\n  }\n\n  if (building.type === 'obelisk') {\n    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx - w * .22, sy + h * .78, w * .44, h * .14);\n    const g = ctx.createLinearGradient(cx - w*.18, sy, cx + w*.18, sy + h); g.addColorStop(0, building.accentColor || '#a86dff'); g.addColorStop(.22, '#4b405c'); g.addColorStop(1, '#19151f');\n    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(cx + w*.18, sy+h*.78); ctx.lineTo(cx-w*.18, sy+h*.78); ctx.closePath(); ctx.fill(); return;\n  }\n  if (building.type === 'graveyard') {\n    ctx.strokeStyle = building.wallColor || '#6b6870'; ctx.lineWidth = 2; ctx.strokeRect(sx+2, sy+h*.25, w-4, h*.68);\n    ctx.fillStyle = '#77757a'; for (let i=0;i<4;i++){const gx=sx+w*(.2+i*.2);ctx.fillRect(gx-3,sy+h*(.48+(i%2)*.12),6,h*.24);} return;\n  }\n  if (building.type === 'market') {\n    const colors=[building.roofColor || '#8b3a2a',building.accentColor || '#d8b45a'];\n    for(let i=0;i<3;i++){const bx=sx+i*w/3;ctx.fillStyle=colors[i%2];ctx.beginPath();ctx.moveTo(bx,sy+h*.42);ctx.lineTo(bx+w/6,sy+h*.12);ctx.lineTo(bx+w/3,sy+h*.42);ctx.closePath();ctx.fill();ctx.fillStyle='#76502d';ctx.fillRect(bx+2,sy+h*.43,w/3-4,h*.4);} return;\n  }\n  if (building.type === 'arena') {\n    ctx.strokeStyle = building.wallColor || '#8d7861'; ctx.lineWidth = Math.max(3,tileSize*.12); ctx.beginPath(); ctx.ellipse(cx,sy+h*.58,w*.46,h*.33,0,0,Math.PI*2); ctx.stroke();\n    ctx.strokeStyle = building.accentColor || '#ff9b45'; ctx.lineWidth = 2; ctx.beginPath();ctx.ellipse(cx,sy+h*.58,w*.32,h*.21,0,0,Math.PI*2);ctx.stroke();return;\n  }\n\n  // Shadow\n",
    'special city landmarks',
)
text = replace_once(
    text,
    "  const wallGrad = ctx.createLinearGradient(sx, sy, sx, sy + h);\n  if (building.type === 'temple' || building.type === 'castle' || building.type === 'tower') {\n",
    "  const wallGrad = ctx.createLinearGradient(sx, sy, sx, sy + h);\n  if (building.wallColor) {\n    wallGrad.addColorStop(0, building.wallColor);\n    wallGrad.addColorStop(1, building.wallColor);\n  } else if (building.type === 'temple' || building.type === 'castle' || building.type === 'tower') {\n",
    'editable building wall palette',
)
text = replace_once(text, "  ctx.fillStyle = '#ffd700';\n", "  ctx.fillStyle = building.accentColor || '#ffd700';\n", 'building door accent')
text = replace_once(
    text,
    "      shop: '🛒', temple: '⛪', inn: '🛏', castle: '🏰', tower: '🗼',\n    };\n    const icon = labels[building.type] || '🏠';\n",
    "      shop: '▣', temple: '✦', inn: '⌂', castle: '♜', tower: '◆', forge: '⚒', dock: '⚓', library: '▤', market: '⚖', arena: '◎', obelisk: '◇', graveyard: '☠',\n    };\n    const icon = building.icon || labels[building.type] || '⌂';\n",
    'building landmark icons',
)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# HUD minimap: actual map tiles + identity markers, never Eldoria hardcode.
# ---------------------------------------------------------------------------
path = root / 'src/components/HUD.tsx'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "import { MAP_WIDTH, MAP_HEIGHT } from '../game/world';\n", "import { MAPS } from '../game/maps';\nimport WorldMiniMap from './WorldMiniMap';\n", 'HUD map imports')
text = replace_once(text, "  official?: any;\n}\n", "  official?: any;\n  mapId: string;\n}\n", 'HUD map prop')
text = replace_once(text, "export default function HUD({ player, spells, onCastSpell, monsters, tick, official }: Props) {", "export default function HUD({ player, spells, onCastSpell, monsters, tick, official, mapId }: Props) {", 'HUD map destructure')
text = replace_once(text, "        title={`Minimap · ${player.pos.x}, ${player.pos.y}`}\n", "        title={`Minimap · ${MAPS[mapId]?.name || mapId} · ${player.pos.x}, ${player.pos.y}`}\n", 'HUD minimap title')
text = replace_once(text, "        <MiniMap player={player} monsters={monsters || []} tick={tick} />\n", "        <WorldMiniMap player={player} monsters={monsters || []} mapId={mapId} />\n", 'HUD real minimap')
pattern = re.compile(r"\nfunction MiniMap\([\s\S]*?\n}\n\nfunction clampPct", re.MULTILINE)
if not pattern.search(text):
    raise SystemExit('HUD legacy minimap block missing')
text = pattern.sub("\nfunction clampPct", text, count=1)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# In-game editor: replace local-only map creator with visual City Designer.
# ---------------------------------------------------------------------------
path = root / 'src/components/GameEditor.tsx'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';\n", "import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';\nimport CityDesigner from './CityDesigner';\n", 'GameEditor CityDesigner import')
text = replace_once(text, "  onClose: () => void;\n}", "  onClose: () => void;\n  onMapsChanged?: () => void;\n}", 'GameEditor map callback prop')
text = replace_once(text, "export default function GameEditor({ player, setPlayer: _setPlayer, onClose }: Props) {", "export default function GameEditor({ player, setPlayer: _setPlayer, onClose, onMapsChanged }: Props) {", 'GameEditor callback destructure')
text = replace_once(text, "    { id: 'maps', label: 'Maps · Preview', icon: '🗺' },", "    { id: 'maps', label: 'City Designer · Live', icon: '🏙' },", 'GameEditor map label')
text = replace_once(text, "        {(['items', 'spells', 'classes', 'maps'] as EditorTab[]).includes(tab) && (", "        {(['items', 'spells', 'classes'] as EditorTab[]).includes(tab) && (", 'GameEditor live maps warning')
text = replace_once(text, "          {tab === 'maps' && <MapCreator player={player} />}", "          {tab === 'maps' && <CityDesigner onApplied={onMapsChanged} />}", 'GameEditor CityDesigner render')
pattern = re.compile(r"\n// ============ MAP CREATOR ============\nfunction MapCreator[\s\S]*?\n// ============ BOOK CREATOR ============", re.MULTILINE)
if not pattern.search(text):
    raise SystemExit('GameEditor legacy MapCreator block missing')
text = pattern.sub("\n// ============ BOOK CREATOR ============", text, count=1)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# GameScreen: tiny integration surface only; all visual complexity stays modular.
# ---------------------------------------------------------------------------
path = root / 'src/components/GameScreen.tsx'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "import { getTownBuildings } from '../game/world';\n", "import { getCityBuildings, drawCityDecor, drawCityTileOverlay } from '../game/cityPresentation';\n", 'GameScreen city presentation import')
text = replace_once(text, "  const buildingsRef = useRef<Building[]>(getTownBuildings('plains'));", "  const buildingsRef = useRef<Building[]>(getCityBuildings(MAPS.eldoria));", 'GameScreen initial city buildings')
text = text.replace("buildingsRef.current = getTownBuildings(MAPS[currentMapIdRef.current].biome);", "buildingsRef.current = getCityBuildings(MAPS[currentMapIdRef.current]);")
text = text.replace("buildingsRef.current = getTownBuildings(mapData.biome);", "buildingsRef.current = getCityBuildings(mapData);")
text = text.replace("buildingsRef.current = getTownBuildings(MAPS[sp.mapId].biome);", "buildingsRef.current = getCityBuildings(MAPS[sp.mapId]);")
if 'getTownBuildings(' in text:
    raise SystemExit('GameScreen legacy getTownBuildings call remains')
text = replace_once(
    text,
    "        drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);\n",
    "        drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);\n        drawCityTileOverlay(ctx, MAPS[currentMapIdRef.current] || MAPS.eldoria, tx, ty, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, world[ty][tx].type);\n",
    'GameScreen city tile overlay',
)
text = replace_once(
    text,
    "    // Houses and decoration are presentation-only projections of global server state.\n",
    "    drawCityDecor(ctx, MAPS[currentMapIdRef.current] || MAPS.eldoria, cam, TILE_SIZE, now);\n\n    // Houses and decoration are presentation-only projections of global server state.\n",
    'GameScreen city decor',
)
text = replace_once(
    text,
    "              onClose={() => { setShowEditor(false); refreshCustomContent(); }}\n",
    "              onClose={() => { setShowEditor(false); refreshCustomContent(); }}\n              onMapsChanged={() => { const map = MAPS[currentMapIdRef.current] || MAPS.eldoria; worldRef.current = generateMap(map.id); buildingsRef.current = getCityBuildings(map); setCurrentMapId(map.id); }}\n",
    'GameScreen live CityDesigner callback',
)
text = replace_once(
    text,
    "          <HUD player={player} tick={hudTick} spells={spells} onCastSpell={castSpell} monsters={monstersRef.current} official={serverSync.isActive() ? officialState : null} />",
    "          <HUD player={player} tick={hudTick} spells={spells} onCastSpell={castSpell} monsters={monstersRef.current} official={serverSync.isActive() ? officialState : null} mapId={currentMapId} />",
    'GameScreen HUD map prop',
)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# Server world: normalize, preserve and project the same city identity contract.
# ---------------------------------------------------------------------------
path = root / 'server/engine/World.mjs'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "const BIOME_SEEDS = Object.freeze({ plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 });\n",
    "const BIOME_SEEDS = Object.freeze({ plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 });\nconst CITY_STYLES = new Set(['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']);\nconst CITY_STYLE_BY_MAP = Object.freeze({ eldoria:'royal',sunreach_coast:'harbor',ironwood:'ironwood',frostpeak:'alpine',shadowfen:'marsh',emberhold:'forge',crystal_deep:'crystal',stormwatch_isle:'storm',voidlands:'void',nightfall_citadel:'nightfall',gm_sanctum:'sanctum' });\nconst CITY_PALETTES = Object.freeze({\n  royal:['#d8b45a','#7e2f34','#c9b68d','#9b8764'], harbor:['#55b9d8','#326177','#c2bda5','#8f8068'], ironwood:['#b48b4a','#4a3324','#8f8066','#755b42'],\n  alpine:['#9dd8ff','#334b67','#cbd4d8','#7f8c92'], marsh:['#8fb85a','#334229','#76755c','#5f6048'], forge:['#ff9b45','#7c3923','#aa7950','#744a38'],\n  crystal:['#74e1ff','#443d72','#8582a5','#56536e'], storm:['#8ddcff','#405169','#aab4bf','#657180'], void:['#a86dff','#21192d','#4c4259','#342c42'],\n  nightfall:['#e85b75','#201b24','#55515b','#39343d'], sanctum:['#f5de8f','#d8d9e7','#d5d0c2','#a79f8d'],\n});\nconst CITY_LANDMARKS = Object.freeze({\n  royal:['Sunspire Keep','Grand Market','Temple of Dawn','Royal Depot','Oath Fountain'], harbor:['Tidewatch Hall','Salt Market','Sea Chapel','Harbor Depot','Mariner Gate'],\n  ironwood:['Marchwarden Hall','Timber Exchange','Grove Shrine','Ironwood Depot','East Palisade'], alpine:['Frostguard Keep','Anvil Hall','Ice Chapel','Expedition Depot','Northwatch Gate'],\n  marsh:['Mirewatch Hall','Lantern Market','Witch Shrine','Fen Depot','Ferryman Dock'], forge:['Ember Citadel','Great Foundry','Ash Bazaar','Flame Shrine','Cinder Arena'],\n  crystal:['Prism Hall','Shard Exchange','Resonance Shrine','Deep Depot','Crystal Spire'], storm:['Tempest Bastion','Gale Exchange','Storm Chapel','Fleet Depot','Thunderwatch'],\n  void:['Black Obelisk','Bone Market','Silent Sanctum','Rift Depot','Necropolis Gate'], nightfall:['Regent Keep','Blacksteel Market','Moonless Chapel','Citadel Depot','Dread Gate'],\n  sanctum:['Astral Command','Review Forum','Aether Shrine','GM Vault','Event Gate'],\n});\nconst CITY_KINDS = ['keep','market','temple','depot','gate'];\n",
    'server city constants',
)
text = replace_once(
    text,
    "function normalizeConfig(record, base = null) {\n",
    "function cityStyleFor(id, biome, requested) {\n  if (CITY_STYLES.has(String(requested || ''))) return String(requested);\n  if (CITY_STYLE_BY_MAP[id]) return CITY_STYLE_BY_MAP[id];\n  return biome === 'snow' ? 'alpine' : biome === 'swamp' ? 'marsh' : biome === 'desert' ? 'forge' : biome === 'shadow' ? 'void' : 'royal';\n}\nfunction cityColor(value, fallback) { return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback; }\nfunction cityCoord(value, fallback) { return integer(value, 1, MAP_WIDTH - 2, fallback); }\nfunction defaultCityIdentity(id, biome, townCenter, record = {}, base = null) {\n  const cityStyle = cityStyleFor(id, biome, record.cityStyle ?? base?.cityStyle);\n  const [accent, roof, wall, road] = CITY_PALETTES[cityStyle];\n  const offsets=[[-3,-8],[-9,-1],[5,-7],[6,1],[0,5]], sizes=[[6,5],[5,4],[4,5],[5,4],[3,3]], icons=['♜','⚖','✦','▣','◆'];\n  const sourceLandmarks = Array.isArray(record.landmarks) && record.landmarks.length ? record.landmarks : (Array.isArray(base?.landmarks) && base.landmarks.length ? base.landmarks : CITY_LANDMARKS[cityStyle].map((name,index)=>({id:`${id}_landmark_${index+1}`,name,kind:CITY_KINDS[index],icon:icons[index],x:townCenter.x+offsets[index][0],y:townCenter.y+offsets[index][1],w:sizes[index][0],h:sizes[index][1]})));\n  const landmarks = sourceLandmarks.filter(x=>x&&typeof x==='object').slice(0,12).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),w:integer(x.w,1,10,4),h:integer(x.h,1,10,4)}));\n  const districtOffsets=[[-5,-2],[5,-2],[-4,5],[5,5]];\n  const sourceDistricts = Array.isArray(record.districts) && record.districts.length ? record.districts : (Array.isArray(base?.districts) && base.districts.length ? base.districts : districtOffsets.map((offset,index)=>({id:`${id}_district_${index+1}`,name:['Civic Ward','Market Ward','Temple Ward','Commons'][index],icon:['♜','⚖','✦','⌂'][index],x:townCenter.x+offset[0],y:townCenter.y+offset[1],radius:index===0?5:4,color:accent})));\n  const districts = sourceDistricts.filter(x=>x&&typeof x==='object').slice(0,8).map((x,index)=>({id:String(x.id||`${id}_district_${index+1}`).slice(0,60),name:String(x.name||`District ${index+1}`).slice(0,60),icon:String(x.icon||'◇').slice(0,8),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),radius:integer(x.radius,1,12,4),color:cityColor(x.color,accent)}));\n  const propKinds={royal:['banner','lamp','statue','barrel','cart'],harbor:['anchor','lamp','barrel','cart','sign'],ironwood:['sign','barrel','cart','pine','banner'],alpine:['brazier','pine','banner','sign','barrel'],marsh:['lamp','mushroom','sign','barrel','grave'],forge:['brazier','banner','barrel','cart','sign'],crystal:['crystal','rune','lamp','crystal','sign'],storm:['banner','lamp','anchor','brazier','sign'],void:['grave','rune','brazier','statue','grave'],nightfall:['banner','brazier','grave','statue','sign'],sanctum:['rune','crystal','banner','lamp','statue']};\n  const propOffsets=[[-8,5],[-5,4],[-2,4],[2,4],[5,4],[8,5],[-8,-5],[-5,-4],[-2,-4],[2,-4],[5,-4],[8,-5],[-10,0],[10,0],[0,7],[0,-10]];\n  const sourceProps=Array.isArray(record.props)&&record.props.length?record.props:(Array.isArray(base?.props)&&base.props.length?base.props:propOffsets.map((offset,index)=>({id:`${id}_prop_${index+1}`,kind:propKinds[cityStyle][index%propKinds[cityStyle].length],x:townCenter.x+offset[0],y:townCenter.y+offset[1],color:accent})));\n  const props=sourceProps.filter(x=>x&&typeof x==='object').slice(0,80).map((x,index)=>({id:String(x.id||`${id}_prop_${index+1}`).slice(0,60),kind:String(x.kind||'banner').slice(0,20),x:cityCoord(x.x,townCenter.x),y:cityCoord(x.y,townCenter.y),color:cityColor(x.color,accent),label:typeof x.label==='string'?x.label.slice(0,60):undefined}));\n  return {cityStyle,cityAccent:cityColor(record.cityAccent??base?.cityAccent,accent),roofColor:cityColor(record.roofColor??base?.roofColor,roof),wallColor:cityColor(record.wallColor??base?.wallColor,wall),roadColor:cityColor(record.roadColor??base?.roadColor,road),districts,landmarks,props};\n}\n\nfunction normalizeConfig(record, base = null) {\n",
    'server city identity helpers',
)
text = replace_once(
    text,
    "  const rawPortals = Array.isArray(record?.portals) ? record.portals : (base?.portals || []);\n  const portals = rawPortals.map(normalizePortal).filter(Boolean).slice(0, 20);\n  return {\n",
    "  const rawPortals = Array.isArray(record?.portals) ? record.portals : (base?.portals || []);\n  const portals = rawPortals.map(normalizePortal).filter(Boolean).slice(0, 20);\n  const townCenter = {\n    x: integer(record?.townX ?? record?.townCenter?.x, 1, MAP_WIDTH - 2, baseTown.x),\n    y: integer(record?.townY ?? record?.townCenter?.y, 1, MAP_HEIGHT - 2, baseTown.y),\n  };\n  const cityIdentity = defaultCityIdentity(id, biome, townCenter, record || {}, base);\n  return {\n",
    'server city normalize prelude',
)
text = replace_once(
    text,
    "    townCenter: {\n      x: integer(record?.townX ?? record?.townCenter?.x, 1, MAP_WIDTH - 2, baseTown.x),\n      y: integer(record?.townY ?? record?.townCenter?.y, 1, MAP_HEIGHT - 2, baseTown.y),\n    },\n    townRange:",
    "    townCenter,\n    ...cityIdentity,\n    townRange:",
    'server city normalize fields',
)
text = replace_once(
    text,
    "      townX: config.townCenter.x, townY: config.townCenter.y, townRange: config.townRange,\n      portals:",
    "      townX: config.townCenter.x, townY: config.townCenter.y, townRange: config.townRange,\n      cityStyle: config.cityStyle, cityAccent: config.cityAccent, roofColor: config.roofColor, wallColor: config.wallColor, roadColor: config.roadColor,\n      districts: config.districts.map(entry => ({ ...entry })), landmarks: config.landmarks.map(entry => ({ ...entry })), props: config.props.map(entry => ({ ...entry })),\n      portals:",
    'server definitions city projection',
)
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# Content Studio: same fields are authorable online, with semantic validation.
# ---------------------------------------------------------------------------
path = root / 'server/engine/ContentStudio.mjs'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "const ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);\n", "const ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);\nconst CITY_STYLES = Object.freeze(['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']);\nconst CITY_LANDMARK_KINDS = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower']);\nconst CITY_PROP_KINDS = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);\n", 'studio city constants')
text = replace_once(
    text,
    "    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'),\n    field('access', 'Access', 'select', { optionKey: 'mapAccess' }), field('portals', 'Portals', 'json'),\n",
    "    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'),\n    field('cityStyle', 'City style', 'select', { optionKey: 'cityStyles' }), field('cityAccent', 'City accent'), field('roofColor', 'Roof color'), field('wallColor', 'Wall color'), field('roadColor', 'Road color'),\n    field('districts', 'Districts', 'json'), field('landmarks', 'Landmarks', 'json'), field('props', 'Street props', 'json'),\n    field('access', 'Access', 'select', { optionKey: 'mapAccess' }), field('portals', 'Portals', 'json'),\n",
    'studio map city fields',
)
text = replace_once(
    text,
    "    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';\n    if (!MAP_ACCESS.includes(String(record.access || 'public'))) return 'map access is not supported';\n    return null;\n",
    "    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';\n    if (record.cityStyle !== undefined && record.cityStyle !== '' && !CITY_STYLES.includes(String(record.cityStyle))) return 'cityStyle is not supported';\n    for (const key of ['cityAccent','roofColor','wallColor','roadColor']) if (record[key] !== undefined && record[key] !== '' && !COLOR_RE.test(String(record[key]))) return `${key} must be a CSS hex color`;\n    if (record.districts !== undefined) {\n      if (!Array.isArray(record.districts) || record.districts.length > 8) return 'districts must be a JSON array with at most 8 entries';\n      for (const entry of record.districts) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'district entries must be objects'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `district ${e}`; } const e=numberIn(entry,'radius',1,12,{required:true,integer:true}); if(e)return `district ${e}`; if(entry.color && !COLOR_RE.test(String(entry.color))) return 'district color must be a CSS hex color'; }\n    }\n    if (record.landmarks !== undefined) {\n      if (!Array.isArray(record.landmarks) || record.landmarks.length > 12) return 'landmarks must be a JSON array with at most 12 entries';\n      for (const entry of record.landmarks) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'landmark entries must be objects'; if (!CITY_LANDMARK_KINDS.has(String(entry.kind||''))) return 'landmark kind is not supported'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `landmark ${e}`; } for (const key of ['w','h']) { const e=numberIn(entry,key,1,10,{required:true,integer:true}); if(e)return `landmark ${e}`; } }\n    }\n    if (record.props !== undefined) {\n      if (!Array.isArray(record.props) || record.props.length > 80) return 'props must be a JSON array with at most 80 entries';\n      for (const entry of record.props) { if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'prop entries must be objects'; if (!CITY_PROP_KINDS.has(String(entry.kind||''))) return 'prop kind is not supported'; for (const key of ['x','y']) { const e=playableCoord(entry,key); if(e)return `prop ${e}`; } if(entry.color && !COLOR_RE.test(String(entry.color))) return 'prop color must be a CSS hex color'; }\n    }\n    if (!MAP_ACCESS.includes(String(record.access || 'public'))) return 'map access is not supported';\n    return null;\n",
    'studio city validation',
)
text = replace_once(text, "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], eventTypes: [...EVENT_TYPES],\n", "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], eventTypes: [...EVENT_TYPES],\n", 'studio city options')
text = replace_once(text, "    maps: 'Map edits rebuild deterministic terrain and live portal travel. Built-in maps cannot be deleted.',\n", "    maps: 'Map edits rebuild deterministic terrain and live portal travel. City style, palette, districts, landmarks and street props drive the 9.6 runtime presentation and minimap. Built-in maps cannot be deleted.',\n", 'studio maps runtime note')
path.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# Fresh alpha content advertises each region's distinct city style.
# ---------------------------------------------------------------------------
path = root / 'server/engine/AlphaContent.mjs'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "const LEGACY_MAP_GATES = Object.freeze({ eldoria:1, frostpeak:1, shadowfen:1, emberhold:1, voidlands:25 });\n",
    "const LEGACY_MAP_GATES = Object.freeze({ eldoria:1, frostpeak:1, shadowfen:1, emberhold:1, voidlands:25 });\nconst CITY_STYLE_BY_REGION = Object.freeze({ eldoria:'royal',sunreach_coast:'harbor',ironwood:'ironwood',frostpeak:'alpine',shadowfen:'marsh',emberhold:'forge',crystal_deep:'crystal',stormwatch_isle:'storm',voidlands:'void',nightfall_citadel:'nightfall' });\n",
    'alpha city style map',
)
text = replace_once(text, "    access:'public', portals:PORTALS[region.id] || [],\n", "    cityStyle:CITY_STYLE_BY_REGION[region.id], access:'public', portals:PORTALS[region.id] || [],\n", 'alpha region city style')
text = replace_once(text, "  access:'gm', portals:PORTALS.gm_sanctum,\n", "  cityStyle:'sanctum', access:'gm', portals:PORTALS.gm_sanctum,\n", 'alpha gm city style')
path.write_text(text, encoding='utf-8')

print('Mor\'ia 9.6 world identity integration applied')
