from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} anchor not found')
    return text.replace(old, new, 1)


# -----------------------------------------------------------------------------
# Client map model: preserve authoritative width/height and generate real sizes.
# -----------------------------------------------------------------------------
MAPS = Path('src/game/maps.ts')
maps = MAPS.read_text(encoding='utf-8')
maps = replace_once(
    maps,
    "export const MAP_WIDTH = 80;\nexport const MAP_HEIGHT = 80;\nexport const TILE_SIZE = 32;",
    "export const MAP_WIDTH = 80;\nexport const MAP_HEIGHT = 80;\nexport const MIN_MAP_DIMENSION = 40;\nexport const MAX_MAP_DIMENSION = 192;\nexport const TILE_SIZE = 32;\n\nexport type SettlementClass = 'wilderness' | 'town' | 'city' | 'capital';\nexport interface UrbanBounds { x: number; y: number; width: number; height: number; }",
    'client map constants',
)
maps = replace_once(
    maps,
    "  biome: BiomeType;\n  seed?: number;",
    "  biome: BiomeType;\n  width?: number;\n  height?: number;\n  settlementClass?: SettlementClass;\n  urbanBounds?: UrbanBounds;\n  seed?: number;",
    'GameMap dimension fields',
)
start = maps.find('function cityCoord')
end = maps.find('\n\nconst BASE_MAPS', start)
if start < 0 or end < 0:
    raise SystemExit('client identity normalization block not found')
identity_block = r'''function cityCoord(value: unknown, fallback: number, dimension = MAP_WIDTH): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(dimension - 2, Math.round(n))) : fallback;
}
function cityColor(value: unknown, fallback: string): string { return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback; }
function settlementClassOf(value: unknown, mapId = ''): SettlementClass {
  const requested = String(value || (mapId === 'eldoria' ? 'capital' : 'city'));
  return (['wilderness','town','city','capital'] as const).includes(requested as SettlementClass) ? requested as SettlementClass : 'city';
}
function mapDimension(value: unknown, fallback = MAP_WIDTH): number { return integer(value, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, fallback); }
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
  const townCenter = { x: cityCoord(map.townCenter?.x, Math.floor(width / 2), width), y: cityCoord(map.townCenter?.y, Math.floor(height / 2), height) };
  const style = VALID_CITY_STYLES.has(map.cityStyle) ? map.cityStyle : undefined;
  const hydrated = withCityDefaults({
    id: map.id, name: map.name, style, biome: map.biome, townCenter, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor,
    districts: normalizeDistricts(map.districts, width, height, settlementClass), landmarks: normalizeLandmarks(map.landmarks, width, height, settlementClass), props: normalizeProps(map.props, width, height, settlementClass),
  });
  return { ...map, width, height, settlementClass, urbanBounds: normalizeUrbanBounds(map.urbanBounds, width, height, townCenter, settlementClass), townCenter, cityStyle: hydrated.style, cityAccent: hydrated.cityAccent, roofColor: hydrated.roofColor, wallColor: hydrated.wallColor, roadColor: hydrated.roadColor, districts: hydrated.districts, landmarks: hydrated.landmarks, props: hydrated.props };
}

export function getMapDimensions(map: Pick<GameMap, 'width' | 'height'> | undefined): { width: number; height: number } {
  return { width: mapDimension(map?.width, MAP_WIDTH), height: mapDimension(map?.height, MAP_HEIGHT) };
}'''
maps = maps[:start] + identity_block + maps[end:]
portal_start = maps.find('function normalizePortal')
portal_end = maps.find('\n\nexport function syncServerMaps', portal_start)
if portal_start < 0 or portal_end < 0:
    raise SystemExit('client portal normalization block not found')
portal_block = r'''function normalizePortal(raw: any, width = MAP_WIDTH, height = MAP_HEIGHT): Portal | null {
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
}'''
maps = maps[:portal_start] + portal_block + maps[portal_end:]
old_sync_dims = """    const spawnBase = base?.spawnPoint || { x: 40, y: 40 };
    const townBase = base?.townCenter || { x: 40, y: 40 };
    const portals = Array.isArray(raw.portals)
      ? raw.portals.map(normalizePortal).filter((portal: Portal | null): portal is Portal => Boolean(portal)).slice(0, 20)
      : (base?.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })) || []);"""
