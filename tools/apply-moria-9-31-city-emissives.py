from pathlib import Path
p=Path('src/game/cityPresentation.ts')
t=p.read_text()
a="ctx.fillStyle=`rgba(255,211,104,${pulse*.25})`;ctx.fillRect(cx-u*5,y+size*.17,u*10,u*10);"
b="const lampGlow=ctx.createRadialGradient(cx,y+size*.34,u,cx,y+size*.34,u*7);lampGlow.addColorStop(0,`rgba(255,218,126,${pulse*.34})`);lampGlow.addColorStop(1,'rgba(255,176,70,0)');ctx.fillStyle=lampGlow;ctx.fillRect(cx-u*7,y+size*.17,u*14,u*14);"
if a not in t: raise SystemExit('lamp marker missing')
t=t.replace(a,b,1)
a="ctx.fillStyle='#ff9737';ctx.fillRect(cx-u*2,cy-u*6,u*4,u*4);ctx.fillStyle='#ffd15e';ctx.fillRect(cx-u,cy-u*7,u*2,u*4);"
b="const fireGlow=ctx.createRadialGradient(cx,cy-u*4,u,cx,cy-u*4,u*8);fireGlow.addColorStop(0,`rgba(255,145,48,${pulse*.32})`);fireGlow.addColorStop(1,'rgba(255,80,20,0)');ctx.fillStyle=fireGlow;ctx.fillRect(cx-u*8,cy-u*12,u*16,u*16);ctx.fillStyle='#ff9737';ctx.fillRect(cx-u*2,cy-u*6,u*4,u*4);ctx.fillStyle='#ffd15e';ctx.fillRect(cx-u,cy-u*7,u*2,u*4);"
if a not in t: raise SystemExit('brazier marker missing')
t=t.replace(a,b,1)
a="ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u*2,y+size*.28,u*4,u*8);ctx.fillRect(cx-u,y+size*.18,u*2,u*12);"
b="const crystalColor=prop.color||accent;const crystalGlow=ctx.createRadialGradient(cx,y+size*.46,u,cx,y+size*.46,u*7);crystalGlow.addColorStop(0,'rgba(125,210,255,.20)');crystalGlow.addColorStop(1,'rgba(90,130,255,0)');ctx.fillStyle=crystalGlow;ctx.fillRect(cx-u*7,y+size*.08,u*14,u*14);ctx.fillStyle=crystalColor;ctx.fillRect(cx-u*2,y+size*.28,u*4,u*8);ctx.fillRect(cx-u,y+size*.18,u*2,u*12);"
if a not in t: raise SystemExit('crystal marker missing')
p.write_text(t.replace(a,b,1))
print('9.31 city emissives applied')
