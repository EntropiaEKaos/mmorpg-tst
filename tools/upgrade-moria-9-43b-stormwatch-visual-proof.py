from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path;text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Cosmetic storm variant only; authoritative logical tile types/walkability stay unchanged.
replace_once('src/game/types.ts',"variant?: 'swamp' | 'crystal';","variant?: 'swamp' | 'crystal' | 'storm';",'storm tile variant')

old_variant="""      const inCrystalUrban = mapData.urbanPlan === 'geode-chambers' && mapData.urbanBounds && x >= mapData.urbanBounds.x && x < mapData.urbanBounds.x + mapData.urbanBounds.width && y >= mapData.urbanBounds.y && y < mapData.urbanBounds.y + mapData.urbanBounds.height;
      const variant: Tile['variant'] = inCrystalUrban && (type === 'wall' || type === 'floor' || type === 'path') ? 'crystal' : biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;"""
new_variant="""      const inCrystalUrban = mapData.urbanPlan === 'geode-chambers' && mapData.urbanBounds && x >= mapData.urbanBounds.x && x < mapData.urbanBounds.x + mapData.urbanBounds.width && y >= mapData.urbanBounds.y && y < mapData.urbanBounds.y + mapData.urbanBounds.height;
      const inStormUrban = mapData.urbanPlan === 'tempest-archipelago' && mapData.urbanBounds && x >= mapData.urbanBounds.x && x < mapData.urbanBounds.x + mapData.urbanBounds.width && y >= mapData.urbanBounds.y && y < mapData.urbanBounds.y + mapData.urbanBounds.height;
      const variant: Tile['variant'] = inCrystalUrban && (type === 'wall' || type === 'floor' || type === 'path') ? 'crystal' : inStormUrban && (type === 'water' || type === 'rock' || type === 'snow' || type === 'path' || type === 'bridge') ? 'storm' : biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;"""
replace_once('src/game/maps.ts',old_variant,new_variant,'storm client variant')

storm_cache=r'''

  tileCache.set(`water_storm_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;const grad=ctx.createLinearGradient(0,0,s,s);grad.addColorStop(0,'#102b3b');grad.addColorStop(.5,'#173d50');grad.addColorStop(1,'#0b2130');ctx.fillStyle=grad;ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));
    for(let i=0;i<8;i++){const y=Math.floor(hash(i,301)*s);const x=Math.floor(hash(i,307)*s*.55);ctx.fillStyle=i%3===0?'rgba(183,225,239,.32)':'rgba(92,142,165,.24)';ctx.fillRect(x,y,Math.max(px,s*(.16+hash(i,311)*.30)),px);}
    ctx.fillStyle='rgba(4,14,23,.34)';ctx.fillRect(0,s-px,s,px);
  },size));
  tileCache.set(`rock_storm_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#283845';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));for(let i=0;i<18;i++){const x=Math.floor(hash(i,313)*s),y=Math.floor(hash(i,317)*s);ctx.fillStyle=['#354b5a','#425866','#1e2f3b','#596975'][Math.floor(hash(i,319)*4)];ctx.fillRect(x,y,Math.max(px,s*.11),Math.max(px,s*.055));}ctx.fillStyle='rgba(187,222,232,.16)';ctx.fillRect(px,px,s*.48,px);ctx.fillStyle='rgba(4,12,18,.28)';ctx.fillRect(0,s-Math.max(px,s*.08),s,Math.max(px,s*.08));
  },size));
  tileCache.set(`snow_storm_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#758a98';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));for(let i=0;i<16;i++){const x=Math.floor(hash(i,331)*s),y=Math.floor(hash(i,337)*s);ctx.fillStyle=hash(i,347)>.55?'rgba(205,226,234,.20)':'rgba(41,58,70,.18)';ctx.fillRect(x,y,Math.max(px,s*.10),px);}ctx.fillStyle='rgba(14,35,48,.13)';ctx.fillRect(0,s*.72,s,s*.28);
  },size));
  tileCache.set(`path_storm_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#455a68';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));ctx.fillStyle='#647986';ctx.fillRect(0,s*.18,s,s*.64);for(let y=Math.round(s*.25);y<s;y+=Math.max(3,Math.round(s*.24))){ctx.fillStyle='rgba(17,33,43,.38)';ctx.fillRect(0,y,s,px);}ctx.fillStyle='rgba(129,222,248,.34)';ctx.fillRect(0,s*.48,s,Math.max(px,s*.035));
  },size));
  tileCache.set(`bridge_storm_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#102d3e';ctx.fillRect(0,0,s,s);ctx.fillStyle='#5b6470';ctx.fillRect(2,0,s-4,s);const plank=Math.max(3,Math.round(s/6));for(let y=0;y<s;y+=plank){ctx.fillStyle=y%(plank*2)===0?'#69737c':'#4b555f';ctx.fillRect(3,y,s-6,Math.max(1,plank-1));ctx.fillStyle='rgba(185,225,235,.14)';ctx.fillRect(4,y,Math.max(1,s*.35),1);}ctx.fillStyle='#293943';ctx.fillRect(0,0,2,s);ctx.fillRect(s-2,0,2,s);ctx.fillStyle='rgba(108,218,245,.24)';ctx.fillRect(s*.48,0,Math.max(1,s*.04),s);
  },size));
'''
render_path=ROOT/'src/game/render.ts';render=render_path.read_text(encoding='utf-8')
if 'water_storm_' not in render:
    anchor="\n  tileCache.set(`water_${size}`, createTileCanvas((ctx, s) => {"
    if anchor not in render:raise SystemExit('storm renderer cache anchor missing')
    render=render.replace(anchor,storm_cache+anchor,1)
    render_path.write_text(render,encoding='utf-8')

