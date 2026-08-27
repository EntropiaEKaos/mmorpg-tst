from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / 'src/components/GameScreen.tsx'
ATMOSPHERE = ROOT / 'src/game/worldAtmosphere.ts'
BANNER = ROOT / 'src/components/RegionBanner.tsx'
WEATHER = ROOT / 'src/components/Weather.tsx'
CSS = ROOT / 'src/index.css'
TEST = ROOT / 'server/test/living-world-presentation.test.mjs'
DOC = ROOT / 'docs/MORIA_8_3_LIVING_WORLD.md'

ATMOSPHERE.write_text(r'''import type { BiomeType } from './maps';

export type WorldWeather = 'clear' | 'rain' | 'snow' | 'storm';

type AtmosphereProfile = {
  name: string;
  accent: string;
  overlay: string;
  overlayAlpha: number;
  mote: string;
  moteCount: number;
  vignette: number;
};

export const ATMOSPHERE_PROFILES: Record<BiomeType, AtmosphereProfile> = {
  plains: { name: 'Verdant Frontier', accent: '#71d8ac', overlay: '40,92,72', overlayAlpha: 0.05, mote: '#d8ffb0', moteCount: 9, vignette: 0.42 },
  snow: { name: 'Frozen Expanse', accent: '#9bd4ff', overlay: '190,220,255', overlayAlpha: 0.09, mote: '#ffffff', moteCount: 14, vignette: 0.40 },
  swamp: { name: 'Rotfen Mists', accent: '#9ed06f', overlay: '20,46,16', overlayAlpha: 0.27, mote: '#c8ff71', moteCount: 13, vignette: 0.53 },
  desert: { name: 'Ashen Reach', accent: '#ffb55f', overlay: '145,76,28', overlayAlpha: 0.09, mote: '#ffc879', moteCount: 14, vignette: 0.46 },
  shadow: { name: 'The Black Verge', accent: '#b398ff', overlay: '14,0,28', overlayAlpha: 0.46, mote: '#c8a0ff', moteCount: 18, vignette: 0.68 },
};

function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function weatherForMap(mapId: string, biome: BiomeType, now = Date.now()): WorldWeather {
  const windowId = Math.floor(now / 90_000);
  const roll = (hashText(`${mapId}:${windowId}`) % 100) / 100;
  switch (biome) {
    case 'snow': return roll < 0.58 ? 'snow' : roll < 0.72 ? 'storm' : 'clear';
    case 'swamp': return roll < 0.48 ? 'rain' : roll < 0.62 ? 'storm' : 'clear';
    case 'shadow': return roll < 0.34 ? 'storm' : roll < 0.52 ? 'rain' : 'clear';
    case 'desert': return roll < 0.14 ? 'storm' : 'clear';
    default: return roll < 0.18 ? 'rain' : roll < 0.22 ? 'storm' : 'clear';
  }
}

function drawAmbientMotes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeType,
  now: number,
): void {
  const profile = ATMOSPHERE_PROFILES[biome];
  ctx.save();
  for (let i = 0; i < profile.moteCount; i++) {
    const seed = (i * 977 + biome.charCodeAt(0) * 131) % 997;
    const speed = biome === 'snow' ? 0.013 : biome === 'desert' ? 0.022 : 0.008;
    const phase = now * speed + seed * 12.3;
    const x = ((seed * 43.7 + phase * (biome === 'desert' ? 1.7 : 0.35)) % (width + 60)) - 30;
    const y = ((seed * 19.1 + phase * (biome === 'snow' ? 1.1 : 0.22)) % (height + 60)) - 30;
    const pulse = 0.25 + (Math.sin(phase * 0.04) + 1) * 0.15;
    ctx.globalAlpha = biome === 'shadow' || biome === 'swamp' ? pulse : pulse * 0.55;
    ctx.fillStyle = profile.mote;
    if (biome === 'desert') {
      ctx.fillRect(x, y, 5, 1);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, biome === 'shadow' ? 1.8 : biome === 'snow' ? 1.4 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawWorldAtmosphere(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  biome: BiomeType,
  nightAlpha: number,
  playerPos: { x: number; y: number },
  camera: { x: number; y: number },
  tileSize: number,
  now: number,
): void {
  const profile = ATMOSPHERE_PROFILES[biome];

  if (profile.overlayAlpha > 0) {
    ctx.fillStyle = `rgba(${profile.overlay},${profile.overlayAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawAmbientMotes(ctx, canvas.width, canvas.height, biome, now);

  const nightAmt = biome === 'shadow' ? 0.64 : Math.max(0, Math.min(0.6, nightAlpha * 1.3));
  if (nightAmt > 0.15) {
    const px = (playerPos.x - camera.x + 0.5) * tileSize;
    const py = (playerPos.y - camera.y + 0.5) * tileSize;
    const torch = ctx.createRadialGradient(px, py, tileSize * 0.5, px, py, tileSize * 6);
    torch.addColorStop(0, 'rgba(255,215,145,0.06)');
    torch.addColorStop(0.45, `rgba(255,180,80,${nightAmt * 0.17})`);
    torch.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = torch;
    ctx.fillRect(px - tileSize * 6, py - tileSize * 6, tileSize * 12, tileSize * 12);
    ctx.globalCompositeOperation = 'source-over';
  }

  if (biome === 'swamp') {
    const fog = ctx.createLinearGradient(0, canvas.height * 0.35, 0, canvas.height);
    fog.addColorStop(0, 'rgba(42,70,32,0)');
    fog.addColorStop(1, 'rgba(20,34,18,0.24)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (biome === 'shadow') {
    const voidGlow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.45, 30, canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.55);
    voidGlow.addColorStop(0, 'rgba(120,70,190,0.05)');
    voidGlow.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = voidGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.3,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${profile.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
''', encoding='utf-8')