new_sync_dims = """    const width = mapDimension(raw.width, base?.width || MAP_WIDTH);
    const height = mapDimension(raw.height, base?.height || MAP_HEIGHT);
    const settlementClass = settlementClassOf(raw.settlementClass ?? base?.settlementClass, id);
    const spawnBase = base?.spawnPoint || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    const townBase = base?.townCenter || { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    const portals = Array.isArray(raw.portals)
      ? raw.portals.map((portal: any) => normalizePortal(portal, width, height)).filter((portal: Portal | null): portal is Portal => Boolean(portal)).slice(0, 20)
      : (base?.portals.map(portal => ({ ...portal, pos: { ...portal.pos }, targetSpawn: { ...portal.targetSpawn } })) || []);
    const townCenter = {
      x: integer(raw.townX ?? raw.townCenter?.x, 1, width - 2, townBase.x),
      y: integer(raw.townY ?? raw.townCenter?.y, 1, height - 2, townBase.y),
    };"""
maps = replace_once(maps, old_sync_dims, new_sync_dims, 'client sync dimensions')
maps = replace_once(maps, "      id,\n      name:", "      id,\n      width, height, settlementClass, urbanBounds: normalizeUrbanBounds(raw.urbanBounds ?? base?.urbanBounds, width, height, townCenter, settlementClass),\n      name:", 'client sync dimension payload')
maps = replace_once(maps, "        x: integer(raw.spawnX ?? raw.spawnPoint?.x, 1, MAP_WIDTH - 2, spawnBase.x),\n        y: integer(raw.spawnY ?? raw.spawnPoint?.y, 1, MAP_HEIGHT - 2, spawnBase.y),", "        x: integer(raw.spawnX ?? raw.spawnPoint?.x, 1, width - 2, spawnBase.x),\n        y: integer(raw.spawnY ?? raw.spawnPoint?.y, 1, height - 2, spawnBase.y),", 'client spawn bounds')
maps = replace_once(maps, "      townCenter: {\n        x: integer(raw.townX ?? raw.townCenter?.x, 1, MAP_WIDTH - 2, townBase.x),\n        y: integer(raw.townY ?? raw.townCenter?.y, 1, MAP_HEIGHT - 2, townBase.y),\n      },", "      townCenter,", 'client town bounds')
maps = replace_once(maps, "      districts: Array.isArray(raw.districts) ? normalizeDistricts(raw.districts) : (base?.districts || []),\n      landmarks: Array.isArray(raw.landmarks) ? normalizeLandmarks(raw.landmarks) : (base?.landmarks || []),\n      props: Array.isArray(raw.props) ? normalizeProps(raw.props) : (base?.props || []),", "      districts: Array.isArray(raw.districts) ? normalizeDistricts(raw.districts, width, height, settlementClass) : (base?.districts || []),\n      landmarks: Array.isArray(raw.landmarks) ? normalizeLandmarks(raw.landmarks, width, height, settlementClass) : (base?.landmarks || []),\n      props: Array.isArray(raw.props) ? normalizeProps(raw.props, width, height, settlementClass) : (base?.props || []),", 'client city identity dimensions')
maps = replace_once(
    maps,
    "  const known = new Set(Object.keys(next));\n  for (const map of Object.values(next)) map.portals = map.portals.filter(portal => known.has(portal.targetMap));",
    "  const known = new Set(Object.keys(next));\n  for (const map of Object.values(next)) {\n    map.portals = map.portals.filter(portal => {\n      if (!known.has(portal.targetMap)) return false;\n      const target = next[portal.targetMap];\n      const targetWidth = target?.width || MAP_WIDTH;\n      const targetHeight = target?.height || MAP_HEIGHT;\n      return portal.targetSpawn.x >= 1 && portal.targetSpawn.x <= targetWidth - 2 && portal.targetSpawn.y >= 1 && portal.targetSpawn.y <= targetHeight - 2;\n    });\n  }",
    'client portal destination bounds',
)
maps = replace_once(maps, "  const tc = mapData.townCenter;\n\n  for (let y = 0; y < MAP_HEIGHT; y++) {", "  const tc = mapData.townCenter;\n  const { width: mapWidth, height: mapHeight } = getMapDimensions(mapData);\n\n  for (let y = 0; y < mapHeight; y++) {", 'client generation height')
maps = replace_once(maps, "    for (let x = 0; x < MAP_WIDTH; x++) {", "    for (let x = 0; x < mapWidth; x++) {", 'client generation width')
maps = replace_once(maps, "      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {", "      if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) {", 'client generation boundary')
for required in ['MAX_MAP_DIMENSION = 192', 'getMapDimensions', 'settlementClass', 'urbanBounds', 'for (let y = 0; y < mapHeight; y++)', 'for (let x = 0; x < mapWidth; x++)']:
    if required not in maps:
        raise SystemExit(f'client maps 9.35B marker missing: {required}')
