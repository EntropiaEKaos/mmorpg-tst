from pathlib import Path
import re

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing marker: {label}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# World entity nameplate renderer: one dedicated overlay pass with distance fade,
# collision avoidance, priority, boss framing and independent NPC/monster policy.
# -----------------------------------------------------------------------------
write('src/game/worldNameplates.ts', r'''import type { GameMap } from './maps';

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
''')

# render.ts: sprites only; world labels are now a dedicated global layout pass.
render = read('src/game/render.ts')
render = re.sub(r"\n  // Name \+ level\n.*?\n  ctx\.fillRect\(hpX, hpY, hpBarW \* hpPct, hpBarH\);", "\n  // World labels are rendered in a dedicated overlay pass so nearby entities\n  // can resolve collisions and distance fading as one layout problem.", render, count=1, flags=re.S)
render = re.sub(r"\n  ctx\.font = 'bold 9px monospace';\n  ctx\.textAlign = 'center';\n  ctx\.textBaseline = 'alphabetic';\n  ctx\.strokeStyle = 'rgba\(0,0,0,0\.9\)';\n  ctx\.lineWidth = 2\.5;\n  ctx\.strokeText\(npc\.name, cx, y - Math\.round\(size \* 0\.34\)\);\n  ctx\.fillStyle = '#9bd4ff';\n  ctx\.fillText\(npc\.name, cx, y - Math\.round\(size \* 0\.34\)\);", "\n  // NPC labels are also deferred to the shared world-nameplate pass.", render, count=1)
write('src/game/render.ts', render)

# maps.ts: editable world-label policy survives server sync and local designer drafts.
maps = read('src/game/maps.ts')
maps = replace_once(maps, "  residentialRingDensity?: number;\n", "  residentialRingDensity?: number;\n  npcNameplateMode?: 'nearby' | 'always' | 'hidden';\n  npcNameplateDistance?: number;\n  monsterNameplateMode?: 'nearby' | 'always' | 'hidden';\n  monsterNameplateDistance?: number;\n  monsterBarDistance?: number;\n  monsterNameplateFontSize?: number;\n  monsterNameplateBarWidth?: number;\n  monsterNameplateBarHeight?: number;\n  monsterNameplateShowLevel?: boolean;\n  monsterNameplateShowValues?: boolean;\n  bossNameplateScale?: number;\n  bossNameplateAlwaysVisible?: boolean;\n  nameplateCollisionPadding?: number;\n  nameplateFadeStart?: number;\n", 'map interface')
maps = replace_once(maps, "      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n", "      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n      npcNameplateMode: ['nearby','always','hidden'].includes(String(raw.npcNameplateMode)) ? raw.npcNameplateMode : (base?.npcNameplateMode ?? 'nearby'),\n      npcNameplateDistance: Number.isFinite(Number(raw.npcNameplateDistance)) ? Math.max(2, Math.min(20, Number(raw.npcNameplateDistance))) : base?.npcNameplateDistance,\n      monsterNameplateMode: ['nearby','always','hidden'].includes(String(raw.monsterNameplateMode)) ? raw.monsterNameplateMode : (base?.monsterNameplateMode ?? 'nearby'),\n      monsterNameplateDistance: Number.isFinite(Number(raw.monsterNameplateDistance)) ? Math.max(2, Math.min(24, Number(raw.monsterNameplateDistance))) : base?.monsterNameplateDistance,\n      monsterBarDistance: Number.isFinite(Number(raw.monsterBarDistance)) ? Math.max(1, Math.min(20, Number(raw.monsterBarDistance))) : base?.monsterBarDistance,\n      monsterNameplateFontSize: Number.isFinite(Number(raw.monsterNameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.monsterNameplateFontSize))) : base?.monsterNameplateFontSize,\n      monsterNameplateBarWidth: Number.isFinite(Number(raw.monsterNameplateBarWidth)) ? Math.max(18, Math.min(72, Number(raw.monsterNameplateBarWidth))) : base?.monsterNameplateBarWidth,\n      monsterNameplateBarHeight: Number.isFinite(Number(raw.monsterNameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.monsterNameplateBarHeight))) : base?.monsterNameplateBarHeight,\n      monsterNameplateShowLevel: typeof raw.monsterNameplateShowLevel === 'boolean' ? raw.monsterNameplateShowLevel : base?.monsterNameplateShowLevel,\n      monsterNameplateShowValues: typeof raw.monsterNameplateShowValues === 'boolean' ? raw.monsterNameplateShowValues : base?.monsterNameplateShowValues,\n      bossNameplateScale: Number.isFinite(Number(raw.bossNameplateScale)) ? Math.max(.8, Math.min(1.8, Number(raw.bossNameplateScale))) : base?.bossNameplateScale,\n      bossNameplateAlwaysVisible: typeof raw.bossNameplateAlwaysVisible === 'boolean' ? raw.bossNameplateAlwaysVisible : base?.bossNameplateAlwaysVisible,\n      nameplateCollisionPadding: Number.isFinite(Number(raw.nameplateCollisionPadding)) ? Math.max(0, Math.min(10, Number(raw.nameplateCollisionPadding))) : base?.nameplateCollisionPadding,\n      nameplateFadeStart: Number.isFinite(Number(raw.nameplateFadeStart)) ? Math.max(.2, Math.min(.95, Number(raw.nameplateFadeStart))) : base?.nameplateFadeStart,\n", 'map sync presentation')
write('src/game/maps.ts', maps)

