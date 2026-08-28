from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

player_avatar = r'''// ===================================================================
// MOR'IA 9.7 — PIXEL-FIRST PLAYER AVATAR
// Original procedural pixel presentation. Gameplay authority remains server-side.
// ===================================================================

export interface AvatarColors {
  head: string;
  primary: string;
  secondary: string;
  detail: string;
}

export interface AvatarAppearance {
  outfit?: { id?: string; name?: string; icon?: string; style?: string } | null;
  colors?: Partial<AvatarColors> | null;
  addonMask?: number;
}

export interface AvatarMount {
  id?: string;
  name?: string;
  icon?: string;
  color?: string;
  speedBonus?: number;
}

export const PIXEL_SPRITE_SCALE = 1.30;

const DEFAULT_COLORS: AvatarColors = {
  head: '#d7a06b',
  primary: '#506aa6',
  secondary: '#343f59',
  detail: '#d9c271',
};

const safeColor = (value: unknown, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;

function shade(hex: string, factor: number) {
  const clean = safeColor(hex, '#667080').slice(1);
  const value = Number.parseInt(clean, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * factor)));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, outline = '#171412') {
  const edge = Math.max(1, Math.round(Math.min(w, h) * 0.08));
  ctx.fillStyle = outline;
  ctx.fillRect(Math.round(x - edge), Math.round(y - edge), Math.round(w + edge * 2), Math.round(h + edge * 2));
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function drawPixelMount(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  size: number,
  mount: AvatarMount,
  direction: string,
  time: number,
) {
  const u = Math.max(1, Math.round(size / 18));
  const id = String(mount.id || 'horse').toLowerCase();
  const body = safeColor(mount.color, '#8b6f47');
  const dark = shade(body, 0.55);
  const light = shade(body, 1.25);
  const face = direction === 'left' ? -1 : 1;
  const stride = Math.round(Math.sin(time / 120) * u);

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(feetY));
  ctx.scale(face, 1);
  // Legs and hooves.
  for (const [x, phase] of [[-5, 1], [-2, -1], [2, -1], [5, 1]] as const) {
    block(ctx, x * u, (-4 * u), 2 * u, (4 + phase * stride / Math.max(1, u)) * u, dark);
    ctx.fillStyle = '#201b18';
    ctx.fillRect(x * u, -u, 2 * u, u);
  }
  // Body, neck and head in chunky pixel masses.
  block(ctx, -7 * u, -9 * u, 12 * u, 6 * u, body);
  block(ctx, 3 * u, -12 * u, 4 * u, 7 * u, body);
  block(ctx, 5 * u, -14 * u, 5 * u, 4 * u, body);
  ctx.fillStyle = light;
  ctx.fillRect(-5 * u, -8 * u, 7 * u, u);
  ctx.fillRect(6 * u, -13 * u, 2 * u, u);
  // Ears / horns.
  ctx.fillStyle = /drake|raptor/.test(id) ? '#d7b45d' : dark;
  ctx.fillRect(6 * u, -16 * u, u, 3 * u);
  ctx.fillRect(9 * u, -16 * u, u, 3 * u);
  // Eye.
  ctx.fillStyle = /nightmare|astral/.test(id) ? '#c896ff' : '#0d0d0d';
  ctx.fillRect(8 * u, -12 * u, u, u);
  // Saddle.
  block(ctx, -2 * u, -11 * u, 6 * u, 3 * u, '#5b3824');
  ctx.fillStyle = '#d8b95f';
  ctx.fillRect(-u, -11 * u, 4 * u, u);
  // Tail.
  ctx.fillStyle = dark;
  ctx.fillRect(-9 * u, -9 * u, 3 * u, u);
  ctx.fillRect(-10 * u, -8 * u, 2 * u, 3 * u);
  ctx.restore();
}

function drawPixelHuman(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  size: number,
  direction: string,
  style: string,
  colors: AvatarColors,
  addonMask: number,
  time: number,
) {
  const u = Math.max(1, Math.round(size / 18));
  const left = Math.round(cx - 6 * u);
  const top = Math.round(feetY - 20 * u);
  const darkPrimary = shade(colors.primary, 0.58);
  const lightPrimary = shade(colors.primary, 1.28);
  const darkSecondary = shade(colors.secondary, 0.58);
  const skinDark = shade(colors.head, 0.72);
  const metal = /knight|templar|paladin|guardian/.test(style);
  const caster = /mage|warlock|shaman|necromancer|druid/.test(style);
  const ranger = /ranger|archer|hunter/.test(style);
  const rogue = /assassin|rogue/.test(style);
  const barbarian = /barbarian|berserk/.test(style);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Back cape / robe creates a stronger readable silhouette.
  if ((addonMask & 1) || caster) {
    block(ctx, left + 2 * u, top + 8 * u, 8 * u, 9 * u, darkSecondary);
    ctx.fillStyle = colors.detail;
    ctx.fillRect(left + 2 * u, top + 8 * u, u, 7 * u);
  }

  // Boots and legs.
  block(ctx, left + 2 * u, top + 15 * u, 3 * u, 4 * u, colors.secondary);
  block(ctx, left + 7 * u, top + 15 * u, 3 * u, 4 * u, colors.secondary);
  ctx.fillStyle = '#211c19';
  ctx.fillRect(left + u, top + 18 * u, 4 * u, 2 * u);
  ctx.fillRect(left + 7 * u, top + 18 * u, 4 * u, 2 * u);
  ctx.fillStyle = shade(colors.secondary, 1.18);
  ctx.fillRect(left + 3 * u, top + 15 * u, u, 2 * u);
  ctx.fillRect(left + 8 * u, top + 15 * u, u, 2 * u);

  // Torso / robe.
  if (caster) {
    block(ctx, left + 2 * u, top + 8 * u, 8 * u, 8 * u, colors.primary);
    ctx.fillStyle = darkPrimary;
    ctx.fillRect(left + 2 * u, top + 13 * u, 8 * u, 3 * u);
  } else {
    block(ctx, left + 2 * u, top + 8 * u, 8 * u, 7 * u, colors.primary);
  }
  ctx.fillStyle = lightPrimary;
  ctx.fillRect(left + 3 * u, top + 9 * u, u, 5 * u);
  ctx.fillStyle = colors.detail;
  ctx.fillRect(left + 5 * u, top + 8 * u, 2 * u, 7 * u);
  ctx.fillStyle = darkPrimary;
  ctx.fillRect(left + 2 * u, top + 14 * u, 8 * u, u);

  // Arms, with a tiny idle offset only on the hand pixel.
  const handBob = Math.round(Math.sin(time / 240) * 0.5 * u);
  block(ctx, left, top + 9 * u, 2 * u, 6 * u, darkPrimary);
  block(ctx, left + 10 * u, top + 9 * u, 2 * u, 6 * u, darkPrimary);
  ctx.fillStyle = colors.head;
  ctx.fillRect(left, top + 14 * u + handBob, 2 * u, 2 * u);
  ctx.fillRect(left + 10 * u, top + 14 * u - handBob, 2 * u, 2 * u);

  // Shoulder / class silhouette accents.
  if (metal) {
    block(ctx, left + u, top + 8 * u, 3 * u, 2 * u, '#9aa4ad');
    block(ctx, left + 8 * u, top + 8 * u, 3 * u, 2 * u, '#9aa4ad');
    ctx.fillStyle = '#d6e0e7';
    ctx.fillRect(left + 2 * u, top + 8 * u, u, u);
    ctx.fillRect(left + 9 * u, top + 8 * u, u, u);
  } else if (barbarian) {
    ctx.fillStyle = '#7a4b2e';
    ctx.fillRect(left + u, top + 8 * u, 3 * u, u);
    ctx.fillRect(left + 8 * u, top + 8 * u, 3 * u, u);
  } else if (rogue || ranger) {
    ctx.fillStyle = colors.detail;
    ctx.fillRect(left + 2 * u, top + 10 * u, 8 * u, u);
  }

  // Head with outline, jaw shading and hair/hood volume.
  block(ctx, left + 3 * u, top + 2 * u, 6 * u, 6 * u, colors.head);
  ctx.fillStyle = skinDark;
  ctx.fillRect(left + 3 * u, top + 6 * u, 6 * u, 2 * u);
  const hooded = caster || rogue || ranger;
  ctx.fillStyle = hooded ? colors.secondary : '#3a261c';
  ctx.fillRect(left + 3 * u, top + u, 6 * u, 2 * u);
  ctx.fillRect(left + 2 * u, top + 2 * u, u, 4 * u);
  ctx.fillRect(left + 9 * u, top + 2 * u, u, 4 * u);
  ctx.fillStyle = hooded ? shade(colors.secondary, 1.25) : '#5b3827';
  ctx.fillRect(left + 4 * u, top + u, 3 * u, u);

  // Directional face pixels.
  if (direction !== 'up') {
    const eyeY = top + 4 * u;
    ctx.fillStyle = '#151515';
    if (direction === 'left') {
      ctx.fillRect(left + 3 * u, eyeY, u, u);
      ctx.fillRect(left + 6 * u, eyeY, u, u);
    } else if (direction === 'right') {
      ctx.fillRect(left + 5 * u, eyeY, u, u);
      ctx.fillRect(left + 8 * u, eyeY, u, u);
    } else {
      ctx.fillRect(left + 4 * u, eyeY, u, u);
      ctx.fillRect(left + 7 * u, eyeY, u, u);
    }
    ctx.fillStyle = '#e7b889';
    ctx.fillRect(left + 6 * u, top + 5 * u, u, u);
  }

  // Addon crest / helmet.
  if ((addonMask & 2) || metal) {
    ctx.fillStyle = colors.detail;
    ctx.fillRect(left + 3 * u, top, 6 * u, u);
    if (metal) {
      ctx.fillStyle = '#8c969e';
      ctx.fillRect(left + 4 * u, top, 4 * u, 2 * u);
      ctx.fillStyle = '#d7e0e5';
      ctx.fillRect(left + 5 * u, top, u, u);
    } else {
      ctx.fillRect(left + 5 * u, top - 2 * u, 2 * u, 2 * u);
    }
  }

  // Class equipment reads as part of the sprite rather than a UI icon.
  if (metal || barbarian) {
    ctx.fillStyle = '#c6cbd0';
    ctx.fillRect(left + 12 * u, top + 7 * u, u, 10 * u);
    ctx.fillStyle = '#e7edf0';
    ctx.fillRect(left + 11 * u, top + 7 * u, 3 * u, u);
    ctx.fillStyle = '#6d4326';
    ctx.fillRect(left + 11 * u, top + 16 * u, 3 * u, u);
    if (metal) {
      ctx.fillStyle = '#697784';
      ctx.fillRect(left - 2 * u, top + 10 * u, 2 * u, 5 * u);
      ctx.fillStyle = colors.detail;
      ctx.fillRect(left - 2 * u, top + 11 * u, u, 3 * u);
    }
  } else if (ranger) {
    ctx.strokeStyle = '#a6783c';
    ctx.lineWidth = Math.max(1, u);
    ctx.beginPath();
    ctx.arc(left + 12 * u, top + 11 * u, 4 * u, Math.PI * 0.55, Math.PI * 1.45);
    ctx.stroke();
    ctx.strokeStyle = '#dfd8c8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + 12 * u, top + 7 * u);
    ctx.lineTo(left + 12 * u, top + 15 * u);
    ctx.stroke();
  } else if (caster) {
    ctx.fillStyle = '#6b4526';
    ctx.fillRect(left + 12 * u, top + 5 * u, u, 12 * u);
    ctx.fillStyle = colors.detail;
    ctx.fillRect(left + 11 * u, top + 4 * u, 3 * u, 3 * u);
    ctx.fillStyle = '#fff3c0';
    ctx.fillRect(left + 12 * u, top + 4 * u, u, u);
  }

  ctx.restore();
}

export function drawAvatar(
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
  fallbackMountIcon?: string,
  appearance?: AvatarAppearance | null,
  mount?: AvatarMount | null,
  mana = 0,
  maxMana = 0,
) {
  const colors: AvatarColors = {
    head: safeColor(appearance?.colors?.head, DEFAULT_COLORS.head),
    primary: safeColor(appearance?.colors?.primary, vocationColor || DEFAULT_COLORS.primary),
    secondary: safeColor(appearance?.colors?.secondary, DEFAULT_COLORS.secondary),
    detail: safeColor(appearance?.colors?.detail, DEFAULT_COLORS.detail),
  };
  const style = String(appearance?.outfit?.style || 'citizen').toLowerCase();
  const addonMask = Math.max(0, Math.min(3, Math.floor(Number(appearance?.addonMask) || 0)));
  const u = Math.max(1, Math.round(size / 18));

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const cx = Math.round(x + size / 2);
  const bob = Math.round(Math.sin(time / 260) * (mounted ? 0.6 : 0.35) * u);
  const feetY = Math.round(y + size - 2 + bob);

  // Tight grounded shadow, no large vector glow halo.
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 2, size * (mounted ? 0.45 : 0.30), Math.max(2, size * 0.07), 0, 0, Math.PI * 2);
  ctx.fill();

  if (mounted) {
    drawPixelMount(ctx, cx, feetY + 2 * u, size, mount || { id: 'legacy', icon: fallbackMountIcon, color: vocationColor }, direction, time);
    drawPixelHuman(ctx, cx, feetY - 8 * u, size * 0.86, direction, style, colors, addonMask, time);
  } else {
    drawPixelHuman(ctx, cx, feetY, size * PIXEL_SPRITE_SCALE, direction, style, colors, addonMask, time);
  }

  // Reference-style overhead name + compact HP/MP stack above the taller sprite.
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));
  const barW = Math.max(34, Math.round(size * 1.18));
  const barH = Math.max(3, Math.round(size / 11));
  const barX = Math.round(cx - barW / 2);
  const hpBarY = Math.round(y - size * 0.28);
  const manaBarY = hpBarY + barH + 2;
  const nameY = hpBarY - 5;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${Math.max(10, Math.round(size * 0.31))}px monospace`;
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = 3;
  ctx.strokeText(name, cx, nameY);
  ctx.fillStyle = '#f4e6bd';
  ctx.fillText(name, cx, nameY);

  ctx.fillStyle = '#090909';
  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);
  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#461116';
  ctx.fillRect(barX, hpBarY, barW, barH);
  ctx.fillStyle = '#c62535';
  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = '#10284d';
  ctx.fillRect(barX, manaBarY, barW, barH);
  ctx.fillStyle = '#2877d4';
  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);

  // Keep numeric readout only at larger scales so pixels remain readable.
  if (size >= 38) {
    ctx.font = 'bold 6px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8ef';
    ctx.fillText(`${Math.max(0, Math.round(hp))}/${Math.max(0, Math.round(maxHp))}`, cx, hpBarY + barH / 2);
    ctx.fillStyle = '#e0efff';
    ctx.fillText(`${Math.max(0, Math.round(mana))}/${Math.max(0, Math.round(maxMana))}`, cx, manaBarY + barH / 2);
  }
  ctx.restore();
}
'''

