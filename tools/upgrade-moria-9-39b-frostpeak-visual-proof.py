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

export default function GrandFrostpeakPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.frostpeak;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;
  const tiles=useMemo(()=>generateMap('frostpeak'),[map]);
  const topology=useMemo(()=>{
    let snow=0, paths=0, walls=0, trees=0;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const type=tiles[y]?.[x]?.type;
      if(type==='snow') snow++;
      else if(type==='path') paths++;
      else if(type==='wall') walls++;
      else if(type==='tree') trees++;
    }
    return {snow,paths,walls,trees};
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
      ctx.save();ctx.globalAlpha=.08;ctx.fillStyle=district.color;ctx.beginPath();ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.34;ctx.strokeStyle=district.color;ctx.lineWidth=1;ctx.stroke();ctx.restore();
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
      ctx.fillStyle='#67e8f9';ctx.fillRect(px-3,py-3,7,7);ctx.strokeStyle='#f8fafc';ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize,sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#fef08a';ctx.fillRect(sx-4,sy-4,9,9);ctx.strokeStyle='#17202a';ctx.strokeRect(sx-5,sy-5,11,11);
    ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);

  const major=map.landmarks.filter(l=>['frostpeak_frostguard_citadel','frostpeak_grand_market','frostpeak_anvil_hall','frostpeak_military_academy','frostpeak_ice_arena','frostpeak_northwatch'].includes(l.id));
  return <section data-grand-frostpeak-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-portal-count={map.portals.length} data-snow-count={topology.snow} data-path-count={topology.paths} data-wall-count={topology.walls} className="w-fit max-w-full rounded-xl border border-cyan-200/25 bg-[#071018]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-cyan-100/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-200/70">CAPITAL ALPINA AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-slate-50">GRAND FROSTPEAK</h2><div className="mt-1 text-[11px] text-cyan-50/55">Renderer de produção · plano terraced-bastion · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] uppercase tracking-wider text-cyan-50/60"><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.districts.length}</b>distritos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.landmarks.length}</b>marcos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.snow}</b>neve</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.walls}</b>muralhas</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#8db7ca] bg-black shadow-[0_0_48px_rgba(147,210,238,.14)]"><canvas ref={canvasRef} data-grand-frostpeak-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-cyan-100/15 bg-cyan-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Marcos da montanha</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-slate-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-cyan-50/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-sky-200/15 bg-sky-950/10 p-3 text-[10px] leading-relaxed text-sky-50/65">Os cinco patamares, a grande escadaria, as muralhas de retenção e os pátios nevados vêm da mesma geração usada pelo gameplay. A neve é tile real e caminhável. Caminhos: {topology.paths} · neve: {topology.snow} · muralhas: {topology.walls}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandFrostpeakPanorama.tsx',component)

replace_once('src/visualQa.tsx',
"import GrandIronwoodPanorama from './components/GrandIronwoodPanorama';",
"import GrandIronwoodPanorama from './components/GrandIronwoodPanorama';\nimport GrandFrostpeakPanorama from './components/GrandFrostpeakPanorama';",
'Frostpeak panorama import')

