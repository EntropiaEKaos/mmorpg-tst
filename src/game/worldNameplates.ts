import type { GameMap } from './maps';

export type WorldNameplateMode = 'nearby' | 'always' | 'hidden';

export interface WorldNameplateOptions {
  npcMode: WorldNameplateMode;
  npcDistance: number;
  monsterMode: WorldNameplateMode;
  monsterDistance: number;
  monsterBarDistance: number;
  monsterFontSize: number;
  monsterBarWidth: number;
  monsterBarHeight: number;
  monsterShowLevel: boolean;
  monsterShowValues: boolean;
  bossScale: number;
  bossAlwaysVisible: boolean;
  collisionPadding: number;
  fadeStart: number;
}

export interface WorldLabelRequest {
  kind: 'npc' | 'monster' | 'pet';
  x: number;
  y: number;
  size: number;
  distance: number;
  targeted?: boolean;
  entity: {
    name: string;
    role?: string;
    hp?: number;
    maxHp?: number;
    level?: number;
    type?: 'normal' | 'elite' | 'boss';
  };
}

const DEFAULTS: WorldNameplateOptions = Object.freeze({
  npcMode: 'nearby', npcDistance: 7,
  monsterMode: 'nearby', monsterDistance: 9, monsterBarDistance: 7,
  monsterFontSize: 8, monsterBarWidth: 30, monsterBarHeight: 3,
  monsterShowLevel: true, monsterShowValues: false,
  bossScale: 1.18, bossAlwaysVisible: true,
  collisionPadding: 3, fadeStart: .68,
});

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const mode = (value: unknown, fallback: WorldNameplateMode): WorldNameplateMode =>
  value === 'always' || value === 'hidden' || value === 'nearby' ? value : fallback;

export function resolveWorldNameplateOptions(map?: Partial<GameMap> | null): WorldNameplateOptions {
  return {
    npcMode: mode(map?.npcNameplateMode, DEFAULTS.npcMode),
    npcDistance: clamp(map?.npcNameplateDistance, 2, 20, DEFAULTS.npcDistance),
    monsterMode: mode(map?.monsterNameplateMode, DEFAULTS.monsterMode),
    monsterDistance: clamp(map?.monsterNameplateDistance, 2, 24, DEFAULTS.monsterDistance),
    monsterBarDistance: clamp(map?.monsterBarDistance, 1, 20, DEFAULTS.monsterBarDistance),
    monsterFontSize: clamp(map?.monsterNameplateFontSize, 7, 14, DEFAULTS.monsterFontSize),
    monsterBarWidth: clamp(map?.monsterNameplateBarWidth, 18, 72, DEFAULTS.monsterBarWidth),
    monsterBarHeight: clamp(map?.monsterNameplateBarHeight, 2, 8, DEFAULTS.monsterBarHeight),
    monsterShowLevel: typeof map?.monsterNameplateShowLevel === 'boolean' ? map.monsterNameplateShowLevel : DEFAULTS.monsterShowLevel,
    monsterShowValues: typeof map?.monsterNameplateShowValues === 'boolean' ? map.monsterNameplateShowValues : DEFAULTS.monsterShowValues,
    bossScale: clamp(map?.bossNameplateScale, .8, 1.8, DEFAULTS.bossScale),
    bossAlwaysVisible: typeof map?.bossNameplateAlwaysVisible === 'boolean' ? map.bossNameplateAlwaysVisible : DEFAULTS.bossAlwaysVisible,
    collisionPadding: clamp(map?.nameplateCollisionPadding, 0, 10, DEFAULTS.collisionPadding),
    fadeStart: clamp(map?.nameplateFadeStart, .2, .95, DEFAULTS.fadeStart),
  };
}

type Rect = { x: number; y: number; w: number; h: number };

function overlaps(a: Rect, b: Rect, padding: number) {
  return a.x < b.x + b.w + padding && a.x + a.w + padding > b.x && a.y < b.y + b.h + padding && a.y + a.h + padding > b.y;
}