classic_entities = r'''// Mor'ia 9.7 — original pixel-first 2D entity presentation.
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
'''

(root / 'src/game/playerAvatar.ts').write_text(player_avatar, encoding='utf-8')
(root / 'src/game/classicEntityPresentation.ts').write_text(classic_entities, encoding='utf-8')

render_path = root / 'src/game/render.ts'
render = render_path.read_text(encoding='utf-8')

# Rich pixel grass: replace smooth gradients with crisp clusters/dither.
grass = r'''  tileCache.set(`grass_${size}`, createTileCanvas((ctx, s) => {
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
'''
render = re.sub(r"  tileCache\.set\(`grass_\$\{size\}`, createTileCanvas\(\(ctx, s\) => \{.*?  \}, size\)\);\n", grass, render, count=1, flags=re.S)

# Dense warm cobble instead of four giant floor quadrants.
floor = r'''  tileCache.set(`floor_${size}`, createTileCanvas((ctx, s) => {
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
'''
render = re.sub(r"  tileCache\.set\(`floor_\$\{size\}`, createTileCanvas\(\(ctx, s\) => \{.*?  \}, size\)\);\n", floor, render, count=1, flags=re.S)

# Lift NPC/monster labels above the taller reference-scale sprites.
render = render.replace("ctx.strokeText(nameStr, cx, y - 2);", "ctx.strokeText(nameStr, cx, y - Math.round(size * 0.34));")
render = render.replace("ctx.fillText(nameStr, cx, y - 2);", "ctx.fillText(nameStr, cx, y - Math.round(size * 0.34));")
render = render.replace("ctx.strokeText(`${roleIcon} ${npc.name}`, cx, y - 2);", "ctx.strokeText(`${roleIcon} ${npc.name}`, cx, y - Math.round(size * 0.34));")
render = render.replace("ctx.fillText(`${roleIcon} ${npc.name}`, cx, y - 2);", "ctx.fillText(`${roleIcon} ${npc.name}`, cx, y - Math.round(size * 0.34));")

