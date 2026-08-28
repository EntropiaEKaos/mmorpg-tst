from pathlib import Path

p=Path('src/game/render.ts');s=p.read_text(encoding='utf-8')
s=s.replace("function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {","function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {",1)
old="""  } else if (type === 'path' || type === 'floor' || type === 'wood_floor' || type === 'bridge') {\n    ctx.fillStyle = 'rgba(255,239,196,.055)';\n    ctx.fillRect(x + px*2, y + px*2, size - px*4, px);\n  }\n  ctx.restore();\n}"""
new="""  } else if (type === 'path' || type === 'floor' || type === 'wood_floor' || type === 'bridge') {\n    ctx.fillStyle = 'rgba(255,239,196,.055)';\n    ctx.fillRect(x + px*2, y + px*2, size - px*4, px);\n  }\n  const variation = hash(worldX, worldY, type.length);\n  if ((type === 'path' || type === 'floor') && variation > .58) {\n    ctx.fillStyle = `rgba(42,34,27,${.06 + variation * .06})`;\n    const ox = Math.floor(hash(worldX, worldY, 22) * size * .58) + size * .12;\n    const oy = Math.floor(hash(worldY, worldX, 31) * size * .56) + size * .14;\n    ctx.fillRect(x + ox, y + oy, Math.max(px, size * .18), px);\n    if (variation > .82) { ctx.fillRect(x + ox + size*.10, y + oy + px, px, Math.max(px, size*.13)); ctx.fillStyle = 'rgba(119,130,72,.10)'; ctx.fillRect(x + ox - px, y + oy - px, px*2, px*2); }\n  } else if (type === 'grass') {\n    const ox = Math.floor(hash(worldX, worldY, 41) * size), oy = Math.floor(hash(worldY, worldX, 53) * size);\n    ctx.fillStyle = variation > .72 ? 'rgba(215,224,126,.17)' : 'rgba(18,50,22,.16)'; ctx.fillRect(x + ox, y + oy, px, px * (variation > .5 ? 2 : 1));\n    if (variation > .88) { ctx.fillStyle = 'rgba(255,218,128,.26)'; ctx.fillRect(x + ((ox + px*5) % size), y + ((oy + px*3) % size), px, px); }\n  } else if (type === 'sand' && variation > .62) { ctx.fillStyle = 'rgba(116,88,50,.09)'; ctx.fillRect(x + size*.18, y + size*(.28 + variation*.25), size*.48, px); }\n  if (type === 'water') {\n    const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5; ctx.fillStyle = `rgba(220,245,255,${.05 + wave*.11})`; ctx.fillRect(x + size*.12, y + size * (.28 + wave * .20), size*(.22 + wave*.22), px);\n  } else if (type === 'lava') {\n    const pulse = (Math.sin(time / 260 + worldX + worldY * .6) + 1) * .5; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,118,35,${.08 + pulse*.18})`; ctx.fillRect(x + size*.20, y + size*.32, size*.58, size*.34); ctx.globalCompositeOperation = 'source-over';\n  }\n  ctx.restore();\n}"""
assert old in s;s=s.replace(old,new,1)
old="""export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {\n  ctx.imageSmoothingEnabled = false;\n  buildTileCache(size);\n  const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) {\n    ctx.drawImage(cached, x, y, size, size);\n    drawMaterialFinish(ctx, tile.type, x, y, size);\n  }\n}"""
new="""export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {\n  ctx.imageSmoothingEnabled = false; buildTileCache(size); const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) { ctx.drawImage(cached, x, y, size, size); drawMaterialFinish(ctx, tile.type, x, y, size, worldX, worldY, time); }\n}"""
assert old in s;s=s.replace(old,new,1)
needle="""  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  if (building.type === 'tree_deco') {"""
replacement="""  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n  if (building.type !== 'tree_deco') { const gs=ctx.createLinearGradient(sx,sy+h*.70,sx,sy+h); gs.addColorStop(0,'rgba(0,0,0,0)'); gs.addColorStop(1,'rgba(0,0,0,.30)'); ctx.fillStyle=gs; ctx.fillRect(sx-tileSize*.08,sy+h*.58,w+tileSize*.22,h*.42+tileSize*.08); }\n\n  if (building.type === 'tree_deco') {"""
assert needle in s;s=s.replace(needle,replacement,1)
s=s.replace("  const entitySize = size * msSize;","  const entitySize = size * msSize * 1.08;",1)
p.write_text(s,encoding='utf-8')

p=Path('src/game/playerAvatar.ts');s=p.read_text(encoding='utf-8')
assert "export const PIXEL_SPRITE_SCALE = 1.30;" in s
s=s.replace("    drawPixelHuman(ctx, cx, feetY, size, direction, style, colors, addonMask, time);","    drawPixelHuman(ctx, cx, feetY, size * 1.08, direction, style, colors, addonMask, time);",1)
p.write_text(s,encoding='utf-8')

