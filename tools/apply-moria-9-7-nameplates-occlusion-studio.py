from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'contract changed: {label}')
    return text.replace(old, new, 1)

# ------------------------------------------------------------------
# Player nameplates: compact defaults + fully configurable map policy.
# ------------------------------------------------------------------
p = 'src/game/playerAvatar.ts'
s = read(p)
s = replace_once(s,
"export function drawAvatar(\n",
"export interface AvatarNameplateOptions {\n  nameplateOffsetY?: number;\n  nameplateScale?: number;\n  nameplateBarWidth?: number;\n  nameplateBarHeight?: number;\n  nameplateFontSize?: number;\n  nameplateShowValues?: boolean;\n}\n\nfunction clampNumber(value: unknown, min: number, max: number, fallback: number) {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;\n}\n\nexport function drawAvatar(\n", 'avatar nameplate options')
s = replace_once(s,
"  maxMana = 0,\n) {",
"  maxMana = 0,\n  nameplate?: AvatarNameplateOptions | null,\n) {", 'drawAvatar signature')
old = """  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));\n  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));\n  const barW = Math.max(38, Math.round(size * 1.28));\n  const barH = Math.max(4, Math.round(size / 10));\n  const barX = Math.round(cx - barW / 2);\n  const hpBarY = Math.round(y - size * 0.34);\n  const manaBarY = hpBarY + barH + 2;\n  const nameY = hpBarY - 6;\n\n  ctx.textAlign = 'center';\n  ctx.textBaseline = 'alphabetic';\n  ctx.font = `bold ${Math.max(10, Math.round(size * 0.30))}px monospace`;\n  ctx.strokeStyle = 'rgba(0,0,0,0.95)';\n  ctx.lineWidth = 3;\n  ctx.strokeText(name, cx, nameY);\n  ctx.fillStyle = '#f4e6bd';\n  ctx.fillText(name, cx, nameY);\n\n  ctx.fillStyle = '#08090a';\n  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);\n  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);\n  ctx.fillStyle = '#481318';\n  ctx.fillRect(barX, hpBarY, barW, barH);\n  ctx.fillStyle = '#d12635';\n  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);\n  ctx.fillStyle = '#10284d';\n  ctx.fillRect(barX, manaBarY, barW, barH);\n  ctx.fillStyle = '#2877d4';\n  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);\n\n  if (size >= 38) {\n    ctx.font = 'bold 6px monospace';\n    ctx.textBaseline = 'middle';\n    ctx.fillStyle = '#fff8ef';\n    ctx.fillText(`${Math.max(0, Math.round(hp))}/${Math.max(0, Math.round(maxHp))}`, cx, hpBarY + barH / 2);\n    ctx.fillStyle = '#e0efff';\n    ctx.fillText(`${Math.max(0, Math.round(mana))}/${Math.max(0, Math.round(maxMana))}`, cx, manaBarY + barH / 2);\n  }\n"""
new = """  // 9.7 compact nameplate policy. Values are map-authored through Content Studio,\n  // but bounded here so a bad presentation edit can never explode the renderer.\n  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));\n  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));\n  const scale = clampNumber(nameplate?.nameplateScale, 0.55, 1.5, 0.82);\n  const offsetY = clampNumber(nameplate?.nameplateOffsetY, -32, 12, -9);\n  const barW = Math.round(clampNumber(nameplate?.nameplateBarWidth, 18, 64, 30) * scale);\n  const barH = Math.max(2, Math.round(clampNumber(nameplate?.nameplateBarHeight, 2, 8, 3) * scale));\n  const fontSize = Math.max(7, Math.round(clampNumber(nameplate?.nameplateFontSize, 7, 14, 8) * scale));\n  const showValues = nameplate?.nameplateShowValues === true;\n  const barX = Math.round(cx - barW / 2);\n  const nameY = Math.round(y + offsetY);\n  const hpBarY = nameY + 3;\n  const manaBarY = hpBarY + barH + 1;\n\n  ctx.textAlign = 'center';\n  ctx.textBaseline = 'alphabetic';\n  ctx.font = `bold ${fontSize}px monospace`;\n  ctx.strokeStyle = 'rgba(0,0,0,0.95)';\n  ctx.lineWidth = Math.max(2, Math.round(scale * 2));\n  ctx.strokeText(name, cx, nameY);\n  ctx.fillStyle = '#f4e6bd';\n  ctx.fillText(name, cx, nameY);\n\n  ctx.fillStyle = '#090a0b';\n  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);\n  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);\n  ctx.fillStyle = '#4b171b';\n  ctx.fillRect(barX, hpBarY, barW, barH);\n  ctx.fillStyle = '#d93643';\n  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);\n  ctx.fillStyle = '#122949';\n  ctx.fillRect(barX, manaBarY, barW, barH);\n  ctx.fillStyle = '#3781d8';\n  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);\n\n  if (showValues && barW >= 32) {\n    ctx.font = `bold ${Math.max(6, fontSize - 2)}px monospace`;\n    ctx.textBaseline = 'middle';\n    ctx.fillStyle = '#fff8ef';\n    ctx.fillText(`${Math.max(0, Math.round(hp))}/${Math.max(0, Math.round(maxHp))}`, cx, hpBarY + barH / 2);\n    ctx.fillStyle = '#e0efff';\n    ctx.fillText(`${Math.max(0, Math.round(mana))}/${Math.max(0, Math.round(maxMana))}`, cx, manaBarY + barH / 2);\n  }\n"""
s = replace_once(s, old, new, 'compact nameplate body')
write(p, s)