MAPS.write_text(maps, encoding='utf-8')


# -----------------------------------------------------------------------------
# Minimap: physical map dimensions drive scale, sampling and marker positions.
# -----------------------------------------------------------------------------
MINIMAP = Path('src/components/WorldMiniMap.tsx')
MINIMAP.write_text(r'''import { useMemo } from 'react';
import type { Monster, Player, TileType } from '../game/types';
import { MAPS, MAP_HEIGHT, MAP_WIDTH, generateMap, getBiomeTint, getMapDimensions } from '../game/maps';
import { getCityMinimapMarkers } from '../game/cityPresentation';

const TILE_COLORS: Partial<Record<TileType, string>> = {
  water: '#285a86', tree: '#294838', stone: '#77736b', sand: '#bba36c', path: '#8a7456', wall: '#27272c',
  floor: '#8f826b', lava: '#a13a2d', bush: '#37563b', rock: '#554e4d', wood_floor: '#765a3a', bridge: '#8b704b',
};

interface Props {
  player: Player;
  monsters: Monster[];
  mapId: string;
}

export default function WorldMiniMap({ player, monsters, mapId }: Props) {
  const map = MAPS[mapId] || MAPS.eldoria;
  const size = 232;
  const { width: mapWidth, height: mapHeight } = getMapDimensions(map);
  const scale = size / mapWidth;
  const height = size * (mapHeight / mapWidth);
  const sample = Math.max(2, Math.ceil(Math.max(mapWidth, mapHeight) / 80));

  const { tiles, markers } = useMemo(() => {
    const world = generateMap(map.id);
    const tint = getBiomeTint(map.biome);
    const nextTiles: Array<{ x: number; y: number; color: string }> = [];
    for (let y = 0; y < mapHeight; y += sample) {
      for (let x = 0; x < mapWidth; x += sample) {
        const tile = world[y]?.[x];
        const fallback = ((x + y) & 2) === 0 ? tint.ground : tint.groundDark;
        nextTiles.push({ x, y, color: tile ? (TILE_COLORS[tile.type] || fallback) : fallback });
      }
    }
    return { tiles: nextTiles, markers: getCityMinimapMarkers(map) };
  }, [map.id, map.biome, map.cityAccent, map.districts, map.landmarks, map.portals, mapWidth, mapHeight, sample]);

  return (
    <div data-minimap-map={map.id} data-map-width={mapWidth} data-map-height={mapHeight} className="relative overflow-hidden border border-[#806437] bg-[#070a10] shadow-[inset_0_0_18px_rgba(0,0,0,.85)]" style={{ width: `${size}px`, height: `${height}px` }}>
      {tiles.map((tile, index) => <div key={index} className="absolute" style={{ left: tile.x * scale, top: tile.y * scale, width: sample * scale + .4, height: sample * scale + .4, background: tile.color }} />)}

      {map.districts.map((district) => <div key={district.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed" title={district.name} style={{ left: district.x * scale, top: district.y * scale, width: Math.max(8, district.radius * scale * 2), height: Math.max(8, district.radius * scale * 2), borderColor: `${district.color}aa`, background: `${district.color}18` }} />)}

      {markers.filter((marker) => marker.kind !== 'district').map((marker) => <div key={marker.id} data-minimap-marker={marker.id} className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-black/70 bg-black/65 font-black" title={marker.name} style={{ left: marker.x * scale, top: marker.y * scale, width: marker.kind === 'portal' ? 7 : 10, height: marker.kind === 'portal' ? 7 : 10, color: marker.color, fontSize: marker.kind === 'portal' ? 6 : 7, boxShadow: `0 0 4px ${marker.color}66` }}>{marker.kind === 'portal' ? '' : marker.icon}</div>)}

      {monsters.filter((monster) => !monster.dead).slice(0, 50).map((monster) => <div key={monster.id} className="absolute z-30" style={{ left: monster.pos.x * scale - 1.5, top: monster.pos.y * scale - 1.5, width: 3, height: 3, background: monster.type === 'boss' ? '#ffd87b' : monster.type === 'elite' ? '#b88aff' : '#ff5666' }} />)}
      <div data-minimap-player="true" className="absolute z-40 -translate-x-1/2 -translate-y-1/2 border border-black bg-amber-200" style={{ left: player.pos.x * scale, top: player.pos.y * scale, width: 7, height: 7, boxShadow: '0 0 7px rgba(255,225,160,.95)' }} />
      <div className="pointer-events-none absolute bottom-1 left-1 z-50 max-w-[150px] border border-black/50 bg-black/65 px-1.5 py-0.5 text-[7px] font-black tracking-wider" style={{ color: map.cityAccent }}>{map.name}</div>
    </div>
  );
}
''', encoding='utf-8')


