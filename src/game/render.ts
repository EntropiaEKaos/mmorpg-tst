import type { Tile } from './types';

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
    // Base gradient with subtle top-light
    const grad = ctx.createRadialGradient(s * 0.4, s * 0.3, 2, s / 2, s / 2, s);
    grad.addColorStop(0, '#5a8c44');
    grad.addColorStop(0.6, '#4a7c3a');
    grad.addColorStop(1, '#3a6028');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Grass blade clusters (denser, varied greens)
    for (let i = 0; i < 28; i++) {
      const x = hash(i, 1) * s;
      const y = hash(i, 2) * s;
      const g1 = 110 + hash(i, 4) * 60;
      ctx.strokeStyle = `rgba(${70 + hash(i, 3) * 40}, ${g1}, ${50 + hash(i, 8) * 30}, ${0.5 + hash(i, 6) * 0.4})`;
      ctx.lineWidth = 0.8;
      const h = 2 + hash(i, 6) * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (hash(i, 5) - 0.5) * 2, y - h * 0.6, x + (hash(i, 5) - 0.5) * 3, y - h);
      ctx.stroke();
    }
    // Tiny pebbles
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(120,110,90,${0.3 + hash(i, 9) * 0.2})`;
      ctx.beginPath();
      ctx.arc(hash(i + 50, 1) * s, hash(i + 50, 2) * s, 0.8 + hash(i, 10), 0, Math.PI * 2);
      ctx.fill();
    }
    // Flowers
    for (let i = 0; i < 2; i++) {
      const x = hash(i + 100, 1) * s;
      const y = hash(i + 100, 2) * s;
      const colors = ['#f4e04d', '#ff7a7a', '#c8a0ff', '#fff'];
      ctx.fillStyle = colors[Math.floor(hash(i, 7) * colors.length)];
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(x, y, 0.6, 0, Math.PI * 2);
      ctx.fill();
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
    ctx.fillStyle = '#4a7c3a';
    ctx.fillRect(0, 0, s, s);
    // Soft ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 3, s * 0.38, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Trunk with gradient + roots
    const trunkGrad = ctx.createLinearGradient(s / 2 - 4, 0, s / 2 + 4, 0);
    trunkGrad.addColorStop(0, '#3a2410');
    trunkGrad.addColorStop(0.5, '#6a4420');
    trunkGrad.addColorStop(1, '#4a2e14');
    ctx.fillStyle = trunkGrad;
    ctx.fillRect(s / 2 - 3, s * 0.52, 6, s * 0.42);
    // Roots
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s / 2, s * 0.9);
    ctx.lineTo(s / 2 - 5, s * 0.96);
    ctx.moveTo(s / 2, s * 0.9);
    ctx.lineTo(s / 2 + 5, s * 0.96);
    ctx.stroke();
    // Layered canopy (darker base to lighter top for depth)
    const leaves = [
      { x: s / 2, y: s * 0.36, r: s * 0.38, c: '#1e3d10' },
      { x: s * 0.34, y: s * 0.42, r: s * 0.24, c: '#2d5016' },
      { x: s * 0.66, y: s * 0.42, r: s * 0.24, c: '#2d5016' },
      { x: s / 2, y: s * 0.26, r: s * 0.27, c: '#3a6b1f' },
      { x: s * 0.42, y: s * 0.3, r: s * 0.16, c: '#4a7c2a' },
    ];
    for (const l of leaves) {
      ctx.fillStyle = l.c;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sunlight highlights
    ctx.fillStyle = 'rgba(150,200,90,0.5)';
    ctx.beginPath();
    ctx.arc(s * 0.38, s * 0.28, 4, 0, Math.PI * 2);
    ctx.arc(s * 0.56, s * 0.32, 3, 0, Math.PI * 2);
    ctx.fill();
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
    // Dirt path with gradient
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#9a8262');
    grad.addColorStop(1, '#7a6244');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Packed dirt stones
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(${110 + hash(i, 1) * 30}, ${85 + hash(i, 3) * 20}, ${60 + hash(i, 5) * 20}, ${0.5 + hash(i, 2) * 0.4})`;
      ctx.beginPath();
      ctx.arc(hash(i, 2) * s, hash(i, 3) * s, 1 + hash(i, 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lighter dust specks
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(200,180,150,${hash(i, 6) * 0.4})`;
      ctx.fillRect(hash(i + 10, 1) * s, hash(i + 10, 2) * s, 1, 1);
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
    // Stone floor with gradient + mortar lines
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#d4b486');
    grad.addColorStop(1, '#b8966a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Mortar grid
    ctx.strokeStyle = 'rgba(80,60,40,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.stroke();
    // Brick highlights
    ctx.fillStyle = 'rgba(255,235,190,0.2)';
    ctx.fillRect(1, 1, s / 2 - 2, 1);
    ctx.fillRect(s / 2 + 1, s / 2 + 1, s / 2 - 2, 1);
    // Cobblestone specks
    ctx.fillStyle = 'rgba(100,75,45,0.4)';
    ctx.beginPath();
    ctx.arc(s * 0.25, s * 0.25, 1.5, 0, Math.PI * 2);
    ctx.arc(s * 0.75, s * 0.7, 1.8, 0, Math.PI * 2);
    ctx.arc(s * 0.3, s * 0.75, 1.2, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = '#4a7c3a';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(s / 2, s - 4, s * 0.35, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a7c2a';
    ctx.beginPath();
    ctx.arc(s * 0.4, s * 0.4, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c13030';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(s * 0.4 + i * 5, s * 0.55, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
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

export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {
  buildTileCache(size);
  const cached = tileCache.get(`${tile.type}_${size}`);
  if (cached) ctx.drawImage(cached, x, y, size, size);
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
  mountIcon?: string
) {
  // Soft ambient glow under player (subtle vocation-colored aura)
  const glowGrad = ctx.createRadialGradient(x + size / 2, y + size / 2, 2, x + size / 2, y + size / 2, size * 0.7);
  glowGrad.addColorStop(0, vocationColor + '22');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size - 3, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = Math.sin(time / 200) * (mounted ? 2 : 1.5);
  const cx = x + size / 2;
  const cy = y + size / 2 + bob;

  // Mount
  if (mounted && mountIcon) {
    ctx.font = `${size * 0.9}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mountIcon, cx, cy + size * 0.1);
  }

  const scale = mounted ? 0.8 : 1;
  const offsetY = mounted ? -size * 0.2 : 0;

  // Cape
  ctx.fillStyle = vocationColor;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3 * scale, cy + size * 0.1 * scale + offsetY);
  ctx.lineTo(cx + size * 0.3 * scale, cy + size * 0.1 * scale + offsetY);
  ctx.lineTo(cx + size * 0.35 * scale, cy + size * 0.45 * scale + offsetY);
  ctx.lineTo(cx - size * 0.35 * scale, cy + size * 0.45 * scale + offsetY);
  ctx.closePath();
  ctx.fill();

  // Torso
  ctx.fillStyle = '#4a5a7a';
  ctx.fillRect(cx - size * 0.22 * scale, cy - size * 0.05 * scale + offsetY, size * 0.44 * scale, size * 0.2 * scale);

  // Arms
  ctx.fillStyle = '#d4a574';
  ctx.fillRect(cx - size * 0.3 * scale, cy - size * 0.02 * scale + offsetY, size * 0.08 * scale, size * 0.18 * scale);
  ctx.fillRect(cx + size * 0.22 * scale, cy - size * 0.02 * scale + offsetY, size * 0.08 * scale, size * 0.18 * scale);

  // Head
  ctx.fillStyle = '#e8c192';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.18 * scale + offsetY, size * 0.14 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.22 * scale + offsetY, size * 0.14 * scale, Math.PI, 0, false);
  ctx.fill();

  // Helmet
  ctx.fillStyle = '#a8a8a8';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.22 * scale + offsetY, size * 0.15 * scale, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  let eyeOffsetX = 0, eyeOffsetY = 0;
  if (direction === 'left') eyeOffsetX = -1;
  if (direction === 'right') eyeOffsetX = 1;
  if (direction === 'up') eyeOffsetY = -1;
  if (direction === 'down') eyeOffsetY = 1;
  ctx.fillRect(cx - 3 + eyeOffsetX, cy - size * 0.2 * scale + eyeOffsetY + offsetY, 1.5, 1.5);
  ctx.fillRect(cx + 1.5 + eyeOffsetX, cy - size * 0.2 * scale + eyeOffsetY + offsetY, 1.5, 1.5);

  // Sword
  ctx.save();
  ctx.translate(cx + size * 0.25, cy + offsetY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#d4d4d4';
  ctx.fillRect(-1, -size * 0.25, 2, size * 0.3);
  ctx.fillStyle = '#8b6f47';
  ctx.fillRect(-3, 0, 6, 2);
  ctx.restore();

  // Name plate
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeText(name, cx, y - 2);
  ctx.fillStyle = '#f4e04d';
  ctx.fillText(name, cx, y - 2);

  // HP bar
  const hpBarW = size * 0.9;
  const hpBarH = 3;
  const hpX = cx - hpBarW / 2;
  const hpY = y + size - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#3a1a1a';
  ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  const hpPct = Math.max(0, hp / maxHp);
  ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 3, entitySize * 0.32, entitySize * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Type indicator (glow ring)
  if (monster.type === 'elite' || monster.type === 'boss') {
    const pulse = 0.5 + Math.sin(time / 200) * 0.3;
    ctx.strokeStyle = monster.type === 'boss'
      ? `rgba(255,215,0,${pulse})`
      : `rgba(200,50,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, entitySize * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Body
  ctx.fillStyle = monster.color;
  ctx.beginPath();
  ctx.arc(cx, cy, entitySize * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(cx - entitySize * 0.12, cy - entitySize * 0.12, entitySize * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Emoji
  ctx.font = `${entitySize * 0.55}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(monster.emoji, cx, cy + 1);

  // Name + level
  const nameColor = monster.type === 'boss' ? '#ffd700' : monster.type === 'elite' ? '#c832ff' : '#ff9090';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 2.5;
  const nameStr = monster.level ? `${monster.name} [${monster.level}]` : monster.name;
  ctx.strokeText(nameStr, cx, y - 2);
  ctx.fillStyle = nameColor;
  ctx.fillText(nameStr, cx, y - 2);

  // HP bar
  const hpBarW = size * 0.9;
  const hpBarH = 3;
  const hpX = cx - hpBarW / 2;
  const hpY = y + size - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#3a1a1a';
  ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  const hpPct = Math.max(0, monster.hp / monster.maxHp);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);
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

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 3, size * 0.32, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = npc.color;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  const pulse = 0.5 + Math.sin(time / 300) * 0.3;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${size * 0.5}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(npc.emoji, cx, cy + 1);

  const roleIcon =
    npc.role === 'merchant' ? '🛒' :
    npc.role === 'banker' ? '🏦' :
    npc.role === 'innkeeper' ? '🛏' :
    npc.role === 'quest' ? '❗' :
    npc.role === 'trainer' ? '📚' :
    npc.role === 'guard' ? '🛡' : '💬';

  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 2.5;
  ctx.strokeText(`${roleIcon} ${npc.name}`, cx, y - 2);
  ctx.fillStyle = '#9bd4ff';
  ctx.fillText(`${roleIcon} ${npc.name}`, cx, y - 2);
}

