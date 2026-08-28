from pathlib import Path

# Renderer: world-coordinate variation, animated liquid detail, stronger scale and VFX.
p = Path('src/game/render.ts')
s = p.read_text(encoding='utf-8')

s = s.replace(
"function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {",
"function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {",
1)

old = """  } else if (type === 'path' || type === 'floor' || type === 'wood_floor' || type === 'bridge') {\n    ctx.fillStyle = 'rgba(255,239,196,.055)';\n    ctx.fillRect(x + px*2, y + px*2, size - px*4, px);\n  }\n  ctx.restore();\n}"""
new = """  } else if (type === 'path' || type === 'floor' || type === 'wood_floor' || type === 'bridge') {\n    ctx.fillStyle = 'rgba(255,239,196,.055)';\n    ctx.fillRect(x + px*2, y + px*2, size - px*4, px);\n  }\n\n  // Macro variation uses world coordinates so textures do not slide with the camera.\n  const variation = hash(worldX, worldY, type.length);\n  if ((type === 'path' || type === 'floor') && variation > .58) {\n    ctx.fillStyle = `rgba(42,34,27,${.06 + variation * .06})`;\n    const ox = Math.floor(hash(worldX, worldY, 22) * size * .58) + size * .12;\n    const oy = Math.floor(hash(worldY, worldX, 31) * size * .56) + size * .14;\n    ctx.fillRect(x + ox, y + oy, Math.max(px, size * .18), px);\n    if (variation > .82) {\n      ctx.fillRect(x + ox + size*.10, y + oy + px, px, Math.max(px, size*.13));\n      ctx.fillStyle = 'rgba(119,130,72,.10)';\n      ctx.fillRect(x + ox - px, y + oy - px, px*2, px*2);\n    }\n  } else if (type === 'grass') {\n    const ox = Math.floor(hash(worldX, worldY, 41) * size);\n    const oy = Math.floor(hash(worldY, worldX, 53) * size);\n    ctx.fillStyle = variation > .72 ? 'rgba(215,224,126,.17)' : 'rgba(18,50,22,.16)';\n    ctx.fillRect(x + ox, y + oy, px, px * (variation > .5 ? 2 : 1));\n    if (variation > .88) {\n      ctx.fillStyle = 'rgba(255,218,128,.26)';\n      ctx.fillRect(x + ((ox + px*5) % size), y + ((oy + px*3) % size), px, px);\n    }\n  } else if (type === 'sand' && variation > .62) {\n    ctx.fillStyle = 'rgba(116,88,50,.09)';\n    ctx.fillRect(x + size*.18, y + size*(.28 + variation*.25), size*.48, px);\n  }\n\n  // Liquids receive a small animated specular pass outside the cached texture.\n  if (type === 'water') {\n    const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5;\n    ctx.fillStyle = `rgba(220,245,255,${.05 + wave*.11})`;\n    const wy = y + size * (.28 + wave * .20);\n    ctx.fillRect(x + size*.12, wy, size*(.22 + wave*.22), px);\n  } else if (type === 'lava') {\n    const pulse = (Math.sin(time / 260 + worldX + worldY * .6) + 1) * .5;\n    ctx.globalCompositeOperation = 'screen';\n    ctx.fillStyle = `rgba(255,118,35,${.08 + pulse*.18})`;\n    ctx.fillRect(x + size*.20, y + size*.32, size*.58, size*.34);\n    ctx.globalCompositeOperation = 'source-over';\n  }\n  ctx.restore();\n}"""
assert old in s
s = s.replace(old, new, 1)

old = """export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {\n  ctx.imageSmoothingEnabled = false;\n  buildTileCache(size);\n  const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) {\n    ctx.drawImage(cached, x, y, size, size);\n    drawMaterialFinish(ctx, tile.type, x, y, size);\n  }\n}"""
new = """export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {\n  ctx.imageSmoothingEnabled = false;\n  buildTileCache(size);\n  const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) {\n    ctx.drawImage(cached, x, y, size, size);\n    drawMaterialFinish(ctx, tile.type, x, y, size, worldX, worldY, time);\n  }\n}"""
assert old in s
s = s.replace(old, new, 1)

# Generic building grounding before the specialized facade is painted.
needle = """  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  if (building.type === 'tree_deco') {"""
replacement = """  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  if (building.type !== 'tree_deco') {\n    const groundShadow = ctx.createLinearGradient(sx, sy + h*.70, sx, sy + h);\n    groundShadow.addColorStop(0, 'rgba(0,0,0,0)');\n    groundShadow.addColorStop(1, 'rgba(0,0,0,.30)');\n    ctx.fillStyle = groundShadow;\n    ctx.fillRect(sx - tileSize*.08, sy + h*.58, w + tileSize*.22, h*.42 + tileSize*.08);\n  }\n\n  if (building.type === 'tree_deco') {"""
assert needle in s
s = s.replace(needle, replacement, 1)

