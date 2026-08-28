from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def once(text, old, new, label):
    if new in text: return text
    if old not in text: raise SystemExit(f'contract changed: {label}')
    return text.replace(old, new, 1)

# 1) Explicit house landmark type: authored buildings are first-class city content.
p='src/game/cityIdentity.ts'; s=read(p)
s=s.replace("'graveyard' | 'lodge' | 'tower';", "'graveyard' | 'lodge' | 'tower' | 'house';")
write(p,s)

p='src/game/maps.ts'; s=read(p)
s=s.replace("'graveyard','lodge','tower'", "'graveyard','lodge','tower','house'")
# helper to share exact landmark geometry with client walkability
if 'function blocksByLandmark' not in s:
    anchor="function isInboundTarget(mapId: string, x: number, y: number): boolean {"
    helper="""function blocksByLandmark(map: GameMap, x: number, y: number): boolean {\n  return map.landmarks.some((landmark) =>\n    x >= landmark.x && x < landmark.x + landmark.w &&\n    y >= landmark.y && y < landmark.y + landmark.h\n  );\n}\n\n"""
    if anchor not in s: raise SystemExit('maps inbound anchor changed')
    s=s.replace(anchor, helper+anchor,1)
# special path stays open; then exact landmark footprints become authoritative walls
old="""      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {\n        type = 'wall'; walkable = false; blocksSight = true;\n      } else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {\n        type = 'floor';\n      } else if ((mapData.spawnPoint.x === x && mapData.spawnPoint.y === y) || mapData.portals.some(portal => portal.pos.x === x && portal.pos.y === y) || isInboundTarget(mapId, x, y)) {\n        type = 'path';\n      } else {\n"""
new="""      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {\n        type = 'wall'; walkable = false; blocksSight = true;\n      } else if ((mapData.spawnPoint.x === x && mapData.spawnPoint.y === y) || mapData.portals.some(portal => portal.pos.x === x && portal.pos.y === y) || isInboundTarget(mapId, x, y)) {\n        type = 'path';\n      } else if (blocksByLandmark(mapData, x, y)) {\n        // Client prediction mirrors authoritative landmark footprints exactly.\n        type = 'wall'; walkable = false; blocksSight = true;\n      } else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {\n        type = 'floor';\n      } else {\n"""
s=once(s,old,new,'client landmark collision')
write(p,s)

# 2) City presentation maps house explicitly.
p='src/game/cityPresentation.ts'; s=read(p)
s=s.replace("    case 'tower': return 'tower';\n    default: return 'house';", "    case 'tower': return 'tower';\n    case 'house': return 'house';\n    default: return 'house';")
write(p,s)

# 3) Studio validates house as a supported landmark kind.
p='server/engine/ContentStudio.mjs'; s=read(p)
s=s.replace("'graveyard','lodge','tower'", "'graveyard','lodge','tower','house'")
write(p,s)

# 4) Server World keeps all presentation settings in authoritative map definitions,
#    and landmark rectangles become authoritative walkability geometry.
p='server/engine/World.mjs'; s=read(p)
if 'function boundedNumber' not in s:
    s=once(s,
"function integer(value, min, max, fallback) {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;\n}\n",
"function integer(value, min, max, fallback) {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;\n}\n\nfunction boundedNumber(value, min, max, fallback) {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;\n}\n", 'bounded number helper')
# Add config fields so Studio edits survive World normalization and snapshots.
s=once(s,
"    townRange: integer(record?.townRange, 0, 20, base?.townRange ?? 8),\n    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),",
"    townRange: integer(record?.townRange, 0, 20, base?.townRange ?? 8),\n    nameplateOffsetY: boundedNumber(record?.nameplateOffsetY, -32, 12, base?.nameplateOffsetY ?? -9),\n    nameplateScale: boundedNumber(record?.nameplateScale, .55, 1.5, base?.nameplateScale ?? .82),\n    nameplateBarWidth: boundedNumber(record?.nameplateBarWidth, 18, 64, base?.nameplateBarWidth ?? 30),\n    nameplateBarHeight: boundedNumber(record?.nameplateBarHeight, 2, 8, base?.nameplateBarHeight ?? 3),\n    nameplateFontSize: boundedNumber(record?.nameplateFontSize, 7, 14, base?.nameplateFontSize ?? 8),\n    nameplateShowValues: typeof record?.nameplateShowValues === 'boolean' ? record.nameplateShowValues : (base?.nameplateShowValues ?? false),\n    residentialRingEnabled: typeof record?.residentialRingEnabled === 'boolean' ? record.residentialRingEnabled : (base?.residentialRingEnabled ?? false),\n    residentialRingDensity: integer(record?.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),", 'server presentation config')
# Expose settings in map definitions sent to clients.
s=once(s,
"      cityStyle: config.cityStyle, cityAccent: config.cityAccent, roofColor: config.roofColor, wallColor: config.wallColor, roadColor: config.roadColor,\n      districts: config.districts.map(entry => ({ ...entry })), landmarks: config.landmarks.map(entry => ({ ...entry })), props: config.props.map(entry => ({ ...entry })),",
"      cityStyle: config.cityStyle, cityAccent: config.cityAccent, roofColor: config.roofColor, wallColor: config.wallColor, roadColor: config.roadColor,\n      nameplateOffsetY: config.nameplateOffsetY, nameplateScale: config.nameplateScale, nameplateBarWidth: config.nameplateBarWidth,\n      nameplateBarHeight: config.nameplateBarHeight, nameplateFontSize: config.nameplateFontSize, nameplateShowValues: config.nameplateShowValues,\n      residentialRingEnabled: config.residentialRingEnabled, residentialRingDensity: config.residentialRingDensity,\n      districts: config.districts.map(entry => ({ ...entry })), landmarks: config.landmarks.map(entry => ({ ...entry })), props: config.props.map(entry => ({ ...entry })),", 'server definition propagation')
# authoritative landmark collision. Spawn/portal path precedence preserved; destination is forcePath after build.
old="""        if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {\n          type = 'wall'; walkable = false; blocksSight = true;\n        } else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) {\n          type = 'floor';\n        } else if ((config.spawnPoint.x === x && config.spawnPoint.y === y) || config.portals.some(portal => portal.pos.x === x && portal.pos.y === y)) {\n          type = 'path';\n        } else {\n"""
new="""        if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {\n          type = 'wall'; walkable = false; blocksSight = true;\n        } else if ((config.spawnPoint.x === x && config.spawnPoint.y === y) || config.portals.some(portal => portal.pos.x === x && portal.pos.y === y)) {\n          type = 'path';\n        } else if (config.landmarks.some(landmark => x >= landmark.x && x < landmark.x + landmark.w && y >= landmark.y && y < landmark.y + landmark.h)) {\n          // Content Studio landmark geometry is authoritative: visual buildings and\n          // movement collision now share the exact same authored rectangle.\n          type = 'wall'; walkable = false; blocksSight = true;\n        } else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) {\n          type = 'floor';\n        } else {\n"""
s=once(s,old,new,'server landmark collision')
write(p,s)

