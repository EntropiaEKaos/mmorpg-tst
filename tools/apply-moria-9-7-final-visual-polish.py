from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding='utf-8')


# ---------------------------------------------------------------------------
# 1) Character readability: keep authored matrices, add a one-pixel native
#    shadow pass so humanoid silhouettes stay readable over detailed streets.
# ---------------------------------------------------------------------------
avatar_path = 'src/game/playerAvatar.ts'
avatar = read(avatar_path)
old_loop = """  for (let row = 0; row < frame.length; row++) {\n    const line = frame[row];\n    for (let col = 0; col < line.length; col++) {\n      const key = line[col];\n      if (key === ' ') continue;\n      const color = palette[key];\n      if (!color) continue;\n      ctx.fillStyle = color;\n      ctx.fillRect(left + col * cell, top + row * cell, cell, cell);\n    }\n  }\n"""
new_loop = """  // Native-pixel silhouette drop shadow: a single offset pass keeps the\n  // authored frame readable over cobbles without turning it into a vector glow.\n  const shadowOffset = Math.max(1, Math.floor(cell / 2));\n  ctx.fillStyle = '#15120f';\n  for (let row = 0; row < frame.length; row++) {\n    const line = frame[row];\n    for (let col = 0; col < line.length; col++) {\n      const key = line[col];\n      if (key === ' ' || !palette[key]) continue;\n      ctx.fillRect(left + col * cell + shadowOffset, top + row * cell + shadowOffset, cell, cell);\n    }\n  }\n\n  for (let row = 0; row < frame.length; row++) {\n    const line = frame[row];\n    for (let col = 0; col < line.length; col++) {\n      const key = line[col];\n      if (key === ' ') continue;\n      const color = palette[key];\n      if (!color) continue;\n      ctx.fillStyle = color;\n      ctx.fillRect(left + col * cell, top + row * cell, cell, cell);\n    }\n  }\n"""
if 'Native-pixel silhouette drop shadow' not in avatar:
    if old_loop not in avatar:
        raise SystemExit('playerAvatar.ts drawSpriteMatrix loop contract changed')
    avatar = avatar.replace(old_loop, new_loop, 1)
    write(avatar_path, avatar)


# ---------------------------------------------------------------------------
# 2) Town composition: keep the textured ground, but break the wallpaper read
#    with a central plaza mosaic, avenue edge strips and deterministic fringe
#    pixels. This is presentation-only; no map tile/collision data is mutated.
# ---------------------------------------------------------------------------
city_path = 'src/game/cityPresentation.ts'
city = read(city_path)
replacement = r"""export function drawCityTileOverlay(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  size: number,
  tileType: string,
) {
  if (tileType !== 'floor' && tileType !== 'path' && tileType !== 'wood_floor') return;
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  const dx = Math.abs(tileX - map.townCenter.x);
  const dy = Math.abs(tileY - map.townCenter.y);
  if (dx > map.townRange + 2 || dy > map.townRange + 2) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const edge = Math.max(1, Math.round(size / 16));
  const corePlaza = dx <= 5 && dy <= 5;
  const avenueX = dx <= 1;
  const avenueY = dy <= 1;
  const fringe = Math.max(dx, dy) >= Math.max(4, map.townRange - 2);

  // Keep the textured base visible. Paths receive only a restrained tint.
  if (tileType === 'path') {
    ctx.globalAlpha = .14;
    ctx.fillStyle = palette.road;
    ctx.fillRect(screenX, screenY, size, size);
  }

  // Central plaza mosaic: alternating inset stones stop the town square from
  // reading as one giant repeated texture while preserving the original tile.
  if (corePlaza) {
    const inset = Math.max(2, Math.round(size / 10));
    const parity = (tileX + tileY) & 1;
    ctx.globalAlpha = parity ? .10 : .16;
    ctx.fillStyle = parity ? palette.wall : palette.road;
    ctx.fillRect(screenX + inset, screenY + inset, size - inset * 2, edge);
    ctx.fillRect(screenX + inset, screenY + size - inset - edge, size - inset * 2, edge);
    if (((tileX * 3 + tileY * 5) & 3) === 0) {
      ctx.globalAlpha = .18;
      ctx.fillStyle = palette.accent;
      ctx.fillRect(screenX + inset, screenY + inset, edge * 2, edge * 2);
    }
  }

  // Town avenue edge strips: the two principal axes now read as constructed
  // streets instead of disappearing into the surrounding plaza texture.
  if (avenueX || avenueY) {
    ctx.globalAlpha = .28;
    ctx.fillStyle = palette.road;
    if (avenueX) {
      ctx.fillRect(screenX, screenY, edge, size);
      ctx.fillRect(screenX + size - edge, screenY, edge, size);
    }
    if (avenueY) {
      ctx.fillRect(screenX, screenY, size, edge);
      ctx.fillRect(screenX, screenY + size - edge, size, edge);
    }
  }

  // Moss fringe pixels: deterministic low-density edge noise visually blends
  // masonry into the outer biome without creating fake collidable objects.
  if (fringe && tileType === 'floor') {
    const seed = ((tileX * 73856093) ^ (tileY * 19349663)) >>> 0;
    if ((seed % 3) === 0) {
      const p = Math.max(1, Math.round(size / 12));
      ctx.globalAlpha = .18;
      ctx.fillStyle = '#365a35';
      ctx.fillRect(screenX + p, screenY + size - p * 2, p * 2, p);
      if ((seed & 4) !== 0) ctx.fillRect(screenX + size - p * 3, screenY + p, p, p * 2);
    }
  }

  if (tileX === map.townCenter.x || tileY === map.townCenter.y) {
    ctx.globalAlpha = .34;
    ctx.strokeStyle = palette.road;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);
  }
  if (dx <= 2 && dy <= 2) {
    const p = Math.max(2, Math.round(size / 12));
    ctx.globalAlpha = .34;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(screenX + p, screenY + p, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + p, p, p);
    ctx.fillRect(screenX + p, screenY + size - p * 2, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + size - p * 2, p, p);
  }
  ctx.restore();
}

const AMBIENT_OFFSETS"""
pattern = re.compile(r"export function drawCityTileOverlay\([\s\S]*?\n}\n\nconst AMBIENT_OFFSETS")
if 'Central plaza mosaic' not in city:
    city, count = pattern.subn(replacement, city, count=1)
    if count != 1:
        raise SystemExit('cityPresentation.ts overlay contract changed')
    write(city_path, city)


# ---------------------------------------------------------------------------
# 3) Extend the 9.7 architecture regression checks so this last pass cannot be
#    accidentally flattened by a later visual refactor.
# ---------------------------------------------------------------------------
test_path = 'server/test/reference-visual-9-7.test.mjs'
test_text = read(test_path)
if 'Native-pixel silhouette drop shadow' not in test_text:
    test_text = test_text.replace(
        "  assert.match(avatar, /function drawSpriteMatrix/);\n",
        "  assert.match(avatar, /function drawSpriteMatrix/);\n  assert.match(avatar, /Native-pixel silhouette drop shadow/);\n",
        1,
    )
if 'Central plaza mosaic' not in test_text:
    test_text = test_text.replace(
        "  assert.match(city, /Keep the textured base visible/);\n",
        "  assert.match(city, /Keep the textured base visible/);\n  assert.match(city, /Central plaza mosaic/);\n  assert.match(city, /Town avenue edge strips/);\n  assert.match(city, /Moss fringe pixels/);\n",
        1,
    )
write(test_path, test_text)

print('Mor\'ia 9.7 final visual polish applied.')
