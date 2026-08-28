// Mor'ia 9.27 — Deep Visual Revamp
// Screen-space cinematic finish only. It never owns gameplay state.

export type VisualBiome = 'plains' | 'forest' | 'desert' | 'snow' | 'volcanic' | 'shadow' | 'swamp' | 'arcane' | string;

const BIOME_TINTS: Record<string, [number, number, number]> = {
  plains: [71, 104, 71],
  forest: [38, 82, 58],
  desert: [155, 118, 66],
  snow: [104, 143, 168],
  volcanic: [143, 55, 34],
  shadow: [70, 48, 105],
  swamp: [63, 82, 56],
  arcane: [78, 78, 145],
};

function hash(n: number) {
  const s = Math.sin(n * 91.733) * 43758.5453123;
  return s - Math.floor(s);
}

function rgba(rgb: [number, number, number], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export function drawWorldCinematicPass(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  biome: VisualBiome,
  weather: string,
  darkness: number,
  time: number,
) {
  const w = canvas.width;
  const h = canvas.height;
  const tint = BIOME_TINTS[biome] || BIOME_TINTS.plains;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Gentle biome grade: enough to unify materials without hiding pixel values.
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = rgba(tint, biome === 'shadow' || biome === 'volcanic' ? 0.13 : 0.075);
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Directional sky light gives the flat tile plane a consistent volume cue.
  const sky = ctx.createLinearGradient(0, 0, w * 0.72, h);
  sky.addColorStop(0, `rgba(255,236,190,${Math.max(0.015, 0.065 - darkness * 0.045)})`);
  sky.addColorStop(0.48, 'rgba(255,255,255,0)');
  sky.addColorStop(1, `rgba(18,28,46,${0.055 + darkness * 0.08})`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sparse atmospheric motes. Deterministic positions; only drift is animated.
  const moteCount = weather === 'storm' ? 7 : biome === 'forest' || biome === 'swamp' ? 18 : 11;
  for (let i = 0; i < moteCount; i++) {
    const phase = time * (0.000018 + hash(i + 2) * 0.00002) + hash(i + 9) * 8;
    const x = (hash(i * 7 + 4) * w + Math.sin(phase) * 24 + w) % w;
    const y = (hash(i * 11 + 8) * h + (time * (0.004 + hash(i) * 0.004)) % (h + 80)) % (h + 80) - 40;
    const r = 0.55 + hash(i * 5 + 3) * 1.15;
    ctx.fillStyle = biome === 'volcanic'
      ? `rgba(255,145,70,${0.08 + hash(i) * 0.12})`
      : biome === 'arcane' || biome === 'shadow'
        ? `rgba(180,155,255,${0.06 + hash(i) * 0.10})`
        : `rgba(228,224,190,${0.035 + hash(i) * 0.065})`;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(r)), Math.max(1, Math.round(r)));
  }

  // Low fog layers for cold, swamp and shadow biomes.
  if (biome === 'snow' || biome === 'swamp' || biome === 'shadow') {
    const fog = ctx.createLinearGradient(0, h * .52, 0, h);
    const fogAlpha = biome === 'shadow' ? .12 : .075;
    fog.addColorStop(0, 'rgba(180,200,220,0)');
    fog.addColorStop(1, `rgba(${biome === 'swamp' ? '116,135,105' : '172,190,214'},${fogAlpha})`);
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * .45, w, h * .55);
  }

  // Cinematic vignette and subtle inner frame improve focus/readability.
  const vignette = ctx.createRadialGradient(w * .50, h * .46, Math.min(w, h) * .20, w * .50, h * .48, Math.max(w, h) * .69);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(.66, 'rgba(0,0,0,0.025)');
  vignette.addColorStop(1, `rgba(0,0,0,${0.25 + darkness * .10})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(232,207,150,.045)';
  ctx.lineWidth = 1;
  ctx.strokeRect(.5, .5, w - 1, h - 1);
  ctx.restore();
}