# -----------------------------------------------------------------------------
# City Designer: operate inside the selected map's real dimensions and budgets.
# -----------------------------------------------------------------------------
CITY = Path('src/components/CityDesigner.tsx')
city = CITY.read_text(encoding='utf-8')
city = replace_once(city, "function clamp(value: number, min = 1, max = 78)", "function clamp(value: number, min = 1, max = Number.MAX_SAFE_INTEGER)", 'City Designer clamp')
marker = 'export default function CityDesigner({ onApplied }: Props) {'
idx = city.find(marker)
if idx < 0:
    raise SystemExit('City Designer component marker not found')
prefix = city[:idx]
body = city[idx:].replace('MAP_WIDTH', 'mapWidth').replace('MAP_HEIGHT', 'mapHeight')
city = prefix + body
city = replace_once(
    city,
    "  const palette = CITY_PALETTES[draft.cityStyle];",
    "  const palette = CITY_PALETTES[draft.cityStyle];\n  const mapWidth = Math.max(40, Math.min(192, Math.round(Number(draft.width) || MAP_WIDTH)));\n  const mapHeight = Math.max(40, Math.min(192, Math.round(Number(draft.height) || MAP_HEIGHT)));\n  const isCapital = draft.settlementClass === 'capital';\n  const districtLimit = isCapital ? 24 : 8;\n  const landmarkLimit = isCapital ? 64 : 12;\n  const propLimit = isCapital ? 320 : 80;\n  const districtRadiusLimit = isCapital ? 24 : 12;\n  const landmarkSizeLimit = isCapital ? 20 : 10;\n  const roadXPct = Math.max(1.2, 7 / mapWidth * 100);\n  const roadYPct = Math.max(1.2, 7 / mapHeight * 100);",
    'City Designer dimension state',
)
city = city.replace("[...current.landmarks, entry].slice(-12)", "[...current.landmarks, entry].slice(-landmarkLimit)")
city = city.replace("[...current.districts, entry].slice(-8)", "[...current.districts, entry].slice(-districtLimit)")
city = city.replace("[...current.props, entry].slice(-80)", "[...current.props, entry].slice(-propLimit)")
city = city.replace("current.landmarks.length >= 12", "current.landmarks.length >= landmarkLimit")
city = city.replace("current.districts.length >= 8", "current.districts.length >= districtLimit")
city = city.replace("current.props.length >= 80", "current.props.length >= propLimit")
city = city.replace("x: clamp(source.x + 1), y: clamp(source.y + 1)", "x: clamp(source.x + 1, 1, mapWidth - source.w - 1), y: clamp(source.y + 1, 1, mapHeight - source.h - 1)", 1)
city = city.replace("x: clamp(source.x + 1), y: clamp(source.y + 1)", "x: clamp(source.x + 1, 1, mapWidth - 2), y: clamp(source.y + 1, 1, mapHeight - 2)", 1)
city = city.replace("x: clamp(source.x + 1), y: clamp(source.y + 1)", "x: clamp(source.x + 1, 1, mapWidth - 2), y: clamp(source.y + 1, 1, mapHeight - 2)", 1)
city = city.replace("{draft.landmarks.length}/12 buildings", "{draft.landmarks.length}/{landmarkLimit} buildings")
city = replace_once(city, "<select value={mapId} onChange={(e) => chooseMap(e.target.value)}", "<select data-city-designer-map-select=\"true\" value={mapId} onChange={(e) => chooseMap(e.target.value)}", 'City Designer map select QA hook')
old_preview = "<div ref={previewRef} onPointerDown={previewPointerDown} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag} className=\"relative mx-auto aspect-square w-full max-w-[620px] touch-none cursor-crosshair overflow-hidden border-2 border-[#665332] shadow-[inset_0_0_35px_rgba(0,0,0,.75)]\" style={{ background: palette.district, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: `${100 / mapWidth}% ${100 / mapHeight}%` }}>"
new_preview = "<div ref={previewRef} data-city-designer-preview=\"true\" data-map-width={mapWidth} data-map-height={mapHeight} data-settlement-class={draft.settlementClass || 'city'} data-landmark-limit={landmarkLimit} onPointerDown={previewPointerDown} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag} className=\"relative mx-auto w-full max-w-[620px] touch-none cursor-crosshair overflow-hidden border-2 border-[#665332] shadow-[inset_0_0_35px_rgba(0,0,0,.75)]\" style={{ aspectRatio: `${mapWidth} / ${mapHeight}`, background: palette.district, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: `${100 / mapWidth}% ${100 / mapHeight}%` }}>"
city = replace_once(city, old_preview, new_preview, 'City Designer preview dimensions')
old_roads = "        <div className=\"absolute left-0 right-0 h-[7%] pointer-events-none\" style={{ top: `${draft.townCenter.y / mapHeight * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} /><div className=\"absolute bottom-0 top-0 w-[7%] pointer-events-none\" style={{ left: `${draft.townCenter.x / mapWidth * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} />"
new_roads = "        <div className=\"pointer-events-none absolute left-0 right-0\" style={{ top: `${draft.townCenter.y / mapHeight * 100 - roadYPct / 2}%`, height: `${roadYPct}%`, background: `${draft.roadColor}bb` }} /><div className=\"pointer-events-none absolute bottom-0 top-0\" style={{ left: `${draft.townCenter.x / mapWidth * 100 - roadXPct / 2}%`, width: `${roadXPct}%`, background: `${draft.roadColor}bb` }} />"
city = replace_once(city, old_roads, new_roads, 'City Designer road scaling')
city = city.replace("key={l.id} onPointerDown={(e) => beginDrag(e, { type: 'landmark', id: l.id })}", "key={l.id} data-city-landmark-id={l.id} onPointerDown={(e) => beginDrag(e, { type: 'landmark', id: l.id })}")
city = city.replace("width: Math.max(18, d.radius * 8), height: Math.max(18, d.radius * 8)", "width: `max(18px, ${d.radius * 2 / mapWidth * 100}%)`, height: `max(18px, ${d.radius * 2 / mapHeight * 100}%)`")
city = city.replace("<NumberField label=\"X\" value={selectedLandmark.x} onChange={(x) => updateLandmark({ x })} /><NumberField label=\"Y\" value={selectedLandmark.y} onChange={(y) => updateLandmark({ y })} /><NumberField label=\"W\" value={selectedLandmark.w} min={1} max={10}", "<NumberField label=\"X\" value={selectedLandmark.x} min={1} max={mapWidth - selectedLandmark.w - 1} onChange={(x) => updateLandmark({ x })} /><NumberField label=\"Y\" value={selectedLandmark.y} min={1} max={mapHeight - selectedLandmark.h - 1} onChange={(y) => updateLandmark({ y })} /><NumberField label=\"W\" value={selectedLandmark.w} min={1} max={landmarkSizeLimit}")
city = city.replace("<NumberField label=\"H\" value={selectedLandmark.h} min={1} max={10}", "<NumberField label=\"H\" value={selectedLandmark.h} min={1} max={landmarkSizeLimit}")
city = city.replace("<NumberField label=\"Radius\" value={selectedDistrict.radius} min={1} max={12}", "<NumberField label=\"Radius\" value={selectedDistrict.radius} min={1} max={districtRadiusLimit}")
city = city.replace("function NumberField({ label, value, onChange, min = 1, max = 78 }", "function NumberField({ label, value, onChange, min = 1, max = 192 }")
city = replace_once(city, "<div>{draft.landmarks.length}/{landmarkLimit} buildings</div><div>{occupancy} blocked tiles</div>", "<div>{mapWidth}×{mapHeight} · {(draft.settlementClass || 'city').toUpperCase()}</div><div>{draft.landmarks.length}/{landmarkLimit} buildings · {occupancy} blocked tiles</div>", 'City Designer dimension badge')
for required in ['data-city-designer-preview', 'data-map-width={mapWidth}', 'data-landmark-limit={landmarkLimit}', 'landmarkLimit = isCapital ? 64 : 12', 'mapWidth - selectedLandmark.w - 1']:
    if required not in city:
        raise SystemExit(f'City Designer 9.35B marker missing: {required}')