function place(occupied: Rect[], centerX: number, preferredY: number, width: number, height: number, padding: number, mustPlace: boolean): Rect | null {
  const steps = [0, -7, -14, -21, -28, -35];
  for (const offset of steps) {
    const candidate = { x: Math.round(centerX - width / 2), y: Math.round(preferredY + offset), w: Math.ceil(width), h: Math.ceil(height) };
    if (!occupied.some((other) => overlaps(candidate, other, padding))) {
      occupied.push(candidate);
      return candidate;
    }
  }
  if (!mustPlace) return null;
  const forced = { x: Math.round(centerX - width / 2), y: Math.round(preferredY - 42), w: Math.ceil(width), h: Math.ceil(height) };
  occupied.push(forced);
  return forced;
}

function priority(request: WorldLabelRequest) {
  if (request.entity.type === 'boss') return 100;
  if (request.targeted) return 92;
  if (request.entity.type === 'elite') return 78;
  if (request.kind === 'npc' && request.entity.role === 'quest') return 68;
  if (request.kind === 'npc') return 58;
  if (request.kind === 'monster') return 40;
  return 18;
}

function visibilityAlpha(modeValue: WorldNameplateMode, distance: number, maxDistance: number, fadeStart: number, force = false) {
  if (force || modeValue === 'always') return 1;
  if (modeValue === 'hidden' || distance > maxDistance) return 0;
  const start = maxDistance * fadeStart;
  if (distance <= start) return 1;
  return Math.max(0, 1 - (distance - start) / Math.max(.001, maxDistance - start));
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, fontSize: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${Math.round(fontSize)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'rgba(0,0,0,.94)';
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMonsterPlate(ctx: CanvasRenderingContext2D, request: WorldLabelRequest, rect: Rect, options: WorldNameplateOptions, alpha: number) {
  const monster = request.entity;
  const boss = monster.type === 'boss';
  const elite = monster.type === 'elite';
  const scale = boss ? options.bossScale : elite ? 1.05 : 1;
  const font = options.monsterFontSize * scale;
  const name = options.monsterShowLevel && monster.level ? `${monster.name} [${monster.level}]` : monster.name;
  const showBar = request.distance <= options.monsterBarDistance || boss || request.targeted;
  const barW = options.monsterBarWidth * scale;
  const barH = options.monsterBarHeight * scale;
  const accent = boss ? '#f0c75e' : elite ? '#c785ff' : '#e96b62';
  const centerX = rect.x + rect.w / 2;
  const top = rect.y;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (boss) {
    ctx.fillStyle = 'rgba(17,12,7,.86)';
    ctx.fillRect(rect.x - 4, top - 3, rect.w + 8, rect.h + 6);
    ctx.strokeStyle = '#8d6a25';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x - 3.5, top - 2.5, rect.w + 7, rect.h + 5);
    ctx.fillStyle = '#f0c75e';
    ctx.font = `bold ${Math.max(6, Math.round(font * .72))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BOSS', centerX, top);
  }
  ctx.restore();

  const textY = top + (boss ? Math.ceil(font * .82) : 0);
  drawText(ctx, name, centerX, textY, accent, font, alpha);
  if (!showBar) return;

  const barY = textY + Math.ceil(font) + 2;
  const hp = Number(monster.hp) || 0;
  const maxHp = Math.max(1, Number(monster.maxHp) || 1);
  const pct = Math.max(0, Math.min(1, hp / maxHp));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10,8,7,.90)';
  ctx.fillRect(Math.round(centerX - barW / 2) - 1, Math.round(barY) - 1, Math.round(barW) + 2, Math.round(barH) + 2);
  ctx.fillStyle = '#321714';
  ctx.fillRect(Math.round(centerX - barW / 2), Math.round(barY), Math.round(barW), Math.max(1, Math.round(barH)));
  const hpColor = pct > .55 ? '#b84138' : pct > .25 ? '#cf6f32' : '#e24b4b';
  ctx.fillStyle = hpColor;
  ctx.fillRect(Math.round(centerX - barW / 2), Math.round(barY), Math.round(barW * pct), Math.max(1, Math.round(barH)));
  ctx.fillStyle = 'rgba(255,255,255,.24)';
  ctx.fillRect(Math.round(centerX - barW / 2) + 1, Math.round(barY), Math.max(0, Math.round(barW * pct) - 2), 1);
  ctx.restore();

  if (options.monsterShowValues) drawText(ctx, `${Math.max(0, Math.round(hp))}/${Math.round(maxHp)}`, centerX, barY + barH + 1, '#eadbd3', Math.max(6, font - 2), alpha * .9);
}

function drawNpcPlate(ctx: CanvasRenderingContext2D, request: WorldLabelRequest, rect: Rect, options: WorldNameplateOptions, alpha: number) {
  const role = String(request.entity.role || '').toLowerCase();
  const color = role === 'quest' ? '#f3d96b' : role === 'guard' ? '#b8d1e5' : '#9bd4ff';
  const centerX = rect.x + rect.w / 2;
  drawText(ctx, request.entity.name, centerX, rect.y, color, Math.max(7, options.monsterFontSize), alpha);
  if (role === 'quest') {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#f3d96b';
    ctx.fillRect(Math.round(centerX - 7), Math.round(rect.y - 3), 14, 1); ctx.restore();
  }
}

export function drawWorldNameplates(ctx: CanvasRenderingContext2D, requests: WorldLabelRequest[], map?: Partial<GameMap> | null) {
  const options = resolveWorldNameplateOptions(map);
  const occupied: Rect[] = [];
  const sorted = [...requests].sort((a, b) => priority(b) - priority(a) || a.distance - b.distance);

  for (const request of sorted) {
    const boss = request.entity.type === 'boss';
    const isNpc = request.kind === 'npc';
    const alpha = visibilityAlpha(
      isNpc ? options.npcMode : options.monsterMode,
      request.distance,
      isNpc ? options.npcDistance : options.monsterDistance,
      options.fadeStart,
      Boolean(request.targeted || (boss && options.bossAlwaysVisible)),
    );
    if (alpha <= .02 || request.kind === 'pet') continue;

    const scale = boss ? options.bossScale : 1;
    ctx.font = `bold ${Math.round(options.monsterFontSize * scale)}px monospace`;
    const label = request.entity.level && options.monsterShowLevel && !isNpc ? `${request.entity.name} [${request.entity.level}]` : request.entity.name;
    const width = Math.max(options.monsterBarWidth * scale, ctx.measureText(label).width + 8);
    const extra = isNpc ? 3 : options.monsterBarHeight * scale + (options.monsterShowValues ? 9 : 3) + (boss ? 8 : 0);
    const height = Math.ceil(options.monsterFontSize * scale + extra);
    const preferredY = request.y - Math.round(request.size * (boss ? .58 : .40)) - height;
    const mustPlace = boss || Boolean(request.targeted);
    const rect = place(occupied, request.x + request.size / 2, preferredY, width, height, options.collisionPadding, mustPlace);
    if (!rect) continue;
    if (isNpc) drawNpcPlate(ctx, request, rect, options, alpha);
    else drawMonsterPlate(ctx, request, rect, options, alpha);
  }
}


export function createWorldLabelQueue(playerPos: { x: number; y: number }, targetId?: string | null) {
  const requests: WorldLabelRequest[] = [];
  return {
    npc(n: any, x: number, y: number, size: number) {
      requests.push({ kind: 'npc', x, y, size, distance: Math.hypot(n.pos.x - playerPos.x, n.pos.y - playerPos.y), entity: { name: n.name, role: n.role } });
    },
    monster(m: any, mx: number, my: number, x: number, y: number, size: number) {
      requests.push({ kind: 'monster', x, y, size, distance: Math.hypot(mx - playerPos.x, my - playerPos.y), targeted: targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });
    },
    draw(ctx: CanvasRenderingContext2D, map?: Partial<GameMap> | null) { drawWorldNameplates(ctx, requests, map); },
  };
}
