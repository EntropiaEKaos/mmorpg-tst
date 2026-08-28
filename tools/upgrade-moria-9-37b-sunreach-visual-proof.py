from pathlib import Path

ROOT=Path('.')

component=r'''import { useEffect, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = {
  keep:'castle', market:'market', temple:'temple', depot:'shop', gate:'tower', forge:'forge',
  dock:'dock', arena:'arena', obelisk:'obelisk', library:'library', graveyard:'graveyard', lodge:'inn', tower:'tower', house:'house',
};

export default function GrandSunreachPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.sunreach_coast;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=canvasWidth; canvas.height=canvasHeight;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    ctx.imageSmoothingEnabled=false;
    const tiles=generateMap('sunreach_coast');
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const tile=tiles[y]?.[x]; if(!tile) continue;
      drawTile(ctx,tile,(x-bounds.x)*tileSize,(y-bounds.y)*tileSize,tileSize,x,y,0);
    }
    for(const district of map.districts) {
      const cx=(district.x-bounds.x)*tileSize, cy=(district.y-bounds.y)*tileSize;
      if(cx<0||cy<0||cx>canvasWidth||cy>canvasHeight) continue;
      ctx.save(); ctx.globalAlpha=.10; ctx.fillStyle=district.color; ctx.beginPath(); ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=.45; ctx.strokeStyle=district.color; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
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
      ctx.fillStyle='#7dd3fc'; ctx.fillRect(px-3,py-3,7,7); ctx.strokeStyle='#f8fafc'; ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize, sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#fde68a'; ctx.fillRect(sx-4,sy-4,9,9); ctx.strokeStyle='#111827'; ctx.strokeRect(sx-5,sy-5,11,11); ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map]);

  const major=map.landmarks.filter(l=>['sunreach_tidewatch_hall','sunreach_salt_market','sunreach_free_league_hall','sunreach_grand_shipyard','sunreach_lighthouse','sunreach_west_quay','sunreach_east_quay'].includes(l.id));
  return <section data-grand-sunreach-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} className="w-fit max-w-full rounded-xl border border-cyan-300/30 bg-[#061015]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-cyan-200/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300/70">CAPITAL MARÍTIMA AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-cyan-50">GRAND SUNREACH COAST</h2><div className="mt-1 text-[11px] text-cyan-100/55">Renderer de produção · plano harbor-crescent · área portuária {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-wider text-cyan-100/60"><div className="rounded border border-cyan-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-cyan-50">{map.districts.length}</b>distritos</div><div className="rounded border border-cyan-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-cyan-50">{map.landmarks.length}</b>marcos</div><div className="rounded border border-cyan-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-cyan-50">4</b>píeres</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#477c8d] bg-black shadow-[0_0_45px_rgba(85,185,216,.15)]"><canvas ref={canvasRef} data-grand-sunreach-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-cyan-200/15 bg-cyan-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300/65">Marcos do grande porto</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-cyan-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-cyan-100/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-blue-300/15 bg-blue-950/10 p-3 text-[10px] leading-relaxed text-blue-50/65">A bacia azul é água autoritativa não caminhável. Píeres e quebra-mar usam tiles de ponte caminháveis; cais, muralhas e edifícios compartilham a mesma geração usada pelo gameplay.</div></aside></div>
  </section>;
}
'''
(ROOT/'src/components/GrandSunreachPanorama.tsx').write_text(component,encoding='utf-8')

p=ROOT/'src/visualQa.tsx'
text=p.read_text(encoding='utf-8')
if "GrandSunreachPanorama" not in text:
    text=text.replace("import GrandEldoriaPanorama from './components/GrandEldoriaPanorama';", "import GrandEldoriaPanorama from './components/GrandEldoriaPanorama';\nimport GrandSunreachPanorama from './components/GrandSunreachPanorama';")
anchor="function VisualQa() {"
block=r'''
const SUNREACH_QA_PLAYER = { ...QA_PLAYER, mapId: 'sunreach_coast', pos: { x: 120, y: 90 } } as unknown as Player;
type SunreachQaMode = 'sunreach-minimap' | 'sunreach-city-designer' | 'sunreach-panorama';

function AuthoritativeGrandSunreachQa({ mode }: { mode: SunreachQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active) return; const records=Array.isArray(payload?.items)?payload.items:[]; const sunreach=records.find((record:any)=>record?.id==='sunreach_coast');
      if(!sunreach||Number(sunreach.width)!==160||Number(sunreach.height)!==160||sunreach.settlementClass!=='capital'||sunreach.urbanPlan!=='harbor-crescent') throw new Error('Grand Sunreach autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records); setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');}); return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-cyan-100" data-grand-sunreach-server-loading="true">Sincronizando Grand Sunreach com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-sunreach-server-error="true">{error}</div>;
  const map=MAPS.sunreach_coast;
  if(mode==='sunreach-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-sunreach-server-ready="minimap" className="rounded-xl border border-cyan-300/30 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND SUNREACH · CAPITAL PORTUÁRIA 160×160</div><div className="mt-1 text-[10px] text-cyan-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,90</div></div><WorldMiniMap player={SUNREACH_QA_PLAYER} monsters={[]} mapId="sunreach_coast" /></div></div>;
  if(mode==='sunreach-city-designer') return <div className="relative z-10 p-4" data-grand-sunreach-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-sunreach-server-ready="panorama"><GrandSunreachPanorama /></div>;
}

'''
if "AuthoritativeGrandSunreachQa" not in text:
    if anchor not in text: raise SystemExit('visualQa function anchor missing')
    text=text.replace(anchor,block+anchor,1)