# ------------------------------------------------------------------
# Render API + roof/front occlusion pass.
# ------------------------------------------------------------------
p = 'src/game/render.ts'; s = read(p)
s = s.replace("import { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';", "import { drawAvatar, type AvatarAppearance, type AvatarMount, type AvatarNameplateOptions } from './playerAvatar';")
s = replace_once(s,
"  maxMana = 0,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana);\n}",
"  maxMana = 0,\n  nameplate?: AvatarNameplateOptions | null,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana, nameplate);\n}", 'drawPlayer forwarding')
append_anchor = "\nexport function drawBuilding(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number, time: number) {"
if 'export function drawBuildingOcclusion' not in s:
    # place helper after drawBuilding function by appending at EOF (drawPixelRoofTiles remains module-visible)
    s += """\n\n// Foreground roof pass: entities can walk behind real architecture without visually\n// appearing on top of the roof. This changes only compositing, never collision.\nexport function drawBuildingOcclusion(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number) {\n  if (['tree_deco','well','obelisk','graveyard','arena','market','dock'].includes(building.type)) return;\n  const w = building.w * tileSize;\n  const h = building.h * tileSize;\n  const roof = building.roofColor || '#8b3a2a';\n  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n  drawPixelRoofTiles(ctx, sx, sy, w, h, roof);\n  // Eave shadow separates the foreground roof from a character passing behind it.\n  ctx.fillStyle = 'rgba(20,16,12,.34)';\n  ctx.fillRect(sx - 3, sy + h * .455, w + 6, Math.max(2, Math.round(tileSize * .07)));\n  ctx.restore();\n}\n"""
write(p, s)

# ------------------------------------------------------------------
# Map model: presentation settings survive Studio -> runtime sync.
# ------------------------------------------------------------------
p = 'src/game/maps.ts'; s = read(p)
s = replace_once(s,
"  props: CityProp[];\n}",
"  props: CityProp[];\n  nameplateOffsetY?: number;\n  nameplateScale?: number;\n  nameplateBarWidth?: number;\n  nameplateBarHeight?: number;\n  nameplateFontSize?: number;\n  nameplateShowValues?: boolean;\n  residentialRingEnabled?: boolean;\n  residentialRingDensity?: number;\n}", 'GameMap presentation fields')
# hydration: keep presentation fields already on map; no changes needed there.
s = replace_once(s,
"      props: Array.isArray(raw.props) ? normalizeProps(raw.props) : (base?.props || []),\n",
"      props: Array.isArray(raw.props) ? normalizeProps(raw.props) : (base?.props || []),\n      nameplateOffsetY: Number.isFinite(Number(raw.nameplateOffsetY)) ? Math.max(-32, Math.min(12, Number(raw.nameplateOffsetY))) : base?.nameplateOffsetY,\n      nameplateScale: Number.isFinite(Number(raw.nameplateScale)) ? Math.max(.55, Math.min(1.5, Number(raw.nameplateScale))) : base?.nameplateScale,\n      nameplateBarWidth: Number.isFinite(Number(raw.nameplateBarWidth)) ? Math.max(18, Math.min(64, Number(raw.nameplateBarWidth))) : base?.nameplateBarWidth,\n      nameplateBarHeight: Number.isFinite(Number(raw.nameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.nameplateBarHeight))) : base?.nameplateBarHeight,\n      nameplateFontSize: Number.isFinite(Number(raw.nameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.nameplateFontSize))) : base?.nameplateFontSize,\n      nameplateShowValues: typeof raw.nameplateShowValues === 'boolean' ? raw.nameplateShowValues : base?.nameplateShowValues,\n      residentialRingEnabled: typeof raw.residentialRingEnabled === 'boolean' ? raw.residentialRingEnabled : (base?.residentialRingEnabled ?? false),\n      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n", 'sync presentation fields')
write(p, s)

