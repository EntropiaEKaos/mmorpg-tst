from pathlib import Path
import json

ROOT = Path('.')

# 1) New world post-processing layer.
visual = r'''// Mor'ia 9.27 — Deep Visual Revamp
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
'''
Path('src/game/worldVisualRevamp927.ts').write_text(visual, encoding='utf-8')

# 2) Integrate post-processing into GameScreen without growing gameplay logic.
p = Path('src/components/GameScreen.tsx')
s = p.read_text(encoding='utf-8')
needle = "import { drawWorldAtmosphere, weatherForMap, type WorldWeather } from '../game/worldAtmosphere';"
replacement = needle + "\nimport { drawWorldCinematicPass } from '../game/worldVisualRevamp927';"
assert needle in s and 'worldVisualRevamp927' not in s
s = s.replace(needle, replacement, 1)
needle = """    drawWorldAtmosphere(\n      ctx,\n      canvas,\n      MAPS[currentMapIdRef.current]?.biome || 'plains',\n      nightAlpha,\n      p.pos,\n      cam,\n      TILE_SIZE,\n      now,\n    );\n\n    worldLabels.draw(ctx,MAPS[currentMapIdRef.current]||MAPS.eldoria);"""
replacement = """    const activeBiome = MAPS[currentMapIdRef.current]?.biome || 'plains';\n    drawWorldAtmosphere(\n      ctx,\n      canvas,\n      activeBiome,\n      nightAlpha,\n      p.pos,\n      cam,\n      TILE_SIZE,\n      now,\n    );\n    drawWorldCinematicPass(ctx, canvas, activeBiome, weather, nightAlpha, now);\n\n    worldLabels.draw(ctx,MAPS[currentMapIdRef.current]||MAPS.eldoria);"""
assert needle in s
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

# 3) Improve grounding/material depth in the renderer.
p = Path('src/game/render.ts')
s = p.read_text(encoding='utf-8')
needle = """export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {\n  ctx.imageSmoothingEnabled = false;\n  buildTileCache(size);\n  const cached = tileCache.get(`${tile.type}_${size}`);\n  if (cached) ctx.drawImage(cached, x, y, size, size);\n}"""
replacement = r'''function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {
  const px = Math.max(1, Math.round(size / 32));
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Universal micro-bevel: preserves tile readability while breaking the flat plane.
  ctx.fillStyle = 'rgba(255,244,213,.035)';
  ctx.fillRect(x, y, size, px);
  ctx.fillRect(x, y, px, size);
  ctx.fillStyle = 'rgba(5,8,12,.09)';
  ctx.fillRect(x, y + size - px, size, px);
  ctx.fillRect(x + size - px, y, px, size);

  if (type === 'water') {
    ctx.fillStyle = 'rgba(217,241,255,.20)';
    ctx.fillRect(x + size*.12, y + size*.24, size*.28, px);
    ctx.fillRect(x + size*.56, y + size*.66, size*.22, px);
    ctx.fillStyle = 'rgba(5,26,58,.18)';
    ctx.fillRect(x + size*.18, y + size*.83, size*.56, px);
  } else if (type === 'lava') {
    ctx.shadowColor = 'rgba(255,83,24,.45)';
    ctx.shadowBlur = Math.max(2, size*.12);
    ctx.fillStyle = 'rgba(255,205,82,.26)';
    ctx.fillRect(x + size*.28, y + size*.42, size*.12, px);
    ctx.fillRect(x + size*.59, y + size*.63, size*.18, px);
    ctx.shadowBlur = 0;
  } else if (type === 'grass' || type === 'sand') {
    ctx.fillStyle = type === 'grass' ? 'rgba(210,228,144,.08)' : 'rgba(255,235,174,.11)';
    ctx.fillRect(x + size*.22, y + size*.19, px, px);
    ctx.fillRect(x + size*.67, y + size*.72, px, px);
  } else if (type === 'path' || type === 'floor' || type === 'wood_floor' || type === 'bridge') {
    ctx.fillStyle = 'rgba(255,239,196,.055)';
    ctx.fillRect(x + px*2, y + px*2, size - px*4, px);
  }
  ctx.restore();
}

export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {
  ctx.imageSmoothingEnabled = false;
  buildTileCache(size);
  const cached = tileCache.get(`${tile.type}_${size}`);
  if (cached) {
    ctx.drawImage(cached, x, y, size, size);
    drawMaterialFinish(ctx, tile.type, x, y, size);
  }
}'''
assert needle in s
s = s.replace(needle, replacement, 1)