replace_once('src/game/render.ts',"ctx.fillStyle = variant === 'swamp' ? 'rgba(172,193,124,.12)' : 'rgba(217,241,255,.20)';","ctx.fillStyle = variant === 'swamp' ? 'rgba(172,193,124,.12)' : variant === 'storm' ? 'rgba(184,225,239,.13)' : 'rgba(217,241,255,.20)';",'storm water material highlight')
replace_once('src/game/render.ts',"ctx.fillStyle = variant === 'swamp' ? 'rgba(10,39,31,.24)' : 'rgba(5,26,58,.18)';","ctx.fillStyle = variant === 'swamp' ? 'rgba(10,39,31,.24)' : variant === 'storm' ? 'rgba(3,20,31,.28)' : 'rgba(5,26,58,.18)';",'storm water material shadow')
replace_once('src/game/render.ts',"type === 'snow' ? 'rgba(255,255,255,.16)'","type === 'snow' ? (variant === 'storm' ? 'rgba(194,221,230,.09)' : 'rgba(255,255,255,.16)')",'storm snow material')
replace_once('src/game/render.ts',"const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5; ctx.fillStyle = variant === 'swamp' ? `rgba(171,192,120,${.025 + wave*.065})` : `rgba(220,245,255,${.05 + wave*.11})`;","const wave = (Math.sin(time / 430 + worldX * .7 + worldY * .31) + 1) * .5; ctx.fillStyle = variant === 'swamp' ? `rgba(171,192,120,${.025 + wave*.065})` : variant === 'storm' ? `rgba(166,219,236,${.035 + wave*.075})` : `rgba(220,245,255,${.05 + wave*.11})`;",'storm animated water')

