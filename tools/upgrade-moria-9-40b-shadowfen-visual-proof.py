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

export default function GrandShadowfenPanorama() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const map=MAPS.shadowfen;
  const {width,height}=getMapDimensions(map);
  const bounds=map.urbanBounds || {x:0,y:0,width,height};
  const tileSize=6;
  const canvasWidth=bounds.width*tileSize;
  const canvasHeight=bounds.height*tileSize;
  const tiles=useMemo(()=>generateMap('shadowfen'),[map]);
  const topology=useMemo(()=>{
    let water=0,bridges=0,paths=0,bushes=0,grass=0;
    for(let y=bounds.y;y<bounds.y+bounds.height;y++) for(let x=bounds.x;x<bounds.x+bounds.width;x++) {
      const type=tiles[y]?.[x]?.type;
      if(type==='water') water++;
      else if(type==='bridge') bridges++;
      else if(type==='path') paths++;
      else if(type==='bush') bushes++;
      else if(type==='grass') grass++;
    }
    return {water,bridges,paths,bushes,grass};
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
      ctx.save();ctx.globalAlpha=.08;ctx.fillStyle=district.color;ctx.beginPath();ctx.arc(cx,cy,district.radius*tileSize,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.35;ctx.strokeStyle=district.color;ctx.lineWidth=1;ctx.stroke();ctx.restore();
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
      ctx.fillStyle='#b7e07c';ctx.fillRect(px-3,py-3,7,7);ctx.strokeStyle='#efffcb';ctx.strokeRect(px-4,py-4,9,9);
    }
    const sx=(map.spawnPoint.x-bounds.x)*tileSize,sy=(map.spawnPoint.y-bounds.y)*tileSize;
    ctx.fillStyle='#ffe68a';ctx.fillRect(sx-4,sy-4,9,9);ctx.strokeStyle='#17221a';ctx.strokeRect(sx-5,sy-5,11,11);
    ctx.restore();
  },[bounds.height,bounds.width,bounds.x,bounds.y,canvasHeight,canvasWidth,map,tileSize,tiles]);

  const major=map.landmarks.filter(l=>['shadowfen_fen_court_hall','shadowfen_lantern_market','shadowfen_apothecary_hall','shadowfen_drowned_chapel','shadowfen_grand_ferryman_wharf','shadowfen_peatworks'].includes(l.id));
  return <section data-grand-shadowfen-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} data-portal-count={map.portals.length} data-water-count={topology.water} data-bridge-count={topology.bridges} data-path-count={topology.paths} data-bush-count={topology.bushes} className="w-fit max-w-full rounded-xl border border-lime-200/20 bg-[#07110d]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-lime-100/15 pb-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-lime-200/65">CAPITAL DO BREJO AUTORITATIVA</div><h2 className="mt-1 text-xl font-black tracking-wide text-stone-50">GRAND SHADOWFEN</h2><div className="mt-1 text-[11px] text-lime-50/55">Renderer de produção · plano marsh-wards · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div></div>
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] uppercase tracking-wider text-lime-50/60"><div className="rounded border border-lime-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.districts.length}</b>distritos</div><div className="rounded border border-lime-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{map.landmarks.length}</b>marcos</div><div className="rounded border border-lime-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.water}</b>água</div><div className="rounded border border-lime-100/15 bg-black/35 px-3 py-2"><b className="block text-sm text-white">{topology.bridges}</b>pontes</div></div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row"><div className="overflow-hidden rounded border-2 border-[#718558] bg-black shadow-[0_0_48px_rgba(143,184,90,.12)]"><canvas ref={canvasRef} data-grand-shadowfen-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" /></div><aside className="w-full space-y-2 lg:w-64"><div className="rounded border border-lime-100/15 bg-lime-950/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.2em] text-lime-200/70">Marcos do brejo</div><div className="mt-2 space-y-1.5">{major.map(l=><div key={l.id} data-panorama-landmark={l.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-stone-50/80"><span>{l.icon} {l.name}</span><span className="shrink-0 text-lime-50/35">{l.x},{l.y}</span></div>)}</div></div><div className="rounded border border-emerald-200/15 bg-emerald-950/10 p-3 text-[10px] leading-relaxed text-emerald-50/65">Os três canais sinuosos, a Corte do Pântano, as passarelas e as pontes vêm da mesma geração usada pelo gameplay. As pontes só aparecem quando a calçada cruza água. Água: {topology.water} · pontes: {topology.bridges} · caminhos: {topology.paths} · juncos: {topology.bushes}.</div></aside></div>
  </section>;
}
'''
write('src/components/GrandShadowfenPanorama.tsx',component)

replace_once('src/visualQa.tsx',
"import GrandFrostpeakPanorama from './components/GrandFrostpeakPanorama';",
"import GrandFrostpeakPanorama from './components/GrandFrostpeakPanorama';\nimport GrandShadowfenPanorama from './components/GrandShadowfenPanorama';",
'Shadowfen panorama import')

block=r'''

