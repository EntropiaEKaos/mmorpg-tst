from pathlib import Path


def patch(path, old, new, label):
    p=Path(path); text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Cosmetic-only tile variant: collision and semantic TileType remain unchanged.
patch('src/game/types.ts',
"export interface Tile {\n  type: TileType;\n  walkable: boolean;\n  blocksSight?: boolean;\n}",
"export interface Tile {\n  type: TileType;\n  walkable: boolean;\n  blocksSight?: boolean;\n  variant?: 'swamp';\n}",
'swamp Tile visual variant')

# Every water/grass/bridge tile in a swamp biome receives the cosmetic variant after
# gameplay topology has already selected its type/walkability.
patch('src/game/maps.ts',
"      row.push({ type, walkable, blocksSight });",
"      const variant: Tile['variant'] = biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;\n      row.push({ type, walkable, blocksSight, ...(variant ? { variant } : {}) });",
'swamp client variant projection')

render=Path('src/game/render.ts'); text=render.read_text(encoding='utf-8')
cache_block=r'''
  tileCache.set(`grass_swamp_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#2d432c'; ctx.fillRect(0,0,s,s);
    const px=Math.max(1,Math.round(s/32));
    for(let i=0;i<40;i++){
      const x=Math.floor(hash(i,121)*s/px)*px,y=Math.floor(hash(i,127)*s/px)*px;
      const tones=['#233827','#365037','#405a3b','#4b4a32','#596044'];
      ctx.fillStyle=tones[Math.floor(hash(i,131)*tones.length)];
      ctx.fillRect(x,y,px*(hash(i,137)>.72?2:1),px);
    }
    for(let i=0;i<7;i++){
      const x=Math.floor(hash(i+70,139)*s),y=Math.floor(hash(i+70,149)*s);
      ctx.fillStyle='rgba(91,80,50,.34)';ctx.fillRect(x,y,Math.max(px,s*.14),Math.max(px,s*.04));
    }
    ctx.fillStyle='rgba(116,139,73,.18)';ctx.fillRect(0,0,s,px);
  }, size));

  tileCache.set(`water_swamp_${size}`, createTileCanvas((ctx, s) => {
    const grad=ctx.createLinearGradient(0,0,0,s);
    grad.addColorStop(0,'#355c50');grad.addColorStop(.5,'#294b43');grad.addColorStop(1,'#17352f');
    ctx.fillStyle=grad;ctx.fillRect(0,0,s,s);
    const px=Math.max(1,Math.round(s/32));
    for(let i=0;i<7;i++){
      const x=hash(i,151)*s,y=hash(i,157)*s;
      ctx.fillStyle=i%2?'rgba(126,143,76,.22)':'rgba(72,105,73,.28)';
      ctx.fillRect(x,y,Math.max(px,s*(.08+hash(i,163)*.12)),px);
    }
    ctx.strokeStyle='rgba(151,177,118,.18)';ctx.lineWidth=Math.max(1,px);
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(s*(.25+i*.23),s*(.30+i*.17),Math.max(1,s*(.08+i*.02)),0,Math.PI);ctx.stroke();}
    ctx.fillStyle='rgba(186,201,135,.24)';ctx.fillRect(s*.62,s*.18,px,px);ctx.fillRect(s*.28,s*.72,px,px);
    ctx.fillStyle='rgba(7,28,24,.20)';ctx.fillRect(0,s-px,s,px);
  }, size));

  tileCache.set(`bridge_swamp_${size}`, createTileCanvas((ctx, s) => {
    ctx.fillStyle='#294b43';ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#63543b';ctx.fillRect(2,0,s-4,s);
    const plank=Math.max(3,Math.round(s/6));
    for(let y=0;y<s;y+=plank){ctx.fillStyle=y%(plank*2)===0?'#756248':'#594a36';ctx.fillRect(3,y,s-6,Math.max(1,plank-1));ctx.fillStyle='rgba(146,159,86,.20)';ctx.fillRect(3,y,Math.max(1,s*.22),1);}
    ctx.fillStyle='#39432d';ctx.fillRect(0,0,2,s);ctx.fillRect(s-2,0,2,s);
  }, size));

'''
anchor="  tileCache.set(`water_${size}`, createTileCanvas((ctx, s) => {"
if 'water_swamp_${size}' not in text:
    if anchor not in text:raise SystemExit('swamp render cache anchor missing')
    text=text.replace(anchor,cache_block+anchor,1)
render.write_text(text,encoding='utf-8')

