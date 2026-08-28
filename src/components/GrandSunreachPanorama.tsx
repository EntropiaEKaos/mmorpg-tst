import { useEffect, useRef } from 'react';
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
