// ===================================================================
// MOR'IA 9.7 — DETAILED PIXEL-FIRST HUMANOIDS
// Original procedural sprite art. Gameplay authority remains server-side.
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

// Public architecture contract used by the 9.7 visual regression tests.
export const PIXEL_SPRITE_SCALE = 1.42;

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

type SpritePalette = Record<string, string>;
type SpriteFrame = readonly string[];

// 18 × 24 native-pixel frames. They are intentionally authored as sprite
// matrices rather than large vector rectangles so silhouettes, face pixels,
// armor seams, boots and equipment remain readable at classic MMO scale.
const KNIGHT_FRAME: SpriteFrame = [
  '       dd         ',
  '      dddd        ',
  '     mmmmmmm      ',
  '    mmhhhhmmm     ',
  '    mhssssshm     ',
  '    mssesssem     ',
  '    mssstsssm     ',
  '     ssstsss      ',
  '      ssss        ',
  '   mmppppppmm     ',
  '  mhpppllppphm  h ',
  '  mppppldppppm  h ',
  ' rmpqppldppqpm mh ',
  ' rrqqppppppqqm mh ',
  ' rrqqppddppqqm mh ',
  ' rrrqppppppqm  wh ',
  ' rrrqqppppqqm  wh ',
  '  rrqqqppqqqm  ww ',
  '    qq    qq      ',
  '   qqq    qqq     ',
  '   qkk    kkq     ',
  '  kkbb    bbkk    ',
  '  kbbb    bbbk    ',
  '                  ',
];

const CASTER_FRAME: SpriteFrame = [
  '       dd         ',
  '      dddd     d  ',
  '     qqqqqq   ddd ',
  '    qqqqqqqq   d  ',
  '    qqssssqq   w  ',
  '    qssesssq   w  ',
  '    qssstssq   w  ',
  '     ssstss    w  ',
  '      ssss     w  ',
  '    qppppppq   w  ',
  '   qqpllllpqq  w  ',
  '   qpplddlppq  w  ',
  '  qqpplddlppqq w  ',
  '  qqppppppppqq w  ',
  '   qppddddppq  w  ',
  '   qqppppppqq  w  ',
  '   qqqppppqqq  w  ',
  '  qqqqppppqqqq w  ',
  '  qqqqqppqqqqq w  ',
  '  qqqqqppqqqqq    ',
  '   qqqqppqqqq     ',
  '   qkk    kkq     ',
  '  kkbb    bbkk    ',
  '                  ',
];

const RANGER_FRAME: SpriteFrame = [
  '      qqqq        ',
  '     qqqqqq       ',
  '    qqqqqqqq      ',
  '    qqssssqq   www',
  '    qssesssq  w  w',
  '    qssstssq w   w',
  '     ssstss  w   w',
  '      ssss   w   w',
  '   qqppppppqqw   w',
  '  qqppllllppqw   w',
  '  qpppddddppqw   w',
  '  qppdppppdpqw   w',
  '  qpppppppppqw   w',
  '  qqppddddppqw   w',
  '   qppppppppq w  w',
  '   qqppppppqq  www',
  '    qqppppqq      ',
  '    qqppppqq      ',
  '    qq    qq      ',
  '   qqq    qqq     ',
  '   qkk    kkq     ',
  '  kkbb    bbkk    ',
  '  kbbb    bbbk    ',
  '                  ',
];

const ROGUE_FRAME: SpriteFrame = [
  '      qqqq        ',
  '     qqqqqq       ',
  '    qqqqqqqq      ',
  '    qqssssqq      ',
  '    qssesssq      ',
  '    qssstssq      ',
  '     ssstss       ',
  '      ssss        ',
  '    qqppppqq      ',
  '   qqpllllpqq  hh ',
  '   qppddddppq  hm ',
  '  qqppdppdppqq hm ',
  '  qqppppppppqq mw ',
  '   qppddddppq  mw ',
  '   qqppppppqq  ww ',
  '    qppppppq      ',
  '    qqppppqq      ',
  '    qqqppqqq      ',
  '    qq    qq      ',
  '   qqq    qqq     ',
  '   qkk    kkq     ',
  '  kkbb    bbkk    ',
  '  kbbb    bbbk    ',
  '                  ',
];