# authoritative world: normalize, expose and round-trip the same presentation policy.
world = read('server/engine/World.mjs')
world = replace_once(world, "    residentialRingDensity: integer(record?.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n", "    residentialRingDensity: integer(record?.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n    npcNameplateMode: ['nearby','always','hidden'].includes(String(record?.npcNameplateMode)) ? String(record.npcNameplateMode) : (base?.npcNameplateMode ?? 'nearby'),\n    npcNameplateDistance: boundedNumber(record?.npcNameplateDistance, 2, 20, base?.npcNameplateDistance ?? 7),\n    monsterNameplateMode: ['nearby','always','hidden'].includes(String(record?.monsterNameplateMode)) ? String(record.monsterNameplateMode) : (base?.monsterNameplateMode ?? 'nearby'),\n    monsterNameplateDistance: boundedNumber(record?.monsterNameplateDistance, 2, 24, base?.monsterNameplateDistance ?? 9),\n    monsterBarDistance: boundedNumber(record?.monsterBarDistance, 1, 20, base?.monsterBarDistance ?? 7),\n    monsterNameplateFontSize: boundedNumber(record?.monsterNameplateFontSize, 7, 14, base?.monsterNameplateFontSize ?? 8),\n    monsterNameplateBarWidth: boundedNumber(record?.monsterNameplateBarWidth, 18, 72, base?.monsterNameplateBarWidth ?? 30),\n    monsterNameplateBarHeight: boundedNumber(record?.monsterNameplateBarHeight, 2, 8, base?.monsterNameplateBarHeight ?? 3),\n    monsterNameplateShowLevel: typeof record?.monsterNameplateShowLevel === 'boolean' ? record.monsterNameplateShowLevel : (base?.monsterNameplateShowLevel ?? true),\n    monsterNameplateShowValues: typeof record?.monsterNameplateShowValues === 'boolean' ? record.monsterNameplateShowValues : (base?.monsterNameplateShowValues ?? false),\n    bossNameplateScale: boundedNumber(record?.bossNameplateScale, .8, 1.8, base?.bossNameplateScale ?? 1.18),\n    bossNameplateAlwaysVisible: typeof record?.bossNameplateAlwaysVisible === 'boolean' ? record.bossNameplateAlwaysVisible : (base?.bossNameplateAlwaysVisible ?? true),\n    nameplateCollisionPadding: boundedNumber(record?.nameplateCollisionPadding, 0, 10, base?.nameplateCollisionPadding ?? 3),\n    nameplateFadeStart: boundedNumber(record?.nameplateFadeStart, .2, .95, base?.nameplateFadeStart ?? .68),\n", 'server normalization')
world = replace_once(world, "      residentialRingEnabled: config.residentialRingEnabled, residentialRingDensity: config.residentialRingDensity,\n", "      residentialRingEnabled: config.residentialRingEnabled, residentialRingDensity: config.residentialRingDensity,\n      npcNameplateMode: config.npcNameplateMode, npcNameplateDistance: config.npcNameplateDistance,\n      monsterNameplateMode: config.monsterNameplateMode, monsterNameplateDistance: config.monsterNameplateDistance, monsterBarDistance: config.monsterBarDistance,\n      monsterNameplateFontSize: config.monsterNameplateFontSize, monsterNameplateBarWidth: config.monsterNameplateBarWidth, monsterNameplateBarHeight: config.monsterNameplateBarHeight,\n      monsterNameplateShowLevel: config.monsterNameplateShowLevel, monsterNameplateShowValues: config.monsterNameplateShowValues,\n      bossNameplateScale: config.bossNameplateScale, bossNameplateAlwaysVisible: config.bossNameplateAlwaysVisible,\n      nameplateCollisionPadding: config.nameplateCollisionPadding, nameplateFadeStart: config.nameplateFadeStart,\n", 'server definitions')
write('server/engine/World.mjs', world)

