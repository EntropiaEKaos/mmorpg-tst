// ===================================================================
// MOR'IA 9.2 — PROCEDURAL PLAYER AVATAR
// Layered, content-driven presentation. No gameplay authority lives here.
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

const DEFAULT_COLORS: AvatarColors = {
  head: '#d7a06b',
  primary: '#506aa6',
  secondary: '#343f59',
  detail: '#d9c271',
};

const safeColor = (value: unknown, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;

function mountPalette(id: string, color: string) {
  const accent = id.includes('nightmare') ? '#9a6ee8'
    : id.includes('astral') ? '#f0d579'
    : id.includes('tiger') ? '#33241c'
    : id.includes('drake') || id.includes('raptor') ? '#f0a05b'
    : id.includes('unicorn') ? '#f1d5ff'
    : '#d6c19c';
  return { body: color, accent };
}

function drawMount(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  mount: AvatarMount,
  direction: string,
  time: number,
) {
  const id = String(mount.id || 'horse');
  const color = safeColor(mount.color, '#8b6f47');
  const { body, accent } = mountPalette(id, color);
  const stride = Math.sin(time / 120) * size * 0.025;
  const face = direction === 'left' ? -1 : 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(face, 1);

  // Body and hindquarters.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.13, size * 0.34, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck / head adapt to quadruped vs drake/raptor silhouette.
  const reptile = /raptor|drake/.test(id);
  const bulky = /boar|bear|lion/.test(id);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(size * 0.28, reptile ? -size * 0.01 : size * 0.02, size * (bulky ? 0.18 : 0.14), size * 0.12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(size * 0.18, -size * 0.01, size * 0.12, size * 0.17);

  // Legs — deliberately chunky to read at the game's pixel scale.
  ctx.fillStyle = body;
  for (const lx of [-0.22, -0.08, 0.12, 0.24]) {
    ctx.fillRect(size * lx, size * 0.22, size * 0.07, size * 0.20 + stride * (lx > 0 ? 1 : -1));
  }

  // Tail / special silhouettes.
  ctx.strokeStyle = body;
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.08);
  ctx.quadraticCurveTo(-size * 0.48, -size * 0.02, -size * 0.43, -size * 0.18);
  ctx.stroke();

  ctx.fillStyle = accent;
  if (/wolf|tiger|lion/.test(id)) {
    ctx.beginPath(); ctx.moveTo(size * 0.22, -size * 0.09); ctx.lineTo(size * 0.25, -size * 0.23); ctx.lineTo(size * 0.31, -size * 0.10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(size * 0.32, -size * 0.08); ctx.lineTo(size * 0.36, -size * 0.22); ctx.lineTo(size * 0.40, -size * 0.06); ctx.fill();
  } else if (/unicorn/.test(id)) {
    ctx.beginPath(); ctx.moveTo(size * 0.32, -size * 0.12); ctx.lineTo(size * 0.42, -size * 0.36); ctx.lineTo(size * 0.37, -size * 0.10); ctx.fill();
  } else if (/boar/.test(id)) {
    ctx.fillRect(size * 0.35, size * 0.02, size * 0.13, size * 0.035);
  } else if (/raptor|drake/.test(id)) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo((-0.12 + i * 0.08) * size, -size * 0.06); ctx.lineTo((-0.08 + i * 0.08) * size, -size * 0.18); ctx.lineTo((-0.03 + i * 0.08) * size, -size * 0.05); ctx.fill();
    }
    if (/drake/.test(id)) {
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.moveTo(-size * 0.05, size * 0.04); ctx.lineTo(-size * 0.35, -size * 0.22); ctx.lineTo(size * 0.03, -size * 0.05); ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    // Horse/nightmare/bear readable ears.
    ctx.beginPath(); ctx.moveTo(size * 0.23, -size * 0.09); ctx.lineTo(size * 0.25, -size * 0.22); ctx.lineTo(size * 0.30, -size * 0.09); ctx.fill();
    ctx.beginPath(); ctx.moveTo(size * 0.31, -size * 0.09); ctx.lineTo(size * 0.35, -size * 0.21); ctx.lineTo(size * 0.38, -size * 0.07); ctx.fill();
  }

  // Saddle and reins.
  ctx.fillStyle = '#3d2b22';
  ctx.fillRect(-size * 0.10, -size * 0.03, size * 0.24, size * 0.07);
  ctx.strokeStyle = '#d1b06e';
  ctx.lineWidth = Math.max(1, size * 0.018);
  ctx.beginPath(); ctx.moveTo(size * 0.10, 0); ctx.quadraticCurveTo(size * 0.30, -size * 0.02, size * 0.36, size * 0.04); ctx.stroke();

  // Eye / magical accent.
  ctx.fillStyle = /nightmare|astral/.test(id) ? accent : '#11151b';
  ctx.fillRect(size * 0.34, -size * 0.035, Math.max(1.5, size * 0.025), Math.max(1.5, size * 0.025));
  ctx.restore();
}

function drawStyleLayers(
  ctx: CanvasRenderingContext2D,
  style: string,
  cx: number,
  cy: number,
  size: number,
  scale: number,
  offsetY: number,
  colors: AvatarColors,
  addonMask: number,
) {
  const s = size * scale;
  const y = cy + offsetY;

  // Legs and boots.
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(cx - s * 0.16, y + s * 0.12, s * 0.12, s * 0.24);
  ctx.fillRect(cx + s * 0.04, y + s * 0.12, s * 0.12, s * 0.24);
  ctx.fillStyle = '#2a2525';
  ctx.fillRect(cx - s * 0.17, y + s * 0.31, s * 0.14, s * 0.08);
  ctx.fillRect(cx + s * 0.03, y + s * 0.31, s * 0.14, s * 0.08);

  // Cape/back addon. Addon #1 intentionally reads behind the body.
  if (addonMask & 1) {
    ctx.fillStyle = colors.detail;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, y - s * 0.04);
    ctx.lineTo(cx + s * 0.22, y - s * 0.04);
    ctx.lineTo(cx + s * 0.27, y + s * 0.35);
    ctx.lineTo(cx - s * 0.27, y + s * 0.35);
    ctx.closePath(); ctx.fill();
  }

  // Torso silhouette.
  ctx.fillStyle = colors.primary;
  if (/mage|warlock|shaman|necromancer/.test(style)) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.20, y - s * 0.06); ctx.lineTo(cx + s * 0.20, y - s * 0.06);
    ctx.lineTo(cx + s * 0.29, y + s * 0.32); ctx.lineTo(cx - s * 0.29, y + s * 0.32); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillRect(cx - s * 0.22, y - s * 0.07, s * 0.44, s * 0.25);
  }

  // Arms.
  ctx.fillStyle = colors.primary;
  ctx.fillRect(cx - s * 0.31, y - s * 0.02, s * 0.10, s * 0.24);
  ctx.fillRect(cx + s * 0.21, y - s * 0.02, s * 0.10, s * 0.24);
  ctx.fillStyle = colors.head;
  ctx.fillRect(cx - s * 0.31, y + s * 0.16, s * 0.10, s * 0.07);
  ctx.fillRect(cx + s * 0.21, y + s * 0.16, s * 0.10, s * 0.07);

  // Style details.
  ctx.fillStyle = colors.detail;
  if (/knight|templar/.test(style)) {
    ctx.fillRect(cx - s * 0.29, y - s * 0.08, s * 0.13, s * 0.10);
    ctx.fillRect(cx + s * 0.16, y - s * 0.08, s * 0.13, s * 0.10);
    ctx.fillRect(cx - s * 0.04, y - s * 0.07, s * 0.08, s * 0.24);
  } else if (/ranger/.test(style)) {
    ctx.strokeStyle = colors.detail; ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.20, y - s * 0.05); ctx.lineTo(cx + s * 0.20, y + s * 0.18); ctx.stroke();
  } else if (/assassin/.test(style)) {
    ctx.fillRect(cx - s * 0.22, y + s * 0.08, s * 0.44, s * 0.05);
  } else if (/noble/.test(style)) {
    ctx.fillRect(cx - s * 0.22, y - s * 0.02, s * 0.44, s * 0.05);
  } else if (/barbarian/.test(style)) {
    for (const dx of [-0.22, -0.12, 0.12, 0.22]) {
      ctx.beginPath(); ctx.arc(cx + s * dx, y - s * 0.05, s * 0.07, 0, Math.PI * 2); ctx.fill();
    }
  } else if (/shaman/.test(style)) {
    ctx.fillRect(cx - s * 0.04, y - s * 0.06, s * 0.08, s * 0.28);
  }

  // Head / hair / hood.
  ctx.fillStyle = colors.head;
  ctx.beginPath(); ctx.arc(cx, y - s * 0.22, s * 0.15, 0, Math.PI * 2); ctx.fill();
  const hooded = /mage|warlock|necromancer|assassin|ranger/.test(style);
  ctx.fillStyle = hooded ? colors.secondary : '#33261f';
  ctx.beginPath(); ctx.arc(cx, y - s * 0.25, s * 0.16, Math.PI, Math.PI * 2); ctx.fill();
  if (hooded) {
    ctx.strokeStyle = colors.detail; ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.beginPath(); ctx.arc(cx, y - s * 0.20, s * 0.18, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }

  // Addon #2 is the head/crest layer.
  if (addonMask & 2) {
    ctx.fillStyle = colors.detail;
    if (/warlock|necromancer|barbarian|shaman/.test(style)) {
      ctx.beginPath(); ctx.moveTo(cx - s * 0.10, y - s * 0.34); ctx.lineTo(cx - s * 0.21, y - s * 0.48); ctx.lineTo(cx - s * 0.04, y - s * 0.36); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + s * 0.10, y - s * 0.34); ctx.lineTo(cx + s * 0.21, y - s * 0.48); ctx.lineTo(cx + s * 0.04, y - s * 0.36); ctx.fill();
    } else if (/noble/.test(style)) {
      ctx.fillRect(cx - s * 0.15, y - s * 0.37, s * 0.30, s * 0.06);
      for (const dx of [-0.11, 0, 0.11]) { ctx.beginPath(); ctx.moveTo(cx + s * dx - s * 0.035, y - s * 0.37); ctx.lineTo(cx + s * dx, y - s * 0.49); ctx.lineTo(cx + s * dx + s * 0.035, y - s * 0.37); ctx.fill(); }
    } else {
      ctx.fillRect(cx - s * 0.03, y - s * 0.44, s * 0.06, s * 0.18);
    }
  }
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
) {
  const colors: AvatarColors = {
    head: safeColor(appearance?.colors?.head, DEFAULT_COLORS.head),
    primary: safeColor(appearance?.colors?.primary, vocationColor || DEFAULT_COLORS.primary),
    secondary: safeColor(appearance?.colors?.secondary, DEFAULT_COLORS.secondary),
    detail: safeColor(appearance?.colors?.detail, DEFAULT_COLORS.detail),
  };
  const style = String(appearance?.outfit?.style || 'citizen').toLowerCase();
  const addonMask = Math.max(0, Math.min(3, Math.floor(Number(appearance?.addonMask) || 0)));

  ctx.save();
  const cx = x + size / 2;
  const bob = Math.sin(time / 200) * (mounted ? 1.4 : 1.0);
  const cy = y + size / 2 + bob;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.68);
  glow.addColorStop(0, colors.primary + '26'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, size * 0.68, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.ellipse(cx, y + size - 3, size * (mounted ? 0.43 : 0.34), size * 0.09, 0, 0, Math.PI * 2); ctx.fill();

  if (mounted) {
    const effectiveMount: AvatarMount = mount || { id:'legacy', icon:fallbackMountIcon, color:vocationColor };
    drawMount(ctx, cx, cy + size * 0.15, size, effectiveMount, direction, time);
  }

  const scale = mounted ? 0.73 : 1;
  const offsetY = mounted ? -size * 0.28 : 0;
  drawStyleLayers(ctx, style, cx, cy, size, scale, offsetY, colors, addonMask);

  // Face direction cue and small eye highlights.
  const eyeShiftX = direction === 'left' ? -1.2 : direction === 'right' ? 1.2 : 0;
  const eyeShiftY = direction === 'up' ? -0.8 : direction === 'down' ? 0.8 : 0;
  const faceY = cy - size * 0.22 * scale + offsetY;
  ctx.fillStyle = '#151515';
  ctx.fillRect(cx - 3 + eyeShiftX, faceY + eyeShiftY, 1.5, 1.5);
  ctx.fillRect(cx + 1.5 + eyeShiftX, faceY + eyeShiftY, 1.5, 1.5);

  // Nameplate.
  ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3; ctx.strokeText(name, cx, y - 2);
  ctx.fillStyle = '#f4e04d'; ctx.fillText(name, cx, y - 2);

  // HP bar.
  const hpBarW = size * 0.9, hpBarH = 3, hpX = cx - hpBarW / 2, hpY = y + size - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#3a1a1a'; ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);
  ctx.restore();
}