BANNER.write_text(r'''import { memo } from 'react';
import type { GameMap } from '../game/maps';
import { ATMOSPHERE_PROFILES, type WorldWeather } from '../game/worldAtmosphere';

interface Props {
  map: GameMap;
  weather: WorldWeather;
}

const WEATHER_ICON: Record<WorldWeather, string> = { clear: '✦', rain: '🌧', snow: '❄', storm: '⚡' };

function RegionBannerInner({ map, weather }: Props) {
  const profile = ATMOSPHERE_PROFILES[map.biome];
  return (
    <div className="moria-region-banner pointer-events-none absolute left-1/2 top-16 z-20 w-[min(520px,88%)] -translate-x-1/2 text-center">
      <div className="text-[9px] font-black uppercase tracking-[0.42em]" style={{ color: profile.accent }}>
        {WEATHER_ICON[weather]} {profile.name} {map.dangerLevel ? `· ${map.dangerLevel}` : ''}
      </div>
      <div className="moria-title mt-1 text-2xl font-black tracking-[0.18em] text-amber-50 sm:text-3xl">{map.name}</div>
      <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" style={{ color: profile.accent }} />
      <div className="mx-auto mt-2 max-w-md text-[10px] font-semibold tracking-wide text-slate-300/75">{map.description}</div>
      {map.levelRequired && map.levelRequired > 1 && (
        <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-300">Recommended level {map.levelRequired}+</div>
      )}
    </div>
  );
}

export default memo(RegionBannerInner);
''', encoding='utf-8')

