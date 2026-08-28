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
export const PIXEL_SPRITE_SCALE = 1.30;



type VocationVisualProfile = {
  family: 'warrior' | 'holy' | 'caster' | 'nature' | 'ranger' | 'rogue' | 'monk' | 'berserker';
  accent: string;
  weapon: 'sword' | 'bow' | 'staff' | 'daggers' | 'mace' | 'axe' | 'fists';
  offhand?: 'shield' | 'orb' | 'totem';
  hood?: boolean;
  helm?: boolean;
  aura?: 'holy' | 'arcane' | 'nature' | 'shadow' | 'death' | 'storm' | 'rage';
};

const VOCATION_VISUALS: Record<string, VocationVisualProfile> = {
  knight: { family:'warrior', accent:'#c8d4df', weapon:'sword', offhand:'shield', helm:true },
  paladin: { family:'holy', accent:'#f1d56e', weapon:'bow', aura:'holy' },
  sorcerer: { family:'caster', accent:'#77baff', weapon:'staff', offhand:'orb', aura:'arcane' },
  druid: { family:'nature', accent:'#8fd769', weapon:'staff', offhand:'orb', aura:'nature' },
  warlock: { family:'caster', accent:'#b56ce3', weapon:'staff', offhand:'orb', hood:true, aura:'shadow' },
  rogue: { family:'rogue', accent:'#a68ad7', weapon:'daggers', hood:true },
  priest: { family:'holy', accent:'#fff0a0', weapon:'mace', offhand:'orb', aura:'holy' },
  deathknight: { family:'warrior', accent:'#a43a45', weapon:'sword', offhand:'shield', helm:true, aura:'death' },
  monk: { family:'monk', accent:'#f0b742', weapon:'fists', aura:'holy' },
  ranger: { family:'ranger', accent:'#7fc56b', weapon:'bow', hood:true, aura:'nature' },
  necromancer: { family:'caster', accent:'#b27be8', weapon:'staff', offhand:'orb', hood:true, aura:'death' },
  berserker: { family:'berserker', accent:'#e66a37', weapon:'axe', aura:'rage' },
  shaman: { family:'nature', accent:'#65cce6', weapon:'staff', offhand:'totem', aura:'storm' },
  templar: { family:'holy', accent:'#f0cf71', weapon:'mace', offhand:'shield', helm:true, aura:'holy' },
};

function vocationProfile(style: string): VocationVisualProfile {
  const key = String(style || '').toLowerCase().replace(/[ _-]/g,'');
  return VOCATION_VISUALS[key] || VOCATION_VISUALS.knight;
}