block=r'''

const FROSTPEAK_QA_PLAYER = { ...QA_PLAYER, mapId: 'frostpeak', pos: { x: 118, y: 116 } } as unknown as Player;
type FrostpeakQaMode = 'frostpeak-minimap' | 'frostpeak-city-designer' | 'frostpeak-panorama';

function AuthoritativeGrandFrostpeakQa({ mode }: { mode: FrostpeakQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active)return; const records=Array.isArray(payload?.items)?payload.items:[]; const frostpeak=records.find((record:any)=>record?.id==='frostpeak');
      if(!frostpeak||Number(frostpeak.width)!==160||Number(frostpeak.height)!==160||frostpeak.settlementClass!=='capital'||frostpeak.urbanPlan!=='terraced-bastion'||!Array.isArray(frostpeak.landmarks)||frostpeak.landmarks.length!==41) throw new Error('Grand Frostpeak autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-cyan-100" data-grand-frostpeak-server-loading="true">Sincronizando Grand Frostpeak com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-frostpeak-server-error="true">{error}</div>;
  const map=MAPS.frostpeak;
  if(mode==='frostpeak-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-frostpeak-server-ready="minimap" className="rounded-xl border border-cyan-200/30 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND FROSTPEAK · CAPITAL ALPINA 160×160</div><div className="mt-1 text-[10px] text-cyan-50/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos · jogador 118,116</div></div><WorldMiniMap player={FROSTPEAK_QA_PLAYER} monsters={[]} mapId="frostpeak" /></div></div>;
  if(mode==='frostpeak-city-designer') return <div className="relative z-10 p-4" data-grand-frostpeak-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-frostpeak-server-ready="panorama"><GrandFrostpeakPanorama /></div>;
}
'''
replace_once('src/visualQa.tsx',"\nfunction VisualQa() {",block+"\nfunction VisualQa() {",'Frostpeak QA function')
replace_once('src/visualQa.tsx',
"      {panel === 'ironwood-panorama' && <AuthoritativeGrandIronwoodQa mode=\"ironwood-panorama\" />}\n",
"      {panel === 'ironwood-panorama' && <AuthoritativeGrandIronwoodQa mode=\"ironwood-panorama\" />}\n      {panel === 'frostpeak-minimap' && <AuthoritativeGrandFrostpeakQa mode=\"frostpeak-minimap\" />}\n      {panel === 'frostpeak-city-designer' && <AuthoritativeGrandFrostpeakQa mode=\"frostpeak-city-designer\" />}\n      {panel === 'frostpeak-panorama' && <AuthoritativeGrandFrostpeakQa mode=\"frostpeak-panorama\" />}\n",
'Frostpeak QA panels')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.39b-screenshots'; const base='http://127.0.0.1:4173/visual-qa.html'; const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true}); const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1680,height:1220},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-frostpeak-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-frostpeak-server-error="true"]');if(await error.count())throw new Error(`9.39B server sync failed: ${await error.innerText()}`);}
await open('frostpeak-minimap'); const minimap=page.locator('[data-minimap-map="frostpeak"]'); await minimap.waitFor({state:'visible'}); if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Frostpeak minimap is not 160x160'); const mb=await minimap.boundingBox(); const east=page.getByTitle('Torre das Cinzas'); const eb=await east.boundingBox(); const pb=await page.locator('[data-minimap-player="true"]').boundingBox(); if(!mb||!eb||!pb)throw new Error('Frostpeak minimap geometry missing'); if(eb.x+eb.width/2<=mb.x+mb.width/2)throw new Error('Frostpeak eastern watch is not east of center'); if(pb.x+pb.width/2<=mb.x+mb.width/2||pb.y+pb.height/2<=mb.y+mb.height/2)throw new Error('Frostpeak QA player is not in southeast quadrant'); const miniProof=page.locator('[data-grand-frostpeak-server-ready="minimap"]'); const miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['grand frostpeak','160×160','12 distritos','41 marcos','4 acessos'])if(!miniText.includes(required))throw new Error(`Frostpeak minimap proof missing ${required}`); await miniProof.screenshot({path:`${output}/frostpeak-minimap.png`});
await open('frostpeak-city-designer'); const select=page.locator('[data-city-designer-map-select="true"]'); await select.waitFor({state:'visible'}); await select.selectOption('frostpeak'); await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160'); const preview=page.locator('[data-city-designer-preview="true"]'); if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Frostpeak City Designer lost capital dimensions'); await page.locator('[data-city-landmark-id="frostpeak_frostguard_citadel"]').waitFor({state:'visible'}); await page.locator('[data-city-landmark-id="frostpeak_ice_arena"]').waitFor({state:'visible'}); const designer=page.locator('[data-city-designer-root="true"]'); const dt=(await designer.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['designer de cidade','160×160','capital','41/64 construções'])if(!dt.includes(required))throw new Error(`Frostpeak designer proof missing ${required}`); await designer.screenshot({path:`${output}/frostpeak-city-designer.png`});
await open('frostpeak-panorama'); const panorama=page.locator('[data-grand-frostpeak-panorama="true"]'); await panorama.waitFor({state:'visible'}); if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-landmark-count')!=='41'||await panorama.getAttribute('data-district-count')!=='12'||await panorama.getAttribute('data-portal-count')!=='4')throw new Error('Frostpeak panorama authoritative metadata mismatch'); const snow=Number(await panorama.getAttribute('data-snow-count')); const paths=Number(await panorama.getAttribute('data-path-count')); const walls=Number(await panorama.getAttribute('data-wall-count')); if(snow<2500||paths<700||walls<250)throw new Error(`Frostpeak topology appears too sparse: ${JSON.stringify({snow,paths,walls})}`); for(const id of ['frostpeak_frostguard_citadel','frostpeak_grand_market','frostpeak_anvil_hall','frostpeak_military_academy','frostpeak_ice_arena','frostpeak_northwatch'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'}); const canvas=page.locator('[data-grand-frostpeak-canvas="true"]'); const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,pale=0;for(let i=0;i<data.length;i+=64){if(data[i+3]>0)opaque++;if(data[i]>175&&data[i+1]>180&&data[i+2]>185)pale++;}return{width:c.width,height:c.height,opaque,pale};}); if(stats.width<640||stats.height<700||stats.opaque<10000||stats.pale<1400)throw new Error(`Frostpeak panorama canvas lacks snowy rendering: ${JSON.stringify(stats)}`); const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['cidadela frostguard','mercado da geada','salão da bigorna','academia da montanha','arena do gelo','terraced-bastion','renderer de produção','neve é tile real'])if(!pt.includes(required))throw new Error(`Frostpeak panorama proof missing ${required}`); await panorama.screenshot({path:`${output}/frostpeak-panorama.png`}); await browser.close(); console.log(`Captured Mor'ia 9.39B Grand Frostpeak screenshots in ${output}`);
'''
write('tools/capture-moria-9-39b.mjs',capture)

p=ROOT/'docs/MORIA_9_39_GRAND_FROSTPEAK.md';text=p.read_text(encoding='utf-8')
section='''\n## 9.39B — Prova visual autoritativa\n\nA validação visual usa a mesma Grand Frostpeak entregue pelo servidor e sincronizada no cliente. O gate captura minimapa, City Designer e panorama pelo renderer de produção. As asserções exigem 160×160, `terraced-bastion`, 12 distritos, 41 construções, quatro acessos, densidade mínima de neve/caminhos/muralhas e pixels claros suficientes para provar que o terreno nevado está realmente renderizado.\n\nA 9.39 só pode ser aprovada depois do CI visual e da inspeção humana dos três PNGs.\n'''
if '## 9.39B — Prova visual autoritativa' not in text:p.write_text(text+section,encoding='utf-8')
print("Mor'ia 9.39B Frostpeak visual proof prepared")