CITY.write_text(city, encoding='utf-8')


# -----------------------------------------------------------------------------
# Visual QA: deterministic 160x160 capital used by minimap and City Designer.
# -----------------------------------------------------------------------------
VISUAL = Path('src/visualQa.tsx')
visual = VISUAL.read_text(encoding='utf-8')
visual = replace_once(visual, "import DPSMeter from './components/DPSMeter';", "import DPSMeter from './components/DPSMeter';\nimport WorldMiniMap from './components/WorldMiniMap';\nimport CityDesigner from './components/CityDesigner';", 'visual QA capital imports')
visual = replace_once(visual, "import { dpsMeter } from './game/dpsMeter';", "import { dpsMeter } from './game/dpsMeter';\nimport { syncServerMaps } from './game/maps';", 'visual QA map sync import')
qa_map = r'''
const QA_GRAND_MAP = {
  id: 'qa_grand_capital', name: 'Nova Auroria', description: 'Capital sintética para prova visual de escala.', biome: 'plains',
  width: 160, height: 160, settlementClass: 'capital', urbanBounds: { x: 28, y: 28, width: 104, height: 104 },
  seed: 935, spawnX: 80, spawnY: 80, townX: 80, townY: 80, townRange: 18,
  cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
  districts: [
    { id: 'qa_civic', name: 'Distrito Cívico', icon: '♜', x: 80, y: 80, radius: 14, color: '#d8b45a' },
    { id: 'qa_high', name: 'Distrito Alto', icon: '◇', x: 126, y: 68, radius: 11, color: '#caa6ff' },
  ],
  landmarks: [
    { id: 'qa_sun_keep', name: 'Fortaleza Solar', kind: 'keep', icon: '♜', x: 70, y: 62, w: 18, h: 14 },
    { id: 'qa_far_keep', name: 'Bastião do Horizonte', kind: 'tower', icon: '◆', x: 124, y: 72, w: 16, h: 12 },
    { id: 'qa_grand_market', name: 'Grande Mercado', kind: 'market', icon: '⚖', x: 102, y: 110, w: 14, h: 10 },
  ],
  props: [
    { id: 'qa_banner_far', kind: 'banner', x: 142, y: 118, color: '#d8b45a' },
    { id: 'qa_statue', kind: 'statue', x: 80, y: 94, color: '#f5de8f' },
  ],
  portals: [{ x: 150, y: 80, targetMap: 'eldoria', targetX: 40, targetY: 40, label: 'Portal de Eldoria' }],
};

const QA_GRAND_PLAYER = { ...QA_PLAYER, mapId: 'qa_grand_capital', pos: { x: 136, y: 118 } } as unknown as Player;
'''
insert_at = visual.find('\nfunction seedVisualQa()')
if insert_at < 0:
    raise SystemExit('visual QA seed marker not found')
