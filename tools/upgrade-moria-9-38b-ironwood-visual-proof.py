from pathlib import Path

ROOT=Path('.')

def write(path, text):
    p=ROOT/path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text,encoding='utf-8')

component=r'''import { useEffect, useMemo, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = {
  keep:'castle', market:'market', temple:'temple', depot:'shop', gate:'tower', forge:'forge',
  dock:'dock', arena:'arena', obelisk:'obelisk', library:'library', graveyard:'graveyard', lodge:'inn', tower:'tower', house:'house',
};

export default function GrandIronwoodPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.ironwood;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;
  const tiles=useMemo(()=>generateMap('ironwood'),[map]);
  const topology=useMemo(()=>{
    let trees=0, paths=0, grass=0;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const type=tiles[y]?.[x]?.type;
      if(type==='tree') trees++;
      else if(type==='path') paths++;
      else if(type==='grass') grass++;
    }
    return {trees,paths,grass};
  },[bounds.height,bounds.width,bounds.x,bounds.y,tiles]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=canvasWidth; canvas.height=canvasHeight;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    ctx.imageSmoothingEnabled=false;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const tile=tiles[y]?.[x]; if(!tile) continue;
      drawTile(ctx,tile,(x-bounds.x)*tileSize,(y-bounds.y)*tileSize,tileSize,x,y,0);
    }
    for(const district of map.districts) {
      const cx=(district.x-bounds.x)*tileSize, cy=(district.y-bounds.y)*tileSize;
      if(cx<0||cy<0||cx>canvasWidth||cy>canvasHeight) continue;
      ctx.save(); ctx.globalAlpha=.09; ctx.fillStyle=district.color; ctx.beginPath(); ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=.42; ctx.strokeStyle=district.color; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
    }
    for(const landmark of map.landmarks) {
      const sx=(landmark.x-bounds.x)*tileSize, sy=(landmark.y-bounds.y)*tileSize;
      if(sx+landmark.w*tileSize<0||sy+landmark.h*tileSize<0||sx>canvasWidth||sy>canvasHeight) continue;
      drawBuilding(ctx,sx,sy,{x:landmark.x,y:landmark.y,w:landmark.w,h:landmark.h,type:KIND_TO_BUILDING[landmark.kind]||'house',roofColor:map.roofColor,wallColor:map.wallColor,accentColor:map.cityAccent,icon:landmark.icon},tileSize,0);
    }
    ctx.save();
    for(const portal of map.portals) {
      if(portal.pos.x<bounds.x||portal.pos.y<bounds.y||portal.pos.x>=bounds.x+bounds.width||portal.pos.y>=bounds.y+bounds.height) continue;
      const px=(portal.pos.x-bounds.x)*tileSize, py=(portal.pos.y-bounds.y)*tileSize;
      ctx.fillStyle='#fbbf24'; ctx.fillRect(px-3,py-3,7,7); ctx.strokeStyle='#f8fafc'; ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize, sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#d9f99d'; ctx.fillRect(sx-4,sy-4,9,9); ctx.strokeStyle='#172014'; ctx.strokeRect(sx-5,sy-5,11,11); ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);

  const major=map.landmarks.filter(l=>['ironwood_marchwarden_hall','ironwood_mother_tree','ironwood_grand_timber_market','ironwood_hunters_lodge','ironwood_tamers_enclave','ironwood_grand_sawmill','ironwood_moonwell'].includes(l.id));
  return <section data-grand-ironwood-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-tree-count={topology.trees} data-path-count={topology.paths} data-grass-count={topology.grass} className="w-fit max-w-full rounded-xl border border-lime-300/25 bg-[#081008]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-lime-200/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-lime-300/65">CAPITAL FLORESTAL AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-lime-50">GRAND IRONWOOD MARCH</h2><div className="mt-1 text-[11px] text-lime-100/55">Renderer de produção · plano forest-rings · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-wider text-lime-100/60"><div className="rounded border border-lime-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-lime-50">{map.districts.length}</b>distritos</div><div className="rounded border border-lime-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-lime-50">{map.landmarks.length}</b>marcos</div><div className="rounded border border-lime-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-lime-50">{topology.trees}</b>árvores</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#617448] bg-black shadow-[0_0_45px_rgba(132,169,84,.15)]"><canvas ref={canvasRef} data-grand-ironwood-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-lime-200/15 bg-lime-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-lime-300/65">Marcos da marcha</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-lime-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-lime-100/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-emerald-300/15 bg-emerald-950/10 p-3 text-[10px] leading-relaxed text-emerald-50/65">A paliçada viva e os bosques são árvores autoritativas com colisão real. Os dois anéis de trilha, eixos de lenhadores e caçadores e a clareira central vêm da mesma geração usada pelo gameplay. Trilhas: {topology.paths} tiles · gramados: {topology.grass}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandIronwoodPanorama.tsx',component)

p=ROOT/'src/visualQa.tsx'
text=p.read_text(encoding='utf-8')
if "GrandIronwoodPanorama" not in text:
    text=text.replace("import GrandSunreachPanorama from './components/GrandSunreachPanorama';", "import GrandSunreachPanorama from './components/GrandSunreachPanorama';\nimport GrandIronwoodPanorama from './components/GrandIronwoodPanorama';")
anchor="function VisualQa() {"
block=r'''
const IRONWOOD_QA_PLAYER = { ...QA_PLAYER, mapId: 'ironwood', pos: { x: 120, y: 118 } } as unknown as Player;
type IronwoodQaMode = 'ironwood-minimap' | 'ironwood-city-designer' | 'ironwood-panorama';