# Content Studio: expose bounded policy controls; generic admin UI gets correct booleans/json.
studio = read('server/engine/ContentStudio.mjs')
studio = replace_once(studio, "const CITY_PROP_KINDS = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);\n", "const CITY_PROP_KINDS = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);\nconst NAMEPLATE_MODES = Object.freeze(['nearby','always','hidden']);\n", 'studio modes')
studio = replace_once(studio, "    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('residentialRingEnabled', 'Decorative residential ring', 'boolean'), field('residentialRingDensity', 'Residential density', 'number'),\n", "    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('residentialRingEnabled', 'Decorative residential ring', 'boolean'), field('residentialRingDensity', 'Residential density', 'number'),\n    field('npcNameplateMode', 'NPC labels', 'select', { optionKey: 'nameplateModes' }), field('npcNameplateDistance', 'NPC label distance', 'number'),\n    field('monsterNameplateMode', 'Monster labels', 'select', { optionKey: 'nameplateModes' }), field('monsterNameplateDistance', 'Monster label distance', 'number'), field('monsterBarDistance', 'Monster HP bar distance', 'number'),\n    field('monsterNameplateFontSize', 'Monster name font', 'number'), field('monsterNameplateBarWidth', 'Monster HP width', 'number'), field('monsterNameplateBarHeight', 'Monster HP height', 'number'),\n    field('monsterNameplateShowLevel', 'Show monster level', 'boolean'), field('monsterNameplateShowValues', 'Show monster HP values', 'boolean'),\n    field('bossNameplateScale', 'Boss plate scale', 'number'), field('bossNameplateAlwaysVisible', 'Boss labels always visible', 'boolean'),\n    field('nameplateCollisionPadding', 'Label collision padding', 'number'), field('nameplateFadeStart', 'Label fade start ratio', 'number'),\n", 'studio map fields')
studio = replace_once(studio, "    for (const [key,min,max] of [['nameplateOffsetY',-32,12],['nameplateScale',0.55,1.5],['nameplateBarWidth',18,64],['nameplateBarHeight',2,8],['nameplateFontSize',7,14],['residentialRingDensity',0,10]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }\n", "    for (const [key,min,max] of [['nameplateOffsetY',-32,12],['nameplateScale',0.55,1.5],['nameplateBarWidth',18,64],['nameplateBarHeight',2,8],['nameplateFontSize',7,14],['residentialRingDensity',0,10],['npcNameplateDistance',2,20],['monsterNameplateDistance',2,24],['monsterBarDistance',1,20],['monsterNameplateFontSize',7,14],['monsterNameplateBarWidth',18,72],['monsterNameplateBarHeight',2,8],['bossNameplateScale',0.8,1.8],['nameplateCollisionPadding',0,10],['nameplateFadeStart',0.2,0.95]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }\n    if (record.npcNameplateMode !== undefined && !NAMEPLATE_MODES.includes(String(record.npcNameplateMode))) return 'npcNameplateMode is not supported';\n    if (record.monsterNameplateMode !== undefined && !NAMEPLATE_MODES.includes(String(record.monsterNameplateMode))) return 'monsterNameplateMode is not supported';\n", 'studio numeric validation')
studio = replace_once(studio, "    if (record.residentialRingEnabled !== undefined && typeof record.residentialRingEnabled !== 'boolean') return 'residentialRingEnabled must be boolean';\n", "    if (record.residentialRingEnabled !== undefined && typeof record.residentialRingEnabled !== 'boolean') return 'residentialRingEnabled must be boolean';\n    for (const key of ['monsterNameplateShowLevel','monsterNameplateShowValues','bossNameplateAlwaysVisible']) if (record[key] !== undefined && typeof record[key] !== 'boolean') return `${key} must be boolean`;\n", 'studio boolean validation')
studio = replace_once(studio, "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], eventTypes: [...EVENT_TYPES],\n", "    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], cityStyles: [...CITY_STYLES], eventTypes: [...EVENT_TYPES], nameplateModes: [...NAMEPLATE_MODES],\n", 'studio options')
write('server/engine/ContentStudio.mjs', studio)

# Admin form correctness: booleans and every schema JSON field become truly editable.
admin = read('server/adminPanel.mjs')
admin = replace_once(admin, "  let renderedItems = [];\n", "  let renderedItems = [];\n  let renderedSchema = [];\n", 'admin schema state')
admin = replace_once(admin, "    const schemaByField = new Map(schema.map(entry => [entry.id, entry]));\n", "    const schemaByField = new Map(schema.map(entry => [entry.id, entry]));\n    renderedSchema = schema;\n", 'admin schema capture')
admin = replace_once(admin, "        } else if (meta.kind === 'textarea') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';\n        } else {\n", "        } else if (meta.kind === 'textarea') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';\n        } else if (meta.kind === 'boolean') {\n          html += '<input id=\"fld_' + f + '\" type=\"checkbox\" ' + (item[f] === true ? 'checked' : '') + ' style=\"width:auto;transform:scale(1.2);margin:.55rem\">';\n        } else {\n", 'admin boolean renderer')
old_save = """      if (el) {\n        let v = el.value;\n        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);\n        if (f === 'portals' || f === 'requires') {\n          try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }\n          if (!Array.isArray(body[f])) { alert(f + ' must be a JSON array.'); return; }\n          continue;\n        }\n        if (numericFields.has(f)) v = parseFloat(v) || 0;\n        body[f] = v;\n      }\n"""
new_save = """      if (el) {\n        const meta = renderedSchema.find(entry => entry.id === f) || { kind: 'text' };\n        if (meta.kind === 'boolean') { body[f] = Boolean(el.checked); continue; }\n        let v = el.value;\n        if (meta.kind === 'json') {\n          try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }\n          continue;\n        }\n        if (meta.kind === 'number') v = v === '' ? 0 : Number(v);\n        body[f] = v;\n      }\n"""
admin = replace_once(admin, old_save, new_save, 'admin generic save')
write('server/adminPanel.mjs', admin)

