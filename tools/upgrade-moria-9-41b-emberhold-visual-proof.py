from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path;text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

component=r'''import { useEffect, useMemo, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = {
  keep:'castle', market:'market', temple:'temple', depot:'shop', gate:'tower', forge:'forge',
  dock:'dock', arena:'arena', obelisk:'obelisk', library:'library', graveyard:'graveyard', lodge:'inn', tower:'tower', house:'house',
};

export default function GrandEmberholdPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.emberhold;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;
  const tiles=useMemo(()=>generateMap('emberhold'),[map]);
  const topology=useMemo(()=>{
    let lava=0,bridges=0,paths=0,walls=0,floors=0;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const type=tiles[y]?.[x]?.type;
      if(type==='lava')lava++;
      else if(type==='bridge')bridges++;
      else if(type==='path')paths++;
      else if(type==='wall')walls++;
      else if(type==='floor')floors++;
    }
    return {lava,bridges,paths,walls,floors};
  },[bounds.height,bounds.width,bounds.x,bounds.y,tiles]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.width=canvasWidth;canvas.height=canvasHeight;
    const ctx=canvas.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const tile=tiles[y]?.[x];if(!tile)continue;
      drawTile(ctx,tile,(x-bounds.x)*tileSize,(y-bounds.y)*tileSize,tileSize,x,y,0);
    }
    for(const district of map.districts) {
      const cx=(district.x-bounds.x)*tileSize,cy=(district.y-bounds.y)*tileSize;
      if(cx<0||cy<0||cx>canvasWidth||cy>canvasHeight)continue;
      ctx.save();ctx.globalAlpha=.07;ctx.fillStyle=district.color;ctx.beginPath();ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.36;ctx.strokeStyle=district.color;ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
    for(const landmark of map.landmarks) {
      const sx=(landmark.x-bounds.x)*tileSize,sy=(landmark.y-bounds.y)*tileSize;
      if(sx+landmark.w*tileSize<0||sy+landmark.h*tileSize<0||sx>canvasWidth||sy>canvasHeight)continue;
      drawBuilding(ctx,sx,sy,{x:landmark.x,y:landmark.y,w:landmark.w,h:landmark.h,type:KIND_TO_BUILDING[landmark.kind]||'house',roofColor:map.roofColor,wallColor:map.wallColor,accentColor:map.cityAccent,icon:landmark.icon},tileSize,0);
    }
    ctx.save();
    for(const portal of map.portals) {
      if(portal.pos.x<bounds.x||portal.pos.y<bounds.y||portal.pos.x>=bounds.x+bounds.width||portal.pos.y>=bounds.y+bounds.height)continue;
      const px=(portal.pos.x-bounds.x)*tileSize,py=(portal.pos.y-bounds.y)*tileSize;
      ctx.fillStyle='#ffb454';ctx.fillRect(px-3,py-3,7,7);ctx.strokeStyle='#fff1b8';ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize,sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#fff2a8';ctx.fillRect(sx-4,sy-4,9,9);ctx.strokeStyle='#2d160f';ctx.strokeRect(sx-5,sy-5,11,11);
    ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);

  const major=map.landmarks.filter(l=>['emberhold_ember_citadel','emberhold_great_foundry','emberhold_ash_bazaar','emberhold_crucible_council','emberhold_cinder_arena','emberhold_dragon_forge'].includes(l.id));
  return <section data-grand-emberhold-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-portal-count={map.portals.length} data-lava-count={topology.lava} data-bridge-count={topology.bridges} data-path-count={topology.paths} data-wall-count={topology.walls} className="w-fit max-w-full rounded-xl border border-orange-300/25 bg-[#130907]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-orange-200/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-orange-200/70">CAPITAL VULCÂNICA AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-orange-50">GRAND EMBERHOLD</h2><div className="mt-1 text-[11px] text-orange-100/55">Renderer de produção · plano caldera-radials · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] uppercase tracking-wider text-orange-50/60"><div className="rounded border border-orange-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.districts.length}</b>distritos</div><div className="rounded border border-orange-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.landmarks.length}</b>marcos</div><div className="rounded border border-orange-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.lava}</b>lava</div><div className="rounded border border-orange-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.bridges}</b>pontes</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#9a5736] bg-black shadow-[0_0_52px_rgba(255,107,45,.16)]"><canvas ref={canvasRef} data-grand-emberhold-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-orange-100/15 bg-orange-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-200/70">Marcos da forja</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-orange-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-orange-100/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-red-300/15 bg-red-950/10 p-3 text-[10px] leading-relaxed text-orange-50/65">A caldeira central, as duas fissuras de lava, os anéis industriais e os quatro pátios de forja vêm da mesma geração usada pelo gameplay. Pontes aparecem somente onde as vias cruzam a lava. Lava: {topology.lava} · pontes: {topology.bridges} · caminhos: {topology.paths} · muralhas/construções: {topology.walls}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandEmberholdPanorama.tsx',component)

replace_once('src/visualQa.tsx',
"import GrandShadowfenPanorama from './components/GrandShadowfenPanorama';",
"import GrandShadowfenPanorama from './components/GrandShadowfenPanorama';\nimport GrandEmberholdPanorama from './components/GrandEmberholdPanorama';",
'Emberhold panorama import')

block=r'''

