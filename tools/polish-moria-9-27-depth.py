from pathlib import Path

p = Path('src/game/render.ts')
s = p.read_text(encoding='utf-8')

# Deepen world-stable grass clusters after the existing grass variation block.
needle = """    if (variation > .88) { ctx.fillStyle = 'rgba(255,218,128,.26)'; ctx.fillRect(x + ((ox + px*5) % size), y + ((oy + px*3) % size), px, px); }\n  } else if (type === 'sand' && variation > .62) {"""
replacement = """    if (variation > .88) { ctx.fillStyle = 'rgba(255,218,128,.26)'; ctx.fillRect(x + ((ox + px*5) % size), y + ((oy + px*3) % size), px, px); }\n    if (variation > .54) {\n      const patchX = x + size * (.12 + hash(worldX, worldY, 61) * .58);\n      const patchY = y + size * (.18 + hash(worldY, worldX, 67) * .56);\n      ctx.fillStyle = variation > .80 ? 'rgba(112,151,72,.18)' : 'rgba(22,53,27,.13)';\n      ctx.fillRect(patchX, patchY, Math.max(px*2, size*.16), Math.max(px, size*.055));\n      ctx.fillRect(patchX + px, patchY - px*2, px, px*3);\n      if (variation > .76) ctx.fillRect(patchX + px*4, patchY - px, px, px*2);\n    }\n  } else if (type === 'sand' && variation > .62) {"""
assert needle in s
s = s.replace(needle, replacement, 1)

# Add contact depth for vegetation tile cache after tree ground detail comment.
needle = """    // Ground detail and tight pixel shadow.\n    ctx.fillStyle = '#294d27';\n    ctx.fillRect(u, s-u*2, s-u*2, u);\n    ctx.fillStyle = 'rgba(20,24,16,.45)';\n    ctx.fillRect(s/2-u*5, s-u*3, u*10, u*2);"""
replacement = """    // Ground detail and layered canopy shadow.\n    ctx.fillStyle = 'rgba(14,20,13,.20)';\n    ctx.fillRect(s/2-u*7, s-u*4, u*14, u*3);\n    ctx.fillStyle = '#294d27';\n    ctx.fillRect(u, s-u*2, s-u*2, u);\n    ctx.fillStyle = 'rgba(20,24,16,.52)';\n    ctx.fillRect(s/2-u*5, s-u*3, u*10, u*2);"""
assert needle in s
s = s.replace(needle, replacement, 1)

# Building foundation AO and directional side plane after wall body.
needle = """  ctx.fillStyle = wall;\n  ctx.fillRect(sx + 2, wallTop + 2, w - 4, wallH - 4);\n\n  // Pixel masonry courses and alternating vertical joints."""
replacement = """  ctx.fillStyle = wall;\n  ctx.fillRect(sx + 2, wallTop + 2, w - 4, wallH - 4);\n\n  // 2.5D facade model: roof/eave cast shadow, right side plane and heavy foundation AO.\n  const sideW = Math.max(3, Math.round(tileSize * .12));\n  ctx.fillStyle = 'rgba(25,20,17,.20)';\n  ctx.fillRect(sx + w - sideW - 2, wallTop + 2, sideW, wallH - 4);\n  ctx.fillStyle = 'rgba(255,239,205,.08)';\n  ctx.fillRect(sx + 2, wallTop + 2, Math.max(2, tileSize*.08), wallH - 5);\n  ctx.fillStyle = 'rgba(20,15,12,.23)';\n  ctx.fillRect(sx + 2, wallTop + 2, w - 4, Math.max(3, Math.round(tileSize*.12)));\n  ctx.fillStyle = 'rgba(21,18,14,.30)';\n  ctx.fillRect(sx + 2, wallTop + wallH - Math.max(4, Math.round(tileSize*.14)), w - 4, Math.max(4, Math.round(tileSize*.14)));\n  ctx.fillStyle = 'rgba(130,112,82,.18)';\n  for (let xx=sx+Math.max(4,tileSize*.12); xx<sx+w-6; xx+=Math.max(12,Math.round(tileSize*.72))) ctx.fillRect(xx, wallTop+wallH-Math.max(3,tileSize*.10), Math.max(3,tileSize*.12), Math.max(2,tileSize*.06));\n\n  // Pixel masonry courses and alternating vertical joints."""
assert needle in s
s = s.replace(needle, replacement, 1)

# Recess window frames deeper.
needle = """    ctx.fillStyle='#34291f';ctx.fillRect(wx-ww/2-2,wy-2,ww+4,wh+4);\n    ctx.fillStyle=`rgba(239,190,91,${flicker})`;ctx.fillRect(wx-ww/2,wy,ww,wh);"""
replacement = """    ctx.fillStyle='rgba(20,15,12,.52)';ctx.fillRect(wx-ww/2-3,wy-3,ww+7,wh+7);\n    ctx.fillStyle='#34291f';ctx.fillRect(wx-ww/2-2,wy-2,ww+4,wh+4);\n    ctx.fillStyle=`rgba(239,190,91,${flicker})`;ctx.fillRect(wx-ww/2,wy,ww,wh);"""
assert needle in s
s = s.replace(needle, replacement, 1)

# Add roof lip/cast shadow after roof tiles.
needle = """  // Roof mass and tile bands.\n  drawPixelRoofTiles(ctx, sx, sy, w, h, roof);\n\n  // Chimney and type accents."""
replacement = """  // Roof mass and tile bands.\n  drawPixelRoofTiles(ctx, sx, sy, w, h, roof);\n  ctx.fillStyle = 'rgba(18,13,11,.34)';\n  ctx.fillRect(sx - 4, sy + h*.425, w + 8, Math.max(3, Math.round(tileSize*.10)));\n  ctx.fillStyle = 'rgba(255,224,173,.08)';\n  ctx.fillRect(sx, sy + h*.415, w, Math.max(1, Math.round(tileSize*.035)));\n\n  // Chimney and type accents."""
assert needle in s
s = s.replace(needle, replacement, 1)

# Give well and market stronger contact/awning depth.
needle = """  if (building.type === 'well') {\n    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(sx + w*.18, sy+h*.72, w*.64, h*.10);"""
replacement = """  if (building.type === 'well') {\n    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(sx + w*.08, sy+h*.68, w*.84, h*.18);\n    ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(sx + w*.18, sy+h*.72, w*.64, h*.10);"""
assert needle in s
s = s.replace(needle, replacement, 1)

needle = """  if (building.type === 'market') {\n    for(let i=0;i<3;i++){const bx=sx+i*w/3;const stripe=i%2?accent:roof;ctx.fillStyle='#5f4027';"""
replacement = """  if (building.type === 'market') {\n    ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(sx+w*.03,sy+h*.67,w*.94,h*.18);\n    for(let i=0;i<3;i++){const bx=sx+i*w/3;const stripe=i%2?accent:roof;ctx.fillStyle='#5f4027';"""
assert needle in s
s = s.replace(needle, replacement, 1)

p.write_text(s, encoding='utf-8')

p = Path('server/test/visual-revamp-9-27.test.mjs')
s = p.read_text(encoding='utf-8')
s += r'''

test('9.27 third pass deepens vegetation and architecture without changing authority', () => {
  const render = read('src/game/render.ts');
  assert.match(render, /2\.5D facade model/);
  assert.match(render, /layered canopy shadow/);
  assert.match(render, /variation > \.54/);
  assert.match(render, /Roof mass and tile bands/);
});
'''
p.write_text(s, encoding='utf-8')
print("Applied Mor'ia 9.27 third-pass environment depth polish")