# GameScreen: collect labels while drawing sprites, then resolve them after world depth/atmosphere.
game = read('src/components/GameScreen.tsx')
game = replace_once(game, "import { drawHousing } from '../game/housingPresentation';\n", "import { drawHousing } from '../game/housingPresentation';\nimport { drawWorldNameplates, type WorldLabelRequest } from '../game/worldNameplates';\n", 'game import')
game = replace_once(game, "    // NPCs\n    for (const n of npcsRef.current) {\n", "    const worldLabelRequests: WorldLabelRequest[] = [];\n\n    // NPCs\n    for (const n of npcsRef.current) {\n", 'label queue')
game = replace_once(game, "      drawNPC(ctx, sx, sy, TILE_SIZE, n, now);\n", "      drawNPC(ctx, sx, sy, TILE_SIZE, n, now);\n      worldLabelRequests.push({ kind: 'npc', x: sx, y: sy, size: TILE_SIZE, distance: Math.hypot(n.pos.x - p.pos.x, n.pos.y - p.pos.y), entity: { name: n.name, role: n.role } });\n", 'npc queue')
game = replace_once(game, "      drawMonster(ctx, sx, sy, TILE_SIZE, {\n        name: m.name, hp: m.hp, maxHp: m.maxHp,\n        color: m.color, emoji: m.emoji, msSize: m.size,\n        level: m.level, type: m.type,\n      }, now);\n", "      drawMonster(ctx, sx, sy, TILE_SIZE, {\n        name: m.name, hp: m.hp, maxHp: m.maxHp,\n        color: m.color, emoji: m.emoji, msSize: m.size,\n        level: m.level, type: m.type,\n      }, now);\n      worldLabelRequests.push({ kind: 'monster', x: sx, y: sy, size: TILE_SIZE, distance: Math.hypot(mx - p.pos.x, my - p.pos.y), targeted: p.targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });\n", 'monster queue')
game = replace_once(game, "    drawWorldAtmosphere(\n      ctx,\n      canvas,\n      MAPS[currentMapIdRef.current]?.biome || 'plains',\n      nightAlpha,\n      p.pos,\n      cam,\n      TILE_SIZE,\n      now,\n    );\n\n    ctx.restore();\n", "    drawWorldAtmosphere(\n      ctx,\n      canvas,\n      MAPS[currentMapIdRef.current]?.biome || 'plains',\n      nightAlpha,\n      p.pos,\n      cam,\n      TILE_SIZE,\n      now,\n    );\n\n    // Nameplates are UI-over-world: draw after depth and atmosphere so labels remain\n    // readable, then globally resolve priority/collisions instead of overlapping blindly.\n    drawWorldNameplates(ctx, worldLabelRequests, MAPS[currentMapIdRef.current] || MAPS.eldoria);\n\n    ctx.restore();\n", 'label render pass')
write('src/components/GameScreen.tsx', game)