needle = """  // Shadow\n  ctx.fillStyle = 'rgba(0,0,0,0.35)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 3, entitySize * 0.32, entitySize * 0.08, 0, 0, Math.PI * 2);\n  ctx.fill();"""
replacement = """  // Layered contact shadow anchors sprites to the terrain without a blurry halo.\n  ctx.fillStyle = 'rgba(0,0,0,0.16)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 2, entitySize * 0.40, entitySize * 0.105, 0, 0, Math.PI * 2);\n  ctx.fill();\n  ctx.fillStyle = 'rgba(0,0,0,0.38)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 3, entitySize * 0.27, entitySize * 0.065, 0, 0, Math.PI * 2);\n  ctx.fill();"""
assert needle in s
s = s.replace(needle, replacement, 1)

needle = """  ctx.fillStyle = 'rgba(0,0,0,0.35)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 3, size * 0.32, size * 0.08, 0, 0, Math.PI * 2);\n  ctx.fill();\n\n  drawClassicNpcSprite"""
replacement = """  ctx.fillStyle = 'rgba(0,0,0,0.14)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 2, size * 0.39, size * 0.10, 0, 0, Math.PI * 2);\n  ctx.fill();\n  ctx.fillStyle = 'rgba(0,0,0,0.36)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 3, size * 0.25, size * 0.06, 0, 0, Math.PI * 2);\n  ctx.fill();\n\n  drawClassicNpcSprite"""
assert needle in s
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

# 4) Add sprite rim/detail pixels for stronger silhouette hierarchy.
p = Path('src/game/classicEntityPresentation.ts')
s = p.read_text(encoding='utf-8')
needle = """  if (monster.type === 'boss') {\n    ctx.fillStyle = '#e2b64f';"""
replacement = """  // Small directional rim pixels make silhouettes survive dark biomes.\n  ctx.fillStyle = monster.type === 'boss' ? 'rgba(255,220,126,.72)' : 'rgba(220,232,240,.18)';\n  ctx.fillRect(left + 3 * u, top + 2 * u, Math.max(1, u), Math.max(2, 3 * u));\n\n  if (monster.type === 'boss') {\n    ctx.fillStyle = '#e2b64f';"""
assert needle in s
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

