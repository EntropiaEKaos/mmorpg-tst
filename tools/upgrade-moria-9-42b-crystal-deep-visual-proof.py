from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
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

export default function GrandCrystalDeepPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.crystal_deep;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;
  const tiles=useMemo(()=>generateMap('crystal_deep'),[map]);
  const topology=useMemo(()=>{
    let walls=0,floors=0,paths=0;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const type=tiles[y]?.[x]?.type;
      if(type==='wall')walls++;else if(type==='floor')floors++;else if(type==='path')paths++;
    }
    return {walls,floors,paths};
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
      ctx.save();ctx.globalAlpha=.08;ctx.fillStyle=district.color;ctx.beginPath();ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.40;ctx.strokeStyle=district.color;ctx.lineWidth=1;ctx.stroke();ctx.restore();
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
      ctx.fillStyle='#74e1ff';ctx.fillRect(px-3,py-3,7,7);ctx.strokeStyle='#e4fbff';ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize,sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#f0dbff';ctx.fillRect(sx-4,sy-4,9,9);ctx.strokeStyle='#18182a';ctx.strokeRect(sx-5,sy-5,11,11);
    ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);

  const major=map.landmarks.filter(l=>['crystaldeep_prism_conclave','crystaldeep_crystal_spire','crystaldeep_shardsmith_foundry','crystaldeep_resonance_shrine','crystaldeep_west_lift_gate','crystaldeep_east_lift_gate'].includes(l.id));
  return <section data-grand-crystal-deep-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-portal-count={map.portals.length} data-wall-count={topology.walls} data-floor-count={topology.floors} data-path-count={topology.paths} className="w-fit max-w-full rounded-xl border border-cyan-200/20 bg-[#08091a]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-cyan-100/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-200/70">CAPITAL SUBTERRÂNEA AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-cyan-50">GRAND CRYSTAL DEEP</h2><div className="mt-1 text-[11px] text-cyan-100/55">Renderer de produção · plano geode-chambers · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] uppercase tracking-wider text-cyan-50/60"><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.districts.length}</b>distritos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.landmarks.length}</b>marcos</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.floors}</b>câmaras</div><div className="rounded border border-cyan-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.paths}</b>galerias</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#554f8a] bg-black shadow-[0_0_52px_rgba(116,225,255,.14)]"><canvas ref={canvasRef} data-grand-crystal-deep-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-cyan-100/15 bg-cyan-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Marcos do geodo</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-cyan-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-cyan-100/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-violet-300/15 bg-violet-950/10 p-3 text-[10px] leading-relaxed text-cyan-50/65">As câmaras circulares, galerias estreitas e poços de acesso são a mesma topologia usada pelo gameplay. A rocha maciça domina a cidade e força os deslocamentos pelos corredores do geodo. Rocha: {topology.walls} · câmaras: {topology.floors} · galerias: {topology.paths}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandCrystalDeepPanorama.tsx',component)

replace_once('src/visualQa.tsx',
"import GrandEmberholdPanorama from './components/GrandEmberholdPanorama';",
"import GrandEmberholdPanorama from './components/GrandEmberholdPanorama';\nimport GrandCrystalDeepPanorama from './components/GrandCrystalDeepPanorama';",
'Crystal Deep panorama import')

