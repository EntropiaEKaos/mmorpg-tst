import type { BiomeType } from './maps';

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

  if (nightAlpha > 0.04 && nightAlpha < 0.5) {
    ctx.save();
    const transition = Math.max(0, 1 - Math.abs(nightAlpha - 0.275) / 0.275);
    ctx.fillStyle = `rgba(222, 128, 72, ${0.055 * transition})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
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