visual = visual[:insert_at] + '\n' + qa_map + visual[insert_at:]
visual = replace_once(visual, "  localStorage.removeItem('moria_mail_Aurora');", "  localStorage.removeItem('moria_mail_Aurora');\n  localStorage.removeItem('moria_city_designer_maps');\n  syncServerMaps([QA_GRAND_MAP]);", 'visual QA capital seed')
visual = replace_once(visual, "      {panel === 'dps' && <DPSMeter onClose={() => {}} />}", "      {panel === 'dps' && <DPSMeter onClose={() => {}} />}\n      {panel === 'grand-minimap' && <div className=\"relative z-10 flex min-h-screen items-center justify-center\"><WorldMiniMap player={QA_GRAND_PLAYER} monsters={[]} mapId=\"qa_grand_capital\" /></div>}\n      {panel === 'grand-city-designer' && <div className=\"relative z-10 p-4\"><CityDesigner /></div>}", 'visual QA capital panels')
for required in ['QA_GRAND_MAP', "width: 160, height: 160", "panel === 'grand-minimap'", "panel === 'grand-city-designer'"]:
    if required not in visual:
        raise SystemExit(f'visual QA 9.35B marker missing: {required}')
VISUAL.write_text(visual, encoding='utf-8')


# -----------------------------------------------------------------------------
# Static regression tests keep dimension-aware client architecture from drifting.
# -----------------------------------------------------------------------------
Path('server/test/grand-capital-client-9-35.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('9.35B client map model generates declared dimensions instead of global 80x80', () => {
  const source = read('src/game/maps.ts');
  assert.match(source, /MAX_MAP_DIMENSION = 192/);
  assert.match(source, /getMapDimensions/);
  assert.match(source, /for \(let y = 0; y < mapHeight; y\+\+\)/);
  assert.match(source, /for \(let x = 0; x < mapWidth; x\+\+\)/);
  assert.match(source, /targetWidth - 2/);
});

