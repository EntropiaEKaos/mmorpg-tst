// Mor'ia 9.7 — original pixel-first 2D entity presentation.
// Inspired by classic grid MMORPG readability; no third-party game assets are used.

import { drawPixelHuman, type AvatarColors } from './playerAvatar';

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

function npcStyle(role: string) {
  if (role === 'guard' || role === 'trainer') return 'knight';
  if (role === 'quest') return 'caster';
  if (role === 'scout' || role === 'hunter') return 'ranger';
  return 'citizen';
}

function npcColors(role: string, body: string): AvatarColors {
  if (role === 'guard') return { head: '#d2a073', primary: '#53677b', secondary: '#293847', detail: '#d4ba63' };
  if (role === 'trainer') return { head: '#c99669', primary: shade(body, 0.88), secondary: '#473426', detail: '#c8cdd1' };
  if (role === 'quest') return { head: '#d5a574', primary: body, secondary: shade(body, 0.54), detail: '#f0cf58' };
  if (role === 'merchant') return { head: '#d5a574', primary: body, secondary: '#5c3e29', detail: '#d6b55c' };
  if (role === 'banker') return { head: '#d5a574', primary: shade(body, 0.90), secondary: '#38455b', detail: '#e0c56f' };
  if (role === 'innkeeper') return { head: '#d5a574', primary: '#8f4f3b', secondary: '#4f3527', detail: '#e0c49a' };
  return { head: '#d5a574', primary: body, secondary: shade(body, 0.56), detail: shade(body, 1.28) };
}

export function drawClassicNpcSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  npc: { color: string; role: string; emoji?: string },
  time: number,
) {
  const role = String(npc.role || '').toLowerCase();
  const body = safeColor(npc.color, '#65728a');
  const feetY = Math.round(cy + size * 0.46);
  const u = Math.max(1, Math.round(size / 24));

  // NPCs share the same authored humanoid sprite grammar as the player so a
  // populated square reads as one coherent pixel-art world instead of mixed UI shapes.
  drawPixelHuman(ctx, cx, feetY, size * 0.96, 'down', npcStyle(role), npcColors(role, body), 0, time + cx * 7);

  // Profession details are only a few native pixels; no emoji is used on-world.
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (role === 'quest') {
    ctx.fillStyle = '#1b1710';
    ctx.fillRect(Math.round(cx - u * 2), Math.round(feetY - size * 1.38), u * 4, u * 6);
    ctx.fillStyle = '#f4d95d';
    ctx.fillRect(Math.round(cx - u), Math.round(feetY - size * 1.36), u * 2, u * 4);
    ctx.fillRect(Math.round(cx - u), Math.round(feetY - size * 1.27), u * 2, u * 2);
  } else if (role === 'merchant') {
    ctx.fillStyle = '#51321f';
    ctx.fillRect(Math.round(cx + size * .28), Math.round(feetY - size * .46), u * 5, u * 5);
    ctx.fillStyle = '#a8783d';
    ctx.fillRect(Math.round(cx + size * .30), Math.round(feetY - size * .44), u * 3, u * 2);
  } else if (role === 'banker') {
    ctx.fillStyle = '#d4b659';
    ctx.fillRect(Math.round(cx + size * .30), Math.round(feetY - size * .50), u * 4, u * 4);
    ctx.fillStyle = '#6c5825';
    ctx.fillRect(Math.round(cx + size * .31), Math.round(feetY - size * .49), u * 2, u * 2);
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

  // Small directional rim pixels make silhouettes survive dark biomes.
  ctx.fillStyle = monster.type === 'boss' ? 'rgba(255,220,126,.72)' : 'rgba(220,232,240,.18)';
  ctx.fillRect(left + 3 * u, top + 2 * u, Math.max(1, u), Math.max(2, 3 * u));

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