WEATHER.write_text(r'''import { useEffect, useMemo, useState } from 'react';
import type { WorldWeather } from '../game/worldAtmosphere';

interface Props { type: WorldWeather; }

type Drop = { id: number; x: number; y: number; delay: number; duration: number; scale: number };

function makeDrops(type: WorldWeather): Drop[] {
  if (type === 'clear') return [];
  const count = type === 'storm' ? 110 : type === 'rain' ? 82 : 68;
  let seed = type === 'storm' ? 771 : type === 'rain' ? 421 : 197;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: random() * 104 - 2,
    y: random() * 104 - 2,
    delay: random() * 3,
    duration: type === 'snow' ? 3 + random() * 2.5 : 0.55 + random() * 0.4,
    scale: 0.65 + random() * 0.75,
  }));
}

export default function Weather({ type }: Props) {
  const drops = useMemo(() => makeDrops(type), [type]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (type !== 'storm') { setFlash(false); return; }
    const pulse = window.setInterval(() => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 110);
    }, 7200);
    return () => window.clearInterval(pulse);
  }, [type]);

  if (type === 'clear') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      <div className={`absolute inset-0 transition-opacity duration-100 ${flash ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'rgba(220,235,255,.26)' }} />
      {(type === 'rain' || type === 'storm') && <div className="absolute inset-0 bg-gradient-to-b from-slate-950/12 via-transparent to-blue-950/10" />}
      {drops.map((drop) => (
        <span
          key={drop.id}
          className={type === 'snow' ? 'moria-snow-drop absolute rounded-full bg-white/80' : 'moria-rain-drop absolute bg-blue-100/65'}
          style={{
            left: `${drop.x}%`, top: `${drop.y}%`,
            animationDelay: `${drop.delay}s`, animationDuration: `${drop.duration}s`,
            transform: `scale(${drop.scale})`,
            width: type === 'snow' ? 5 : 1,
            height: type === 'snow' ? 5 : type === 'storm' ? 22 : 14,
          }}
        />
      ))}
    </div>
  );
}
''', encoding='utf-8')

screen = SCREEN.read_text(encoding='utf-8')
import_anchor = "import Weather from './Weather';"
if import_anchor not in screen:
    raise SystemExit('Weather import anchor missing')
screen = screen.replace(import_anchor, import_anchor + "\nimport RegionBanner from './RegionBanner';\nimport { drawWorldAtmosphere, weatherForMap, type WorldWeather } from '../game/worldAtmosphere';", 1)
screen = screen.replace("const [weather, setWeather] = useState<'clear' | 'rain' | 'snow' | 'storm'>('clear');", "const [weather, setWeather] = useState<WorldWeather>('clear');", 1)

music_effect = """  // Restart music when changing maps
  useEffect(() => {
    audio.startMusic(MAPS[currentMapId]?.biome || 'plains');
  }, [currentMapId]);
"""
weather_effect = music_effect + """

  // Cosmetic realm weather is deterministic per map/time window so players in
  // the same region see the same atmosphere without affecting server authority.
  useEffect(() => {
    const refreshWeather = () => {
      const map = MAPS[currentMapId] || MAPS.eldoria;
      setWeather(weatherForMap(map.id, map.biome));
    };
    refreshWeather();
    const timer = window.setInterval(refreshWeather, 45_000);
    return () => window.clearInterval(timer);
  }, [currentMapId]);
"""
if music_effect not in screen:
    raise SystemExit('Map music effect marker missing')
screen = screen.replace(music_effect, weather_effect, 1)

start_marker = '    // Biome overlay (shadowlands darkness, swamp fog, etc)\n'
end_marker = '    ctx.restore();\n'
if start_marker not in screen:
    raise SystemExit('Biome overlay start marker missing')
start = screen.index(start_marker)
end = screen.index(end_marker, start)
replacement = """    drawWorldAtmosphere(
      ctx,
      canvas,
      MAPS[currentMapIdRef.current]?.biome || 'plains',
      nightAlpha,
      p.pos,
      cam,
      TILE_SIZE,
      now,
    );

"""
screen = screen[:start] + replacement + screen[end:]

canvas_anchor = """          {/* Zoom controls */}
"""
if canvas_anchor not in screen:
    raise SystemExit('Canvas controls anchor missing')
screen = screen.replace(canvas_anchor, """          <RegionBanner key={currentMapId} map={MAPS[currentMapId] || MAPS.eldoria} weather={weather} />

          {/* Zoom controls */}
""", 1)
SCREEN.write_text(screen, encoding='utf-8')