# 5) Relay/sim players use same map nameplate presentation too.
p='src/components/GameScreen.tsx'; s=read(p)
s=s.replace("drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction, `${op.name} [${op.level}]`, op.hp, op.maxHp, now, op.color, op.mounted, op.mountIcon);",
            "drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction, `${op.name} [${op.level}]`, op.hp, op.maxHp, now, op.color, op.mounted, op.mountIcon, undefined, undefined, 0, 0, MAPS[currentMapIdRef.current] || MAPS.eldoria);")
s=s.replace("drawPlayer(ctx, sx, sy, TILE_SIZE, 'down', `${sim.name} [${sim.level}]`, 100, 100, now, sim.color, false, undefined);",
            "drawPlayer(ctx, sx, sy, TILE_SIZE, 'down', `${sim.name} [${sim.level}]`, 100, 100, now, sim.color, false, undefined, undefined, undefined, 0, 0, MAPS[currentMapIdRef.current] || MAPS.eldoria);")
write(p,s)

# 6) Behavioral server tests for actual authority, not just textual contracts.
p='server/test/city-geometry-9-7.test.mjs'
if not (ROOT/p).exists():
    write(p, """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { WorldManager } from '../engine/World.mjs';\n\ntest('9.7 authored landmark rectangles block authoritative movement geometry', () => {\n  const world = new WorldManager();\n  const defs = world.syncContentMaps([{\n    id:'eldoria', biome:'plains', seed:42, spawnX:40, spawnY:40, townX:40, townY:40, townRange:10, levelRequired:1, access:'public',\n    landmarks:[{id:'home_1',name:'Editable House',kind:'house',icon:'⌂',x:30,y:30,w:3,h:2}],\n    nameplateOffsetY:-12, nameplateScale:.72, nameplateBarWidth:26, nameplateBarHeight:3, nameplateFontSize:8, nameplateShowValues:false,\n    residentialRingEnabled:false, residentialRingDensity:0, portals:[],\n  }]);\n  const map = world.getMap('eldoria');\n  assert.equal(map.tiles[30][30].walkable, false);\n  assert.equal(map.tiles[31][32].walkable, false);\n  assert.equal(map.tiles[32][30].walkable, true);\n  const eldoria = defs.find(entry => entry.id === 'eldoria');\n  assert.equal(eldoria.nameplateOffsetY, -12);\n  assert.equal(eldoria.nameplateScale, .72);\n  assert.equal(eldoria.nameplateBarWidth, 26);\n  assert.equal(eldoria.nameplateShowValues, false);\n});\n\ntest('9.7 spawn/portal safety wins over landmark geometry', () => {\n  const world = new WorldManager();\n  world.syncContentMaps([{\n    id:'eldoria', biome:'plains', seed:42, spawnX:40, spawnY:40, townX:40, townY:40, townRange:10, levelRequired:1, access:'public',\n    landmarks:[{id:'bad_overlap',name:'Overlap',kind:'house',icon:'⌂',x:39,y:39,w:3,h:3}], portals:[],\n  }]);\n  assert.equal(world.getMap('eldoria').tiles[40][40].walkable, true);\n});\n""")

# extend visual regression contract with authoritative geometry markers
p='server/test/reference-visual-9-7.test.mjs'; s=read(p)
if 'movement collision now share' not in s:
    s += """\n\ntest('9.7 city authoring exposes real houses and shared authoritative geometry', () => {\n  const identity = read('src/game/cityIdentity.ts');\n  const clientMaps = read('src/game/maps.ts');\n  const world = read('server/engine/World.mjs');\n  const studio = read('server/engine/ContentStudio.mjs');\n  assert.match(identity, /'house'/);\n  assert.match(clientMaps, /blocksByLandmark/);\n  assert.match(world, /movement collision now share/);\n  assert.match(studio, /house/);\n});\n"""
write(p,s)

print('Mor\'ia 9.7 authoritative editable city geometry applied.')