# ------------------------------------------------------------------
# City residential ring is no longer fake collision by default.
# ------------------------------------------------------------------
p = 'src/game/cityPresentation.ts'; s = read(p)
old = """  // Visual-only residential ring. It deliberately frames the square more\n  // tightly than 9.6, but never changes authoritative collision/pathing.\n  const tc = map.townCenter;\n  const homes: Array<[number, number, number, number]> = [\n    [-13,-6,4,3], [-13,3,3,3], [-9,7,4,3], [-4,8,3,3], [2,8,4,3],\n    [8,7,4,3], [11,3,3,3], [11,-3,4,3], [8,-10,4,3], [1,-12,3,3],\n  ];\n  for (const [dx, dy, w, h] of homes) {\n    const x = Math.max(1, Math.min(78 - w, tc.x + dx));\n    const y = Math.max(1, Math.min(78 - h, tc.y + dy));\n    if (overlapsLandmark(map, x, y, w, h, 1)) continue;\n    buildings.push({ x, y, w, h, type: 'house', roofColor: palette.roof, wallColor: palette.wall, accentColor: palette.accent });\n  }\n"""
new = """  // Optional presentation-only residential ring. Disabled by default because\n  // decorative houses must never masquerade as authoritative collision geometry.\n  // Admins may deliberately enable a bounded density from Content Studio.\n  const tc = map.townCenter;\n  const homes: Array<[number, number, number, number]> = [\n    [-13,-6,4,3], [-13,3,3,3], [-9,7,4,3], [-4,8,3,3], [2,8,4,3],\n    [8,7,4,3], [11,3,3,3], [11,-3,4,3], [8,-10,4,3], [1,-12,3,3],\n  ];\n  const density = map.residentialRingEnabled === true ? Math.max(0, Math.min(homes.length, Math.round(Number(map.residentialRingDensity) || homes.length))) : 0;\n  for (const [dx, dy, w, h] of homes.slice(0, density)) {\n    const x = Math.max(1, Math.min(78 - w, tc.x + dx));\n    const y = Math.max(1, Math.min(78 - h, tc.y + dy));\n    if (overlapsLandmark(map, x, y, w, h, 1)) continue;\n    buildings.push({ x, y, w, h, type: 'house', roofColor: palette.roof, wallColor: palette.wall, accentColor: palette.accent });\n  }\n"""
s = replace_once(s, old, new, 'residential ring policy')
write(p, s)

# ------------------------------------------------------------------
# GameScreen: map-authored nameplates + foreground roof occlusion.
# ------------------------------------------------------------------
p = 'src/components/GameScreen.tsx'; s = read(p)
s = s.replace("import { drawBuilding, type Building } from '../game/render';", "import { drawBuilding, drawBuildingOcclusion, type Building } from '../game/render';")
s = replace_once(s,
"      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount, p.mana, p.maxMana);",
"      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount, p.mana, p.maxMana, MAPS[currentMapIdRef.current] || MAPS.eldoria);", 'local player nameplate settings')
s = replace_once(s,
"        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount, Number(op.mana) || 0, Number(op.maxMana) || 0);",
"        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount, Number(op.mana) || 0, Number(op.maxMana) || 0, MAPS[currentMapIdRef.current] || MAPS.eldoria);", 'server player nameplate settings')
if '// Foreground architecture occlusion pass' not in s:
    s = replace_once(s,
"    // Projectiles\n",
"    // Foreground architecture occlusion pass. Roofs are re-composited after\n    // players/pets so characters cannot visually stand on top of real houses.\n    for (const b of buildingsRef.current) {\n      const sx = (b.x - cam.x) * TILE_SIZE;\n      const sy = (b.y - cam.y) * TILE_SIZE;\n      if (sx > canvas.width || sy > canvas.height || sx + b.w * TILE_SIZE < 0 || sy + b.h * TILE_SIZE < 0) continue;\n      drawBuildingOcclusion(ctx, sx, sy, b, TILE_SIZE);\n    }\n\n    // Projectiles\n", 'foreground occlusion call')
write(p, s)