const CITIZEN_FRAME: SpriteFrame = [
  '      bbbb        ',
  '     bbbbbb       ',
  '    bbssssbb      ',
  '    bssssssb      ',
  '    bssesssb      ',
  '    bssstssb      ',
  '     ssstss       ',
  '      ssss        ',
  '    qqppppqq      ',
  '   qqpllllpqq     ',
  '   qppddddppq     ',
  '   qppdppdppq     ',
  '   qppppppppq     ',
  '   qqppddppqq     ',
  '    qppppppq      ',
  '    qqppppqq      ',
  '    qqppppqq      ',
  '    qq    qq      ',
  '   qqq    qqq     ',
  '   qkk    kkq     ',
  '  kkbb    bbkk    ',
  '  kbbb    bbbk    ',
  '                  ',
  '                  ',
];

function drawSpriteMatrix(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  sourceSize: number,
  frame: SpriteFrame,
  palette: SpritePalette,
  mirror = false,
) {
  const cell = Math.max(1, Math.round(sourceSize * PIXEL_SPRITE_SCALE / 24));
  const width = Math.max(...frame.map(row => row.length));
  const height = frame.length;
  const drawWidth = width * cell;
  const drawHeight = height * cell;
  const left = Math.round(cx - drawWidth / 2);
  const top = Math.round(feetY - drawHeight);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (mirror) {
    ctx.translate(Math.round(cx * 2), 0);
    ctx.scale(-1, 1);
  }
  // Native-pixel silhouette drop shadow: a single offset pass keeps the
  // authored frame readable over cobbles without turning it into a vector glow.
  const shadowOffset = Math.max(1, Math.floor(cell / 2));
  ctx.fillStyle = '#15120f';
  for (let row = 0; row < frame.length; row++) {
    const line = frame[row];
    for (let col = 0; col < line.length; col++) {
      const key = line[col];
      if (key === ' ' || !palette[key]) continue;
      ctx.fillRect(left + col * cell + shadowOffset, top + row * cell + shadowOffset, cell, cell);
    }
  }

  for (let row = 0; row < frame.length; row++) {
    const line = frame[row];
    for (let col = 0; col < line.length; col++) {
      const key = line[col];
      if (key === ' ') continue;
      const color = palette[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(left + col * cell, top + row * cell, cell, cell);
    }
  }
  ctx.restore();
}

function inferVocationStyle(vocationColor: string) {
  const color = String(vocationColor || '').toLowerCase();
  if (['#c13030', '#4a0e0e', '#7c5030'].includes(color)) return 'knight';
  if (['#4a7c3a', '#3e8066'].includes(color)) return 'ranger';
  if (['#555555', '#404048'].includes(color)) return 'rogue';
  if (['#9b59ff', '#2ecc71', '#8b1a8b', '#f4e04d', '#4a90e2'].includes(color)) return 'caster';
  return 'citizen';
}

function frameForStyle(style: string) {
  if (/knight|templar|guardian|deathknight|paladin|barbarian|berserk/.test(style)) return KNIGHT_FRAME;
  if (/mage|sorcerer|warlock|shaman|necromancer|druid|priest|wizard/.test(style)) return CASTER_FRAME;
  if (/ranger|archer|hunter/.test(style)) return RANGER_FRAME;
  if (/assassin|rogue/.test(style)) return ROGUE_FRAME;
  return CITIZEN_FRAME;
}

export function drawPixelHuman(
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
  const primary = safeColor(colors.primary, DEFAULT_COLORS.primary);
  const secondary = safeColor(colors.secondary, DEFAULT_COLORS.secondary);
  const detail = safeColor(colors.detail, DEFAULT_COLORS.detail);
  const skin = safeColor(colors.head, DEFAULT_COLORS.head);
  const upFacing = direction === 'up';
  const palette: SpritePalette = {
    k: '#181513',
    b: upFacing ? shade(secondary, 0.56) : '#3a281f',
    s: upFacing ? '#3a281f' : skin,
    t: upFacing ? '#3a281f' : shade(skin, 0.72),
    e: upFacing ? '#3a281f' : '#17191b',
    p: primary,
    l: shade(primary, 1.30),
    q: secondary,
    d: detail,
    m: '#737c82',
    h: '#c7d0d5',
    w: '#6a4528',
    r: shade(secondary, 0.82),
  };
  const frame = frameForStyle(style);
  const idle = Math.round(Math.sin(time / 300) * 0.35);
  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');

  // 9.29 one-pixel material glint: keeps larger silhouettes crisp rather than blurry.
  const glint = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 32));
  ctx.fillStyle = 'rgba(255,239,196,.20)';
  ctx.fillRect(Math.round(cx - glint*2), Math.round(feetY - size*1.02 + idle), glint*2, glint);

  // Tiny addon pixels sit on top of the authored frame instead of changing its
  // bounding box, so outfit addons remain crisp and do not become UI glyphs.
  const cell = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 24));
  if (addonMask & 1) {
    ctx.fillStyle = detail;
    ctx.fillRect(Math.round(cx - cell), Math.round(feetY - frame.length * cell - cell * 2), cell * 2, cell * 2);
  }
  if (addonMask & 2) {
    ctx.fillStyle = shade(detail, 1.18);
    ctx.fillRect(Math.round(cx - cell * 2), Math.round(feetY - frame.length * cell - cell), cell * 4, cell);
  }
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
  const cell = Math.max(1, Math.round(size / 17));
  const body = safeColor(mount.color, '#8b6f47');
  const dark = shade(body, 0.55);
  const light = shade(body, 1.25);
  const mirror = direction === 'left';
  const frame: SpriteFrame = [
    '          bb      ',
    '         bbbb     ',
    '      bbbbbbbb    ',
    '  bbbbbbbllbbb    ',
    ' bbbbbbbbbbbbb    ',
    'bbbbddddbbbbbbb   ',
    'bbbddddddbbbbbbb  ',
    ' bbbbbbbbbbbbbbb  ',
    '  bbbbbbbbbbbbbb  ',
    '   bb  bb  bb     ',
    '   bb  bb  bb     ',
    '   kk  kk  kk     ',
  ];
  const bob = Math.round(Math.sin(time / 140) * 0.5 * cell);
  drawSpriteMatrix(ctx, cx, feetY + bob, size * 0.92, frame, { b: body, d: dark, l: light, k: '#211b17' }, mirror);
}

