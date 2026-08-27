// Mor'ia 9.5 — original procedural 2D entity presentation.
// Inspired by classic grid MMORPG readability; no third-party game assets are used.

const safeColor = (value: string | undefined, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;

function shade(hex: string, factor: number) {
  const clean = safeColor(hex, '#667080').slice(1);
  const n = Number.parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
  return `rgb(${r},${g},${b})`;
}

export function drawClassicNpcSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  npc: { color: string; role: string; emoji?: string },
  time: number,
) {
  const unit = Math.max(2, Math.round(size / 16));
  const body = safeColor(npc.color, '#65728a');
  const dark = shade(body, 0.55);
  const light = shade(body, 1.25);
  const skin = '#d6a06f';
  const idle = Math.round(Math.sin(time / 420 + cx) * unit * 0.35);
  const x = Math.round(cx - unit * 4);
  const y = Math.round(cy - unit * 5 + idle);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // legs / boots
  ctx.fillStyle = '#27241f';
  ctx.fillRect(x + unit, y + unit * 7, unit * 2, unit * 3);
  ctx.fillRect(x + unit * 5, y + unit * 7, unit * 2, unit * 3);
  ctx.fillStyle = '#151515';
  ctx.fillRect(x, y + unit * 9, unit * 3, unit);
  ctx.fillRect(x + unit * 5, y + unit * 9, unit * 3, unit);
  // torso / arms
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + unit * 3, unit * 8, unit * 5);
  ctx.fillStyle = body;
  ctx.fillRect(x + unit, y + unit * 3, unit * 6, unit * 4);
  ctx.fillStyle = light;
  ctx.fillRect(x + unit * 2, y + unit * 3, unit, unit * 4);
  // head / hair
  ctx.fillStyle = skin;
  ctx.fillRect(x + unit * 2, y, unit * 4, unit * 4);
  ctx.fillStyle = npc.role === 'guard' ? '#8f9498' : '#3b2b23';
  ctx.fillRect(x + unit * 2, y, unit * 4, unit);
  ctx.fillRect(x + unit, y + unit, unit, unit * 2);
  ctx.fillRect(x + unit * 6, y + unit, unit, unit * 2);
  // eyes
  ctx.fillStyle = '#161616';
  ctx.fillRect(x + unit * 3, y + unit * 2, unit, unit);
  ctx.fillRect(x + unit * 5, y + unit * 2, unit, unit);
  // role silhouette accents
  ctx.fillStyle = '#d9b85f';
  if (npc.role === 'guard') {
    ctx.fillRect(x + unit * 3, y + unit * 4, unit * 2, unit * 3);
    ctx.strokeStyle = '#aab5c2';
    ctx.lineWidth = unit;
    ctx.beginPath(); ctx.moveTo(x + unit * 7, y + unit * 3); ctx.lineTo(x + unit * 8, y + unit * 9); ctx.stroke();
  } else if (npc.role === 'merchant' || npc.role === 'banker') {
    ctx.fillRect(x + unit * 3, y + unit * 5, unit * 2, unit);
  } else if (npc.role === 'trainer') {
    ctx.fillStyle = '#c7d1dc';
    ctx.fillRect(x + unit * 6, y + unit * 4, unit, unit * 4);
  } else if (npc.role === 'quest') {
    ctx.fillStyle = '#f4d95d';
    ctx.fillRect(x + unit * 3, y - unit * 3, unit * 2, unit * 2);
    ctx.fillRect(x + unit * 3, y - unit, unit * 2, unit);
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
  const unit = Math.max(2, Math.round(size / 16));
  const body = safeColor(monster.color, '#8b4550');
  const dark = shade(body, 0.5);
  const light = shade(body, 1.3);
  const id = String(monster.name || '').toLowerCase();
  const bob = Math.round(Math.sin(time / 320 + cx) * unit * 0.45);
  const x = Math.round(cx - unit * 4);
  const y = Math.round(cy - unit * 4 + bob);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (/rat|wolf|boar|spider|hound/.test(id)) {
    ctx.fillStyle = dark;
    ctx.fillRect(x, y + unit * 4, unit * 8, unit * 4);
    ctx.fillStyle = body;
    ctx.fillRect(x + unit, y + unit * 3, unit * 6, unit * 4);
    ctx.fillRect(x + unit * 6, y + unit * 2, unit * 3, unit * 3);
    ctx.fillStyle = light;
    ctx.fillRect(x + unit * 7, y + unit * 2, unit, unit);
    ctx.fillStyle = '#f1d8a0';
    ctx.fillRect(x + unit * 8, y + unit * 4, unit, unit);
    ctx.fillStyle = '#191919';
    ctx.fillRect(x + unit * 7, y + unit * 3, unit, unit);
    ctx.fillRect(x + unit, y + unit * 8, unit * 2, unit);
    ctx.fillRect(x + unit * 5, y + unit * 8, unit * 2, unit);
  } else if (/slime|ooze|blob/.test(id)) {
    ctx.fillStyle = dark;
    ctx.fillRect(x, y + unit * 4, unit * 8, unit * 5);
    ctx.fillStyle = body;
    ctx.fillRect(x + unit, y + unit * 2, unit * 6, unit * 6);
    ctx.fillStyle = light;
    ctx.fillRect(x + unit * 2, y + unit * 2, unit * 2, unit);
    ctx.fillStyle = '#111';
    ctx.fillRect(x + unit * 2, y + unit * 5, unit, unit);
    ctx.fillRect(x + unit * 5, y + unit * 5, unit, unit);
  } else {
    // Humanoid / generic creature silhouette.
    const bone = /skeleton|undead/.test(id);
    const primary = bone ? '#c9c4ae' : body;
    ctx.fillStyle = dark;
    ctx.fillRect(x + unit, y + unit * 4, unit * 6, unit * 5);
    ctx.fillStyle = primary;
    ctx.fillRect(x + unit * 2, y + unit * 3, unit * 4, unit * 5);
    ctx.fillRect(x + unit * 2, y, unit * 4, unit * 4);
    ctx.fillStyle = bone ? '#2a2822' : light;
    ctx.fillRect(x + unit * 3, y + unit, unit, unit);
    ctx.fillRect(x + unit * 5, y + unit, unit, unit);
    ctx.fillStyle = '#211e1b';
    ctx.fillRect(x + unit, y + unit * 8, unit * 2, unit * 2);
    ctx.fillRect(x + unit * 5, y + unit * 8, unit * 2, unit * 2);
  }

  if (monster.type === 'boss') {
    ctx.fillStyle = '#e2b64f';
    ctx.fillRect(x + unit, y - unit * 2, unit, unit * 2);
    ctx.fillRect(x + unit * 3, y - unit * 3, unit * 2, unit * 3);
    ctx.fillRect(x + unit * 6, y - unit * 2, unit, unit * 2);
  }
  ctx.restore();
}
