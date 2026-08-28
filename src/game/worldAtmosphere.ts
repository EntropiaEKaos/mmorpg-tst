import type { BiomeType } from './maps';

export type WorldWeather = 'clear' | 'rain' | 'snow' | 'storm';

type AtmosphereProfile = {
  name: string;
  accent: string;
  overlay: string;
  overlayAlpha: number;
  shadow: string;
  highlight: string;
  mote: string;
  moteCount: number;
  vignette: number;
  haze: number;
};

export const ATMOSPHERE_PROFILES: Record<BiomeType, AtmosphereProfile> = {
  plains: { name: 'Verdant Frontier', accent: '#78d0a4', overlay: '39,79,61', overlayAlpha: 0.045, shadow: '11,20,18', highlight: '214,198,142', mote: '#d7f2aa', moteCount: 11, vignette: 0.38, haze: 0.055 },
  snow: { name: 'Frozen Expanse', accent: '#9ed6ff', overlay: '170,205,230', overlayAlpha: 0.075, shadow: '17,31,46', highlight: '224,242,255', mote: '#ffffff', moteCount: 16, vignette: 0.38, haze: 0.095 },
  swamp: { name: 'Rotfen Mists', accent: '#9bc66a', overlay: '25,49,20', overlayAlpha: 0.22, shadow: '10,21,8', highlight: '178,190,112', mote: '#c7f47b', moteCount: 15, vignette: 0.52, haze: 0.20 },
  desert: { name: 'Ashen Reach', accent: '#e7ad67', overlay: '129,72,31', overlayAlpha: 0.075, shadow: '43,24,14', highlight: '238,195,126', mote: '#e4be75', moteCount: 16, vignette: 0.43, haze: 0.07 },
  shadow: { name: 'The Black Verge', accent: '#ad8ade', overlay: '18,8,31', overlayAlpha: 0.37, shadow: '4,0,9', highlight: '146,106,199', mote: '#b88ee6', moteCount: 20, vignette: 0.66, haze: 0.14 },
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
    const speed = biome === 'snow' ? 0.013 : biome === 'desert' ? 0.021 : 0.007;
    const phase = now * speed + seed * 12.3;
    const x = ((seed * 43.7 + phase * (biome === 'desert' ? 1.7 : 0.32)) % (width + 80)) - 40;
    const y = ((seed * 19.1 + phase * (biome === 'snow' ? 1.05 : 0.20)) % (height + 80)) - 40;
    const pulse = 0.20 + (Math.sin(phase * 0.04) + 1) * 0.13;
    ctx.globalAlpha = biome === 'shadow' || biome === 'swamp' ? pulse : pulse * 0.5;
    ctx.fillStyle = profile.mote;
    if (biome === 'desert') {
      ctx.fillRect(x, y, 5, 1);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, biome === 'shadow' ? 1.7 : biome === 'snow' ? 1.35 : 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHazeBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeType,
  now: number,
): void {
  const profile = ATMOSPHERE_PROFILES[biome];
  if (profile.haze <= 0) return;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const phase = now * (0.000018 + i * 0.000006) + i * 1.9;
    const y = height * (0.35 + i * 0.18) + Math.sin(phase * 7) * 16;
    const x = Math.sin(phase * 3.3) * width * 0.06;
    const haze = ctx.createLinearGradient(0, y - 50, 0, y + 50);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(0.5, `rgba(${profile.highlight},${profile.haze * (0.62 - i * 0.1)})`);
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(x - width * 0.08, y - 50, width * 1.16, 100);
  }
  ctx.restore();
}