building_impl = r'''function shadeBuildingColor(hex: string, factor: number, fallback = '#8b3a2a') {
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
'''
render = re.sub(r"export function drawBuilding\(ctx: CanvasRenderingContext2D, sx: number, sy: number, building: Building, tileSize: number, time: number\) \{.*\Z", building_impl, render, count=1, flags=re.S)
render_path.write_text(render, encoding='utf-8')

city_path = root / 'src/game/cityPresentation.ts'
city = city_path.read_text(encoding='utf-8')
overlay = r'''export function drawCityTileOverlay(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  size: number,
  tileType: string,
) {
  if (tileType !== 'floor' && tileType !== 'path' && tileType !== 'wood_floor') return;
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  const dx = Math.abs(tileX - map.townCenter.x);
  const dy = Math.abs(tileY - map.townCenter.y);
  if (dx > map.townRange + 2 || dy > map.townRange + 2) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Keep the textured base visible; city identity now accents edges and avenues
  // instead of flattening every tile under a translucent rectangle.
  if (tileType === 'path') {
    ctx.globalAlpha = .16;
    ctx.fillStyle = palette.road;
    ctx.fillRect(screenX, screenY, size, size);
  }
  if (tileX === map.townCenter.x || tileY === map.townCenter.y) {
    ctx.globalAlpha = .30;
    ctx.strokeStyle = palette.road;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);
  }
  if (dx <= 2 && dy <= 2) {
    const p = Math.max(2, Math.round(size / 12));
    ctx.globalAlpha = .34;
    ctx.fillStyle = palette.accent;
    // Small plaza mosaic corners preserve cobble detail while making center unique.
    ctx.fillRect(screenX + p, screenY + p, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + p, p, p);
    ctx.fillRect(screenX + p, screenY + size - p * 2, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + size - p * 2, p, p);
  }
  ctx.restore();
}
'''
city = re.sub(r"export function drawCityTileOverlay\(.*?^\}\n\nfunction drawPropGlyph", overlay + "\nfunction drawPropGlyph", city, count=1, flags=re.S | re.M)
city_path.write_text(city, encoding='utf-8')