css = CSS.read_text(encoding='utf-8')
css += r'''

/* Mor'ia 8.3 — living world */
@keyframes moria-region-reveal {
  0% { opacity: 0; transform: translate(-50%, -10px) scale(.96); filter: blur(5px); }
  14% { opacity: 1; transform: translate(-50%, 0) scale(1); filter: blur(0); }
  76% { opacity: 1; transform: translate(-50%, 0) scale(1); filter: blur(0); }
  100% { opacity: 0; transform: translate(-50%, -5px) scale(1.02); filter: blur(2px); }
}
@keyframes moria-rain-fall { from { translate: 18px -115vh; } to { translate: -30px 115vh; } }
@keyframes moria-snow-fall { from { translate: 0 -110vh; rotate: 0deg; } to { translate: -45px 110vh; rotate: 240deg; } }
.moria-region-banner { animation: moria-region-reveal 4.8s cubic-bezier(.2,.8,.2,1) both; text-shadow: 0 4px 24px rgba(0,0,0,.9); }
.moria-rain-drop { animation: moria-rain-fall linear infinite; }
.moria-snow-drop { animation: moria-snow-fall linear infinite; filter: blur(.35px) drop-shadow(0 0 3px rgba(255,255,255,.4)); }
@media (prefers-reduced-motion: reduce) {
  .moria-region-banner { animation-duration: 2.8s; }
  .moria-rain-drop, .moria-snow-drop { animation-duration: 8s !important; opacity: .4; }
}
'''
CSS.write_text(css, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const screen = read('src/components/GameScreen.tsx');
const atmosphere = read('src/game/worldAtmosphere.ts');
const banner = read('src/components/RegionBanner.tsx');
const weather = read('src/components/Weather.tsx');

test('living-world atmosphere is extracted from the GameScreen orchestrator', () => {
  assert.match(screen, /drawWorldAtmosphere\(/);
  assert.doesNotMatch(screen, /Biome overlay \(shadowlands darkness/);
  assert.match(atmosphere, /export function drawWorldAtmosphere/);
  assert.match(atmosphere, /ATMOSPHERE_PROFILES/);
});

test('weather is deterministic per realm time window and presentation-only', () => {
  assert.match(atmosphere, /export function weatherForMap/);
  assert.match(screen, /setInterval\(refreshWeather, 45_000\)/);
  assert.doesNotMatch(atmosphere, /sendIntent|sendOfficial|player\.hp|monster\.hp/);
});

test('region arrival communicates identity danger and weather', () => {
  assert.match(screen, /<RegionBanner/);
  assert.match(banner, /Recommended level/);
  assert.match(banner, /WEATHER_ICON/);
  assert.match(weather, /prefers-reduced-motion|moria-snow-drop|moria-rain-drop/);
});
''', encoding='utf-8')

DOC.write_text(r'''# Mor'ia 8.3 — Living World

## Goal

Make every region feel like a place rather than a palette swap while preserving server authority.

## Changes

- World atmosphere rendering moved out of `GameScreen` into a biome-aware renderer.
- Plains, snow, swamp, desert and shadow now have distinct overlay, vignette, ambient motes and light treatment.
- Swamps gain layered ground fog; Voidlands gain a subtle void glow; night torch lighting remains player-centered.
- Region arrival banners communicate realm name, biome identity, description, danger and recommended level.
- Weather is deterministic from map + shared time window, so clients in the same region converge on the same cosmetic weather without trusting weather for gameplay.
- Weather particles are deterministic, lighter than the old implementation and respect reduced-motion preferences.

No weather or atmosphere effect changes damage, movement, loot, visibility authority, encounters or progression.
''', encoding='utf-8')

size = len(screen.encode('utf-8'))
print(f'GameScreen after living-world extraction: {size} bytes')
if size > 155_000:
    raise SystemExit('GameScreen exceeds the protected architecture budget')
print('Mor\'ia 8.3 living-world migration prepared')