patch('src/game/render.ts',
"function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {",
"function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0, variant?: Tile['variant']) {",
'swamp material signature')
patch('src/game/render.ts',
"  if (type === 'water') {\n    ctx.fillStyle = 'rgba(217,241,255,.20)';\n    ctx.fillRect(x + size*.12, y + size*.24, size*.28, px);\n    ctx.fillRect(x + size*.56, y + size*.66, size*.22, px);\n    ctx.fillStyle = 'rgba(5,26,58,.18)';\n    ctx.fillRect(x + size*.18, y + size*.83, size*.56, px);",
"  if (type === 'water') {\n    ctx.fillStyle = variant === 'swamp' ? 'rgba(172,193,124,.12)' : 'rgba(217,241,255,.20)';\n    ctx.fillRect(x + size*.12, y + size*.24, size*.28, px);\n    ctx.fillRect(x + size*.56, y + size*.66, size*.22, px);\n    ctx.fillStyle = variant === 'swamp' ? 'rgba(10,39,31,.24)' : 'rgba(5,26,58,.18)';\n    ctx.fillRect(x + size*.18, y + size*.83, size*.56, px);",
'swamp static water finish')
patch('src/game/render.ts',
"  } else if (type === 'grass' || type === 'sand' || type === 'snow') {\n    ctx.fillStyle = type === 'grass' ? 'rgba(210,228,144,.08)' : type === 'snow' ? 'rgba(255,255,255,.16)' : 'rgba(255,235,174,.11)';",
"  } else if (type === 'grass' || type === 'sand' || type === 'snow') {\n    ctx.fillStyle = type === 'grass' ? (variant === 'swamp' ? 'rgba(141,158,87,.065)' : 'rgba(210,228,144,.08)') : type === 'snow' ? 'rgba(255,255,255,.16)' : 'rgba(255,235,174,.11)';",
'swamp grass finish')
patch('src/game/render.ts',
"  if (type === 'water') {\n    const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5; ctx.fillStyle = `rgba(220,245,255,${.05 + wave*.11})`; ctx.fillRect(x + size*.12, y + size * (.28 + wave * .20), size*(.22 + wave*.22), px);",
"  if (type === 'water') {\n    const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5; ctx.fillStyle = variant === 'swamp' ? `rgba(171,192,120,${.025 + wave*.065})` : `rgba(220,245,255,${.05 + wave*.11})`; ctx.fillRect(x + size*.12, y + size * (.28 + wave * .20), size*(.22 + wave*.22), px);",
'swamp animated water finish')
patch('src/game/render.ts',
"export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {\n  ctx.imageSmoothingEnabled = false; buildTileCache(size); const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) { ctx.drawImage(cached, x, y, size, size); drawMaterialFinish(ctx, tile.type, x, y, size, worldX, worldY, time); }\n}",
"export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number, worldX = 0, worldY = 0, time = 0) {\n  ctx.imageSmoothingEnabled = false; buildTileCache(size); const cacheKey = tile.variant ? `${tile.type}_${tile.variant}_${size}` : `${tile.type}_${size}`; const cached = tileCache.get(cacheKey) || tileCache.get(`${tile.type}_${size}`);\n  if (cached) { ctx.drawImage(cached, x, y, size, size); drawMaterialFinish(ctx, tile.type, x, y, size, worldX, worldY, time, tile.variant); }\n}",
'swamp renderer cache dispatch')

# Visual capture now proves the intended murky palette rather than generic blue water.
p=Path('tools/capture-moria-9-40b.mjs'); cap=p.read_text(encoding='utf-8')
old="let opaque=0,blueWater=0,darkGreen=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(b>g*1.15&&b>r*1.45&&b>70)blueWater++;if(g>r*1.15&&g>b*.8&&g<150)darkGreen++;}return{width:c.width,height:c.height,opaque,blueWater,darkGreen};}); if(stats.width<740||stats.height<740||stats.opaque<12000||stats.blueWater<700||stats.darkGreen<900)throw new Error(`Shadowfen panorama canvas lacks marsh rendering: ${JSON.stringify(stats)}`);"
new="let opaque=0,murkyWater=0,darkGreen=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(g>r*1.12&&b>r*1.08&&Math.abs(g-b)<48&&g<135)murkyWater++;if(g>r*1.18&&g>b*1.10&&g<135)darkGreen++;}return{width:c.width,height:c.height,opaque,murkyWater,darkGreen};}); if(stats.width<740||stats.height<740||stats.opaque<12000||stats.murkyWater<1200||stats.darkGreen<3000)throw new Error(`Shadowfen panorama canvas lacks murky marsh rendering: ${JSON.stringify(stats)}`);"
if new not in cap:
    if old not in cap:raise SystemExit('Shadowfen capture color anchor missing')
    cap=cap.replace(old,new,1)
p.write_text(cap,encoding='utf-8')

# Record the human-review-driven polish.
doc=Path('docs/MORIA_9_40_GRAND_SHADOWFEN.md'); text=doc.read_text(encoding='utf-8')
section="""

### 9.40B.1 — Polish de brejo após inspeção humana

A primeira captura 9.40B comprovou escala e topologia, porém a inspeção humana rejeitou a paleta por usar água azul genérica e gramado limpo demais. O polish adiciona uma `variant: 'swamp'` **somente visual** aos tiles `water`, `grass` e `bridge` quando o bioma é `swamp`.

O tipo lógico do tile, colisão, caminhabilidade, pathfinding e contratos do servidor não mudam. O renderer passa a usar água turva verde-azulada, limo, musgo, solo mais escuro e pontes envelhecidas. A captura automatizada também deixa de aceitar azul genérico e exige massa suficiente de pixels de água turva e vegetação escura.
"""
if '### 9.40B.1 — Polish de brejo após inspeção humana' not in text:doc.write_text(text+section,encoding='utf-8')