# Preserve night gameplay but keep pixel detail and color readable.
day_path = root / 'src/game/dayNight.ts'
day = day_path.read_text(encoding='utf-8')
day = day.replace('let darkness = 0.55;', 'let darkness = 0.38;')
day = day.replace('darkness = 0.55 * (1 - smoothstep(300, 420, minuteOfDay));', 'darkness = 0.38 * (1 - smoothstep(300, 420, minuteOfDay));')
day = day.replace('darkness = 0.55 * smoothstep(1080, 1200, minuteOfDay);', 'darkness = 0.38 * smoothstep(1080, 1200, minuteOfDay);')
day = day.replace('1 - darkness / 0.55', '1 - darkness / 0.38')
day = day.replace('Math.min(0.65, Number(clock.darkness) || 0)', 'Math.min(0.38, Number(clock.darkness) || 0)')
day = day.replace('return Math.min(0.55, ((dayTime - 120) / 30) * 0.55);', 'return Math.min(0.38, ((dayTime - 120) / 30) * 0.38);')
day = day.replace('return Math.max(0, 0.55 - (dayTime / 30) * 0.55);', 'return Math.max(0, 0.38 - (dayTime / 30) * 0.38);')
day_path.write_text(day, encoding='utf-8')

# Static contract for the new visual direction.
test = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.7 player presentation is pixel-first and materially larger than one-tile legacy figure', () => {
  const avatar = read('src/game/playerAvatar.ts');
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.30/);
  assert.match(avatar, /drawPixelHuman/);
  assert.match(avatar, /drawPixelOutline|function block/);
  assert.doesNotMatch(avatar, /createRadialGradient/);
});

test('9.7 NPC and monster silhouettes use original outlined pixel construction', () => {
  const entities = read('src/game/classicEntityPresentation.ts');
  assert.match(entities, /pixel-first 2D entity presentation/);
  assert.match(entities, /drawPixelOutline/);
  assert.match(entities, /role === 'guard'/);
  assert.match(entities, /rat\|wolf\|boar/);
});

test('9.7 city presentation replaces flat architecture with masonry and tiled roofs', () => {
  const render = read('src/game/render.ts');
  const city = read('src/game/cityPresentation.ts');
  assert.match(render, /drawPixelRoofTiles/);
  assert.match(render, /Pixel masonry courses/);
  assert.match(render, /Timber frame/);
  assert.match(render, /Dense warm cobble/);
  assert.match(city, /Keep the textured base visible/);
});

test('9.7 night presentation preserves detail instead of crushing the world under 55% darkness', () => {
  const day = read('src/game/dayNight.ts');
  assert.match(day, /let darkness = 0\.38/);
  assert.doesNotMatch(day, /let darkness = 0\.55/);
});
'''
(root / 'server/test/reference-visual-9-7.test.mjs').write_text(test, encoding='utf-8')

print('Mor\'ia 9.7 reference visual convergence materialized')
