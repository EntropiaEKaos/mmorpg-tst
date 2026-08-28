import type { Tile } from './types';
import { drawAvatar, type AvatarAppearance, type AvatarMount, type AvatarNameplateOptions } from './playerAvatar';
import { drawClassicMonsterSprite, drawClassicNpcSprite } from './classicEntityPresentation';

const tileCache = new Map<string, HTMLCanvasElement>();

function createTileCanvas(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 32): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  return canvas;
}

function hash(x: number, y: number, salt = 0): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

function buildTileCache(size: number) {
  if (tileCache.has(`grass_${size}`)) return;

  tileCache.set(`grass_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#355d2d';
    ctx.fillRect(0, 0, s, s);
    const px = Math.max(1, Math.round(s / 32));
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(hash(i, 11) * s / px) * px;
      const y = Math.floor(hash(i, 17) * s / px) * px;
      const colors = ['#294c26', '#3d6b32', '#4a7b3a', '#244522'];
      ctx.fillStyle = colors[Math.floor(hash(i, 3) * colors.length)];
      ctx.fillRect(x, y, px * (hash(i, 5) > .7 ? 2 : 1), px);
      if (hash(i, 9) > .70) ctx.fillRect(x, y - px, px, px);
    }
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(hash(i + 90, 2) * s / px) * px;
      const y = Math.floor(hash(i + 90, 5) * s / px) * px;
      ctx.fillStyle = ['#d8c95b', '#d77d83', '#9f86cf', '#e7e0c7'][i % 4];
      ctx.fillRect(x, y, px, px);
    }
  }, size));

  tileCache.set(`water_${size}`, createTileCanvas((ctx, s) => {
    // Deep water gradient with depth
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#3578c8');
    grad.addColorStop(0.5, '#2a5da8');
    grad.addColorStop(1, '#1a3d72');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Animated-feel ripple rings
    ctx.strokeStyle = 'rgba(180,220,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(s * 0.25 + i * 7, s * 0.35, 3 + i * 2, 0, Math.PI, false);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,230,255,0.18)';
    ctx.beginPath();
    ctx.arc(s * 0.7, s * 0.72, 5, Math.PI, 0, false);
    ctx.stroke();
    // Shimmer highlights
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(s * 0.55, s * 0.2, 2, 1);
    ctx.fillRect(s * 0.2, s * 0.7, 1.5, 1);
    // Subtle foam at edges
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, s, 1);
  }, size));

  tileCache.set(`tree_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#355d2d';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));

    // Ground detail and tight pixel shadow.
    ctx.fillStyle = '#294d27';
    ctx.fillRect(u, s-u*2, s-u*2, u);
    ctx.fillStyle = 'rgba(20,24,16,.45)';
    ctx.fillRect(s/2-u*5, s-u*3, u*10, u*2);

    // Trunk, roots and bark highlights.
    ctx.fillStyle = '#2c1d13';
    ctx.fillRect(s/2-u*2, s-u*8, u*4, u*6);
    ctx.fillStyle = '#5f3d23';
    ctx.fillRect(s/2-u, s-u*8, u*2, u*6);
    ctx.fillStyle = '#8a5b31';
    ctx.fillRect(s/2-u, s-u*7, u, u*3);
    ctx.fillStyle = '#382418';
    ctx.fillRect(s/2-u*5, s-u*3, u*4, u);
    ctx.fillRect(s/2+u, s-u*3, u*4, u);

    // Stepped canopy clusters, intentionally no vector circles/gradients.
    ctx.fillStyle = '#132d1b';
    ctx.fillRect(s/2-u*7, u*5, u*14, u*7);
    ctx.fillRect(s/2-u*6, u*3, u*12, u*10);
    ctx.fillRect(s/2-u*4, u*2, u*8, u*11);
    ctx.fillStyle = '#214529';
    ctx.fillRect(s/2-u*6, u*4, u*5, u*5);
    ctx.fillRect(s/2+u, u*5, u*5, u*5);
    ctx.fillRect(s/2-u*3, u*2, u*6, u*5);
    ctx.fillStyle = '#35683a';
    ctx.fillRect(s/2-u*4, u*4, u*3, u*3);
    ctx.fillRect(s/2+u, u*3, u*3, u*3);
    ctx.fillRect(s/2-u, u*6, u*3, u*3);
    ctx.fillStyle = '#5b8a4c';
    ctx.fillRect(s/2-u*3, u*3, u*2, u*2);
    ctx.fillRect(s/2+u, u*4, u*2, u*2);
    ctx.fillStyle = '#86a85c';
    ctx.fillRect(s/2-u*2, u*3, u, u);
  }, size));

  tileCache.set(`stone_${size}`, createTileCanvas((ctx, s) => {
    ctx.fillStyle = '#4a7c3a';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 4, s * 0.35, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(s * 0.4, s * 0.4, 2, s / 2, s / 2, s * 0.4);
    grad.addColorStop(0, '#a8a8a8');
    grad.addColorStop(1, '#5a5a5a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(s / 2, s / 2 + 2, s * 0.35, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }, size));

  tileCache.set(`sand_${size}`, createTileCanvas((ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#e8d7a1');
    grad.addColorStop(1, '#d4c08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Sand ripples
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(180,155,100,${0.15 + hash(i, 5) * 0.15})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const yy = (i + 1) * s / 5;
      ctx.moveTo(0, yy);
      ctx.quadraticCurveTo(s / 2, yy - 2, s, yy);
      ctx.stroke();
    }
    // Sand grains
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(${190 + hash(i, 1) * 30}, ${170 + hash(i, 3) * 25}, ${110 + hash(i, 5) * 25}, ${hash(i, 1) * 0.5})`;
      ctx.fillRect(hash(i, 2) * s, hash(i, 3) * s, 1, 1);
    }
  }, size));

  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#816b4f';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));
    for (let row = 0; row < 5; row++) {
      const yy = row * Math.max(u*3, Math.floor(s/5));
      const offset = row % 2 ? u*3 : 0;
      for (let xx = -offset; xx < s; xx += u*6) {
        const tone = hash(xx + row, row, 7) > .5 ? '#967b58' : '#755e45';
        ctx.fillStyle = '#5d4937';
        ctx.fillRect(xx, yy, u*5, u*3);
        ctx.fillStyle = tone;
        ctx.fillRect(xx+u, yy+u, u*4-1, u*2-1);
        ctx.fillStyle = 'rgba(226,199,151,.16)';
        ctx.fillRect(xx+u, yy+u, u*3, 1);
      }
    }
  }, size));

  tileCache.set(`wall_${size}`, createTileCanvas((ctx, s) => {
    // Stone wall with 3D bevel
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#4a4a4a');
    grad.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Brick pattern with depth
    for (let y = 0; y < s; y += 8) {
      // Mortar line (dark gap)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, y, s, 1);
      const offset = (y / 8) % 2 === 0 ? 0 : s / 2;
      for (let x = offset; x < s; x += s / 2) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, 1, 8);
        // Bevel highlight on brick
        ctx.fillStyle = 'rgba(120,120,120,0.3)';
        ctx.fillRect(x + 1, y + 1, s / 2 - 2, 1);
      }
    }
    // Top edge light
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fillRect(0, 0, s, 1.5);
  }, size));

  tileCache.set(`floor_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#786a55';
    ctx.fillRect(0, 0, s, s);
    const cellH = Math.max(4, Math.round(s / 6));
    const cellW = Math.max(6, Math.round(s / 4));
    for (let row = 0, yy = 0; yy < s; row++, yy += cellH) {
      const offset = row % 2 ? -Math.round(cellW / 2) : 0;
      for (let col = -1, xx = offset; xx < s; col++, xx += cellW) {
        const r = hash(col + row * 7, row, 19);
        const base = r > .66 ? '#a79270' : r > .33 ? '#968264' : '#88765b';
        ctx.fillStyle = '#554b3f';
        ctx.fillRect(xx, yy, cellW - 1, cellH - 1);
        ctx.fillStyle = base;
        ctx.fillRect(xx + 1, yy + 1, cellW - 3, cellH - 3);
        ctx.fillStyle = 'rgba(229,210,169,.24)';
        ctx.fillRect(xx + 2, yy + 1, Math.max(1, cellW - 5), 1);
        ctx.fillStyle = 'rgba(45,36,28,.20)';
        ctx.fillRect(xx + cellW - 3, yy + 2, 1, Math.max(1, cellH - 4));
      }
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(55,45,34,.30)';
      ctx.fillRect(Math.floor(hash(i, 21) * s), Math.floor(hash(i, 31) * s), 1, 1);
    }
  }, size));

  tileCache.set(`lava_${size}`, createTileCanvas((ctx, s) => {
    // Cracked molten rock
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(0, 0, s, s);
    // Molten cracks (glowing)
    const grad = ctx.createRadialGradient(s * 0.45, s * 0.45, 1, s / 2, s / 2, s * 0.6);
    grad.addColorStop(0, '#fff5b0');
    grad.addColorStop(0.25, '#ffd700');
    grad.addColorStop(0.55, '#ff6a00');
    grad.addColorStop(1, '#8b0000');
    ctx.fillStyle = grad;
    // Irregular molten blob
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.3);
    ctx.quadraticCurveTo(s * 0.5, s * 0.1, s * 0.8, s * 0.35);
    ctx.quadraticCurveTo(s * 0.95, s * 0.6, s * 0.7, s * 0.85);
    ctx.quadraticCurveTo(s * 0.4, s * 0.95, s * 0.15, s * 0.7);
    ctx.quadraticCurveTo(s * 0.05, s * 0.5, s * 0.2, s * 0.3);
    ctx.fill();
    // Bright bubbles
    ctx.fillStyle = 'rgba(255,240,150,0.8)';
    ctx.beginPath();
    ctx.arc(s * 0.35, s * 0.45, 2.5, 0, Math.PI * 2);
    ctx.arc(s * 0.65, s * 0.6, 1.8, 0, Math.PI * 2);
    ctx.arc(s * 0.5, s * 0.7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }, size));

  tileCache.set(`bush_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#355d2d';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));
    ctx.fillStyle = 'rgba(20,24,16,.35)';
    ctx.fillRect(u*3, s-u*4, s-u*6, u*2);
    ctx.fillStyle = '#17341e';
    ctx.fillRect(u*2, u*6, s-u*4, u*7);
    ctx.fillRect(u*4, u*4, s-u*8, u*10);
    ctx.fillStyle = '#28542f';
    ctx.fillRect(u*3, u*6, u*5, u*4);
    ctx.fillRect(u*9, u*7, u*4, u*4);
    ctx.fillStyle = '#47783d';
    ctx.fillRect(u*5, u*5, u*3, u*3);
    ctx.fillRect(u*9, u*6, u*2, u*2);
    ctx.fillStyle = '#b74e55';
    ctx.fillRect(u*5, u*9, u, u);
    ctx.fillRect(u*10, u*8, u, u);
    ctx.fillStyle = '#e0c261';
    ctx.fillRect(u*7, u*7, u, u);
  }, size));

  tileCache.set(`rock_${size}`, createTileCanvas((ctx, s) => {
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 3, s * 0.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(s * 0.4, s * 0.35, 2, s / 2, s / 2, s * 0.5);
    grad.addColorStop(0, '#8a7a6a');
    grad.addColorStop(1, '#4a3a2a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.8);
    ctx.lineTo(s * 0.1, s * 0.5);
    ctx.lineTo(s * 0.4, s * 0.2);
    ctx.lineTo(s * 0.8, s * 0.3);
    ctx.lineTo(s * 0.9, s * 0.7);
    ctx.lineTo(s * 0.6, s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
  }, size));

  tileCache.set(`wood_floor_${size}`, createTileCanvas((ctx, s) => {
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(40,25,10,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
  }, size));

  tileCache.set(`bridge_${size}`, createTileCanvas((ctx, s) => {
    ctx.fillStyle = '#2a5da8';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(2, 0, s - 4, s);
    ctx.strokeStyle = 'rgba(40,25,10,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 5) {
      ctx.beginPath();
      ctx.moveTo(2, i);
      ctx.lineTo(s - 2, i);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(0, 0, 2, s);
    ctx.fillRect(s - 2, 0, 2, s);
  }, size));
}

function drawMaterialFinish(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {
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
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: string,
  name: string,
  hp: number,
  maxHp: number,
  time: number,
  vocationColor = '#8b2e2e',
  mounted = false,
  mountIcon?: string,
  appearance?: AvatarAppearance | null,
  mount?: AvatarMount | null,
  mana = 0,
  maxMana = 0,
  nameplate?: AvatarNameplateOptions | null,
) {
  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana, nameplate);
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  monster: { name: string; hp: number; maxHp: number; color: string; emoji: string; msSize?: number; level?: number; type?: 'normal' | 'elite' | 'boss' },
  time: number
) {
  const msSize = monster.msSize ?? 1;
  const bob = Math.sin(time / 300 + x) * 1;
  const cx = x + size / 2;
  const cy = y + size / 2 + bob;
  const entitySize = size * msSize;

  // Layered contact shadow anchors sprites to the terrain without a blurry halo.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 2, entitySize * 0.40, entitySize * 0.105, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 3, entitySize * 0.27, entitySize * 0.065, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pixel-native rarity corners: readable without a vector glow halo.
  if (monster.type === 'elite' || monster.type === 'boss') {
    const marker = monster.type === 'boss' ? '#e2b64f' : '#c265ef';
    const m = Math.max(2, Math.round(size / 12));
    const r = entitySize * .40;
    ctx.fillStyle = marker;
    ctx.fillRect(cx-r, cy-r, m*3, m);
    ctx.fillRect(cx-r, cy-r, m, m*3);
    ctx.fillRect(cx+r-m*3, cy-r, m*3, m);
    ctx.fillRect(cx+r-m, cy-r, m, m*3);
  }

  drawClassicMonsterSprite(ctx, cx, cy, entitySize, monster, time);

  // World labels are rendered in a dedicated overlay pass so nearby entities
  // can resolve collisions and distance fading as one layout problem.
}

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  npc: { name: string; emoji: string; color: string; role: string },
  time: number
) {
  const bob = Math.sin(time / 400 + x) * 1;
  const cx = x + size / 2;
  const cy = y + size / 2 + bob;

  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 2, size * 0.39, size * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 3, size * 0.25, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  drawClassicNpcSprite(ctx, cx, cy, size, npc, time);

  // NPC labels are also deferred to the shared world-nameplate pass.
}

// ===== BUILDINGS =====
export interface Building {
  x: number; // tile x (top-left)
  y: number; // tile y (top-left)
  w: number; // width in tiles
  h: number; // height in tiles
  type: 'house' | 'tower' | 'shop' | 'temple' | 'castle' | 'inn' | 'well' | 'tree_deco' | 'market' | 'forge' | 'dock' | 'arena' | 'obelisk' | 'library' | 'graveyard';
  roofColor?: string;
  wallColor?: string;
  accentColor?: string;
  label?: string;
  icon?: string;
}

function shadeBuildingColor(hex: string, factor: number, fallback = '#8b3a2a') {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex || '') ? hex.slice(1) : fallback.slice(1);
  const n = Number.parseInt(clean, 16);
  const c = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function drawPixelRoofTiles(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, color: string) {
  const dark = shadeBuildingColor(color, .56);
  const light = shadeBuildingColor(color, 1.18);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx - 3, sy + h * .40);
  ctx.lineTo(sx + w * .50, sy + h * .07);
  ctx.lineTo(sx + w + 3, sy + h * .40);
  ctx.lineTo(sx + w + 3, sy + h * .46);
  ctx.lineTo(sx - 3, sy + h * .46);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(sx - 4, sy, w + 8, h * .48);
  const band = Math.max(3, Math.round(h * .055));
  for (let yy = Math.round(sy + h * .10), row = 0; yy < sy + h * .46; yy += band, row++) {
    ctx.fillStyle = row % 2 ? dark : shadeBuildingColor(color, .82);
    ctx.fillRect(sx - 4, yy, w + 8, 1);
    const step = Math.max(7, Math.round(w / 9));
    for (let xx = sx - step + (row % 2 ? Math.round(step / 2) : 0); xx < sx + w + step; xx += step) {
      ctx.fillRect(xx, yy, 1, band);
      ctx.fillStyle = light;
      ctx.fillRect(xx + 1, yy + 1, Math.max(1, step - 2), 1);
      ctx.fillStyle = row % 2 ? dark : shadeBuildingColor(color, .82);
    }
  }
  ctx.restore();
  ctx.strokeStyle = '#2b201b';
  ctx.lineWidth = Math.max(2, Math.round(w / 80));
  ctx.beginPath();
  ctx.moveTo(sx - 3, sy + h * .40);
  ctx.lineTo(sx + w * .50, sy + h * .07);
  ctx.lineTo(sx + w + 3, sy + h * .40);
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.fillRect(sx - 4, sy + h * .43, w + 8, Math.max(3, h * .035));
}

export function drawBuilding(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number, time: number) {
  const w = building.w * tileSize;
  const h = building.h * tileSize;
  const cx = sx + w / 2;
  const roof = building.roofColor || '#8b3a2a';
  const wall = building.wallColor || (building.type === 'temple' || building.type === 'castle' || building.type === 'tower' ? '#b8b1a0' : '#bda77f');
  const accent = building.accentColor || '#d4b553';

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (building.type === 'tree_deco') {
    drawTile(ctx, { type: 'tree', walkable: false }, sx, sy, tileSize);
    ctx.restore();
    return;
  }
  if (building.type === 'well') {
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(sx + w*.18, sy+h*.72, w*.64, h*.10);
    ctx.fillStyle = '#4a4740'; ctx.fillRect(sx+w*.18, sy+h*.49, w*.64, h*.25);
    ctx.fillStyle = '#847d6d'; ctx.fillRect(sx+w*.22, sy+h*.45, w*.56, h*.10);
    ctx.fillStyle = '#173a4c'; ctx.fillRect(sx+w*.29, sy+h*.51, w*.42, h*.14);
    ctx.fillStyle = '#5d3b22'; ctx.fillRect(cx-2, sy+h*.16, 4, h*.38); ctx.fillRect(sx+w*.22, sy+h*.16, w*.56, 4);
    drawPixelRoofTiles(ctx, sx+w*.18, sy, w*.64, h*.50, roof);
    ctx.restore(); return;
  }
  if (building.type === 'obelisk') {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx-w*.24, sy+h*.80, w*.48, h*.12);
    ctx.fillStyle = '#1e1925'; ctx.fillRect(cx-w*.14, sy+h*.25, w*.28, h*.55);
    ctx.fillStyle = accent; ctx.fillRect(cx-2, sy+h*.30, 4, h*.38);
    ctx.fillStyle = '#5a4e69'; ctx.beginPath(); ctx.moveTo(cx,sy);ctx.lineTo(cx+w*.14,sy+h*.25);ctx.lineTo(cx-w*.14,sy+h*.25);ctx.closePath();ctx.fill();
    ctx.restore(); return;
  }
  if (building.type === 'graveyard') {
    ctx.strokeStyle = '#625f5c'; ctx.lineWidth = 3; ctx.strokeRect(sx+3,sy+h*.25,w-6,h*.66);
    for (let i=0;i<5;i++){const gx=sx+w*(.15+i*.17);const gy=sy+h*(.48+(i%2)*.12);ctx.fillStyle='#77746e';ctx.fillRect(gx-4,gy,8,h*.22);ctx.fillStyle='#9b978f';ctx.fillRect(gx-3,gy+1,6,2);} ctx.restore(); return;
  }
  if (building.type === 'arena') {
    ctx.fillStyle = '#79674f'; ctx.beginPath(); ctx.ellipse(cx,sy+h*.60,w*.47,h*.34,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle = '#3d3328';ctx.beginPath();ctx.ellipse(cx,sy+h*.60,w*.35,h*.23,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,sy+h*.60,w*.28,h*.17,0,0,Math.PI*2);ctx.stroke();ctx.restore();return;
  }
  if (building.type === 'market') {
    for(let i=0;i<3;i++){const bx=sx+i*w/3;const stripe=i%2?accent:roof;ctx.fillStyle='#5f4027';ctx.fillRect(bx+3,sy+h*.43,w/3-6,h*.40);ctx.fillStyle=stripe;ctx.beginPath();ctx.moveTo(bx,sy+h*.43);ctx.lineTo(bx+w/6,sy+h*.12);ctx.lineTo(bx+w/3,sy+h*.43);ctx.closePath();ctx.fill();ctx.fillStyle='#d8bd85';ctx.fillRect(bx+6,sy+h*.50,w/3-12,h*.08);} ctx.restore();return;
  }

  // Building drop shadow gives the multi-tile mass depth.
  ctx.fillStyle = 'rgba(20,16,12,.35)';
  ctx.fillRect(sx + Math.max(4, tileSize*.12), sy + h*.45 + Math.max(4, tileSize*.12), w - 2, h*.52);

  // Wall body.
  const wallTop = sy + h*.40;
  const wallH = h*.56;
  ctx.fillStyle = '#2a241f';
  ctx.fillRect(sx, wallTop, w, wallH);
  ctx.fillStyle = wall;
  ctx.fillRect(sx + 2, wallTop + 2, w - 4, wallH - 4);

  // Pixel masonry courses and alternating vertical joints.
  const course = Math.max(5, Math.round(tileSize*.20));
  ctx.strokeStyle = 'rgba(55,45,36,.42)';
  ctx.lineWidth = 1;
  for (let yy = Math.round(wallTop + course), row = 0; yy < wallTop + wallH - 2; yy += course, row++) {
    ctx.beginPath(); ctx.moveTo(sx+2,yy);ctx.lineTo(sx+w-2,yy);ctx.stroke();
    const joint = Math.max(10, Math.round(tileSize*.70));
    for (let xx = sx + (row%2?joint/2:joint); xx < sx+w; xx += joint) { ctx.beginPath();ctx.moveTo(xx,yy-course);ctx.lineTo(xx,yy);ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(255,239,202,.12)'; ctx.fillRect(sx+3,wallTop+3,w-6,2);

  // Timber frame on houses/inns/shops makes them read like the reference architecture.
  if (!['temple','castle','tower','forge','library','dock'].includes(building.type)) {
    ctx.fillStyle = '#5c3a24';
    ctx.fillRect(sx + w*.12, wallTop, Math.max(3,tileSize*.09), wallH);
    ctx.fillRect(sx + w*.84, wallTop, Math.max(3,tileSize*.09), wallH);
    ctx.fillRect(sx + 2, wallTop + wallH*.48, w - 4, Math.max(3,tileSize*.08));
  }

  // Door with frame and metal latch.
  const doorW = Math.max(tileSize*.45, w*.14);
  const doorH = Math.min(wallH*.62, tileSize*1.20);
  const doorX = cx - doorW/2;
  const doorY = wallTop + wallH - doorH - 2;
  ctx.fillStyle = '#2a1b13'; ctx.fillRect(doorX-2,doorY-2,doorW+4,doorH+4);
  ctx.fillStyle = '#5c3923'; ctx.fillRect(doorX,doorY,doorW,doorH);
  ctx.fillStyle = '#845333'; for(let xx=doorX+4;xx<doorX+doorW;xx+=6)ctx.fillRect(xx,doorY+2,1,doorH-4);
  ctx.fillStyle = accent; ctx.fillRect(doorX+doorW*.72,doorY+doorH*.52,2,2);

  // Framed windows, scaled by facade width.
  const windows = Math.max(2, Math.min(4, Math.floor(building.w / 2) + 1));
  const flicker = .78 + Math.sin(time/900 + sx)*.08;
  for (let i=0;i<windows;i++) {
    const wx = sx + w*(.14 + (i/(Math.max(1,windows-1)))*.72);
    if (Math.abs(wx-cx) < doorW*.65) continue;
    const wy = wallTop + wallH*.22;
    const ww = Math.max(8,tileSize*.32), wh=Math.max(8,tileSize*.28);
    ctx.fillStyle='#34291f';ctx.fillRect(wx-ww/2-2,wy-2,ww+4,wh+4);
    ctx.fillStyle=`rgba(239,190,91,${flicker})`;ctx.fillRect(wx-ww/2,wy,ww,wh);
    ctx.fillStyle='rgba(255,239,169,.7)';ctx.fillRect(wx-ww/2+2,wy+2,ww*.38,2);
    ctx.fillStyle='#5b452f';ctx.fillRect(wx-1,wy,2,wh);ctx.fillRect(wx-ww/2,wy+wh/2-1,ww,2);
  }

  // Roof mass and tile bands.
  drawPixelRoofTiles(ctx, sx, sy, w, h, roof);

  // Chimney and type accents.
  if (building.w >= 3 && !['castle','tower'].includes(building.type)) {
    ctx.fillStyle='#4c4037';ctx.fillRect(sx+w*.70,sy+h*.12,Math.max(5,tileSize*.16),h*.22);
    ctx.fillStyle='#7d6b5a';ctx.fillRect(sx+w*.70-1,sy+h*.12,Math.max(7,tileSize*.20),3);
  }
  if (building.type === 'castle' || building.type === 'tower') {
    ctx.fillStyle=shadeBuildingColor(wall,.70,'#8a8275');
    const crenel=Math.max(6,Math.round(tileSize*.20));
    for(let xx=sx+3;xx<sx+w-3;xx+=crenel*2)ctx.fillRect(xx,wallTop-5,crenel,7);
  }
  if (building.type === 'temple') {
    ctx.fillStyle=accent;ctx.fillRect(cx-2,sy+h*.12,4,h*.18);ctx.fillRect(cx-7,sy+h*.18,14,4);
  } else if (building.type === 'forge') {
    ctx.fillStyle='#34251d';ctx.fillRect(sx+w*.15,wallTop+wallH*.55,tileSize*.42,tileSize*.28);ctx.fillStyle='#ef7436';ctx.fillRect(sx+w*.15+3,wallTop+wallH*.55+3,tileSize*.30,tileSize*.16);
  } else if (building.type === 'library') {
    ctx.fillStyle=accent;ctx.fillRect(sx+w*.08,wallTop+wallH*.20,4,wallH*.55);ctx.fillRect(sx+w*.90,wallTop+wallH*.20,4,wallH*.55);
  }

  ctx.restore();
}


// Foreground roof pass: entities can walk behind real architecture without visually
// appearing on top of the roof. This changes only compositing, never collision.
export function drawBuildingOcclusion(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number) {
  if (['tree_deco','well','obelisk','graveyard','arena','market','dock'].includes(building.type)) return;
  const w = building.w * tileSize;
  const h = building.h * tileSize;
  const roof = building.roofColor || '#8b3a2a';
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawPixelRoofTiles(ctx, sx, sy, w, h, roof);
  // Eave shadow separates the foreground roof from a character passing behind it.
  ctx.fillStyle = 'rgba(20,16,12,.34)';
  ctx.fillRect(sx - 3, sy + h * .455, w + 6, Math.max(2, Math.round(tileSize * .07)));
  ctx.restore();
}