function AuthoritativeGrandIronwoodQa({ mode }: { mode: IronwoodQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active) return; const records=Array.isArray(payload?.items)?payload.items:[]; const ironwood=records.find((record:any)=>record?.id==='ironwood');
      if(!ironwood||Number(ironwood.width)!==160||Number(ironwood.height)!==160||ironwood.settlementClass!=='capital'||ironwood.urbanPlan!=='forest-rings') throw new Error('Grand Ironwood autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records); setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');}); return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-lime-100" data-grand-ironwood-server-loading="true">Sincronizando Grand Ironwood com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-ironwood-server-error="true">{error}</div>;
  const map=MAPS.ironwood;
  if(mode==='ironwood-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-ironwood-server-ready="minimap" className="rounded-xl border border-lime-300/25 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-lime-50">GRAND IRONWOOD · CAPITAL FLORESTAL 160×160</div><div className="mt-1 text-[10px] text-lime-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,118</div></div><WorldMiniMap player={IRONWOOD_QA_PLAYER} monsters={[]} mapId="ironwood" /></div></div>;
  if(mode==='ironwood-city-designer') return <div className="relative z-10 p-4" data-grand-ironwood-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-ironwood-server-ready="panorama"><GrandIronwoodPanorama /></div>;
}

'''
if 'AuthoritativeGrandIronwoodQa' not in text:
    if anchor not in text: raise SystemExit('visualQa Ironwood function anchor missing')
    text=text.replace(anchor,block+anchor,1)
render_anchor="      {panel === 'sunreach-panorama' && <AuthoritativeGrandSunreachQa mode=\"sunreach-panorama\" />}"
render_new=render_anchor+"\n      {panel === 'ironwood-minimap' && <AuthoritativeGrandIronwoodQa mode=\"ironwood-minimap\" />}\n      {panel === 'ironwood-city-designer' && <AuthoritativeGrandIronwoodQa mode=\"ironwood-city-designer\" />}\n      {panel === 'ironwood-panorama' && <AuthoritativeGrandIronwoodQa mode=\"ironwood-panorama\" />}"
if "panel === 'ironwood-minimap'" not in text:
    if render_anchor not in text: raise SystemExit('visualQa Ironwood render anchor missing')
    text=text.replace(render_anchor,render_new,1)
p.write_text(text,encoding='utf-8')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.38b-screenshots'; const base='http://127.0.0.1:4173/visual-qa.html'; const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true}); const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1680,height:1180},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-ironwood-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-ironwood-server-error="true"]');if(await error.count())throw new Error(`9.38B server sync failed: ${await error.innerText()}`);}
await open('ironwood-minimap'); const minimap=page.locator('[data-minimap-map="ironwood"]'); await minimap.waitFor({state:'visible'}); if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Ironwood minimap is not 160x160'); const mb=await minimap.boundingBox(); const moonwell=page.getByTitle('Santuário do Poço Lunar'); const lb=await moonwell.boundingBox(); const pb=await page.locator('[data-minimap-player="true"]').boundingBox(); if(!mb||!lb||!pb)throw new Error('Ironwood minimap geometry missing'); if(lb.x+lb.width/2<=mb.x+mb.width/2||lb.y+lb.height/2<=mb.y+mb.height/2)throw new Error('Ironwood Moonwell is not in southeast sector'); if(pb.x+pb.width/2<=mb.x+mb.width/2||pb.y+pb.height/2<=mb.y+mb.height/2)throw new Error('Ironwood player is not in southeast quadrant'); const miniProof=page.locator('[data-grand-ironwood-server-ready="minimap"]'); const miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['grand ironwood','160×160','12 distritos','40 marcos'])if(!miniText.includes(required))throw new Error(`Ironwood minimap proof missing ${required}`); await miniProof.screenshot({path:`${output}/ironwood-minimap.png`});
await open('ironwood-city-designer'); const select=page.locator('[data-city-designer-map-select="true"]'); await select.waitFor({state:'visible'}); await select.selectOption('ironwood'); await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160'); const preview=page.locator('[data-city-designer-preview="true"]'); if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Ironwood City Designer lost capital dimensions'); await page.locator('[data-city-landmark-id="ironwood_marchwarden_hall"]').waitFor({state:'visible'}); await page.locator('[data-city-landmark-id="ironwood_moonwell"]').waitFor({state:'visible'}); const designer=page.locator('[data-city-designer-root="true"]'); const dt=(await designer.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['designer de cidade','160×160','capital','40/64 construções'])if(!dt.includes(required))throw new Error(`Ironwood designer proof missing ${required}`); await designer.screenshot({path:`${output}/ironwood-city-designer.png`});
await open('ironwood-panorama'); const panorama=page.locator('[data-grand-ironwood-panorama="true"]'); await panorama.waitFor({state:'visible'}); if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-landmark-count')!=='40'||await panorama.getAttribute('data-district-count')!=='12')throw new Error('Ironwood panorama authoritative metadata mismatch'); const trees=Number(await panorama.getAttribute('data-tree-count')); const paths=Number(await panorama.getAttribute('data-path-count')); const grass=Number(await panorama.getAttribute('data-grass-count')); if(trees<250||paths<1200||grass<3500)throw new Error(`Ironwood topology appears too sparse: ${JSON.stringify({trees,paths,grass})}`); for(const id of ['ironwood_marchwarden_hall','ironwood_mother_tree','ironwood_grand_timber_market','ironwood_grand_sawmill','ironwood_moonwell'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'}); const canvas=page.locator('[data-grand-ironwood-canvas="true"]'); const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,green=0;for(let i=0;i<data.length;i+=64){if(data[i+3]>0)opaque++;if(data[i+1]>data[i]+12&&data[i+1]>data[i+2]-8)green++;}return{width:c.width,height:c.height,opaque,green};}); if(stats.width<650||stats.height<650||stats.opaque<10000||stats.green<1200)throw new Error(`Ironwood panorama canvas lacks forest rendering: ${JSON.stringify(stats)}`); const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['salão dos marchwardens','árvore-mãe ironbark','grande mercado da madeira','grande serraria','santuário do poço lunar','forest-rings','renderer de produção'])if(!pt.includes(required))throw new Error(`Ironwood panorama proof missing ${required}`); await panorama.screenshot({path:`${output}/ironwood-panorama.png`}); await browser.close(); console.log(`Captured Mor'ia 9.38B Grand Ironwood screenshots in ${output}`);
'''
write('tools/capture-moria-9-38b.mjs',capture)

doc=ROOT/'docs/MORIA_9_38_GRAND_IRONWOOD.md'
text=doc.read_text(encoding='utf-8')
section='''\n\n## 9.38B — Prova visual autoritativa\n\nA aceitação visual usa o servidor real em banco temporário e o renderer de produção. São capturados minimapa, City Designer e panorâmica da área urbana. O gate exige 160×160, 12 distritos, 40 footprints, Poço Lunar no setor sudeste, uma massa mínima de árvores, trilhas e gramados gerados pelo `forest-rings`, além de presença mínima de pixels verdes no canvas para detectar regressões que apaguem a identidade florestal.\n'''
if '## 9.38B — Prova visual autoritativa' not in text: text+=section
doc.write_text(text,encoding='utf-8')
print("Mor'ia 9.38B Grand Ironwood visual proof prepared")