# Production minimap palette.
mini_path=ROOT/'src/components/WorldMiniMap.tsx';mini=mini_path.read_text(encoding='utf-8')
if 'STORM_TILE_COLORS' not in mini:
    mini=mini.replace("const CRYSTAL_TILE_COLORS: Partial<Record<TileType,string>> = { wall:'#17182b', floor:'#4d5277', path:'#6ca9c7' };","const CRYSTAL_TILE_COLORS: Partial<Record<TileType,string>> = { wall:'#17182b', floor:'#4d5277', path:'#6ca9c7' };\nconst STORM_TILE_COLORS: Partial<Record<TileType,string>> = { water:'#18384d', rock:'#354858', snow:'#8799a8', path:'#718b9e', bridge:'#8c7860' };")
    old="tile ? (tile.variant === 'crystal' ? (CRYSTAL_TILE_COLORS[tile.type] || TILE_COLORS[tile.type] || fallback) : (TILE_COLORS[tile.type] || fallback)) : fallback"
    new="tile ? (tile.variant === 'crystal' ? (CRYSTAL_TILE_COLORS[tile.type] || TILE_COLORS[tile.type] || fallback) : tile.variant === 'storm' ? (STORM_TILE_COLORS[tile.type] || TILE_COLORS[tile.type] || fallback) : (TILE_COLORS[tile.type] || fallback)) : fallback"
    if old not in mini:raise SystemExit('Storm minimap dispatch anchor missing')
    mini=mini.replace(old,new,1);mini_path.write_text(mini,encoding='utf-8')

component=r'''import { useEffect, useMemo, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = { keep:'castle',market:'market',temple:'temple',depot:'shop',gate:'tower',forge:'forge',dock:'dock',arena:'arena',obelisk:'obelisk',library:'library',graveyard:'graveyard',lodge:'inn',tower:'tower',house:'house' };

export default function GrandStormwatchPanorama(){
  const canvasRef=useRef<HTMLCanvasElement>(null);const map=MAPS.stormwatch_isle;const {width,height}=getMapDimensions(map);const bounds=map.urbanBounds||{x:0,y:0,width,height};const tileSize=6;const canvasWidth=bounds.width*tileSize,canvasHeight=bounds.height*tileSize;const tiles=useMemo(()=>generateMap('stormwatch_isle'),[map]);
  const topology=useMemo(()=>{let water=0,bridges=0,rocks=0,snow=0,paths=0;for(let y=bounds.y;y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++){const type=tiles[y]?.[x]?.type;if(type==='water')water++;else if(type==='bridge')bridges++;else if(type==='rock')rocks++;else if(type==='snow')snow++;else if(type==='path')paths++;}return{water,bridges,rocks,snow,paths};},[bounds.height,bounds.width,bounds.x,bounds.y,tiles]);
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;canvas.width=canvasWidth;canvas.height=canvasHeight;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;for(let y=bounds.y;y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++){const tile=tiles[y]?.[x];if(tile)drawTile(ctx,tile,(x-bounds.x)*tileSize,(y-bounds.y)*tileSize,tileSize,x,y,0);}for(const district of map.districts){const cx=(district.x-bounds.x)*tileSize,cy=(district.y-bounds.y)*tileSize;if(cx<0||cy<0||cx>canvasWidth||cy>canvasHeight)continue;ctx.save();ctx.globalAlpha=.07;ctx.fillStyle=district.color;ctx.beginPath();ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.34;ctx.strokeStyle=district.color;ctx.lineWidth=1;ctx.stroke();ctx.restore();}for(const landmark of map.landmarks){const sx=(landmark.x-bounds.x)*tileSize,sy=(landmark.y-bounds.y)*tileSize;if(sx+landmark.w*tileSize<0||sy+landmark.h*tileSize<0||sx>canvasWidth||sy>canvasHeight)continue;drawBuilding(ctx,sx,sy,{x:landmark.x,y:landmark.y,w:landmark.w,h:landmark.h,type:KIND_TO_BUILDING[landmark.kind]||'house',roofColor:map.roofColor,wallColor:map.wallColor,accentColor:map.cityAccent,icon:landmark.icon},tileSize,0);}ctx.save();for(const portal of map.portals){if(portal.pos.x<bounds.x||portal.pos.y<bounds.y||portal.pos.x>=bounds.x+bounds.width||portal.pos.y>=bounds.y+bounds.height)continue;const px=(portal.pos.x-bounds.x)*tileSize,py=(portal.pos.y-bounds.y)*tileSize;ctx.fillStyle='#8ddcff';ctx.fillRect(px-3,py-3,7,7);ctx.strokeStyle='#e8fbff';ctx.strokeRect(px-4,py-4,9,9);}const sx=(map.spawnPoint.x-bounds.x)*tileSize,sy=(map.spawnPoint.y-bounds.y)*tileSize;ctx.fillStyle='#fff4bd';ctx.fillRect(sx-4,sy-4,9,9);ctx.strokeStyle='#122332';ctx.strokeRect(sx-5,sy-5,11,11);ctx.restore();},[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);
  const major=map.landmarks.filter(l=>['stormwatch_tempest_bastion','stormwatch_conduit_spire','stormwatch_windwright_forge','stormwatch_thunderwatch','stormwatch_maelstrom_academy','stormwatch_nightfall_gate'].includes(l.id));
  return <section data-grand-stormwatch-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-portal-count={map.portals.length} data-water-count={topology.water} data-bridge-count={topology.bridges} data-rock-count={topology.rocks} data-snow-count={topology.snow} data-path-count={topology.paths} className="w-fit max-w-full rounded-xl border border-cyan-200/20 bg-[#07121b]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-cyan-100/15 pb-3"><div><div className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-200/70">CAPITAL INSULAR AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-cyan-50">GRAND STORMWATCH ISLE</h2><div className="mt-1 text-[11px] text-cyan-100/55">Renderer de produção · plano tempest-archipelago · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div><div className="grid grid-cols-4 gap-2 text-center text-[9px] uppercase tracking-wider text-cyan-50/60"><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.districts.length}</b>distritos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.landmarks.length}</b>marcos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.water}</b>mar</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.bridges}</b>pontes</div></div></header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#49697c] bg-black shadow-[0_0_54px_rgba(98,191,222,.12)]"><canvas ref={canvasRef} data-grand-stormwatch-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-cyan-100/15 bg-cyan-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Marcos da tempestade</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-cyan-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-cyan-100/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-sky-300/15 bg-slate-950/55 p-3 text-[10px] leading-relaxed text-cyan-50/65">Seis ilhas rochosas são separadas por mar de tempestade e conectadas por causeways estreitos. O Olho da Tempestade concentra o poder cívico enquanto Thunderwatch, a Frota Norte e o Passadiço de Nightfall controlam os extremos. Mar: {topology.water} · pontes: {topology.bridges} · rocha: {topology.rocks} · caminhos: {topology.paths}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandStormwatchPanorama.tsx',component)

replace_once('src/visualQa.tsx',"import GrandCrystalDeepPanorama from './components/GrandCrystalDeepPanorama';","import GrandCrystalDeepPanorama from './components/GrandCrystalDeepPanorama';\nimport GrandStormwatchPanorama from './components/GrandStormwatchPanorama';",'Stormwatch panorama import')

qa=r'''