# Replace CityDesigner with direct manipulation: select, drag, footprint resize, house type,
# direct-click placement and a live world-label policy inspector.
write('src/components/CityDesigner.tsx', r'''import { useMemo, useRef, useState } from 'react';
import { MAPS, MAP_WIDTH, MAP_HEIGHT, syncServerMaps, type GameMap } from '../game/maps';
import {
  CITY_STYLES, CITY_STYLE_LABELS, CITY_PALETTES,
  type CityStyle, type CityLandmark, type CityDistrict, type CityProp,
} from '../game/cityIdentity';

interface Props { onApplied?: () => void; }
type Tool = 'select' | 'landmark' | 'district' | 'prop';
type Selection = { type: 'landmark' | 'district' | 'prop'; id: string } | null;
const LANDMARK_KINDS: CityLandmark['kind'][] = ['house','keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower'];
const PROP_KINDS: CityProp['kind'][] = ['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune'];

function cloneMap(map: GameMap): GameMap { return JSON.parse(JSON.stringify(map)); }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'entry'; }
function clamp(value: number, min = 1, max = 78) { return Math.max(min, Math.min(max, Math.round(value))); }
function iconFor(kind: CityLandmark['kind']) { return kind === 'house' ? '⌂' : kind === 'temple' ? '✦' : kind === 'forge' ? '⚒' : kind === 'dock' ? '⚓' : kind === 'graveyard' ? '☠' : '◆'; }

export default function CityDesigner({ onApplied }: Props) {
  const ids = Object.keys(MAPS);
  const [mapId, setMapId] = useState(ids[0] || 'eldoria');
  const [draft, setDraft] = useState<GameMap>(() => cloneMap(MAPS[ids[0] || 'eldoria']));
  const [tool, setTool] = useState<Tool>('select');
  const [selection, setSelection] = useState<Selection>(null);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState({ x: draft.townCenter.x, y: draft.townCenter.y });
  const [landmarkName, setLandmarkName] = useState('New House');
  const [landmarkKind, setLandmarkKind] = useState<CityLandmark['kind']>('house');
  const [propKind, setPropKind] = useState<CityProp['kind']>('banner');
  const [districtName, setDistrictName] = useState('New District');
  const previewRef = useRef<HTMLDivElement>(null);
  const palette = CITY_PALETTES[draft.cityStyle];

  const chooseMap = (id: string) => {
    setMapId(id); const next = cloneMap(MAPS[id]); setDraft(next); setCursor({ ...next.townCenter }); setSelection(null);
  };
  const updateStyle = (style: CityStyle) => {
    const p = CITY_PALETTES[style];
    setDraft((current) => ({ ...current, cityStyle: style, cityAccent: p.accent, roofColor: p.roof, wallColor: p.wall, roadColor: p.road }));
  };
  const point = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return cursor;
    return { x: clamp(((clientX - rect.left) / rect.width) * MAP_WIDTH), y: clamp(((clientY - rect.top) / rect.height) * MAP_HEIGHT) };
  };
  const moveSelection = (next: { x: number; y: number }) => {
    if (!selection) return;
    setDraft((current) => {
      if (selection.type === 'landmark') return { ...current, landmarks: current.landmarks.map((entry) => entry.id === selection.id ? { ...entry, x: clamp(next.x, 1, MAP_WIDTH - entry.w - 1), y: clamp(next.y, 1, MAP_HEIGHT - entry.h - 1) } : entry) };
      if (selection.type === 'district') return { ...current, districts: current.districts.map((entry) => entry.id === selection.id ? { ...entry, x: next.x, y: next.y } : entry) };
      return { ...current, props: current.props.map((entry) => entry.id === selection.id ? { ...entry, x: next.x, y: next.y } : entry) };
    });
  };
  const addAt = (at: { x: number; y: number }) => {
    const stamp = Date.now();
    if (tool === 'landmark') {
      const w = landmarkKind === 'keep' ? 6 : landmarkKind === 'house' ? 3 : 4;
      const h = landmarkKind === 'keep' ? 5 : landmarkKind === 'house' ? 3 : 4;
      const entry: CityLandmark = { id: `${draft.id}_${slug(landmarkName)}_${stamp}`, name: landmarkName.trim().slice(0, 60) || 'Landmark', kind: landmarkKind, icon: iconFor(landmarkKind), x: clamp(at.x, 1, MAP_WIDTH - w - 1), y: clamp(at.y, 1, MAP_HEIGHT - h - 1), w, h };
      setDraft((current) => ({ ...current, landmarks: [...current.landmarks, entry].slice(-12) })); setSelection({ type: 'landmark', id: entry.id }); setTool('select');
    } else if (tool === 'district') {
      const entry: CityDistrict = { id: `${draft.id}_${slug(districtName)}_${stamp}`, name: districtName.trim().slice(0, 60) || 'District', icon: '◇', x: at.x, y: at.y, radius: 4, color: draft.cityAccent };
      setDraft((current) => ({ ...current, districts: [...current.districts, entry].slice(-8) })); setSelection({ type: 'district', id: entry.id }); setTool('select');
    } else if (tool === 'prop') {
      const entry: CityProp = { id: `${draft.id}_${propKind}_${stamp}`, kind: propKind, x: at.x, y: at.y, color: draft.cityAccent };
      setDraft((current) => ({ ...current, props: [...current.props, entry].slice(-80) })); setSelection({ type: 'prop', id: entry.id }); setTool('select');
    }
  };
  const previewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const next = point(event.clientX, event.clientY); setCursor(next);
    if (tool !== 'select') addAt(next); else setSelection(null);
  };
  const beginDrag = (event: React.PointerEvent, next: Selection) => {
    event.stopPropagation(); setSelection(next); setDragging(true); (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };
  const dragMove = (event: React.PointerEvent) => { if (!dragging || !selection) return; event.stopPropagation(); const next = point(event.clientX, event.clientY); setCursor(next); moveSelection(next); };
  const endDrag = (event: React.PointerEvent) => { if (!dragging) return; event.stopPropagation(); setDragging(false); };

  const updateLandmark = (patch: Partial<CityLandmark>) => setDraft((current) => ({ ...current, landmarks: current.landmarks.map((entry) => selection?.type === 'landmark' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const updateDistrict = (patch: Partial<CityDistrict>) => setDraft((current) => ({ ...current, districts: current.districts.map((entry) => selection?.type === 'district' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const updateProp = (patch: Partial<CityProp>) => setDraft((current) => ({ ...current, props: current.props.map((entry) => selection?.type === 'prop' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const removeSelected = () => {
    if (!selection) return;
    setDraft((current) => selection.type === 'landmark' ? { ...current, landmarks: current.landmarks.filter((x) => x.id !== selection.id) } : selection.type === 'district' ? { ...current, districts: current.districts.filter((x) => x.id !== selection.id) } : { ...current, props: current.props.filter((x) => x.id !== selection.id) });
    setSelection(null);
  };
  const duplicateSelected = () => {
    if (!selection) return; const stamp = Date.now();
    setDraft((current) => {
      if (selection.type === 'landmark') { const source = current.landmarks.find((x) => x.id === selection.id); if (!source || current.landmarks.length >= 12) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, name: `${source.name} Copy`, x: clamp(source.x + 1), y: clamp(source.y + 1) }; setSelection({ type: 'landmark', id: copy.id }); return { ...current, landmarks: [...current.landmarks, copy] }; }
      if (selection.type === 'district') { const source = current.districts.find((x) => x.id === selection.id); if (!source || current.districts.length >= 8) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, name: `${source.name} Copy`, x: clamp(source.x + 1), y: clamp(source.y + 1) }; setSelection({ type: 'district', id: copy.id }); return { ...current, districts: [...current.districts, copy] }; }
      const source = current.props.find((x) => x.id === selection.id); if (!source || current.props.length >= 80) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, x: clamp(source.x + 1), y: clamp(source.y + 1) }; setSelection({ type: 'prop', id: copy.id }); return { ...current, props: [...current.props, copy] };
    });
  };

  const selectedLandmark = selection?.type === 'landmark' ? draft.landmarks.find((x) => x.id === selection.id) : undefined;
  const selectedDistrict = selection?.type === 'district' ? draft.districts.find((x) => x.id === selection.id) : undefined;
  const selectedProp = selection?.type === 'prop' ? draft.props.find((x) => x.id === selection.id) : undefined;
  const occupancy = useMemo(() => draft.landmarks.reduce((sum, x) => sum + x.w * x.h, 0), [draft.landmarks]);

  const apply = () => {
    const records = Object.values(MAPS).map((map) => map.id === draft.id ? cloneMap(draft) : cloneMap(map));
    syncServerMaps(records); try { localStorage.setItem('moria_city_designer_maps', JSON.stringify(records)); } catch {} setDraft(cloneMap(MAPS[draft.id])); onApplied?.();
  };
  const reset = () => { try { localStorage.removeItem('moria_city_designer_maps'); } catch {} location.reload(); };

  return <div className="grid gap-3 xl:grid-cols-[330px_minmax(420px,1fr)_350px]">
    <section className="space-y-3 rounded border border-cyan-400/25 bg-black/40 p-3">
      <div><div className="text-[10px] font-black tracking-[.22em] text-cyan-200">CITY DESIGNER · DIRECT MANIPULATION</div><div className="mt-1 text-[10px] text-purple-100/55">Place, select, drag and resize real authoritative building footprints.</div></div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">Map<select value={mapId} onChange={(e) => chooseMap(e.target.value)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{ids.map((id) => <option key={id} value={id}>{MAPS[id].name}</option>)}</select></label>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">City style<select value={draft.cityStyle} onChange={(e) => updateStyle(e.target.value as CityStyle)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{CITY_STYLES.map((style) => <option key={style} value={style}>{CITY_STYLE_LABELS[style]}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2"><ColorField label="Accent" value={draft.cityAccent} onChange={(cityAccent) => setDraft({ ...draft, cityAccent })} /><ColorField label="Roof" value={draft.roofColor} onChange={(roofColor) => setDraft({ ...draft, roofColor })} /><ColorField label="Walls" value={draft.wallColor} onChange={(wallColor) => setDraft({ ...draft, wallColor })} /><ColorField label="Road" value={draft.roadColor} onChange={(roadColor) => setDraft({ ...draft, roadColor })} /></div>
      <div className="rounded border border-purple-400/20 bg-purple-950/20 p-2"><div className="mb-2 text-[9px] font-black tracking-wider text-purple-200">WORLD LABEL POLICY</div><div className="grid grid-cols-2 gap-2"><SelectMini label="NPC labels" value={draft.npcNameplateMode || 'nearby'} options={['nearby','always','hidden']} onChange={(npcNameplateMode) => setDraft({ ...draft, npcNameplateMode: npcNameplateMode as GameMap['npcNameplateMode'] })} /><NumberField label="NPC distance" value={draft.npcNameplateDistance ?? 7} min={2} max={20} onChange={(npcNameplateDistance) => setDraft({ ...draft, npcNameplateDistance })} /><SelectMini label="Monster labels" value={draft.monsterNameplateMode || 'nearby'} options={['nearby','always','hidden']} onChange={(monsterNameplateMode) => setDraft({ ...draft, monsterNameplateMode: monsterNameplateMode as GameMap['monsterNameplateMode'] })} /><NumberField label="Monster distance" value={draft.monsterNameplateDistance ?? 9} min={2} max={24} onChange={(monsterNameplateDistance) => setDraft({ ...draft, monsterNameplateDistance })} /><NumberField label="HP bar distance" value={draft.monsterBarDistance ?? 7} min={1} max={20} onChange={(monsterBarDistance) => setDraft({ ...draft, monsterBarDistance })} /><NumberField label="Font" value={draft.monsterNameplateFontSize ?? 8} min={7} max={14} onChange={(monsterNameplateFontSize) => setDraft({ ...draft, monsterNameplateFontSize })} /><NumberField label="Bar width" value={draft.monsterNameplateBarWidth ?? 30} min={18} max={72} onChange={(monsterNameplateBarWidth) => setDraft({ ...draft, monsterNameplateBarWidth })} /><NumberField label="Boss scale ×10" value={Math.round((draft.bossNameplateScale ?? 1.18) * 10)} min={8} max={18} onChange={(v) => setDraft({ ...draft, bossNameplateScale: v / 10 })} /></div><div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-purple-100/70"><Check label="Monster level" checked={draft.monsterNameplateShowLevel ?? true} onChange={(monsterNameplateShowLevel) => setDraft({ ...draft, monsterNameplateShowLevel })} /><Check label="HP values" checked={draft.monsterNameplateShowValues ?? false} onChange={(monsterNameplateShowValues) => setDraft({ ...draft, monsterNameplateShowValues })} /><Check label="Boss always" checked={draft.bossNameplateAlwaysVisible ?? true} onChange={(bossNameplateAlwaysVisible) => setDraft({ ...draft, bossNameplateAlwaysVisible })} /></div></div>
      <div className="grid grid-cols-2 gap-2"><button onClick={apply} className="rounded border border-emerald-300/45 bg-emerald-800/45 px-3 py-2 text-[10px] font-black text-emerald-100">APPLY TO WORLD</button><button onClick={reset} className="rounded border border-red-300/30 bg-red-950/35 px-3 py-2 text-[10px] font-black text-red-200">RESET LOCAL</button></div>
    </section>

    <section className="rounded border border-amber-300/20 bg-[#080705] p-3">
      <div className="mb-2 flex items-center justify-between gap-3"><div><div className="font-black text-amber-100">{draft.name}</div><div className="text-[9px] text-amber-100/45">{tool === 'select' ? 'Select and drag footprints directly' : `Click map to place ${tool}`} · {cursor.x},{cursor.y}</div></div><div className="text-right text-[9px] text-amber-100/50"><div>{draft.landmarks.length}/12 buildings</div><div>{occupancy} blocked tiles</div></div></div>
      <div ref={previewRef} onPointerDown={previewPointerDown} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag} className="relative mx-auto aspect-square w-full max-w-[620px] touch-none cursor-crosshair overflow-hidden border-2 border-[#665332] shadow-[inset_0_0_35px_rgba(0,0,0,.75)]" style={{ background: palette.district, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: `${100 / MAP_WIDTH}% ${100 / MAP_HEIGHT}%` }}>
        <div className="absolute left-0 right-0 h-[7%] pointer-events-none" style={{ top: `${draft.townCenter.y / MAP_HEIGHT * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} /><div className="absolute bottom-0 top-0 w-[7%] pointer-events-none" style={{ left: `${draft.townCenter.x / MAP_WIDTH * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} />
        {draft.districts.map((d) => <div key={d.id} onPointerDown={(e) => beginDrag(e, { type: 'district', id: d.id })} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${selection?.id === d.id ? 'ring-2 ring-white' : ''}`} title={`${d.name} · drag to move`} style={{ left: `${d.x / MAP_WIDTH * 100}%`, top: `${d.y / MAP_HEIGHT * 100}%`, width: Math.max(18, d.radius * 8), height: Math.max(18, d.radius * 8), borderColor: d.color, background: `${d.color}22` }}><span className="absolute inset-0 flex items-center justify-center text-[9px]" style={{ color: d.color }}>{d.icon}</span></div>)}
        {draft.landmarks.map((l) => <div key={l.id} onPointerDown={(e) => beginDrag(e, { type: 'landmark', id: l.id })} className={`absolute overflow-hidden border bg-black/70 ${selection?.id === l.id ? 'ring-2 ring-white z-20' : 'z-10'}`} title={`${l.name} · ${l.w}×${l.h} · drag to move`} style={{ left: `${l.x / MAP_WIDTH * 100}%`, top: `${l.y / MAP_HEIGHT * 100}%`, width: `${l.w / MAP_WIDTH * 100}%`, height: `${l.h / MAP_HEIGHT * 100}%`, minWidth: 14, minHeight: 14, borderColor: `${draft.cityAccent}cc` }}><div className="h-[38%] border-b border-black/60" style={{ background: draft.roofColor }} /><div className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color: draft.cityAccent }}>{l.icon}</div></div>)}
        {draft.props.map((p) => <div key={p.id} onPointerDown={(e) => beginDrag(e, { type: 'prop', id: p.id })} className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-black ${selection?.id === p.id ? 'ring-2 ring-white z-30' : 'z-20'}`} style={{ left: `${p.x / MAP_WIDTH * 100}%`, top: `${p.y / MAP_HEIGHT * 100}%`, background: p.color || draft.cityAccent }} title={`${p.kind} · drag to move`} />)}
        <div className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-white/80 bg-cyan-400/50" style={{ left: `${cursor.x / MAP_WIDTH * 100}%`, top: `${cursor.y / MAP_HEIGHT * 100}%` }} />
      </div>
    </section>

    <section className="space-y-3 rounded border border-purple-400/25 bg-black/40 p-3">
      <div className="grid grid-cols-4 gap-1">{(['select','landmark','district','prop'] as Tool[]).map((entry) => <button key={entry} onClick={() => setTool(entry)} className={`rounded px-1 py-2 text-[8px] font-black uppercase ${tool === entry ? 'bg-purple-600 text-white' : 'bg-purple-950/50 text-purple-300'}`}>{entry === 'landmark' ? 'BUILD' : entry}</button>)}</div>
      {tool === 'landmark' && <><TextField label="Building name" value={landmarkName} onChange={setLandmarkName} /><SelectMini label="Building kind" value={landmarkKind} options={LANDMARK_KINDS} onChange={(v) => setLandmarkKind(v as CityLandmark['kind'])} /><div className="text-[9px] text-cyan-100/60">Click the map: houses default to 3×3 and can be resized after placement.</div></>}
      {tool === 'district' && <TextField label="District name" value={districtName} onChange={setDistrictName} />}
      {tool === 'prop' && <SelectMini label="Prop preset" value={propKind} options={PROP_KINDS} onChange={(v) => setPropKind(v as CityProp['kind'])} />}
      {selectedLandmark && <div className="space-y-2 rounded border border-amber-300/25 bg-amber-950/15 p-2"><div className="text-[9px] font-black text-amber-200">SELECTED BUILDING</div><TextField label="Name" value={selectedLandmark.name} onChange={(name) => updateLandmark({ name })} /><SelectMini label="Kind" value={selectedLandmark.kind} options={LANDMARK_KINDS} onChange={(kind) => updateLandmark({ kind: kind as CityLandmark['kind'], icon: iconFor(kind as CityLandmark['kind']) })} /><div className="grid grid-cols-4 gap-1"><NumberField label="X" value={selectedLandmark.x} onChange={(x) => updateLandmark({ x })} /><NumberField label="Y" value={selectedLandmark.y} onChange={(y) => updateLandmark({ y })} /><NumberField label="W" value={selectedLandmark.w} min={1} max={10} onChange={(w) => updateLandmark({ w, x: clamp(selectedLandmark.x, 1, MAP_WIDTH - w - 1) })} /><NumberField label="H" value={selectedLandmark.h} min={1} max={10} onChange={(h) => updateLandmark({ h, y: clamp(selectedLandmark.y, 1, MAP_HEIGHT - h - 1) })} /></div><div className="grid grid-cols-2 gap-1"><button onClick={duplicateSelected} className="rounded bg-cyan-900/45 px-2 py-1.5 text-[9px] font-bold text-cyan-100">DUPLICATE</button><button onClick={removeSelected} className="rounded bg-red-950/55 px-2 py-1.5 text-[9px] font-bold text-red-200">DELETE</button></div></div>}
      {selectedDistrict && <div className="space-y-2 rounded border border-cyan-300/20 p-2"><div className="text-[9px] font-black text-cyan-100">SELECTED DISTRICT</div><TextField label="Name" value={selectedDistrict.name} onChange={(name) => updateDistrict({ name })} /><NumberField label="Radius" value={selectedDistrict.radius} min={1} max={12} onChange={(radius) => updateDistrict({ radius })} /><button onClick={removeSelected} className="w-full rounded bg-red-950/55 px-2 py-1.5 text-[9px] text-red-200">DELETE</button></div>}
      {selectedProp && <div className="space-y-2 rounded border border-cyan-300/20 p-2"><div className="text-[9px] font-black text-cyan-100">SELECTED PROP</div><SelectMini label="Kind" value={selectedProp.kind} options={PROP_KINDS} onChange={(kind) => updateProp({ kind: kind as CityProp['kind'] })} /><button onClick={removeSelected} className="w-full rounded bg-red-950/55 px-2 py-1.5 text-[9px] text-red-200">DELETE</button></div>}
      {!selection && tool === 'select' && <div className="rounded border border-purple-400/20 bg-purple-950/20 p-3 text-[10px] leading-relaxed text-purple-100/65">Click a building, district or prop to inspect it. Drag it directly on the map. Building width/height update the same collision footprint used by the server.</div>}
    </section>
  </div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-[9px] text-purple-200/60">{label}<div className="mt-1 flex items-center gap-1 rounded border border-purple-500/30 bg-black/55 p-1"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-8 bg-transparent" /><span className="font-mono text-[9px] text-purple-100">{value}</span></div></label>; }
function NumberField({ label, value, onChange, min = 1, max = 78 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) { return <label className="text-[9px] text-purple-200/60">{label}<input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[9px] text-purple-200/60">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>; }
function SelectMini({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block text-[9px] text-purple-200/60">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100">{options.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-1"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
''')