export interface AvatarNameplateOptions {
  nameplateOffsetY?: number;
  nameplateScale?: number;
  nameplateBarWidth?: number;
  nameplateBarHeight?: number;
  nameplateFontSize?: number;
  nameplateShowValues?: boolean;
  nameplateHeadClearance?: number;
  nameplateStackGap?: number;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
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
  nameplate?: AvatarNameplateOptions | null,
) {
  const colors: AvatarColors = {
    head: safeColor(appearance?.colors?.head, DEFAULT_COLORS.head),
    primary: safeColor(appearance?.colors?.primary, vocationColor || DEFAULT_COLORS.primary),
    secondary: safeColor(appearance?.colors?.secondary, DEFAULT_COLORS.secondary),
    detail: safeColor(appearance?.colors?.detail, DEFAULT_COLORS.detail),
  };
  const authoredStyle = String(appearance?.outfit?.style || '').toLowerCase();
  const style = authoredStyle || inferVocationStyle(vocationColor);
  const addonMask = Math.max(0, Math.min(3, Math.floor(Number(appearance?.addonMask) || 0)));
  const cell = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 24));

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const cx = Math.round(x + size / 2);
  const feetY = Math.round(y + size - 1);

  // 9.27 layered contact shadow makes the sprite feel planted in the world.
  const shadowY = y + size - 1;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.035, shadowY + 1, size * (mounted ? 0.48 : 0.38), Math.max(3, size * 0.095), -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  ctx.beginPath();
  ctx.ellipse(cx, shadowY, size * (mounted ? 0.37 : 0.285), Math.max(2, size * 0.052), 0, 0, Math.PI * 2);
  ctx.fill();
  // Warm micro-rim under the feet separates silhouettes from dark cobbles without smoothing pixels.
  ctx.fillStyle = 'rgba(244,210,138,0.075)';
  ctx.fillRect(Math.round(cx - size * .22), Math.round(shadowY - 2), Math.max(2, Math.round(size * .44)), 1);

  if (mounted) {
    drawMount(ctx, cx, feetY + cell * 2, size, mount || { id: 'legacy', icon: fallbackMountIcon, color: vocationColor }, direction, time);
    drawPixelHuman(ctx, cx, feetY - cell * 6, size * 0.84, direction, style, colors, addonMask, time);
  } else {
    drawPixelHuman(ctx, cx, feetY, size, direction, style, colors, addonMask, time);
  }

  // 9.7.1 safe-stack policy: anchor to the authored sprite top, never the tile center.
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));
  const scale = clampNumber(nameplate?.nameplateScale, 0.55, 1.5, 0.82);
  const offsetY = clampNumber(nameplate?.nameplateOffsetY, -32, 12, 0);
  const barW = Math.round(clampNumber(nameplate?.nameplateBarWidth, 18, 64, 30) * scale);
  const barH = Math.max(2, Math.round(clampNumber(nameplate?.nameplateBarHeight, 2, 8, 3) * scale));
  const fontSize = Math.max(7, Math.round(clampNumber(nameplate?.nameplateFontSize, 7, 14, 8) * scale));
  const headClearance = Math.round(clampNumber(nameplate?.nameplateHeadClearance, 4, 24, 7) * scale);
  const stackGap = Math.max(1, Math.round(clampNumber(nameplate?.nameplateStackGap, 1, 8, 2) * scale));
  const showValues = nameplate?.nameplateShowValues === true;
  const barX = Math.round(cx - barW / 2);
  const humanCell = Math.max(1, Math.round((mounted ? size * 0.84 : size) * PIXEL_SPRITE_SCALE / 24));
  const spriteTop = mounted
    ? Math.round(feetY - cell * 6 - CITIZEN_FRAME.length * humanCell)
    : Math.round(feetY - CITIZEN_FRAME.length * humanCell);
  const nameLineH = fontSize + 2;
  const stackH = nameLineH + stackGap + barH + 1 + barH;
  // Positive legacy offsets cannot lower the plate into the protected head zone.
  const safeBottom = spriteTop - headClearance + Math.min(0, Math.round(offsetY));
  const stackTop = safeBottom - stackH;
  const nameY = stackTop + fontSize;
  const hpBarY = stackTop + nameLineH + stackGap;
  const manaBarY = hpBarY + barH + 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = Math.max(2, Math.round(scale * 2));
  ctx.strokeText(name, cx, nameY);
  ctx.fillStyle = '#f4e6bd';
  ctx.fillText(name, cx, nameY);

  ctx.fillStyle = '#090a0b';
  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);
  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#4b171b';
  ctx.fillRect(barX, hpBarY, barW, barH);
  ctx.fillStyle = '#d93643';
  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = '#122949';
  ctx.fillRect(barX, manaBarY, barW, barH);
  ctx.fillStyle = '#3781d8';
  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);

  if (showValues && barW >= 32) {
    ctx.font = `bold ${Math.max(6, fontSize - 2)}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8ef';
    ctx.fillText(`${Math.max(0, Math.round(hp))}/${Math.max(0, Math.round(maxHp))}`, cx, hpBarY + barH / 2);
    ctx.fillStyle = '#e0efff';
    ctx.fillText(`${Math.max(0, Math.round(mana))}/${Math.max(0, Math.round(maxMana))}`, cx, manaBarY + barH / 2);
  }
  ctx.restore();
}