block=r'''

const CRYSTAL_DEEP_QA_PLAYER = { ...QA_PLAYER, mapId: 'crystal_deep', pos: { x: 108, y: 118 } } as unknown as Player;
type CrystalDeepQaMode = 'crystal-deep-minimap' | 'crystal-deep-city-designer' | 'crystal-deep-panorama';

function AuthoritativeGrandCrystalDeepQa({ mode }: { mode: CrystalDeepQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;const params=new URLSearchParams(window.location.search);const base=params.get('qaServer')||'http://127.0.0.1:3000';const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(`Servidor de conteúdo respondeu ${response.status}`);return response.json();}).then(payload=>{
      if(!active)return;const records=Array.isArray(payload?.items)?payload.items:[];const crystal=records.find((record:any)=>record?.id==='crystal_deep');
      if(!crystal||Number(crystal.width)!==160||Number(crystal.height)!==160||crystal.settlementClass!=='capital'||crystal.urbanPlan!=='geode-chambers'||!Array.isArray(crystal.landmarks)||crystal.landmarks.length!==42)throw new Error('Grand Crystal Deep autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading')return <div className="relative z-10 p-8 text-cyan-100" data-grand-crystal-deep-server-loading="true">Sincronizando Grand Crystal Deep com o servidor autoritativo…</div>;
  if(status==='error')return <div className="relative z-10 p-8 text-red-200" data-grand-crystal-deep-server-error="true">{error}</div>;
  const map=MAPS.crystal_deep;
  if(mode==='crystal-deep-minimap')return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-crystal-deep-server-ready="minimap" className="rounded-xl border border-cyan-300/25 bg-black/80 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND CRYSTAL DEEP · CAPITAL SUBTERRÂNEA 160×160</div><div className="mt-1 text-[10px] text-cyan-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 poços/acessos físicos · jogador 108,118</div></div><WorldMiniMap player={CRYSTAL_DEEP_QA_PLAYER} monsters={[]} mapId="crystal_deep" /></div></div>;
  if(mode==='crystal-deep-city-designer')return <div className="relative z-10 p-4" data-grand-crystal-deep-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-crystal-deep-server-ready="panorama"><GrandCrystalDeepPanorama /></div>;
}
'''
p=ROOT/'src/visualQa.tsx';text=p.read_text(encoding='utf-8')
if 'function AuthoritativeGrandCrystalDeepQa' not in text:
    anchor='\nfunction VisualQa() {'
    if anchor not in text:raise SystemExit('Crystal Deep QA function anchor missing')
    text=text.replace(anchor,block+anchor,1);p.write_text(text,encoding='utf-8')