const EMBERHOLD_QA_PLAYER = { ...QA_PLAYER, mapId: 'emberhold', pos: { x: 116, y: 122 } } as unknown as Player;
type EmberholdQaMode = 'emberhold-minimap' | 'emberhold-city-designer' | 'emberhold-panorama';

function AuthoritativeGrandEmberholdQa({ mode }: { mode: EmberholdQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;const params=new URLSearchParams(window.location.search);const base=params.get('qaServer')||'http://127.0.0.1:3000';const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(`Servidor de conteúdo respondeu ${response.status}`);return response.json();}).then(payload=>{
      if(!active)return;const records=Array.isArray(payload?.items)?payload.items:[];const emberhold=records.find((record:any)=>record?.id==='emberhold');
      if(!emberhold||Number(emberhold.width)!==160||Number(emberhold.height)!==160||emberhold.settlementClass!=='capital'||emberhold.urbanPlan!=='caldera-radials'||!Array.isArray(emberhold.landmarks)||emberhold.landmarks.length!==42)throw new Error('Grand Emberhold autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading')return <div className="relative z-10 p-8 text-orange-100" data-grand-emberhold-server-loading="true">Sincronizando Grand Emberhold com o servidor autoritativo…</div>;
  if(status==='error')return <div className="relative z-10 p-8 text-red-200" data-grand-emberhold-server-error="true">{error}</div>;
  const map=MAPS.emberhold;
  if(mode==='emberhold-minimap')return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-emberhold-server-ready="minimap" className="rounded-xl border border-orange-300/25 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-orange-50">GRAND EMBERHOLD · CAPITAL VULCÂNICA 160×160</div><div className="mt-1 text-[10px] text-orange-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos físicos · jogador 116,122</div></div><WorldMiniMap player={EMBERHOLD_QA_PLAYER} monsters={[]} mapId="emberhold" /></div></div>;
  if(mode==='emberhold-city-designer')return <div className="relative z-10 p-4" data-grand-emberhold-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-emberhold-server-ready="panorama"><GrandEmberholdPanorama /></div>;
}
'''
replace_once('src/visualQa.tsx',"\nfunction VisualQa() {",block+"\nfunction VisualQa() {",'Emberhold QA function')
replace_once('src/visualQa.tsx',
"      {panel === 'shadowfen-panorama' && <AuthoritativeGrandShadowfenQa mode=\"shadowfen-panorama\" />}\n",
"      {panel === 'shadowfen-panorama' && <AuthoritativeGrandShadowfenQa mode=\"shadowfen-panorama\" />}\n      {panel === 'emberhold-minimap' && <AuthoritativeGrandEmberholdQa mode=\"emberhold-minimap\" />}\n      {panel === 'emberhold-city-designer' && <AuthoritativeGrandEmberholdQa mode=\"emberhold-city-designer\" />}\n      {panel === 'emberhold-panorama' && <AuthoritativeGrandEmberholdQa mode=\"emberhold-panorama\" />}\n",
'Emberhold QA panels')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.41b-screenshots';const base='http://127.0.0.1:4173/visual-qa.html';const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true});const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1680,height:1220},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-emberhold-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-emberhold-server-error="true"]');if(await error.count())throw new Error(`9.41B server sync failed: ${await error.innerText()}`);}
await open('emberhold-minimap');const minimap=page.locator('[data-minimap-map="emberhold"]');await minimap.waitFor({state:'visible'});if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Emberhold minimap is not 160x160');const mb=await minimap.boundingBox();const forge=page.getByTitle('Forja dos Dragões');const fb=await forge.boundingBox();const pb=await page.locator('[data-minimap-player="true"]').boundingBox();if(!mb||!fb||!pb)throw new Error('Emberhold minimap geometry missing');if(fb.x+fb.width/2<=mb.x+mb.width/2||fb.y+fb.height/2<=mb.y+mb.height/2)throw new Error('Dragon Forge is not in southeast quadrant');if(pb.x+pb.width/2<=mb.x+mb.width/2||pb.y+pb.height/2<=mb.y+mb.height/2)throw new Error('Emberhold QA player is not in southeast quadrant');const miniProof=page.locator('[data-grand-emberhold-server-ready="minimap"]');const miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['grand emberhold','160×160','12 distritos','42 marcos','4 acessos físicos'])if(!miniText.includes(required))throw new Error(`Emberhold minimap proof missing ${required}`);await miniProof.screenshot({path:`${output}/emberhold-minimap.png`});
await open('emberhold-city-designer');const select=page.locator('[data-city-designer-map-select="true"]');await select.waitFor({state:'visible'});await select.selectOption('emberhold');await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160');const preview=page.locator('[data-city-designer-preview="true"]');if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Emberhold City Designer lost capital dimensions');await page.locator('[data-city-landmark-id="emberhold_ember_citadel"]').waitFor({state:'visible'});await page.locator('[data-city-landmark-id="emberhold_cinder_arena"]').waitFor({state:'visible'});const designer=page.locator('[data-city-designer-root="true"]');const dt=(await designer.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['designer de cidade','160×160','capital','42/64 construções'])if(!dt.includes(required))throw new Error(`Emberhold designer proof missing ${required}`);await designer.screenshot({path:`${output}/emberhold-city-designer.png`});
await open('emberhold-panorama');const panorama=page.locator('[data-grand-emberhold-panorama="true"]');await panorama.waitFor({state:'visible'});if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-map-height')!=='160'||await panorama.getAttribute('data-landmark-count')!=='42'||await panorama.getAttribute('data-district-count')!=='12'||await panorama.getAttribute('data-portal-count')!=='2')throw new Error('Emberhold panorama authoritative metadata mismatch');const lava=Number(await panorama.getAttribute('data-lava-count'));const bridges=Number(await panorama.getAttribute('data-bridge-count'));const paths=Number(await panorama.getAttribute('data-path-count'));const walls=Number(await panorama.getAttribute('data-wall-count'));if(lava<600||bridges<350||paths<2500||walls<3000)throw new Error(`Emberhold topology appears too sparse: ${JSON.stringify({lava,bridges,paths,walls})}`);for(const id of ['emberhold_ember_citadel','emberhold_great_foundry','emberhold_ash_bazaar','emberhold_crucible_council','emberhold_cinder_arena','emberhold_dragon_forge'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'});const canvas=page.locator('[data-grand-emberhold-canvas="true"]');const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,hot=0,warmDark=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(r>145&&r>g*1.15&&g>45&&g<190&&b<130)hot++;if(r>55&&r<155&&g>30&&g<115&&b<95)warmDark++;}return{width:c.width,height:c.height,opaque,hot,warmDark};});if(stats.width<740||stats.height<740||stats.opaque<12000||stats.hot<350||stats.warmDark<2200)throw new Error(`Emberhold panorama canvas lacks volcanic rendering: ${JSON.stringify(stats)}`);const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['cidadela de ember','grande fundição','bazar das cinzas','conselho do cadinho','arena das brasas','forja dos dragões','caldera-radials','renderer de produção','duas fissuras de lava','pontes'])if(!pt.includes(required))throw new Error(`Emberhold panorama proof missing ${required}`);await panorama.screenshot({path:`${output}/emberhold-panorama.png`});await browser.close();console.log(`Captured Mor'ia 9.41B Grand Emberhold screenshots in ${output}`);'''
write('tools/capture-moria-9-41b.mjs',capture)

p=ROOT/'docs/MORIA_9_41_GRAND_EMBERHOLD.md';docs=p.read_text(encoding='utf-8')
section=r'''

## 9.41B — Prova visual autoritativa

A prova visual sobe o servidor real, consulta `/admin/api/maps`, sincroniza `MAPS.emberhold` e renderiza a mesma topologia usada pelo gameplay com `generateMap`, `drawTile` e `drawBuilding`.

O gate captura e valida:

- minimapa 160×160 com 12 distritos, 42 marcos e quatro acessos físicos;
- City Designer selecionado em Emberhold, com orçamento real `42/64 construções`;
- panorâmica completa da área urbana, medindo lava, pontes, caminhos e massa arquitetônica.

A aprovação humana exige uma caldeira central claramente legível, fissuras diagonais que realmente cortem a cidade, pontes/radiais coerentes, escala industrial convincente e identidade visual distinta das cinco capitais anteriores. Passar os asserts automáticos não basta para fechar 9.41.
'''
if '## 9.41B — Prova visual autoritativa' not in docs:p.write_text(docs+section,encoding='utf-8')