const SHADOWFEN_QA_PLAYER = { ...QA_PLAYER, mapId: 'shadowfen', pos: { x: 116, y: 122 } } as unknown as Player;
type ShadowfenQaMode = 'shadowfen-minimap' | 'shadowfen-city-designer' | 'shadowfen-panorama';

function AuthoritativeGrandShadowfenQa({ mode }: { mode: ShadowfenQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active)return; const records=Array.isArray(payload?.items)?payload.items:[]; const shadowfen=records.find((record:any)=>record?.id==='shadowfen');
      if(!shadowfen||Number(shadowfen.width)!==160||Number(shadowfen.height)!==160||shadowfen.settlementClass!=='capital'||shadowfen.urbanPlan!=='marsh-wards'||!Array.isArray(shadowfen.landmarks)||shadowfen.landmarks.length!==42) throw new Error('Grand Shadowfen autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-lime-100" data-grand-shadowfen-server-loading="true">Sincronizando Grand Shadowfen com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-shadowfen-server-error="true">{error}</div>;
  const map=MAPS.shadowfen;
  if(mode==='shadowfen-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-shadowfen-server-ready="minimap" className="rounded-xl border border-lime-200/25 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-lime-50">GRAND SHADOWFEN · CAPITAL DO BREJO 160×160</div><div className="mt-1 text-[10px] text-lime-50/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos físicos · jogador 116,122</div></div><WorldMiniMap player={SHADOWFEN_QA_PLAYER} monsters={[]} mapId="shadowfen" /></div></div>;
  if(mode==='shadowfen-city-designer') return <div className="relative z-10 p-4" data-grand-shadowfen-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-shadowfen-server-ready="panorama"><GrandShadowfenPanorama /></div>;
}
'''
replace_once('src/visualQa.tsx',"\nfunction VisualQa() {",block+"\nfunction VisualQa() {",'Shadowfen QA function')
replace_once('src/visualQa.tsx',
"      {panel === 'frostpeak-panorama' && <AuthoritativeGrandFrostpeakQa mode=\"frostpeak-panorama\" />}\n",
"      {panel === 'frostpeak-panorama' && <AuthoritativeGrandFrostpeakQa mode=\"frostpeak-panorama\" />}\n      {panel === 'shadowfen-minimap' && <AuthoritativeGrandShadowfenQa mode=\"shadowfen-minimap\" />}\n      {panel === 'shadowfen-city-designer' && <AuthoritativeGrandShadowfenQa mode=\"shadowfen-city-designer\" />}\n      {panel === 'shadowfen-panorama' && <AuthoritativeGrandShadowfenQa mode=\"shadowfen-panorama\" />}\n",
'Shadowfen QA panels')

capture=r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const output='artifacts/moria-9.40b-screenshots'; const base='http://127.0.0.1:4173/visual-qa.html'; const auth='&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output,{recursive:true}); const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1720,height:1260},deviceScaleFactor:1});
async function open(panel){await page.goto(`${base}?panel=${panel}${auth}`,{waitUntil:'networkidle'});await page.locator('[data-grand-shadowfen-server-ready]').waitFor({state:'visible',timeout:15000});const error=page.locator('[data-grand-shadowfen-server-error="true"]');if(await error.count())throw new Error(`9.40B server sync failed: ${await error.innerText()}`);}
await open('shadowfen-minimap'); const minimap=page.locator('[data-minimap-map="shadowfen"]'); await minimap.waitFor({state:'visible'}); if(await minimap.getAttribute('data-map-width')!=='160'||await minimap.getAttribute('data-map-height')!=='160')throw new Error('Shadowfen minimap is not 160x160'); const east=page.getByTitle('Torre do Sumidouro'); await east.waitFor({state:'visible'}); const player=page.locator('[data-minimap-player="true"]'); await player.waitFor({state:'visible'}); const miniProof=page.locator('[data-grand-shadowfen-server-ready="minimap"]'); const miniText=(await miniProof.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['grand shadowfen','160×160','12 distritos','42 marcos','4 acessos físicos'])if(!miniText.includes(required))throw new Error(`Shadowfen minimap proof missing ${required}`); await miniProof.screenshot({path:`${output}/shadowfen-minimap.png`});
await open('shadowfen-city-designer'); const select=page.locator('[data-city-designer-map-select="true"]'); await select.waitFor({state:'visible'}); await select.selectOption('shadowfen'); await page.waitForFunction(()=>document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width')==='160'); const preview=page.locator('[data-city-designer-preview="true"]'); if(await preview.getAttribute('data-map-height')!=='160'||await preview.getAttribute('data-settlement-class')!=='capital')throw new Error('Shadowfen City Designer lost capital dimensions'); await page.locator('[data-city-landmark-id="shadowfen_fen_court_hall"]').waitFor({state:'visible'}); await page.locator('[data-city-landmark-id="shadowfen_grand_ferryman_wharf"]').waitFor({state:'visible'}); const designer=page.locator('[data-city-designer-root="true"]'); const dt=(await designer.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['designer de cidade','160×160','capital','42/64 construções'])if(!dt.includes(required))throw new Error(`Shadowfen designer proof missing ${required}`); await designer.screenshot({path:`${output}/shadowfen-city-designer.png`});
await open('shadowfen-panorama'); const panorama=page.locator('[data-grand-shadowfen-panorama="true"]'); await panorama.waitFor({state:'visible'}); if(await panorama.getAttribute('data-map-width')!=='160'||await panorama.getAttribute('data-map-height')!=='160'||await panorama.getAttribute('data-landmark-count')!=='42'||await panorama.getAttribute('data-district-count')!=='12'||await panorama.getAttribute('data-portal-count')!=='3')throw new Error('Shadowfen panorama authoritative metadata mismatch'); const water=Number(await panorama.getAttribute('data-water-count')); const bridges=Number(await panorama.getAttribute('data-bridge-count')); const paths=Number(await panorama.getAttribute('data-path-count')); const bushes=Number(await panorama.getAttribute('data-bush-count')); if(water<1300||bridges<70||paths<1200||bushes<50)throw new Error(`Shadowfen topology appears too sparse: ${JSON.stringify({water,bridges,paths,bushes})}`); for(const id of ['shadowfen_fen_court_hall','shadowfen_lantern_market','shadowfen_apothecary_hall','shadowfen_drowned_chapel','shadowfen_grand_ferryman_wharf','shadowfen_peatworks'])await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({state:'visible'}); const canvas=page.locator('[data-grand-shadowfen-canvas="true"]'); const stats=await canvas.evaluate(node=>{const c=node;const ctx=c.getContext('2d');const data=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0,blueWater=0,darkGreen=0;for(let i=0;i<data.length;i+=64){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a>0)opaque++;if(b>g*1.15&&b>r*1.45&&b>70)blueWater++;if(g>r*1.15&&g>b*.8&&g<150)darkGreen++;}return{width:c.width,height:c.height,opaque,blueWater,darkGreen};}); if(stats.width<740||stats.height<740||stats.opaque<12000||stats.blueWater<700||stats.darkGreen<900)throw new Error(`Shadowfen panorama canvas lacks marsh rendering: ${JSON.stringify(stats)}`); const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['salão da corte do pântano','mercado das lanternas','casa dos boticários','capela afogada','grande cais dos barqueiros','oficinas de turfa','marsh-wards','renderer de produção','três canais sinuosos'])if(!pt.includes(required))throw new Error(`Shadowfen panorama proof missing ${required}`); await panorama.screenshot({path:`${output}/shadowfen-panorama.png`}); await browser.close(); console.log(`Captured Mor'ia 9.40B Grand Shadowfen screenshots in ${output}`);'''
write('tools/capture-moria-9-40b.mjs',capture)

p=ROOT/'docs/MORIA_9_40_GRAND_SHADOWFEN.md';docs=p.read_text(encoding='utf-8')
section=r'''

## 9.40B — Prova visual autoritativa

A prova visual usa o servidor real em `/admin/api/maps`, sincroniza `MAPS.shadowfen` e renderiza a mesma topologia do gameplay por `generateMap`, `drawTile` e `drawBuilding`.

O gate captura e valida três superfícies de produção:

- minimapa 160×160 com 12 distritos, 42 marcos e os quatro acessos físicos;
- City Designer selecionado em Shadowfen, mostrando o orçamento real `42/64 construções`;
- panorâmica da área urbana completa com contagens de água, pontes, caminhos e vegetação de brejo.

A aprovação humana exige que os três canais sejam legíveis, que pontes/passarelas criem circulação coerente, que a Corte do Pântano e os bairros em palafitas tenham escala de capital e que Shadowfen não pareça uma Eldoria apenas recolorida.
'''
if '## 9.40B — Prova visual autoritativa' not in docs:p.write_text(docs+section,encoding='utf-8')