# Tests: contract checks for global label layout, Studio controls and direct-manipulation city designer.
test = read('server/test/reference-visual-9-7.test.mjs')
test += r'''

test('9.7 world nameplates resolve distance fade, priority collisions and boss styling globally', async () => {
  const labels = await read('src/game/worldNameplates.ts');
  const screen = await read('src/components/GameScreen.tsx');
  const render = await read('src/game/render.ts');
  assert.match(labels, /collisionPadding/);
  assert.match(labels, /bossAlwaysVisible/);
  assert.match(labels, /sort\(\(a, b\) => priority\(b\) - priority\(a\)/);
  assert.match(labels, /visibilityAlpha/);
  assert.match(labels, /'BOSS'/);
  assert.match(screen, /drawWorldNameplates\(ctx, worldLabelRequests/);
  assert.doesNotMatch(render, /const hpBarW = size \* 0\.9/);
});

test('9.7 city designer directly manipulates authoritative building footprints', async () => {
  const designer = await read('src/components/CityDesigner.tsx');
  const studio = await read('server/engine/ContentStudio.mjs');
  const admin = await read('server/adminPanel.mjs');
  assert.match(designer, /DIRECT MANIPULATION/);
  assert.match(designer, /onPointerMove=\{dragMove\}/);
  assert.match(designer, /SELECTED BUILDING/);
  assert.match(designer, /'house'/);
  assert.match(studio, /monsterNameplateMode/);
  assert.match(studio, /bossNameplateAlwaysVisible/);
  assert.match(admin, /meta\.kind === 'boolean'/);
  assert.match(admin, /meta\.kind === 'json'/);
});
'''
write('server/test/reference-visual-9-7.test.mjs', test)

print("Mor'ia 9.7 world labels and visual city designer applied.")
