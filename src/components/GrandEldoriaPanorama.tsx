import { useEffect, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = {
  keep: 'castle', market: 'market', temple: 'temple', depot: 'shop', gate: 'tower',
  forge: 'forge', dock: 'dock', arena: 'arena', obelisk: 'obelisk', library: 'library',
  graveyard: 'graveyard', lodge: 'inn', tower: 'tower', house: 'house',
};

export default function GrandEldoriaPanorama() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = MAPS.eldoria;
  const { width, height } = getMapDimensions(map);
  const bounds = map.urbanBounds || { x: 0, y: 0, width, height };
  const tileSize = 6;
  const canvasWidth = bounds.width * tileSize;
  const canvasHeight = bounds.height * tileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tiles = generateMap('eldoria');

    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const tile = tiles[y]?.[x];
        if (!tile) continue;
        drawTile(ctx, tile, (x - bounds.x) * tileSize, (y - bounds.y) * tileSize, tileSize, x, y, 0);
      }
    }

    for (const district of map.districts) {
      const cx = (district.x - bounds.x) * tileSize;
      const cy = (district.y - bounds.y) * tileSize;
      if (cx < 0 || cy < 0 || cx > canvasWidth || cy > canvasHeight) continue;
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = district.color;
      ctx.beginPath();
      ctx.arc(cx, cy, district.radius * tileSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = district.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    for (const landmark of map.landmarks) {
      const sx = (landmark.x - bounds.x) * tileSize;
      const sy = (landmark.y - bounds.y) * tileSize;
      if (sx + landmark.w * tileSize < 0 || sy + landmark.h * tileSize < 0 || sx > canvasWidth || sy > canvasHeight) continue;
      drawBuilding(ctx, sx, sy, {
        x: landmark.x, y: landmark.y, w: landmark.w, h: landmark.h,
        type: KIND_TO_BUILDING[landmark.kind] || 'house',
        roofColor: map.roofColor, wallColor: map.wallColor, accentColor: map.cityAccent,
        icon: landmark.icon,
      }, tileSize, 0);
    }

    ctx.save();
    for (const portal of map.portals) {
      if (portal.pos.x < bounds.x || portal.pos.y < bounds.y || portal.pos.x >= bounds.x + bounds.width || portal.pos.y >= bounds.y + bounds.height) continue;
      const px = (portal.pos.x - bounds.x) * tileSize;
      const py = (portal.pos.y - bounds.y) * tileSize;
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(px - 3, py - 3, 7, 7);
      ctx.strokeStyle = '#f8fafc';
      ctx.strokeRect(px - 4, py - 4, 9, 9);
    }
    const spawnX = (map.spawnPoint.x - bounds.x) * tileSize;
    const spawnY = (map.spawnPoint.y - bounds.y) * tileSize;
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(spawnX - 4, spawnY - 4, 9, 9);
    ctx.strokeStyle = '#111827';
    ctx.strokeRect(spawnX - 5, spawnY - 5, 11, 11);
    ctx.restore();
  }, [bounds.height, bounds.width, bounds.x, bounds.y, canvasHeight, canvasWidth, map, tileSize]);

  const major = map.landmarks.filter((landmark) => [
    'eldoria_sunspire_keep', 'eldoria_grand_market', 'eldoria_dawn_temple',
    'eldoria_grand_arena', 'eldoria_royal_stables', 'eldoria_royal_library',
  ].includes(landmark.id));

  return <section data-grand-eldoria-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} className="w-fit max-w-full rounded-xl border border-amber-300/30 bg-[#090806]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-amber-200/15 pb-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.28em] text-amber-300/70">VISÃO URBANA AUTORITATIVA</div>
        <h2 className="mt-1 text-xl font-black tracking-wide text-amber-100">GRAND ELDORIA</h2>
        <div className="mt-1 text-[11px] text-amber-100/55">Renderer de produção · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-wider text-amber-100/60">
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.districts.length}</b>distritos</div>
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.landmarks.length}</b>marcos</div>
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.portals.length}</b>portões</div>
      </div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="overflow-hidden rounded border-2 border-[#7e6946] bg-black shadow-[0_0_45px_rgba(216,180,90,.12)]">
        <canvas ref={canvasRef} data-grand-eldoria-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" />
      </div>
      <aside className="w-full space-y-2 lg:w-64">
        <div className="rounded border border-amber-200/15 bg-amber-950/10 p-3">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300/65">Marcos principais</div>
          <div className="mt-2 space-y-1.5">
            {major.map((landmark) => <div key={landmark.id} data-panorama-landmark={landmark.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-amber-50/80"><span>{landmark.icon} {landmark.name}</span><span className="shrink-0 text-amber-100/35">{landmark.x},{landmark.y}</span></div>)}
          </div>
        </div>
        <div className="rounded border border-cyan-300/15 bg-cyan-950/10 p-3 text-[10px] leading-relaxed text-cyan-50/60">Os quadrados ciano são portões autoritativos. O marcador dourado indica o ponto de chegada da capital. Muralhas, avenidas, pisos e colisões vêm da mesma geração usada pelo jogo.</div>
      </aside>
    </div>
  </section>;
}