test('9.35B minimap scales sampling markers and player by the selected map dimensions', () => {
  const source = read('src/components/WorldMiniMap.tsx');
  assert.match(source, /getMapDimensions\(map\)/);
  assert.match(source, /data-map-width=\{mapWidth\}/);
  assert.match(source, /data-map-height=\{mapHeight\}/);
  assert.match(source, /player\.pos\.x \* scale/);
});

test('9.35B City Designer uses live dimensions and capital authoring budgets', () => {
  const source = read('src/components/CityDesigner.tsx');
  assert.match(source, /landmarkLimit = isCapital \? 64 : 12/);
  assert.match(source, /data-city-designer-preview/);
  assert.match(source, /data-landmark-limit=\{landmarkLimit\}/);
  assert.doesNotMatch(source, /max = 78/);
});

test('9.35B visual proof owns a synthetic 160x160 capital with far-side content', () => {
  const source = read('src/visualQa.tsx');
  assert.match(source, /qa_grand_capital/);
  assert.match(source, /width: 160, height: 160/);
  assert.match(source, /qa_far_keep/);
  assert.match(source, /x: 136, y: 118/);
});
''', encoding='utf-8')


# -----------------------------------------------------------------------------
# Browser proof: far-side coordinates must land on the far half of both surfaces.
# -----------------------------------------------------------------------------
Path('tools/capture-moria-9-35b.mjs').write_text(r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.35b-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });

await page.goto('http://127.0.0.1:4173/visual-qa.html?panel=grand-minimap', { waitUntil: 'networkidle' });
await page.locator('[data-visual-qa-ready="grand-minimap"]').waitFor({ state: 'visible' });
const minimap = page.locator('[data-minimap-map="qa_grand_capital"]');
await minimap.waitFor({ state: 'visible' });
if (await minimap.getAttribute('data-map-width') !== '160' || await minimap.getAttribute('data-map-height') !== '160') throw new Error('9.35B minimap did not preserve 160x160 dimensions');
const minimapBox = await minimap.boundingBox();
const farMarker = page.getByTitle('Bastião do Horizonte');
const farBox = await farMarker.boundingBox();
const playerBox = await page.locator('[data-minimap-player="true"]').boundingBox();
if (!minimapBox || !farBox || !playerBox) throw new Error('9.35B minimap proof elements are missing');
if (farBox.x + farBox.width / 2 <= minimapBox.x + minimapBox.width / 2) throw new Error('9.35B far landmark collapsed into legacy 80-tile half on minimap');
if (playerBox.x + playerBox.width / 2 <= minimapBox.x + minimapBox.width / 2 || playerBox.y + playerBox.height / 2 <= minimapBox.y + minimapBox.height / 2) throw new Error('9.35B far-side player is not mapped into the expected minimap quadrant');
await page.screenshot({ path: `${output}/grand-minimap.png`, fullPage: true });

await page.goto('http://127.0.0.1:4173/visual-qa.html?panel=grand-city-designer', { waitUntil: 'networkidle' });
await page.locator('[data-visual-qa-ready="grand-city-designer"]').waitFor({ state: 'visible' });
const select = page.locator('[data-city-designer-map-select="true"]');
await select.waitFor({ state: 'visible' });
await select.selectOption('qa_grand_capital');
await page.waitForFunction(() => document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width') === '160');
const preview = page.locator('[data-city-designer-preview="true"]');
if (await preview.getAttribute('data-map-height') !== '160') throw new Error('9.35B City Designer height did not follow the selected capital');
if (await preview.getAttribute('data-settlement-class') !== 'capital' || await preview.getAttribute('data-landmark-limit') !== '64') throw new Error('9.35B City Designer did not load capital authoring budgets');
const previewBox = await preview.boundingBox();
const farBuilding = page.locator('[data-city-landmark-id="qa_far_keep"]');
await farBuilding.waitFor({ state: 'visible' });
const buildingBox = await farBuilding.boundingBox();
if (!previewBox || !buildingBox) throw new Error('9.35B City Designer visual proof elements are missing');
if (buildingBox.x + buildingBox.width / 2 <= previewBox.x + previewBox.width / 2) throw new Error('9.35B City Designer placed x=124 landmark on the legacy half of the map');
await page.screenshot({ path: `${output}/grand-city-designer.png`, fullPage: true });

await browser.close();
console.log(`Captured Mor'ia 9.35B grand-capital client screenshots in ${output}`);
''', encoding='utf-8')