render_anchor="      {panel === 'eldoria-panorama' && <AuthoritativeGrandEldoriaQa mode=\"eldoria-panorama\" />}"
render_new=render_anchor+"\n      {panel === 'sunreach-minimap' && <AuthoritativeGrandSunreachQa mode=\"sunreach-minimap\" />}\n      {panel === 'sunreach-city-designer' && <AuthoritativeGrandSunreachQa mode=\"sunreach-city-designer\" />}\n      {panel === 'sunreach-panorama' && <AuthoritativeGrandSunreachQa mode=\"sunreach-panorama\" />}"
if "panel === 'sunreach-minimap'" not in text:
    if render_anchor not in text: raise SystemExit('visualQa render anchor missing')
    text=text.replace(render_anchor,render_new,1)
p.write_text(text,encoding='utf-8')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.37b-screenshots'; const base='http://127.0.0.1:4173/visual-qa.html'; const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true}); const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1680,height:1180},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-sunreach-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-sunreach-server-error="true"]');if(await error.count())throw new Error(`9.37B server sync failed: ${await error.innerText()}`);}
await open('sunreach-minimap'); const minimap=page.locator('[data-minimap-map="sunreach_coast"]'); await minimap.waitFor({state:'visible'}); if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Sunreach minimap is not 160x160'); const mb=await minimap.boundingBox(); const lighthouse=page.getByTitle('Farol de Sunreach'); const lb=await lighthouse.boundingBox(); const pb=await page.locator('[data-minimap-player="true"]').boundingBox(); if(!mb||!lb||!pb)throw new Error('Sunreach minimap geometry missing'); if(lb.x+lb.width/2<=mb.x+mb.width/2||lb.y+lb.height/2<=mb.y+mb.height/2)throw new Error('Sunreach lighthouse is not in southeast harbor sector'); const miniProof=page.locator('[data-grand-sunreach-server-ready="minimap"]'); const miniText=await miniProof.innerText(); for(const required of ['GRAND SUNREACH','160×160','12 distritos','38 marcos'])if(!miniText.includes(required))throw new Error(`Sunreach minimap proof missing ${required}`); await miniProof.screenshot({path:`${output}/sunreach-minimap.png`});
await open('sunreach-city-designer'); const select=page.locator('[data-city-designer-map-select="true"]'); await select.waitFor({state:'visible'}); await select.selectOption('sunreach_coast'); await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160'); const preview=page.locator('[data-city-designer-preview="true"]'); if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Sunreach City Designer lost capital dimensions'); await page.locator('[data-city-landmark-id="sunreach_tidewatch_hall"]').waitFor({state:'visible'}); await page.locator('[data-city-landmark-id="sunreach_lighthouse"]').waitFor({state:'visible'}); const designer=page.locator('[data-city-designer-root="true"]'); const dt=await designer.innerText(); for(const required of ['DESIGNER DE CIDADE','160×160','CAPITAL','38/64 construções'])if(!dt.includes(required))throw new Error(`Sunreach designer proof missing ${required}`); await designer.screenshot({path:`${output}/sunreach-city-designer.png`});
await open('sunreach-panorama'); const panorama=page.locator('[data-grand-sunreach-panorama="true"]'); await panorama.waitFor({state:'visible'}); if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-landmark-count')!=='38'||await panorama.getAttribute('data-district-count')!=='12')throw new Error('Sunreach panorama authoritative metadata mismatch'); for(const id of ['sunreach_tidewatch_hall','sunreach_salt_market','sunreach_grand_shipyard','sunreach_lighthouse'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'}); const canvas=page.locator('[data-grand-sunreach-canvas="true"]'); const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,blue=0;for(let i=0;i<data.length;i+=64){if(data[i+3]>0)opaque++;if(data[i+2]>data[i]+20&&data[i+2]>data[i+1])blue++;}return{width:c.width,height:c.height,opaque,blue};}); if(stats.width<650||stats.height<650||stats.opaque<10000||stats.blue<900)throw new Error(`Sunreach panorama canvas lacks maritime rendering: ${JSON.stringify(stats)}`); const pt=await panorama.innerText(); for(const required of ['Cidadela Tidewatch','Grande Mercado do Sal','Grande Estaleiro','Farol de Sunreach','4','píeres','Renderer de produção'])if(!pt.includes(required))throw new Error(`Sunreach panorama proof missing ${required}`); await panorama.screenshot({path:`${output}/sunreach-panorama.png`}); await browser.close(); console.log(`Captured Mor'ia 9.37B Grand Sunreach screenshots in ${output}`);
'''
(ROOT/'tools/capture-moria-9-37b.mjs').write_text(capture,encoding='utf-8')

doc=ROOT/'docs/MORIA_9_37_GRAND_SUNREACH.md'; text=doc.read_text(encoding='utf-8'); section='''\n\n## 9.37B — Prova visual autoritativa\n\nA aceitação visual usa o servidor real em banco temporário e o renderer de produção. São capturados minimapa, City Designer e panorâmica da área portuária. O gate exige 160×160, 12 distritos, 38 footprints, Farol no setor sudeste e uma quantidade mínima de pixels azuis na panorâmica para impedir que a bacia marítima desapareça por regressão de renderização.\n''';
if '## 9.37B — Prova visual autoritativa' not in text: text+=section
doc.write_text(text,encoding='utf-8')
print("Mor'ia 9.37B Grand Sunreach visual proof prepared")