// ===== BUILDINGS =====
export interface Building {
  x: number; // tile x (top-left)
  y: number; // tile y (top-left)
  w: number; // width in tiles
  h: number; // height in tiles
  type: 'house' | 'tower' | 'shop' | 'temple' | 'castle' | 'inn' | 'well' | 'tree_deco';
  roofColor?: string;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number, time: number) {
  const w = building.w * tileSize;
  const h = building.h * tileSize;
  const cx = sx + w / 2;
  const baseColor = building.roofColor || '#8b3a2a';

  if (building.type === 'well') {
    // Stone well
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.ellipse(cx, sy + h * 0.55, w * 0.4, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a3d5a';
    ctx.beginPath();
    ctx.ellipse(cx, sy + h * 0.55, w * 0.28, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wooden frame
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(cx - 2, sy + h * 0.1, 4, h * 0.5);
    ctx.fillRect(cx - w * 0.25, sy + h * 0.1, w * 0.5, 3);
    // Roof
    ctx.fillStyle = '#8b3a2a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, sy + h * 0.1);
    ctx.lineTo(cx, sy - h * 0.05);
    ctx.lineTo(cx + w * 0.3, sy + h * 0.1);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (building.type === 'tree_deco') {
    drawTile(ctx, { type: 'tree', walkable: false }, sx, sy, tileSize);
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, sy + h - 3, w * 0.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Walls (stone/wood)
  const wallGrad = ctx.createLinearGradient(sx, sy, sx, sy + h);
  if (building.type === 'temple' || building.type === 'castle' || building.type === 'tower') {
    wallGrad.addColorStop(0, '#c8c8c0');
    wallGrad.addColorStop(1, '#8a8a82');
  } else {
    wallGrad.addColorStop(0, '#e8d4a8');
    wallGrad.addColorStop(1, '#b89868');
  }
  ctx.fillStyle = wallGrad;
  ctx.fillRect(sx + 2, sy + h * 0.35, w - 4, h * 0.6);

  // Wall texture lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + h * 0.35 + (h * 0.6 * i / 4));
    ctx.lineTo(sx + w - 2, sy + h * 0.35 + (h * 0.6 * i / 4));
    ctx.stroke();
  }

  // Door
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - w * 0.08, sy + h * 0.6, w * 0.16, h * 0.35);
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(cx + w * 0.03, sy + h * 0.78, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Windows (glow at night)
  const nightGlow = Math.sin(time / 800) * 0.1 + 0.5;
  ctx.fillStyle = `rgba(255,220,100,${nightGlow})`;
  ctx.fillRect(sx + w * 0.2, sy + h * 0.45, w * 0.1, h * 0.1);
  ctx.fillRect(sx + w * 0.7, sy + h * 0.45, w * 0.1, h * 0.1);

  // Roof
  ctx.fillStyle = baseColor;
  if (building.type === 'tower' || building.type === 'castle') {
    // Pointed / battlement roof
    ctx.beginPath();
    ctx.moveTo(sx, sy + h * 0.35);
    ctx.lineTo(cx, sy);
    ctx.lineTo(sx + w, sy + h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(sx, sy + h * 0.35);
    ctx.lineTo(cx, sy);
    ctx.lineTo(cx - w * 0.1, sy + h * 0.35);
    ctx.closePath();
    ctx.fill();
  } else {
    // Sloped roof
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy + h * 0.38);
    ctx.lineTo(cx, sy + h * 0.08);
    ctx.lineTo(sx + w + 2, sy + h * 0.38);
    ctx.lineTo(sx + w + 2, sy + h * 0.42);
    ctx.lineTo(sx - 2, sy + h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy + h * 0.38);
    ctx.lineTo(cx, sy + h * 0.08);
    ctx.lineTo(cx, sy + h * 0.42);
    ctx.lineTo(sx - 2, sy + h * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  // Building label/sign
  if (building.type !== 'house') {
    const labels: Record<string, string> = {
      shop: '🛒', temple: '⛪', inn: '🛏', castle: '🏰', tower: '🗼',
    };
    const icon = labels[building.type] || '🏠';
    ctx.font = `${tileSize * 0.5}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, sy + h * 0.5);
  }
}