replace_once('src/visualQa.tsx',
"      {panel === 'emberhold-panorama' && <AuthoritativeGrandEmberholdQa mode=\"emberhold-panorama\" />}\n",
"      {panel === 'emberhold-panorama' && <AuthoritativeGrandEmberholdQa mode=\"emberhold-panorama\" />}\n      {panel === 'crystal-deep-minimap' && <AuthoritativeGrandCrystalDeepQa mode=\"crystal-deep-minimap\" />}\n      {panel === 'crystal-deep-city-designer' && <AuthoritativeGrandCrystalDeepQa mode=\"crystal-deep-city-designer\" />}\n      {panel === 'crystal-deep-panorama' && <AuthoritativeGrandCrystalDeepQa mode=\"crystal-deep-panorama\" />}\n",
'Crystal Deep QA panels')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.42b-screenshots';const base='http://127.0.0.1:4173/visual-qa.html';const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true});const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1680,height:1220},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-crystal-deep-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-crystal-deep-server-error="true"]');if(await error.count())throw new Error(`9.42B server sync failed: ${await error.innerText()}`);}
await open('crystal-deep-minimap');const minimap=page.locator('[data-minimap-map="crystal_deep"]');await minimap.waitFor({state:'visible'});if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Crystal Deep minimap is not 160x160');const mb=await minimap.boundingBox();const east=page.getByTitle('Elevador do Leste');const eb=await east.boundingBox();const pb=await page.locator('[data-minimap-player="true"]').boundingBox();if(!mb||!eb||!pb)throw new Error('Crystal Deep minimap geometry missing');if(eb.x+eb.width/2<=mb.x+mb.width/2)throw new Error('East Lift is not east of the geode center');if(pb.x+pb.width/2<=mb.x+mb.width/2||pb.y+pb.height/2<=mb.y+mb.height/2)throw new Error('Crystal Deep QA player is not in southeast chamber');const miniProof=page.locator('[data-grand-crystal-deep-server-ready="minimap"]');const miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['grand crystal deep','160×160','12 distritos','42 marcos','4 poços/acessos físicos'])if(!miniText.includes(required))throw new Error(`Crystal Deep minimap proof missing ${required}`);await miniProof.screenshot({path:`${output}/crystal-deep-minimap.png`});
await open('crystal-deep-city-designer');const select=page.locator('[data-city-designer-map-select="true"]');await select.waitFor({state:'visible'});await select.selectOption('crystal_deep');await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160');const preview=page.locator('[data-city-designer-preview="true"]');if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Crystal Deep City Designer lost capital dimensions');await page.locator('[data-city-landmark-id="crystaldeep_prism_conclave"]').waitFor({state:'visible'});await page.locator('[data-city-landmark-id="crystaldeep_east_lift_gate"]').waitFor({state:'visible'});const designer=page.locator('[data-city-designer-root="true"]');const dt=(await designer.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['designer de cidade','160×160','capital','42/64 construções'])if(!dt.includes(required))throw new Error(`Crystal Deep designer proof missing ${required}`);await designer.screenshot({path:`${output}/crystal-deep-city-designer.png`});
await open('crystal-deep-panorama');const panorama=page.locator('[data-grand-crystal-deep-panorama="true"]');await panorama.waitFor({state:'visible'});if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-map-height')!=='160'||await panorama.getAttribute('data-landmark-count')!=='42'||await panorama.getAttribute('data-district-count')!=='12'||await panorama.getAttribute('data-portal-count')!=='3')throw new Error('Crystal Deep panorama authoritative metadata mismatch');const walls=Number(await panorama.getAttribute('data-wall-count'));const floors=Number(await panorama.getAttribute('data-floor-count'));const paths=Number(await panorama.getAttribute('data-path-count'));if(walls<11000||floors<2200||paths<1000)throw new Error(`Crystal Deep topology appears too sparse: ${JSON.stringify({walls,floors,paths})}`);for(const id of ['crystaldeep_prism_conclave','crystaldeep_crystal_spire','crystaldeep_shardsmith_foundry','crystaldeep_resonance_shrine','crystaldeep_west_lift_gate','crystaldeep_east_lift_gate'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'});const canvas=page.locator('[data-grand-crystal-deep-canvas="true"]');const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,darkBedrock=0,cyanGlow=0,violet=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(b>r*1.25&&b>g*1.12&&b<155&&r<95)darkBedrock++;if(b>135&&g>95&&b>r*1.20)cyanGlow++;if(b>r*1.20&&b>g*1.03&&r>45&&r<150)violet++;}return{width:c.width,height:c.height,opaque,darkBedrock,cyanGlow,violet};});if(stats.width<740||stats.height<740||stats.opaque<12000||stats.darkBedrock<7000||stats.cyanGlow<250||stats.violet<700)throw new Error(`Crystal Deep panorama canvas lacks geode rendering: ${JSON.stringify(stats)}`);const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR');for(const required of ['conclave prismático','agulha de cristal','forja dos lapidários','santuário da ressonância','elevador do oeste','elevador do leste','geode-chambers','renderer de produção','câmaras circulares','galerias estreitas','rocha maciça'])if(!pt.includes(required))throw new Error(`Crystal Deep panorama proof missing ${required}`);await panorama.screenshot({path:`${output}/crystal-deep-panorama.png`});await browser.close();console.log(`Captured Mor'ia 9.42B Grand Crystal Deep screenshots in ${output}`);
'''
write('tools/capture-moria-9-42b.mjs',capture)

doc=ROOT/'docs/MORIA_9_42_GRAND_CRYSTAL_DEEP.md'
text=doc.read_text(encoding='utf-8')
marker='## 9.42B — Prova visual autoritativa'
if marker not in text:
    text=text.rstrip()+f'''\n\n{marker}\n\n- A prova visual sincroniza Crystal Deep diretamente do servidor autoritativo antes de renderizar.\n- Chromium captura minimapa, City Designer e panorama usando a mesma geração `geode-chambers` do gameplay.\n- O gate mede rocha, câmaras, galerias e uma paleta subterrânea ciano/violeta; não basta apenas produzir PNGs.\n- Crystal Deep só pode ser considerada aprovada após inspeção humana dos três screenshots.\n'''
    doc.write_text(text,encoding='utf-8')