function drawVocationIdentity(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  size: number,
  direction: string,
  style: string,
  colors: AvatarColors,
  time: number,
) {
  const profile = vocationProfile(style);
  const cell = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 24));
  const top = Math.round(feetY - 24 * cell);
  const mirror = direction === 'left';
  const side = mirror ? -1 : 1;
  const primary = safeColor(colors.primary, DEFAULT_COLORS.primary);
  const secondary = safeColor(colors.secondary, DEFAULT_COLORS.secondary);
  const accent = profile.accent;
  const pulse = (Math.sin(time / 280) + 1) * .5;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Class silhouette: shoulder mass, cloak/hood and head profile.
  if (profile.helm) {
    ctx.fillStyle = shade(secondary,.62); ctx.fillRect(cx-cell*4, top+cell*2, cell*8, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*2, top+cell, cell*4, cell);
  } else if (profile.hood) {
    ctx.fillStyle = shade(secondary,.56); ctx.fillRect(cx-cell*4, top+cell*2, cell*8, cell*5);
    ctx.fillStyle = shade(primary,.72); ctx.fillRect(cx-cell*3, top+cell*4, cell*6, cell*2);
  }
  if (profile.family === 'berserker') {
    ctx.fillStyle = '#6a4a32'; ctx.fillRect(cx-cell*6, top+cell*9, cell*4, cell*3); ctx.fillRect(cx+cell*2, top+cell*9, cell*4, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*5, top+cell*10, cell*2, cell); ctx.fillRect(cx+cell*3, top+cell*10, cell*2, cell);
  } else if (profile.family === 'holy' || profile.family === 'warrior') {
    ctx.fillStyle = shade(secondary,.68); ctx.fillRect(cx-cell*6, top+cell*10, cell*4, cell*3); ctx.fillRect(cx+cell*2, top+cell*10, cell*4, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*5, top+cell*10, cell*2, cell); ctx.fillRect(cx+cell*3, top+cell*10, cell*2, cell);
  }

  // Weapons/offhands are deliberately pixel-rect based to remain crisp at native scale.
  const handY = top + cell*13;
  const weaponX = cx + side*cell*8;
  ctx.fillStyle = '#2a211a';
  if (profile.weapon === 'sword') {
    ctx.fillRect(weaponX, handY-cell*6, cell, cell*9); ctx.fillStyle='#dce4e8'; ctx.fillRect(weaponX-side*cell, handY-cell*8, cell*2, cell*7); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell*2, handY-cell*2, cell*4, cell);
  } else if (profile.weapon === 'mace') {
    ctx.fillRect(weaponX, handY-cell*5, cell, cell*8); ctx.fillStyle=accent; ctx.fillRect(weaponX-cell*2, handY-cell*7, cell*5, cell*4); ctx.fillStyle='#fff0b0'; ctx.fillRect(weaponX-cell, handY-cell*6, cell*2, cell*2);
  } else if (profile.weapon === 'staff') {
    ctx.fillRect(weaponX, handY-cell*8, cell*2, cell*12); ctx.fillStyle=accent; ctx.fillRect(weaponX-cell, handY-cell*10, cell*4, cell*4); ctx.fillStyle='#eff7ff'; ctx.fillRect(weaponX, handY-cell*9, cell*2, cell*2);
  } else if (profile.weapon === 'bow') {
    ctx.fillStyle='#7b522c'; ctx.fillRect(weaponX, handY-cell*8, cell, cell*11); ctx.fillRect(weaponX+side*cell, handY-cell*8, cell, cell); ctx.fillRect(weaponX+side*cell, handY+cell*2, cell, cell); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell, handY-cell*3, cell*3, cell);
  } else if (profile.weapon === 'daggers') {
    ctx.fillStyle='#e5e6e7'; ctx.fillRect(cx-cell*8, handY-cell*2, cell*5, cell); ctx.fillRect(cx+cell*3, handY-cell*2, cell*5, cell); ctx.fillStyle=accent; ctx.fillRect(cx-cell*4, handY-cell*3, cell, cell*3); ctx.fillRect(cx+cell*3, handY-cell*3, cell, cell*3);
  } else if (profile.weapon === 'axe') {
    ctx.fillStyle='#5a3925'; ctx.fillRect(weaponX, handY-cell*6, cell*2, cell*10); ctx.fillStyle='#c7c5c0'; ctx.fillRect(weaponX-side*cell*4, handY-cell*8, cell*7, cell*4); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell*3, handY-cell*7, cell*2, cell*2);
  } else if (profile.weapon === 'fists') {
    ctx.fillStyle=accent; ctx.fillRect(cx-cell*7, handY-cell*2, cell*3, cell*3); ctx.fillRect(cx+cell*4, handY-cell*2, cell*3, cell*3);
  }

  if (profile.offhand === 'shield') {
    const ox = cx - side*cell*8; ctx.fillStyle=shade(secondary,.5); ctx.fillRect(ox-cell*3, handY-cell*5, cell*6, cell*8); ctx.fillStyle=secondary; ctx.fillRect(ox-cell*2, handY-cell*4, cell*4, cell*6); ctx.fillStyle=accent; ctx.fillRect(ox-cell, handY-cell*3, cell*2, cell*4); ctx.fillRect(ox-cell*2, handY-cell*2, cell*4, cell);
  } else if (profile.offhand === 'orb' || profile.offhand === 'totem') {
    const ox = cx-side*cell*7; ctx.fillStyle=accent; ctx.globalAlpha=.72+.20*pulse; ctx.fillRect(ox-cell*2, handY-cell*4, cell*4, cell*4); ctx.fillStyle='#f4fbff'; ctx.fillRect(ox-cell, handY-cell*3, cell*2, cell*2); ctx.globalAlpha=1;
  }

  if (profile.aura) {
    const auraColor = profile.aura === 'nature' ? '#86e56b' : profile.aura === 'holy' ? '#ffe580' : profile.aura === 'storm' ? '#73dfff' : profile.aura === 'rage' ? '#ff6a36' : profile.aura === 'death' ? '#b26ee8' : profile.aura === 'shadow' ? '#8b58bf' : '#69a9ff';
    ctx.fillStyle = auraColor; ctx.globalAlpha = .18 + pulse*.16;
    const y = feetY + cell; for (let i=0;i<4;i++) { const dx=((i*5+Math.floor(time/220))%17)-8; ctx.fillRect(cx+dx*cell, y-(i%2)*cell*2, cell, cell); }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

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
  vocationId?: string,
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
  const resolvedStyle = vocationId || style;
  const frame = frameForStyle(resolvedStyle);
  const idle = Math.round(Math.sin(time / 300) * 0.35);
  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');
  drawVocationIdentity(ctx, cx, feetY + idle, size, direction, resolvedStyle, colors, time);

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
  vocationId?: string,
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

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, y + size - 1, size * (mounted ? 0.42 : 0.32), Math.max(2, size * 0.065), 0, 0, Math.PI * 2);
  ctx.fill();

  if (mounted) {
    drawMount(ctx, cx, feetY + cell * 2, size, mount || { id: 'legacy', icon: fallbackMountIcon, color: vocationColor }, direction, time);
    drawPixelHuman(ctx, cx, feetY - cell * 6, size * 0.84, direction, style, colors, addonMask, time, vocationId);
  } else {
    drawPixelHuman(ctx, cx, feetY, size * 1.08, direction, style, colors, addonMask, time);
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