# Slightly larger monster presence.
s = s.replace("  const entitySize = size * msSize;", "  const entitySize = size * msSize * 1.08;", 1)
p.write_text(s, encoding='utf-8')

# Humanoids gain stronger screen presence.
p = Path('src/game/playerAvatar.ts')
s = p.read_text(encoding='utf-8')
assert "export const PIXEL_SPRITE_SCALE = 1.30;" in s
s = s.replace("export const PIXEL_SPRITE_SCALE = 1.30;", "export const PIXEL_SPRITE_SCALE = 1.42;", 1)
p.write_text(s, encoding='utf-8')

# Main render loop: pass world coordinates/time, vary biome tint by world tile, and modernize combat VFX.
p = Path('src/components/GameScreen.tsx')
s = p.read_text(encoding='utf-8')
old = "drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);"
new = "drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, tx, ty, now);"
assert old in s
s = s.replace(old, new, 1)

old = """          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && world[ty][tx].type === 'grass') {\n            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);\n          }"""
new = """          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && world[ty][tx].type === 'grass') {\n            const macro = ((tx * 17 + ty * 31) % 11) / 11;\n            const baseTint = tint[biome];\n            ctx.globalAlpha = .76 + macro * .18;\n            ctx.fillStyle = baseTint;\n            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);\n            ctx.globalAlpha = 1;\n          }"""
assert old in s
s = s.replace(old, new, 1)

old = """      } else {\n        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);\n        grad.addColorStop(0, pr.color);\n        grad.addColorStop(1, 'transparent');\n        ctx.fillStyle = grad;\n        ctx.beginPath();\n        ctx.arc(cx, cy, 16, 0, Math.PI * 2);\n        ctx.fill();\n        if (pr.emoji) {\n          ctx.font = '16px system-ui';\n          ctx.textAlign = 'center';\n          ctx.textBaseline = 'middle';\n          ctx.fillText(pr.emoji, cx, cy);\n        } else {\n          ctx.fillStyle = '#fff';\n          ctx.beginPath();\n          ctx.arc(cx, cy, 3, 0, Math.PI * 2);\n          ctx.fill();\n        }\n      }"""
new = """      } else {\n        const prevT = Math.max(0, t - .09);\n        const px = (pr.from.x + (pr.to.x - pr.from.x) * prevT - cam.x + 0.5) * TILE_SIZE;\n        const py = (pr.from.y + (pr.to.y - pr.from.y) * prevT - cam.y + 0.5) * TILE_SIZE;\n        ctx.save();\n        ctx.globalCompositeOperation = 'lighter';\n        ctx.strokeStyle = pr.color;\n        ctx.globalAlpha = .26;\n        ctx.lineWidth = 9;\n        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, cy); ctx.stroke();\n        ctx.globalAlpha = .82;\n        ctx.lineWidth = 2;\n        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, cy); ctx.stroke();\n        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 13);\n        grad.addColorStop(0, '#ffffff');\n        grad.addColorStop(.18, pr.color);\n        grad.addColorStop(1, 'transparent');\n        ctx.fillStyle = grad;\n        ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();\n        ctx.restore();\n        if (pr.emoji) {\n          ctx.font = '14px system-ui';\n          ctx.textAlign = 'center';\n          ctx.textBaseline = 'middle';\n          ctx.fillText(pr.emoji, cx, cy);\n        }\n      }"""
assert old in s
s = s.replace(old, new, 1)

old = """      ctx.globalAlpha = pp.life;\n      ctx.fillStyle = pp.color;\n      ctx.beginPath();\n      ctx.arc(sx, sy, pp.size, 0, Math.PI * 2);\n      ctx.fill();\n      ctx.globalAlpha = 1;"""
new = """      ctx.save();\n      ctx.globalAlpha = pp.life;\n      ctx.globalCompositeOperation = 'lighter';\n      ctx.shadowColor = pp.color;\n      ctx.shadowBlur = Math.max(2, pp.size * 2.5);\n      ctx.fillStyle = pp.color;\n      const ps = Math.max(1, Math.round(pp.size));\n      ctx.fillRect(Math.round(sx - ps/2), Math.round(sy - ps/2), ps, ps);\n      if (ps >= 3) {\n        ctx.fillStyle = 'rgba(255,255,255,.72)';\n        ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);\n      }\n      ctx.restore();"""
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# Tests track the deeper second pass.
p = Path('server/test/visual-revamp-9-27.test.mjs')
s = p.read_text(encoding='utf-8')
s += """

test('9.27 second pass uses world-stable material variation and enhanced VFX', () => {
  const render = read('src/game/render.ts');
  const game = read('src/components/GameScreen.tsx');
  const avatar = read('src/game/playerAvatar.ts');
  assert.match(render, /worldX = 0, worldY = 0, time = 0/);
  assert.match(game, /TILE_SIZE, tx, ty, now/);
  assert.match(game, /globalCompositeOperation = 'lighter'/);
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.42/);
});
"""
p.write_text(s, encoding='utf-8')
print('Applied Mor\'ia 9.27 aggressive world graphics refinement')