function drawPlayerLight(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tileSize: number,
  nightAmt: number,
  biome: BiomeType,
): void {
  if (nightAmt <= 0.08 && biome !== 'shadow') return;
  const radius = tileSize * (biome === 'shadow' ? 5.2 : 6.4);
  const light = ctx.createRadialGradient(px, py, tileSize * 0.35, px, py, radius);
  light.addColorStop(0, `rgba(255,225,166,${0.12 + nightAmt * 0.10})`);
  light.addColorStop(0.22, `rgba(233,170,93,${0.08 + nightAmt * 0.08})`);
  light.addColorStop(0.62, `rgba(190,116,48,${nightAmt * 0.045})`);
  light.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = light;
  ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawColorGrade(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeType,
  nightAlpha: number,
): void {
  const profile = ATMOSPHERE_PROFILES[biome];
  const night = Math.max(0, Math.min(0.78, nightAlpha * 1.42));
  if (profile.overlayAlpha > 0) {
    ctx.fillStyle = `rgba(${profile.overlay},${profile.overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (night > 0.02) {
    ctx.fillStyle = `rgba(${profile.shadow},${night * 0.43})`;
    ctx.fillRect(0, 0, width, height);
  }

  const topLight = ctx.createLinearGradient(0, 0, 0, height);
  topLight.addColorStop(0, `rgba(${profile.highlight},${0.035 + Math.max(0, 0.08 - night * 0.08)})`);
  topLight.addColorStop(0.46, 'rgba(255,255,255,0)');
  topLight.addColorStop(1, `rgba(${profile.shadow},${0.05 + night * 0.06})`);
  ctx.fillStyle = topLight;
  ctx.fillRect(0, 0, width, height);
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) / 3.2,
    width / 2, height / 2, Math.max(width, height) / 1.18,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.72, 'rgba(0,0,0,0.02)');
  vignette.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
  ctx.save();
  ctx.globalAlpha = 0.055;
  const cell = 18;
  const phase = Math.floor(now / 120);
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const seed = hashText(`${x}:${y}:${phase}`);
      if (seed % 4 !== 0) continue;
      const alpha = 0.08 + (seed % 13) / 100;
      ctx.fillStyle = `rgba(235,225,205,${alpha})`;
      ctx.fillRect(x + (seed % 7), y + (seed % 5), 1, 1);
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
  const px = (playerPos.x - camera.x + 0.5) * tileSize;
  const py = (playerPos.y - camera.y + 0.5) * tileSize;
  const nightAmt = biome === 'shadow' ? Math.max(0.56, nightAlpha) : Math.max(0, Math.min(0.72, nightAlpha * 1.36));

  drawColorGrade(ctx, canvas.width, canvas.height, biome, nightAlpha);
  drawHazeBands(ctx, canvas.width, canvas.height, biome, now);
  drawAmbientMotes(ctx, canvas.width, canvas.height, biome, now);
  drawPlayerLight(ctx, px, py, tileSize, nightAmt, biome);

  if (biome === 'swamp') {
    const lowFog = ctx.createLinearGradient(0, canvas.height * 0.38, 0, canvas.height);
    lowFog.addColorStop(0, 'rgba(64,78,46,0)');
    lowFog.addColorStop(0.7, 'rgba(44,57,35,0.13)');
    lowFog.addColorStop(1, 'rgba(19,26,17,0.27)');
    ctx.fillStyle = lowFog;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (biome === 'shadow') {
    const voidGlow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.43, 24, canvas.width * 0.5, canvas.height * 0.43, canvas.width * 0.58);
    voidGlow.addColorStop(0, 'rgba(126,86,178,0.07)');
    voidGlow.addColorStop(0.5, 'rgba(59,30,83,0.03)');
    voidGlow.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = voidGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (biome === 'desert') {
    const heat = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
    heat.addColorStop(0, 'rgba(211,136,70,0)');
    heat.addColorStop(1, 'rgba(211,136,70,0.055)');
    ctx.fillStyle = heat;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (nightAlpha > 0.04 && nightAlpha < 0.52) {
    const transition = Math.max(0, 1 - Math.abs(nightAlpha - 0.28) / 0.28);
    const dusk = ctx.createLinearGradient(0, 0, 0, canvas.height);
    dusk.addColorStop(0, `rgba(232,145,91,${0.035 * transition})`);
    dusk.addColorStop(0.55, `rgba(169,83,73,${0.024 * transition})`);
    dusk.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dusk;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawVignette(ctx, canvas.width, canvas.height, profile.vignette + nightAmt * 0.10);
  drawFilmGrain(ctx, canvas.width, canvas.height, now);
}