Path('src/game/combatVfx927.ts').write_text(r'''import type { Projectile, Particle } from './types';
export function drawProjectile927(ctx:CanvasRenderingContext2D,pr:Projectile,cx:number,cy:number,px:number,py:number){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=pr.color;ctx.globalAlpha=.26;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(cx,cy);ctx.stroke();ctx.globalAlpha=.82;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(cx,cy);ctx.stroke();const g=ctx.createRadialGradient(cx,cy,0,cx,cy,13);g.addColorStop(0,'#fff');g.addColorStop(.18,pr.color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,13,0,Math.PI*2);ctx.fill();ctx.restore();if(pr.emoji){ctx.font='14px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pr.emoji,cx,cy)}}
export function drawParticle927(ctx:CanvasRenderingContext2D,pp:Particle,sx:number,sy:number){ctx.save();ctx.globalAlpha=pp.life;ctx.globalCompositeOperation='lighter';ctx.shadowColor=pp.color;ctx.shadowBlur=Math.max(2,pp.size*2.5);ctx.fillStyle=pp.color;const ps=Math.max(1,Math.round(pp.size));ctx.fillRect(Math.round(sx-ps/2),Math.round(sy-ps/2),ps,ps);if(ps>=3){ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillRect(Math.round(sx),Math.round(sy),1,1)}ctx.restore()}
''',encoding='utf-8')

p=Path('src/components/GameScreen.tsx');s=p.read_text(encoding='utf-8')
needle="import { drawWorldCinematicPass } from '../game/worldVisualRevamp927';";assert needle in s;s=s.replace(needle,needle+"\nimport { drawProjectile927, drawParticle927 } from '../game/combatVfx927';",1)
s=s.replace("drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);","drawTile(ctx,world[ty][tx],x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,tx,ty,now);",1)
old="""          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && world[ty][tx].type === 'grass') {\n            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);\n          }"""
new="""          if(tx>=0&&tx<MAP_WIDTH&&ty>=0&&ty<MAP_HEIGHT&&world[ty][tx].type==='grass'){ctx.globalAlpha=.76+(((tx*17+ty*31)%11)/11)*.18;ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE);ctx.globalAlpha=1;}"""
assert old in s;s=s.replace(old,new,1)
old="""      } else {\n        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);\n        grad.addColorStop(0, pr.color);\n        grad.addColorStop(1, 'transparent');\n        ctx.fillStyle = grad;\n        ctx.beginPath();\n        ctx.arc(cx, cy, 16, 0, Math.PI * 2);\n        ctx.fill();\n        if (pr.emoji) {\n          ctx.font = '16px system-ui';\n          ctx.textAlign = 'center';\n          ctx.textBaseline = 'middle';\n          ctx.fillText(pr.emoji, cx, cy);\n        } else {\n          ctx.fillStyle = '#fff';\n          ctx.beginPath();\n          ctx.arc(cx, cy, 3, 0, Math.PI * 2);\n          ctx.fill();\n        }\n      }"""
new="""      } else {const q=Math.max(0,t-.09),px=(pr.from.x+(pr.to.x-pr.from.x)*q-cam.x+.5)*TILE_SIZE,py=(pr.from.y+(pr.to.y-pr.from.y)*q-cam.y+.5)*TILE_SIZE;drawProjectile927(ctx,pr,cx,cy,px,py);}"""
assert old in s;s=s.replace(old,new,1)
old="""      ctx.globalAlpha = pp.life;\n      ctx.fillStyle = pp.color;\n      ctx.beginPath();\n      ctx.arc(sx, sy, pp.size, 0, Math.PI * 2);\n      ctx.fill();\n      ctx.globalAlpha = 1;"""
assert old in s;s=s.replace(old,"      drawParticle927(ctx,pp,sx,sy);",1)
p.write_text(s,encoding='utf-8')

p=Path('server/test/visual-revamp-9-27.test.mjs');s=p.read_text(encoding='utf-8')
s+=r'''

test('9.27 second pass preserves architecture contracts while extracting richer VFX', () => {
  const render=read('src/game/render.ts'),game=read('src/components/GameScreen.tsx'),avatar=read('src/game/playerAvatar.ts'),vfx=read('src/game/combatVfx927.ts');
  assert.match(render,/worldX = 0, worldY = 0, time = 0/); assert.match(game,/TILE_SIZE,tx,ty,now/); assert.match(avatar,/PIXEL_SPRITE_SCALE = 1\.30/); assert.match(avatar,/size \* 1\.08/); assert.match(vfx,/globalCompositeOperation='lighter'/);
});
'''
p.write_text(s,encoding='utf-8')
print("Applied Mor'ia 9.27 contract-safe aggressive refinement")