# -----------------------------------------------------------------------------
# Documentation: record the client-side scale proof before Eldoria expands.
# -----------------------------------------------------------------------------
DOC = Path('docs/MORIA_9_35_GRAND_CAPITAL_FOUNDATION.md')
doc = DOC.read_text(encoding='utf-8')
append = r'''

## 9.35B — cliente, minimapa e City Designer

O cliente agora preserva `width`, `height`, `settlementClass` e `urbanBounds` recebidos do servidor. `generateMap()` deixa de iterar pela constante histórica 80×80 e usa as dimensões reais do mapa selecionado, mantendo 80×80 como fallback compatível.

O minimapa deriva escala, altura, amostragem, marcadores e posição do jogador das dimensões reais. Para evitar explosão de DOM, a amostragem cresce de forma limitada em mapas maiores sem mudar coordenadas de gameplay.

O City Designer passa a usar largura/altura reais para cliques, arraste, footprints, grid, estradas e limites de coordenadas. Capitais reconhecem o mesmo orçamento do servidor: 24 distritos, 64 landmarks, 320 props, landmarks de até 20×20 e raio distrital até 24. A dimensão continua sendo propriedade do Studio/servidor; o editor visual não redimensiona mapas implicitamente.

### Prova visual 160×160
O harness cria `qa_grand_capital`, uma capital sintética 160×160 com conteúdo após a coordenada 120. O Playwright exige que `Bastião do Horizonte` e o jogador apareçam na metade distante do minimapa, e que o mesmo landmark apareça à direita do centro no City Designer. O screenshot só é aceito após essas verificações geométricas.

### Próximo passo — 9.36 Grand Eldoria
Com servidor e cliente dimension-aware, Eldoria pode ser expandida deliberadamente para 160×160 com distritos, muralhas, vias, landmarks, housing e serviços planejados como uma capital real, sem ampliar automaticamente as demais regiões.
'''
if '## 9.35B — cliente, minimapa e City Designer' not in doc:
    doc += append
DOC.write_text(doc, encoding='utf-8')

print("Mor'ia 9.35B Grand Capital client scale pass prepared")