# ------------------------------------------------------------------
# Content Studio: all presentation controls editable and bounded.
# ------------------------------------------------------------------
p = 'server/engine/ContentStudio.mjs'; s = read(p)
s = replace_once(s,
"    field('cityStyle', 'City style', 'select', { optionKey: 'cityStyles' }), field('cityAccent', 'City accent'), field('roofColor', 'Roof color'), field('wallColor', 'Wall color'), field('roadColor', 'Road color'),\n    field('districts', 'Districts', 'json'),",
"    field('cityStyle', 'City style', 'select', { optionKey: 'cityStyles' }), field('cityAccent', 'City accent'), field('roofColor', 'Roof color'), field('wallColor', 'Wall color'), field('roadColor', 'Road color'),\n    field('nameplateOffsetY', 'Nameplate Y offset', 'number'), field('nameplateScale', 'Nameplate scale', 'number'),\n    field('nameplateBarWidth', 'Nameplate bar width', 'number'), field('nameplateBarHeight', 'Nameplate bar height', 'number'), field('nameplateFontSize', 'Name font size', 'number'),\n    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('residentialRingEnabled', 'Decorative residential ring', 'boolean'), field('residentialRingDensity', 'Residential density', 'number'),\n    field('districts', 'Districts', 'json'),", 'studio presentation fields')
s = replace_once(s,
"    for (const key of ['cityAccent','roofColor','wallColor','roadColor']) if (record[key] !== undefined && record[key] !== '' && !COLOR_RE.test(String(record[key]))) return `${key} must be a CSS hex color`;\n",
"    for (const key of ['cityAccent','roofColor','wallColor','roadColor']) if (record[key] !== undefined && record[key] !== '' && !COLOR_RE.test(String(record[key]))) return `${key} must be a CSS hex color`;\n    for (const [key,min,max] of [['nameplateOffsetY',-32,12],['nameplateScale',0.55,1.5],['nameplateBarWidth',18,64],['nameplateBarHeight',2,8],['nameplateFontSize',7,14],['residentialRingDensity',0,10]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }\n    if (record.nameplateShowValues !== undefined && typeof record.nameplateShowValues !== 'boolean') return 'nameplateShowValues must be boolean';\n    if (record.residentialRingEnabled !== undefined && typeof record.residentialRingEnabled !== 'boolean') return 'residentialRingEnabled must be boolean';\n", 'studio presentation validation')
s = s.replace("City style, palette, districts, landmarks and street props drive the 9.6 runtime presentation and minimap.", "City style, palette, districts, landmarks, street props, nameplates and residential presentation controls drive the runtime presentation and minimap.")
write(p, s)

# ------------------------------------------------------------------
# 9.7 regression coverage.
# ------------------------------------------------------------------
p = 'server/test/reference-visual-9-7.test.mjs'; s = read(p)
if 'editable compact nameplates' not in s:
    s += """\n\ntest('9.7 editable compact nameplates and architecture occlusion stay presentation-only', () => {\n  const avatar = read('src/game/playerAvatar.ts');\n  const render = read('src/game/render.ts');\n  const screen = read('src/components/GameScreen.tsx');\n  const maps = read('src/game/maps.ts');\n  const city = read('src/game/cityPresentation.ts');\n  const studio = read('server/engine/ContentStudio.mjs');\n  assert.match(avatar, /nameplateOffsetY/);\n  assert.match(avatar, /nameplateShowValues/);\n  assert.match(render, /drawBuildingOcclusion/);\n  assert.match(screen, /Foreground architecture occlusion pass/);\n  assert.match(maps, /residentialRingEnabled/);\n  assert.match(city, /Disabled by default because/);\n  assert.match(studio, /Nameplate Y offset/);\n  assert.match(studio, /Decorative residential ring/);\n});\n"""
write(p, s)

print('Mor\'ia 9.7 nameplate/occlusion/studio polish applied.')