const STORMWATCH_QA_PLAYER = { ...QA_PLAYER, mapId: 'stormwatch_isle', pos: { x: 128, y: 128 } } as unknown as Player;
type StormwatchQaMode = 'stormwatch-minimap' | 'stormwatch-city-designer' | 'stormwatch-panorama';
function AuthoritativeGrandStormwatchQa({mode}:{mode:StormwatchQaMode}){
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');const [error,setError]=useState('');
  useEffect(()=>{let active=true;const params=new URLSearchParams(window.location.search);const base=params.get('qaServer')||'http://127.0.0.1:3000';const token=params.get('qaToken')||'';fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(`Servidor de conteúdo respondeu ${response.status}`);return response.json();}).then(payload=>{if(!active)return;const records=Array.isArray(payload?.items)?payload.items:[];const storm=records.find((record:any)=>record?.id==='stormwatch_isle');if(!storm||Number(storm.width)!==160||Number(storm.height)!==160||storm.settlementClass!=='capital'||storm.urbanPlan!=='tempest-archipelago'||!Array.isArray(storm.landmarks)||storm.landmarks.length!==42)throw new Error('Grand Stormwatch Isle autoritativa 160×160 não foi recebida do servidor');syncServerMaps(records);setStatus('ready');}).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};},[]);
  if(status==='loading')return <div className="relative z-10 p-8 text-cyan-100" data-grand-stormwatch-server-loading="true">Sincronizando Grand Stormwatch Isle com o servidor autoritativo…</div>;
  if(status==='error')return <div className="relative z-10 p-8 text-red-200" data-grand-stormwatch-server-error="true">{error}</div>;const map=MAPS.stormwatch_isle;
  if(mode==='stormwatch-minimap')return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-stormwatch-server-ready="minimap" className="rounded-xl border border-cyan-300/25 bg-black/80 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND STORMWATCH ISLE · CAPITAL INSULAR 160×160</div><div className="mt-1 text-[10px] text-cyan-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos físicos · jogador 128,128</div></div><WorldMiniMap player={STORMWATCH_QA_PLAYER} monsters={[]} mapId="stormwatch_isle" /></div></div>;
  if(mode==='stormwatch-city-designer')return <div className="relative z-10 p-4" data-grand-stormwatch-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-stormwatch-server-ready="panorama"><GrandStormwatchPanorama /></div>;
}
'''
p=ROOT/'src/visualQa.tsx';text=p.read_text(encoding='utf-8')
if 'function AuthoritativeGrandStormwatchQa' not in text:
    anchor='\nfunction VisualQa() {'
    if anchor not in text:raise SystemExit('Stormwatch QA anchor missing')
    text=text.replace(anchor,qa+anchor,1);p.write_text(text,encoding='utf-8')
replace_once('src/visualQa.tsx',"      {panel === 'crystal-deep-panorama' && <AuthoritativeGrandCrystalDeepQa mode=\"crystal-deep-panorama\" />}\n","      {panel === 'crystal-deep-panorama' && <AuthoritativeGrandCrystalDeepQa mode=\"crystal-deep-panorama\" />}\n      {panel === 'stormwatch-minimap' && <AuthoritativeGrandStormwatchQa mode=\"stormwatch-minimap\" />}\n      {panel === 'stormwatch-city-designer' && <AuthoritativeGrandStormwatchQa mode=\"stormwatch-city-designer\" />}\n      {panel === 'stormwatch-panorama' && <AuthoritativeGrandStormwatchQa mode=\"stormwatch-panorama\" />}\n",'Stormwatch QA panels')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.43b-screenshots',base='http://127.0.0.1:4173/visual-qa.html',auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';await mkdir(output,{recursive:true});const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1720,height:1260},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-stormwatch-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-stormwatch-server-error="true"]');if(await error.count())throw new Error(`9.43B server sync failed: ${await error.innerText()}`);}
await open('stormwatch-minimap');const minimap=page.locator('[data-minimap-map="stormwatch_isle"]');await minimap.waitFor({state:'visible'});if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Stormwatch minimap is not 160x160');const mb=await minimap.boundingBox(),night=await page.locator('[data-minimap-marker="stormwatch_nightfall_gate"]').boundingBox(),pb=await page.locator('[data-minimap-player="true"]').boundingBox();if(!mb||!night||!pb)throw new Error('Stormwatch minimap geometry missing');if(night.x+night.width/2<=mb.x+mb.width*.65||night.y+night.height/2<=mb.y+mb.height*.65)throw new Error('Nightfall gate is not in the southeast archipelago');if(pb.x+pb.width/2<=mb.x+mb.width/2||pb.y+pb.height/2<=mb.y+mb.height/2)throw new Error('Stormwatch QA player is not on southeast island');const miniProof=page.locator('[data-grand-stormwatch-server-ready="minimap"]'),miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['grand stormwatch isle','160×160','12 distritos','42 marcos','4 acessos físicos'])if(!miniText.includes(required))throw new Error(`Stormwatch minimap proof missing ${required}`);await miniProof.screenshot({path:`${output}/stormwatch-minimap.png`});
await open('stormwatch-city-designer');const select=page.locator('[data-city-designer-map-select="true"]');await select.waitFor({state:'visible'});await select.selectOption('stormwatch_isle');await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160');const preview=page.locator('[data-city-designer-preview="true"]');if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Stormwatch City Designer lost capital dimensions');for(const id of ['stormwatch_tempest_bastion','stormwatch_thunderwatch','stormwatch_nightfall_gate'])await page.locator(`[data-city-landmark-id="${id}"]`).waitFor({state:'visible'});const designer=page.locator('[data-city-designer-root="true"]'),dt=(await designer.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['designer de cidade','160×160','capital','42/64 construções'])if(!dt.includes(required))throw new Error(`Stormwatch designer proof missing ${required}`);await designer.screenshot({path:`${output}/stormwatch-city-designer.png`});
await open('stormwatch-panorama');const panorama=page.locator('[data-grand-stormwatch-panorama="true"]');await panorama.waitFor({state:'visible'});if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-map-height')!=='160'||await panorama.getAttribute('data-landmark-count')!=='42'||await panorama.getAttribute('data-district-count')!=='12'||await panorama.getAttribute('data-portal-count')!=='3')throw new Error('Stormwatch panorama authoritative metadata mismatch');const water=Number(await panorama.getAttribute('data-water-count')),bridges=Number(await panorama.getAttribute('data-bridge-count')),rocks=Number(await panorama.getAttribute('data-rock-count')),snow=Number(await panorama.getAttribute('data-snow-count')),paths=Number(await panorama.getAttribute('data-path-count'));if(water<8000||bridges<180||rocks<1600||snow<2200||paths<700)throw new Error(`Stormwatch topology appears too sparse: ${JSON.stringify({water,bridges,rocks,snow,paths})}`);for(const id of ['stormwatch_tempest_bastion','stormwatch_conduit_spire','stormwatch_windwright_forge','stormwatch_thunderwatch','stormwatch_maelstrom_academy','stormwatch_nightfall_gate'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'});const canvas=page.locator('[data-grand-stormwatch-canvas="true"]');const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,darkOcean=0,stormSlate=0,cyan=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(b>r*1.25&&g>r*1.15&&b>35&&b<115)darkOcean++;if(b>r*1.08&&g>r*1.02&&r>35&&r<145&&b<175)stormSlate++;if(b>125&&g>100&&b>r*1.15)cyan++;}return{width:c.width,height:c.height,opaque,darkOcean,stormSlate,cyan};});if(stats.width<790||stats.height<790||stats.opaque<15000||stats.darkOcean<6000||stats.stormSlate<2500||stats.cyan<180)throw new Error(`Stormwatch panorama lacks storm rendering: ${JSON.stringify(stats)}`);const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['bastião da tempestade','agulha do condutor','forja dos aeroforjadores','torre thunderwatch','academia do maelstrom','passadiço de nightfall','tempest-archipelago','renderer de produção','seis ilhas rochosas','mar de tempestade','causeways','olho da tempestade'])if(!pt.includes(required))throw new Error(`Stormwatch panorama proof missing ${required}`);await panorama.screenshot({path:`${output}/stormwatch-panorama.png`});await browser.close();console.log(`Captured Mor'ia 9.43B Grand Stormwatch Isle screenshots in ${output}`);
'''
write('tools/capture-moria-9-43b.mjs',capture)

# Append docs once.
p=ROOT/'docs/MORIA_9_43_GRAND_STORMWATCH_ISLE.md';text=p.read_text(encoding='utf-8')
section="""

## 9.43B — Prova visual autoritativa
A validação visual usa o mesmo `generateMap`, `drawTile`, `drawBuilding`, minimapa e City Designer do cliente de produção, sincronizados com `/admin/api/maps` do servidor autoritativo. O tile lógico não muda; a variante cosmética `storm` fornece mar profundo com whitecaps, costa de ardósia molhada, neve castigada por granizo e causeways metálicos.

O gate captura minimapa, Designer e panorâmica, mede os contadores reais de mar/pontes/rocha/neve/caminhos e também inspeciona a paleta de pixels para impedir regressão a água tropical ou superfície clara genérica.
"""
if '## 9.43B — Prova visual autoritativa' not in text:p.write_text(text+section,encoding='utf-8')

print("Mor'ia 9.43B Stormwatch visual proof applicator complete")
