// Mor'ia 9.7 — original pixel-first 2D entity presentation.
// Inspired by classic grid MMORPG readability; no third-party game assets are used.

const safeColor = (value: string | undefined, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;

function shade(hex: string, factor: number) {
  const clean = safeColor(hex, '#667080').slice(1);
  const n = Number.parseInt(clean, 16);
  const c = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function drawPixelOutline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  const e = Math.max(1, Math.round(Math.min(w, h) * 0.08));
  ctx.fillStyle = '#171412';
  ctx.fillRect(Math.round(x - e), Math.round(y - e), Math.round(w + e * 2), Math.round(h + e * 2));
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

export function drawClassicNpcSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  npc: { color: string; role: string; emoji?: string },
  time: number,
) {
  const u = Math.max(1, Math.round(size / 18));
  const body = safeColor(npc.color, '#65728a');
  const dark = shade(body, 0.56);
  const light = shade(body, 1.28);
  const skin = '#d6a06f';
  const feetY = Math.round(cy + size * 0.46 + Math.sin(time / 500 + cx) * 0.35 * u);
  const left = Math.round(cx - 6 * u);
  const top = feetY - 20 * u;
  const role = String(npc.role || '').toLowerCase();

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Legs / boots.
  drawPixelOutline(ctx, left + 2 * u, top + 15 * u, 3 * u, 4 * u, dark);
  drawPixelOutline(ctx, left + 7 * u, top + 15 * u, 3 * u, 4 * u, dark);
  ctx.fillStyle = '#211d19';
  ctx.fillRect(left + u, top + 18 * u, 4 * u, 2 * u);
  ctx.fillRect(left + 7 * u, top + 18 * u, 4 * u, 2 * u);

  // Role-specific torso gives every profession a readable silhouette.
  drawPixelOutline(ctx, left + 2 * u, top + 8 * u, 8 * u, 7 * u, body);
  ctx.fillStyle = light;
  ctx.fillRect(left + 3 * u, top + 9 * u, u, 5 * u);
  ctx.fillStyle = dark;
  ctx.fillRect(left + 2 * u, top + 14 * u, 8 * u, u);
  drawPixelOutline(ctx, left, top + 9 * u, 2 * u, 6 * u, dark);
  drawPixelOutline(ctx, left + 10 * u, top + 9 * u, 2 * u, 6 * u, dark);

  // Head / hair or helmet.
  drawPixelOutline(ctx, left + 3 * u, top + 2 * u, 6 * u, 6 * u, skin);
  ctx.fillStyle = '#2c211c';
  ctx.fillRect(left + 3 * u, top + u, 6 * u, 2 * u);
  ctx.fillRect(left + 2 * u, top + 2 * u, u, 4 * u);
  ctx.fillRect(left + 9 * u, top + 2 * u, u, 4 * u);
  ctx.fillStyle = '#171717';
  ctx.fillRect(left + 4 * u, top + 4 * u, u, u);
  ctx.fillRect(left + 7 * u, top + 4 * u, u, u);

  if (role === 'guard') {
    ctx.fillStyle = '#87919b';
    ctx.fillRect(left + 3 * u, top, 6 * u, 3 * u);
    ctx.fillStyle = '#c8d1d8';
    ctx.fillRect(left + 5 * u, top, 2 * u, 2 * u);
    ctx.fillStyle = '#d0b85a';
    ctx.fillRect(left + 5 * u, top + 9 * u, 2 * u, 5 * u);
    ctx.fillStyle = '#bfc7ce';
    ctx.fillRect(left + 12 * u, top + 6 * u, u, 11 * u);
    ctx.fillRect(left + 11 * u, top + 6 * u, 3 * u, u);
  } else if (role === 'merchant' || role === 'banker') {
    ctx.fillStyle = '#d6b55c';
    ctx.fillRect(left + 3 * u, top + 11 * u, 6 * u, 2 * u);
    ctx.fillStyle = '#5f3b24';
    ctx.fillRect(left + 10 * u, top + 13 * u, 3 * u, 4 * u);
  } else if (role === 'trainer') {
    ctx.fillStyle = '#c7d1dc';
    ctx.fillRect(left + 11 * u, top + 7 * u, u, 10 * u);
    ctx.fillStyle = '#7b4d2b';
    ctx.fillRect(left + 10 * u, top + 6 * u, 3 * u, 2 * u);
  } else if (role === 'quest') {
    ctx.fillStyle = '#f4d95d';
    ctx.fillRect(left + 5 * u, top - 4 * u, 2 * u, 3 * u);
    ctx.fillRect(left + 5 * u, top, 2 * u, u);
  } else if (role === 'innkeeper') {
    ctx.fillStyle = '#f0d0a0';
    ctx.fillRect(left + 3 * u, top + 10 * u, 6 * u, 4 * u);
    ctx.fillStyle = '#8f2f2f';
    ctx.fillRect(left + 5 * u, top + 10 * u, 2 * u, 4 * u);
  }
  ctx.restore();
}

export function drawClassicMonsterSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  monster: { name: string; color: string; emoji?: string; type?: 'normal' | 'elite' | 'boss' },
  time: number,
) {
  const u = Math.max(1, Math.round(size / 18));
  const body = safeColor(monster.color, '#8b4550');
  const dark = shade(body, 0.5);
  const light = shade(body, 1.32);
  const id = String(monster.name || '').toLowerCase();
  const bob = Math.round(Math.sin(time / 340 + cx) * 0.4 * u);
  const feetY = Math.round(cy + size * 0.45 + bob);
  const left = Math.round(cx - 6 * u);
  const top = feetY - 18 * u;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (/rat|wolf|boar|hound|tiger|lion/.test(id)) {
    drawPixelOutline(ctx, left + u, top + 8 * u, 9 * u, 6 * u, body);
    drawPixelOutline(ctx, left + 8 * u, top + 6 * u, 5 * u, 5 * u, body);
    ctx.fillStyle = light;
    ctx.fillRect(left + 9 * u, top + 7 * u, 2 * u, u);
    ctx.fillStyle = '#151515';
    ctx.fillRect(left + 11 * u, top + 8 * u, u, u);
    ctx.fillStyle = dark;
    ctx.fillRect(left + 2 * u, top + 14 * u, 2 * u, 3 * u);
    ctx.fillRect(left + 7 * u, top + 14 * u, 2 * u, 3 * u);
    ctx.fillRect(left, top + 10 * u, 2 * u, u);
  } else if (/spider/.test(id)) {
    drawPixelOutline(ctx, left + 3 * u, top + 7 * u, 7 * u, 7 * u, body);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, u);
    for (const dy of [7, 9, 11, 13]) {
      ctx.beginPath();
      ctx.moveTo(left + 4 * u, top + dy * u);
      ctx.lineTo(left, top + (dy - 2) * u);
      ctx.moveTo(left + 9 * u, top + dy * u);
      ctx.lineTo(left + 13 * u, top + (dy - 2) * u);
      ctx.stroke();
    }
    ctx.fillStyle = '#f13a3a';
    ctx.fillRect(left + 5 * u, top + 9 * u, u, u);
    ctx.fillRect(left + 8 * u, top + 9 * u, u, u);
  } else if (/slime|ooze|blob/.test(id)) {
    drawPixelOutline(ctx, left + 2 * u, top + 8 * u, 10 * u, 8 * u, body);
    ctx.fillStyle = light;
    ctx.fillRect(left + 4 * u, top + 8 * u, 4 * u, u);
    ctx.fillStyle = '#111';
    ctx.fillRect(left + 4 * u, top + 11 * u, u, u);
    ctx.fillRect(left + 8 * u, top + 11 * u, u, u);
  } else {
    const bone = /skeleton|undead/.test(id);
    const primary = bone ? '#c9c4ae' : body;
    drawPixelOutline(ctx, left + 3 * u, top + 2 * u, 6 * u, 6 * u, primary);
    drawPixelOutline(ctx, left + 2 * u, top + 8 * u, 8 * u, 7 * u, primary);
    drawPixelOutline(ctx, left + 2 * u, top + 15 * u, 3 * u, 3 * u, dark);
    drawPixelOutline(ctx, left + 7 * u, top + 15 * u, 3 * u, 3 * u, dark);
    ctx.fillStyle = bone ? '#29271f' : light;
    ctx.fillRect(left + 4 * u, top + 4 * u, u, u);
    ctx.fillRect(left + 7 * u, top + 4 * u, u, u);
    ctx.fillStyle = dark;
    ctx.fillRect(left, top + 9 * u, 2 * u, 6 * u);
    ctx.fillRect(left + 10 * u, top + 9 * u, 2 * u, 6 * u);
  }

  if (monster.type === 'boss') {
    ctx.fillStyle = '#e2b64f';
    ctx.fillRect(left + 2 * u, top - u, 2 * u, 3 * u);
    ctx.fillRect(left + 5 * u, top - 2 * u, 3 * u, 4 * u);
    ctx.fillRect(left + 9 * u, top - u, 2 * u, 3 * u);
  } else if (monster.type === 'elite') {
    ctx.fillStyle = '#c265ef';
    ctx.fillRect(left + 5 * u, top, 3 * u, u);
  }
  ctx.restore();
}