# 5) CSS: more cohesive glass/metal UI and canvas presentation. Append overrides to avoid destabilizing old selectors.
p = Path('src/index.css')
s = p.read_text(encoding='utf-8')
marker = '/* Mor\'ia 9.27 — Deep Visual Revamp */'
assert marker not in s
s += r'''

/* Mor'ia 9.27 — Deep Visual Revamp */
:root {
  --moria-bg: #03050a;
  --moria-panel: rgba(8, 12, 20, 0.91);
  --moria-panel-strong: rgba(4, 7, 12, 0.975);
  --moria-line: rgba(157, 177, 205, 0.17);
  --moria-line-strong: rgba(229, 196, 119, 0.48);
  --moria-gold: #e8c979;
  --moria-text: #f7f0e2;
  --moria-muted: #99a6bb;
}

.moria-panel {
  background:
    linear-gradient(180deg, rgba(19, 26, 39, .945), rgba(5, 8, 14, .975)),
    radial-gradient(circle at 84% 0%, rgba(116, 160, 224, .10), transparent 34%),
    radial-gradient(circle at 12% 100%, rgba(229, 196, 119, .055), transparent 30%);
  box-shadow:
    0 28px 80px rgba(0,0,0,.58),
    0 1px 0 rgba(255,255,255,.035),
    inset 0 1px rgba(255,255,255,.055),
    inset 0 -1px rgba(0,0,0,.55);
}

.moria-panel::after {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,.018);
  box-shadow: inset 0 0 42px rgba(0,0,0,.18);
}

.moria-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.012)),
    radial-gradient(circle at 50% -20%, rgba(229,196,119,.045), transparent 55%);
  border-color: rgba(159,178,205,.16);
  box-shadow: inset 0 1px rgba(255,255,255,.035), 0 10px 28px rgba(0,0,0,.16);
}

.moria-button,
.moria-slot {
  text-shadow: 0 1px 2px rgba(0,0,0,.8);
}

.moria-button {
  background:
    linear-gradient(180deg, rgba(42,52,70,.98), rgba(11,16,25,.99)),
    radial-gradient(circle at 50% 0%, rgba(255,255,255,.08), transparent 60%);
  border-color: rgba(189,173,132,.28);
}

.moria-slot {
  background:
    radial-gradient(circle at 50% 18%, rgba(255,255,255,.10), transparent 38%),
    linear-gradient(180deg, rgba(28,37,52,.965), rgba(5,9,15,.985));
  border-color: rgba(161,181,211,.24);
  box-shadow: inset 0 1px rgba(255,255,255,.065), inset 0 -8px 16px rgba(0,0,0,.22), 0 8px 24px rgba(0,0,0,.34);
}

.moria-world-canvas {
  image-rendering: pixelated;
  filter: saturate(1.08) contrast(1.045) brightness(.985);
  box-shadow: inset 0 0 110px rgba(0,0,0,.38), 0 0 70px rgba(0,0,0,.55) !important;
}

.moria-topbar-95 {
  border-bottom-color: rgba(229,196,119,.20) !important;
  box-shadow: 0 8px 28px rgba(0,0,0,.38), inset 0 -1px rgba(255,255,255,.025) !important;
}

@keyframes moria-927-ambient-breathe {
  0%,100% { filter: saturate(1.06) contrast(1.04) brightness(.98); }
  50% { filter: saturate(1.09) contrast(1.05) brightness(.992); }
}

@media (prefers-reduced-motion: no-preference) {
  .moria-world-canvas { animation: moria-927-ambient-breathe 9s ease-in-out infinite; }
}
'''
p.write_text(s, encoding='utf-8')

# 6) Version bump root/server to 9.27.0.
def bump(path):
    p = Path(path)
    data = json.loads(p.read_text(encoding='utf-8'))
    data['version'] = '9.27.0'
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for name in ['package.json', 'package-lock.json', 'server/package.json', 'server/package-lock.json']:
    bump(name)

# 7) Static regression contract for the visual-only release.
test = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('9.27 visual revamp remains presentation-only and modular', () => {
  const game = read('src/components/GameScreen.tsx');
  const fx = read('src/game/worldVisualRevamp927.ts');
  assert.match(game, /drawWorldCinematicPass/);
  assert.match(fx, /setTransform\(1, 0, 0, 1, 0, 0\)/);
  assert.doesNotMatch(fx, /serverSync|sendOfficial|fetch\(|WebSocket/);
});

test('9.27 renderer adds material finish and grounded entity shadows', () => {
  const render = read('src/game/render.ts');
  assert.match(render, /drawMaterialFinish/);
  assert.match(render, /Layered contact shadow/);
  assert.match(render, /entitySize \* 0\.40/);
});

test('9.27 CSS includes cinematic canvas and respects reduced motion', () => {
  const css = read('src/index.css');
  assert.match(css, /Mor'ia 9\.27 — Deep Visual Revamp/);
  assert.match(css, /moria-world-canvas/);
  assert.match(css, /prefers-reduced-motion: no-preference/);
});
'''
Path('server/test/visual-revamp-9-27.test.mjs').write_text(test, encoding='utf-8')
print('Applied Mor\'ia 9.27 visual revamp')
