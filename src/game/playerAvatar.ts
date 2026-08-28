// ===================================================================
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

function drawMount(
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
    drawMount(ctx, cx, feetY + 2 * u, size, mount || { id: 'legacy', icon: fallbackMountIcon, color: vocationColor }, direction, time);
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
