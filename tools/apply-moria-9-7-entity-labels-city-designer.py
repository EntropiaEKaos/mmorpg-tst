from pathlib import Path
import re

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    if old not in text: raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

# 1) Shared deferred entity-nameplate layout / rendering policy.
entity = r'''export interface EntityNameplateOptions {
  npcNameplateOffsetY?: number;
  npcNameplateScale?: number;
  npcNameplateFontSize?: number;
  npcNameplateFadeStart?: number;
  npcNameplateHideDistance?: number;
  npcNameplateShowRole?: boolean;
  monsterNameplateOffsetY?: number;
  monsterNameplateScale?: number;
  monsterNameplateFontSize?: number;
  monsterNameplateBarWidth?: number;
  monsterNameplateBarHeight?: number;
  monsterNameplateFadeStart?: number;
  monsterNameplateHideDistance?: number;
  monsterNameplateShowValues?: boolean;
  bossNameplateScale?: number;
  bossNameplateFontSize?: number;
  bossNameplateBarWidth?: number;
  bossNameplateBarHeight?: number;
  bossNameplateShowValues?: boolean;
  bossNameplateAccent?: string;
}

type Box = { left:number; right:number; top:number; bottom:number };
type Entry = { cx:number; y:number; width:number; height:number; priority:number; alpha:number; paint:(resolvedY:number, alpha:number)=>void };

function bounded(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function bool(value: unknown, fallback: boolean): boolean { return typeof value === 'boolean' ? value : fallback; }
function overlap(a: Box, b: Box): boolean { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
function alphaByDistance(distance: number, fadeStart: number, hideDistance: number, force = false): number {
  if (force) return 1;
  if (distance >= hideDistance) return 0;
  if (distance <= fadeStart) return 1;
  return Math.max(0, Math.min(1, 1 - (distance - fadeStart) / Math.max(.1, hideDistance - fadeStart)));
}

export class EntityNameplateLayout {
  private entries: Entry[] = [];
  queue(entry: Entry) { if (entry.alpha > .01) this.entries.push(entry); }
  flush() {
    const occupied: Box[] = [];
    this.entries.sort((a,b) => b.priority - a.priority || a.y - b.y);
    for (const entry of this.entries) {
      let y = entry.y;
      const step = Math.max(4, entry.height + 2);
      for (let lane = 0; lane < 7; lane++) {
        const candidate = { left: entry.cx-entry.width/2, right: entry.cx+entry.width/2, top: y-entry.height, bottom: y+1 };
        if (!occupied.some(box => overlap(candidate, box))) { occupied.push(candidate); entry.paint(y, entry.alpha); break; }
        y -= step;
      }
    }
    this.entries = [];
  }
}

export interface MonsterPlateTarget { name:string; hp:number; maxHp:number; level?:number; type?:'normal'|'elite'|'boss' }
export interface NpcPlateTarget { name:string; role?:string }

export function queueNpcNameplate(ctx: CanvasRenderingContext2D, layout: EntityNameplateLayout, cx: number, spriteY: number, size: number, npc: NpcPlateTarget, distanceTiles: number, options: EntityNameplateOptions = {}) {
  const scale = bounded(options.npcNameplateScale, .55, 1.5, .82);
  const fontSize = bounded(options.npcNameplateFontSize, 7, 14, 8) * scale;
  const offsetY = bounded(options.npcNameplateOffsetY, -40, 12, -8);
  const fadeStart = bounded(options.npcNameplateFadeStart, 2, 20, 7);
  const hideDistance = Math.max(fadeStart + 1, bounded(options.npcNameplateHideDistance, 3, 30, 12));
  const showRole = bool(options.npcNameplateShowRole, true) && distanceTiles <= 4.5 && Boolean(npc.role);
  const alpha = alphaByDistance(distanceTiles, fadeStart, hideDistance);
  const title = npc.name;
  const role = showRole ? String(npc.role).replace(/(^|\s)\S/g, m => m.toUpperCase()) : '';
  ctx.save(); ctx.font = `bold ${fontSize}px monospace`; const width = Math.max(ctx.measureText(title).width, role ? ctx.measureText(role).width : 0) + 8; ctx.restore();
  const height = role ? fontSize * 2 + 5 : fontSize + 4;
  const desiredY = spriteY + offsetY;
  layout.queue({ cx, y: desiredY, width, height, priority: 30, alpha, paint: (y, a) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.lineWidth=2.5; ctx.strokeStyle='rgba(0,0,0,.9)'; ctx.font=`bold ${fontSize}px monospace`;
    ctx.strokeText(title, cx, y); ctx.fillStyle='#9bd4ff'; ctx.fillText(title, cx, y);
    if (role) { ctx.font=`${Math.max(6, fontSize-1)}px monospace`; ctx.strokeText(role, cx, y + fontSize + 2); ctx.fillStyle='#d7c98d'; ctx.fillText(role, cx, y + fontSize + 2); }
    ctx.restore();
  }});
}

export function queueMonsterNameplate(ctx: CanvasRenderingContext2D, layout: EntityNameplateLayout, cx: number, spriteY: number, size: number, monster: MonsterPlateTarget, distanceTiles: number, options: EntityNameplateOptions = {}, targeted = false) {
  const boss = monster.type === 'boss';
  const elite = monster.type === 'elite';
  const scale = bounded(boss ? options.bossNameplateScale : options.monsterNameplateScale, .55, 1.8, boss ? 1.08 : .84);
  const fontSize = bounded(boss ? options.bossNameplateFontSize : options.monsterNameplateFontSize, 7, 18, boss ? 10 : 8) * scale;
  const barW = bounded(boss ? options.bossNameplateBarWidth : options.monsterNameplateBarWidth, 18, 90, boss ? 48 : 28) * scale;
  const barH = bounded(boss ? options.bossNameplateBarHeight : options.monsterNameplateBarHeight, 2, 10, boss ? 5 : 3) * scale;
  const offsetY = bounded(options.monsterNameplateOffsetY, -44, 12, -9);
  const fadeStart = bounded(options.monsterNameplateFadeStart, 2, 24, 8);
  const hideDistance = Math.max(fadeStart + 1, bounded(options.monsterNameplateHideDistance, 3, 32, 13));
  const showValues = bool(boss ? options.bossNameplateShowValues : options.monsterNameplateShowValues, boss);
  const alpha = alphaByDistance(distanceTiles, fadeStart, hideDistance, boss || targeted);
  const name = monster.level ? `${monster.name} [${monster.level}]` : monster.name;
  ctx.save(); ctx.font=`bold ${fontSize}px monospace`; const textW=ctx.measureText(name).width; ctx.restore();
  const width = Math.max(textW + 10, barW + 8);
  const height = fontSize + barH + (showValues ? fontSize*.8 : 0) + (boss ? 11 : 7);
  const desiredY = spriteY + offsetY;
  const accent = boss ? (typeof options.bossNameplateAccent === 'string' ? options.bossNameplateAccent : '#f0c45b') : elite ? '#c265ef' : '#ff8f8f';
  layout.queue({ cx, y: desiredY, width, height, priority: boss ? 100 : targeted ? 80 : elite ? 60 : 40, alpha, paint: (y, a) => {
    const hpPct = Math.max(0, Math.min(1, monster.maxHp > 0 ? monster.hp / monster.maxHp : 0));
    ctx.save(); ctx.globalAlpha *= a; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    if (boss) { ctx.fillStyle='rgba(11,8,5,.82)'; ctx.fillRect(cx-width/2, y-fontSize-4, width, height); ctx.fillStyle=accent; ctx.fillRect(cx-width/2, y-fontSize-4, width, 2); ctx.fillRect(cx-width/2, y-fontSize-4+height-2, width, 2); }
    ctx.font=`bold ${fontSize}px monospace`; ctx.lineWidth=2.5; ctx.strokeStyle='rgba(0,0,0,.92)'; ctx.strokeText(name,cx,y); ctx.fillStyle=accent; ctx.fillText(name,cx,y);
    const barY=y+4; const bx=cx-barW/2; ctx.fillStyle='rgba(0,0,0,.75)'; ctx.fillRect(bx-1,barY-1,barW+2,barH+2); ctx.fillStyle='#3b1717'; ctx.fillRect(bx,barY,barW,barH);
    ctx.fillStyle=hpPct>.55?'#43b95f':hpPct>.25?'#d9a83c':'#d94b4b'; ctx.fillRect(bx,barY,barW*hpPct,barH);
    if (showValues) { ctx.font=`${Math.max(6,fontSize*.72)}px monospace`; ctx.fillStyle='#f3ead8'; ctx.strokeText(`${Math.max(0,Math.ceil(monster.hp))}/${Math.max(1,Math.ceil(monster.maxHp))}`,cx,barY+barH+fontSize*.78); ctx.fillText(`${Math.max(0,Math.ceil(monster.hp))}/${Math.max(1,Math.ceil(monster.maxHp))}`,cx,barY+barH+fontSize*.78); }
    ctx.restore();
  }});
}
'''
write('src/game/entityNameplates.ts', entity)

# 2) Render delegates entity labels to deferred policy.
path='src/game/render.ts'; text=read(path)
text=replace_once(text, "import { drawClassicMonsterSprite, drawClassicNpcSprite } from './classicEntityPresentation';", "import { drawClassicMonsterSprite, drawClassicNpcSprite } from './classicEntityPresentation';\nimport { queueMonsterNameplate, queueNpcNameplate, type EntityNameplateLayout, type EntityNameplateOptions } from './entityNameplates';", 'render import')
start=text.index('export function drawMonster(')
end=text.index('// ===== BUILDINGS =====')
replacement=r'''export function drawMonster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  monster: { name: string; hp: number; maxHp: number; color: string; emoji: string; msSize?: number; level?: number; type?: 'normal' | 'elite' | 'boss' },
  time: number,
  nameplateOptions: EntityNameplateOptions = {},
  distanceTiles = 0,
  labelLayout?: EntityNameplateLayout,
  targeted = false,
) {
  const msSize = monster.msSize ?? 1;
  const bob = Math.sin(time / 300 + x) * 1;
  const cx = x + size / 2;
  const cy = y + size / 2 + bob;
  const entitySize = size * msSize;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, y + size - 3, entitySize * 0.32, entitySize * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  if (monster.type === 'elite' || monster.type === 'boss') {
    const marker = monster.type === 'boss' ? '#e2b64f' : '#c265ef';
    const m = Math.max(2, Math.round(size / 12)); const r = entitySize * .40;
    ctx.fillStyle = marker;
    ctx.fillRect(cx-r, cy-r, m*3, m); ctx.fillRect(cx-r, cy-r, m, m*3);
    ctx.fillRect(cx+r-m*3, cy-r, m*3, m); ctx.fillRect(cx+r-m, cy-r, m, m*3);
  }
  drawClassicMonsterSprite(ctx, cx, cy, entitySize, monster, time);
  if (labelLayout) queueMonsterNameplate(ctx, labelLayout, cx, y, size, monster, distanceTiles, nameplateOptions, targeted);
}

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  npc: { name: string; emoji: string; color: string; role: string },
  time: number,
  nameplateOptions: EntityNameplateOptions = {},
  distanceTiles = 0,
  labelLayout?: EntityNameplateLayout,
) {
  const bob = Math.sin(time / 400 + x) * 1;
  const cx = x + size / 2; const cy = y + size / 2 + bob;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, y + size - 3, size * 0.32, size * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  drawClassicNpcSprite(ctx, cx, cy, size, npc, time);
  if (labelLayout) queueNpcNameplate(ctx, labelLayout, cx, y, size, npc, distanceTiles, nameplateOptions);
}

'''
text=text[:start]+replacement+text[end:]
write(path,text)

# 3) GameScreen: one shared deferred label layout per frame, with distance and priority.
path='src/components/GameScreen.tsx'; text=read(path)
text=replace_once(text, "import { drawBuilding, type Building } from '../game/render';", "import { drawBuilding, type Building } from '../game/render';\nimport { EntityNameplateLayout } from '../game/entityNameplates';", 'GameScreen import')
text=replace_once(text, "    // NPCs\n    for (const n of npcsRef.current) {", "    const entityNameplateMap = MAPS[currentMapIdRef.current] || MAPS.eldoria;\n    const entityLabelLayout = new EntityNameplateLayout();\n\n    // NPCs\n    for (const n of npcsRef.current) {", 'NPC layout init')
text=replace_once(text, "      drawNPC(ctx, sx, sy, TILE_SIZE, n, now);", "      drawNPC(ctx, sx, sy, TILE_SIZE, n, now, entityNameplateMap, Math.hypot(n.pos.x - p.pos.x, n.pos.y - p.pos.y), entityLabelLayout);", 'NPC call')
text=replace_once(text, "      }, now);", "      }, now, entityNameplateMap, Math.hypot(mx - p.pos.x, my - p.pos.y), entityLabelLayout, p.targetId === m.id);", 'main monster call')
# pet calls: keep labels but use distance + shared layout.
text=text.replace("}, now);\n      }\n    } else if (petStateRef.current)", "}, now, entityNameplateMap, 1, entityLabelLayout);\n      }\n    } else if (petStateRef.current)", 1)
text=text.replace("          }, now);\n        }\n      }\n    }\n\n    // Target highlight", "          }, now, entityNameplateMap, Math.hypot(pet.pos.x - p.pos.x, pet.pos.y - p.pos.y), entityLabelLayout);\n        }\n      }\n    }\n\n    // Target highlight", 1)
text=replace_once(text, "    // Projectiles\n", "    // Deferred NPC/monster/boss labels are resolved after roof occlusion so high-priority\n    // targets remain readable and overlapping labels are assigned separate vertical lanes.\n    entityLabelLayout.flush();\n\n    // Projectiles\n", 'label flush')
write(path,text)

# 4) Client map contract exposes all entity label controls.
path='src/game/maps.ts'; text=read(path)
anchor="  residentialRingDensity?: number;\n"
fields="""  residentialRingDensity?: number;\n  npcNameplateOffsetY?: number;\n  npcNameplateScale?: number;\n  npcNameplateFontSize?: number;\n  npcNameplateFadeStart?: number;\n  npcNameplateHideDistance?: number;\n  npcNameplateShowRole?: boolean;\n  monsterNameplateOffsetY?: number;\n  monsterNameplateScale?: number;\n  monsterNameplateFontSize?: number;\n  monsterNameplateBarWidth?: number;\n  monsterNameplateBarHeight?: number;\n  monsterNameplateFadeStart?: number;\n  monsterNameplateHideDistance?: number;\n  monsterNameplateShowValues?: boolean;\n  bossNameplateScale?: number;\n  bossNameplateFontSize?: number;\n  bossNameplateBarWidth?: number;\n  bossNameplateBarHeight?: number;\n  bossNameplateShowValues?: boolean;\n  bossNameplateAccent?: string;\n"""
text=replace_once(text,anchor,fields,'map interface')
sync_anchor="      residentialRingDensity: integer(raw.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n"
sync_fields=sync_anchor+"""      npcNameplateOffsetY: Number.isFinite(Number(raw.npcNameplateOffsetY)) ? Math.max(-40, Math.min(12, Number(raw.npcNameplateOffsetY))) : base?.npcNameplateOffsetY,\n      npcNameplateScale: Number.isFinite(Number(raw.npcNameplateScale)) ? Math.max(.55, Math.min(1.5, Number(raw.npcNameplateScale))) : base?.npcNameplateScale,\n      npcNameplateFontSize: Number.isFinite(Number(raw.npcNameplateFontSize)) ? Math.max(7, Math.min(14, Number(raw.npcNameplateFontSize))) : base?.npcNameplateFontSize,\n      npcNameplateFadeStart: Number.isFinite(Number(raw.npcNameplateFadeStart)) ? Math.max(2, Math.min(20, Number(raw.npcNameplateFadeStart))) : base?.npcNameplateFadeStart,\n      npcNameplateHideDistance: Number.isFinite(Number(raw.npcNameplateHideDistance)) ? Math.max(3, Math.min(30, Number(raw.npcNameplateHideDistance))) : base?.npcNameplateHideDistance,\n      npcNameplateShowRole: typeof raw.npcNameplateShowRole === 'boolean' ? raw.npcNameplateShowRole : base?.npcNameplateShowRole,\n      monsterNameplateOffsetY: Number.isFinite(Number(raw.monsterNameplateOffsetY)) ? Math.max(-44, Math.min(12, Number(raw.monsterNameplateOffsetY))) : base?.monsterNameplateOffsetY,\n      monsterNameplateScale: Number.isFinite(Number(raw.monsterNameplateScale)) ? Math.max(.55, Math.min(1.5, Number(raw.monsterNameplateScale))) : base?.monsterNameplateScale,\n      monsterNameplateFontSize: Number.isFinite(Number(raw.monsterNameplateFontSize)) ? Math.max(7, Math.min(16, Number(raw.monsterNameplateFontSize))) : base?.monsterNameplateFontSize,\n      monsterNameplateBarWidth: Number.isFinite(Number(raw.monsterNameplateBarWidth)) ? Math.max(18, Math.min(80, Number(raw.monsterNameplateBarWidth))) : base?.monsterNameplateBarWidth,\n      monsterNameplateBarHeight: Number.isFinite(Number(raw.monsterNameplateBarHeight)) ? Math.max(2, Math.min(8, Number(raw.monsterNameplateBarHeight))) : base?.monsterNameplateBarHeight,\n      monsterNameplateFadeStart: Number.isFinite(Number(raw.monsterNameplateFadeStart)) ? Math.max(2, Math.min(24, Number(raw.monsterNameplateFadeStart))) : base?.monsterNameplateFadeStart,\n      monsterNameplateHideDistance: Number.isFinite(Number(raw.monsterNameplateHideDistance)) ? Math.max(3, Math.min(32, Number(raw.monsterNameplateHideDistance))) : base?.monsterNameplateHideDistance,\n      monsterNameplateShowValues: typeof raw.monsterNameplateShowValues === 'boolean' ? raw.monsterNameplateShowValues : base?.monsterNameplateShowValues,\n      bossNameplateScale: Number.isFinite(Number(raw.bossNameplateScale)) ? Math.max(.7, Math.min(1.8, Number(raw.bossNameplateScale))) : base?.bossNameplateScale,\n      bossNameplateFontSize: Number.isFinite(Number(raw.bossNameplateFontSize)) ? Math.max(8, Math.min(18, Number(raw.bossNameplateFontSize))) : base?.bossNameplateFontSize,\n      bossNameplateBarWidth: Number.isFinite(Number(raw.bossNameplateBarWidth)) ? Math.max(28, Math.min(90, Number(raw.bossNameplateBarWidth))) : base?.bossNameplateBarWidth,\n      bossNameplateBarHeight: Number.isFinite(Number(raw.bossNameplateBarHeight)) ? Math.max(3, Math.min(10, Number(raw.bossNameplateBarHeight))) : base?.bossNameplateBarHeight,\n      bossNameplateShowValues: typeof raw.bossNameplateShowValues === 'boolean' ? raw.bossNameplateShowValues : base?.bossNameplateShowValues,\n      bossNameplateAccent: cityColor(raw.bossNameplateAccent, base?.bossNameplateAccent || '#f0c45b'),\n"""
text=replace_once(text,sync_anchor,sync_fields,'map sync fields')
write(path,text)

# 5) Authoritative world round-trips same controls.
path='server/engine/World.mjs'; text=read(path)
world_anchor="    residentialRingDensity: integer(record?.residentialRingDensity, 0, 10, base?.residentialRingDensity ?? 0),\n"
world_fields=world_anchor+"""    npcNameplateOffsetY: boundedNumber(record?.npcNameplateOffsetY, -40, 12, base?.npcNameplateOffsetY ?? -8),\n    npcNameplateScale: boundedNumber(record?.npcNameplateScale, .55, 1.5, base?.npcNameplateScale ?? .82),\n    npcNameplateFontSize: boundedNumber(record?.npcNameplateFontSize, 7, 14, base?.npcNameplateFontSize ?? 8),\n    npcNameplateFadeStart: boundedNumber(record?.npcNameplateFadeStart, 2, 20, base?.npcNameplateFadeStart ?? 7),\n    npcNameplateHideDistance: boundedNumber(record?.npcNameplateHideDistance, 3, 30, base?.npcNameplateHideDistance ?? 12),\n    npcNameplateShowRole: typeof record?.npcNameplateShowRole === 'boolean' ? record.npcNameplateShowRole : (base?.npcNameplateShowRole ?? true),\n    monsterNameplateOffsetY: boundedNumber(record?.monsterNameplateOffsetY, -44, 12, base?.monsterNameplateOffsetY ?? -9),\n    monsterNameplateScale: boundedNumber(record?.monsterNameplateScale, .55, 1.5, base?.monsterNameplateScale ?? .84),\n    monsterNameplateFontSize: boundedNumber(record?.monsterNameplateFontSize, 7, 16, base?.monsterNameplateFontSize ?? 8),\n    monsterNameplateBarWidth: boundedNumber(record?.monsterNameplateBarWidth, 18, 80, base?.monsterNameplateBarWidth ?? 28),\n    monsterNameplateBarHeight: boundedNumber(record?.monsterNameplateBarHeight, 2, 8, base?.monsterNameplateBarHeight ?? 3),\n    monsterNameplateFadeStart: boundedNumber(record?.monsterNameplateFadeStart, 2, 24, base?.monsterNameplateFadeStart ?? 8),\n    monsterNameplateHideDistance: boundedNumber(record?.monsterNameplateHideDistance, 3, 32, base?.monsterNameplateHideDistance ?? 13),\n    monsterNameplateShowValues: typeof record?.monsterNameplateShowValues === 'boolean' ? record.monsterNameplateShowValues : (base?.monsterNameplateShowValues ?? false),\n    bossNameplateScale: boundedNumber(record?.bossNameplateScale, .7, 1.8, base?.bossNameplateScale ?? 1.08),\n    bossNameplateFontSize: boundedNumber(record?.bossNameplateFontSize, 8, 18, base?.bossNameplateFontSize ?? 10),\n    bossNameplateBarWidth: boundedNumber(record?.bossNameplateBarWidth, 28, 90, base?.bossNameplateBarWidth ?? 48),\n    bossNameplateBarHeight: boundedNumber(record?.bossNameplateBarHeight, 3, 10, base?.bossNameplateBarHeight ?? 5),\n    bossNameplateShowValues: typeof record?.bossNameplateShowValues === 'boolean' ? record.bossNameplateShowValues : (base?.bossNameplateShowValues ?? true),\n    bossNameplateAccent: cityColor(record?.bossNameplateAccent, base?.bossNameplateAccent || '#f0c45b'),\n"""
text=replace_once(text,world_anchor,world_fields,'world normalized fields')
def_anchor="      cityStyle: config.cityStyle, cityAccent: config.cityAccent, roofColor: config.roofColor, wallColor: config.wallColor, roadColor: config.roadColor,\n"
def_fields=def_anchor+"""      nameplateOffsetY: config.nameplateOffsetY, nameplateScale: config.nameplateScale, nameplateBarWidth: config.nameplateBarWidth, nameplateBarHeight: config.nameplateBarHeight, nameplateFontSize: config.nameplateFontSize, nameplateShowValues: config.nameplateShowValues,\n      residentialRingEnabled: config.residentialRingEnabled, residentialRingDensity: config.residentialRingDensity,\n      npcNameplateOffsetY: config.npcNameplateOffsetY, npcNameplateScale: config.npcNameplateScale, npcNameplateFontSize: config.npcNameplateFontSize, npcNameplateFadeStart: config.npcNameplateFadeStart, npcNameplateHideDistance: config.npcNameplateHideDistance, npcNameplateShowRole: config.npcNameplateShowRole,\n      monsterNameplateOffsetY: config.monsterNameplateOffsetY, monsterNameplateScale: config.monsterNameplateScale, monsterNameplateFontSize: config.monsterNameplateFontSize, monsterNameplateBarWidth: config.monsterNameplateBarWidth, monsterNameplateBarHeight: config.monsterNameplateBarHeight, monsterNameplateFadeStart: config.monsterNameplateFadeStart, monsterNameplateHideDistance: config.monsterNameplateHideDistance, monsterNameplateShowValues: config.monsterNameplateShowValues,\n      bossNameplateScale: config.bossNameplateScale, bossNameplateFontSize: config.bossNameplateFontSize, bossNameplateBarWidth: config.bossNameplateBarWidth, bossNameplateBarHeight: config.bossNameplateBarHeight, bossNameplateShowValues: config.bossNameplateShowValues, bossNameplateAccent: config.bossNameplateAccent,\n"""
text=replace_once(text,def_anchor,def_fields,'world definitions')
write(path,text)

# 6) Content Studio schema + bounded validation.
path='server/engine/ContentStudio.mjs'; text=read(path)
studio_anchor="    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('residentialRingEnabled', 'Decorative residential ring', 'boolean'), field('residentialRingDensity', 'Residential density', 'number'),\n"
studio_fields=studio_anchor+"""    field('npcNameplateOffsetY', 'NPC label Y offset', 'number'), field('npcNameplateScale', 'NPC label scale', 'number'), field('npcNameplateFontSize', 'NPC font size', 'number'),\n    field('npcNameplateFadeStart', 'NPC fade start (tiles)', 'number'), field('npcNameplateHideDistance', 'NPC hide distance (tiles)', 'number'), field('npcNameplateShowRole', 'Show NPC role nearby', 'boolean'),\n    field('monsterNameplateOffsetY', 'Monster label Y offset', 'number'), field('monsterNameplateScale', 'Monster label scale', 'number'), field('monsterNameplateFontSize', 'Monster font size', 'number'),\n    field('monsterNameplateBarWidth', 'Monster HP width', 'number'), field('monsterNameplateBarHeight', 'Monster HP height', 'number'), field('monsterNameplateFadeStart', 'Monster fade start (tiles)', 'number'),\n    field('monsterNameplateHideDistance', 'Monster hide distance (tiles)', 'number'), field('monsterNameplateShowValues', 'Show monster HP values', 'boolean'),\n    field('bossNameplateScale', 'Boss label scale', 'number'), field('bossNameplateFontSize', 'Boss font size', 'number'), field('bossNameplateBarWidth', 'Boss HP width', 'number'), field('bossNameplateBarHeight', 'Boss HP height', 'number'), field('bossNameplateShowValues', 'Show boss HP values', 'boolean'), field('bossNameplateAccent', 'Boss accent color'),\n"""
text=replace_once(text,studio_anchor,studio_fields,'studio fields')
val_anchor="    for (const [key,min,max] of [['nameplateOffsetY',-32,12],['nameplateScale',0.55,1.5],['nameplateBarWidth',18,64],['nameplateBarHeight',2,8],['nameplateFontSize',7,14],['residentialRingDensity',0,10]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }\n"
val_new=val_anchor+"""    for (const [key,min,max] of [['npcNameplateOffsetY',-40,12],['npcNameplateScale',0.55,1.5],['npcNameplateFontSize',7,14],['npcNameplateFadeStart',2,20],['npcNameplateHideDistance',3,30],['monsterNameplateOffsetY',-44,12],['monsterNameplateScale',0.55,1.5],['monsterNameplateFontSize',7,16],['monsterNameplateBarWidth',18,80],['monsterNameplateBarHeight',2,8],['monsterNameplateFadeStart',2,24],['monsterNameplateHideDistance',3,32],['bossNameplateScale',0.7,1.8],['bossNameplateFontSize',8,18],['bossNameplateBarWidth',28,90],['bossNameplateBarHeight',3,10]]) { const e=numberIn(record,key,min,max,{required:false}); if(e)return e; }\n    for (const key of ['npcNameplateShowRole','monsterNameplateShowValues','bossNameplateShowValues']) if (record[key] !== undefined && typeof record[key] !== 'boolean') return `${key} must be boolean`;\n    if (record.bossNameplateAccent !== undefined && record.bossNameplateAccent !== '' && !COLOR_RE.test(String(record.bossNameplateAccent))) return 'bossNameplateAccent must be a CSS hex color';\n    if (Number(record.npcNameplateHideDistance || 12) <= Number(record.npcNameplateFadeStart || 7)) return 'npcNameplateHideDistance must be greater than npcNameplateFadeStart';\n    if (Number(record.monsterNameplateHideDistance || 13) <= Number(record.monsterNameplateFadeStart || 8)) return 'monsterNameplateHideDistance must be greater than monsterNameplateFadeStart';\n"""
text=replace_once(text,val_anchor,val_new,'studio validation')
write(path,text)

# 7) Admin: boolean controls, generic JSON handling, and draggable/resizable city canvas.
path='server/adminPanel.mjs'; text=read(path)
css_anchor="  .readonly-label { color:#f4e04d80; font-size:.75rem; font-weight:700; letter-spacing:.06em; }\n"
css_new=css_anchor+"""  .city-designer { margin:1rem 0; padding:1rem; border:1px solid #4b3920; border-radius:8px; background:#0d0906; }\n  .city-designer canvas { width:min(100%,720px); aspect-ratio:1; image-rendering:pixelated; border:1px solid #8b6914; background:#17130f; cursor:crosshair; display:block; }\n  .city-tools { display:flex; gap:.5rem; flex-wrap:wrap; margin:.7rem 0; }\n  .city-selection { color:#d7c98d; font-size:.8rem; margin-top:.5rem; }\n"""
text=replace_once(text,css_anchor,css_new,'admin css')
text=replace_once(text, "  let renderedItems = [];\n", "  let renderedItems = [];\n  let cityDesigner = { landmarks:[], selected:-1, drag:null };\n", 'admin state')
# Boolean fields proper checkbox.
text=replace_once(text, "        } else if (meta.kind === 'textarea') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';\n        } else {", "        } else if (meta.kind === 'textarea') {\n          html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';\n        } else if (meta.kind === 'boolean') {\n          html += '<input type=\"checkbox\" id=\"fld_' + f + '\" ' + (item[f] === true ? 'checked' : '') + '>';\n        } else {", 'admin boolean rendering')
# Insert map designer before save controls.
map_ui_anchor="      html += '</div>';\n      html += '<div style=\"margin-top:.5rem\"><button class=\"btn btn-green\" onclick=\"saveItem()\">💾 Save</button> ';\n"
map_ui_new="""      html += '</div>';\n      if (currentTab === 'maps') {\n        html += '<div class=\"city-designer\"><h3>🏘 Visual City Designer</h3><p class=\"catalog-note\">Drag buildings to move them. Drag the gold square in the lower-right corner to resize. The canvas writes directly to the authoritative landmarks JSON used by rendering and collision.</p><div class=\"city-tools\"><button class=\"btn btn-amber\" type=\"button\" onclick=\"cityAddHouse()\">＋ House</button><button class=\"btn btn-red\" type=\"button\" onclick=\"cityDeleteSelected()\">Delete selected</button></div><canvas id=\"cityDesignerCanvas\" width=\"640\" height=\"640\"></canvas><div class=\"city-selection\" id=\"cityDesignerSelection\">No building selected</div></div>';\n      }\n      html += '<div style=\"margin-top:.5rem\"><button class=\"btn btn-green\" onclick=\"saveItem()\">💾 Save</button> ';\n"""
text=replace_once(text,map_ui_anchor,map_ui_new,'admin map designer ui')
# initialize designer after innerHTML assignment.
text=replace_once(text, "    el.innerHTML = html;\n", "    el.innerHTML = html;\n    if (!readOnly && editing !== null && currentTab === 'maps') setTimeout(initCityDesigner, 0);\n", 'designer init')
# Save parser update.
save_anchor="""      if (el) {\n        let v = el.value;\n        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);\n        if (f === 'portals' || f === 'requires') {\n          try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }\n          if (!Array.isArray(body[f])) { alert(f + ' must be a JSON array.'); return; }\n          continue;\n        }\n        if (numericFields.has(f)) v = parseFloat(v) || 0;\n        body[f] = v;\n      }\n"""
save_new="""      if (el) {\n        const meta = Array.isArray(data.schema) ? data.schema.find(entry => entry.id === f) : null;\n        if (meta?.kind === 'boolean') { body[f] = Boolean(el.checked); continue; }\n        let v = el.value;\n        if (meta?.kind === 'json') {\n          try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }\n          if (!Array.isArray(body[f])) { alert(f + ' must be a JSON array.'); return; }\n          continue;\n        }\n        if (meta?.kind === 'number') v = parseFloat(v) || 0;\n        body[f] = v;\n      }\n"""
text=replace_once(text,save_anchor,save_new,'admin generic parser')
# Add designer functions before del.
del_anchor="  async function del(id) {\n"
designer=r'''  function cityReadLandmarks() {
    const field = document.getElementById('fld_landmarks');
    if (!field) return [];
    try { const parsed = JSON.parse(field.value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  function cityWriteLandmarks() {
    const field = document.getElementById('fld_landmarks');
    if (field) field.value = JSON.stringify(cityDesigner.landmarks, null, 2);
    cityDraw();
  }
  function cityAddHouse() {
    const townX = Number(document.getElementById('fld_townX')?.value || 40), townY = Number(document.getElementById('fld_townY')?.value || 40);
    const index = cityDesigner.landmarks.length + 1;
    cityDesigner.landmarks.push({ id:'house_'+Date.now(), name:'House '+index, kind:'house', icon:'⌂', x:Math.max(1,Math.min(75,Math.round(townX-2))), y:Math.max(1,Math.min(75,Math.round(townY-2))), w:4, h:4 });
    cityDesigner.selected = cityDesigner.landmarks.length - 1; cityWriteLandmarks();
  }
  function cityDeleteSelected() {
    if (cityDesigner.selected < 0) return;
    cityDesigner.landmarks.splice(cityDesigner.selected,1); cityDesigner.selected=-1; cityWriteLandmarks();
  }
  function cityDraw() {
    const canvas = document.getElementById('cityDesignerCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'), cell = canvas.width / 80;
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#18130e'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='rgba(180,150,90,.12)'; ctx.lineWidth=1;
    for(let i=0;i<=80;i+=5){ const p=i*cell; ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(canvas.width,p);ctx.stroke(); }
    const townX=Number(document.getElementById('fld_townX')?.value||40), townY=Number(document.getElementById('fld_townY')?.value||40), townRange=Number(document.getElementById('fld_townRange')?.value||8);
    ctx.fillStyle='rgba(145,125,88,.14)'; ctx.fillRect((townX-townRange)*cell,(townY-townRange)*cell,townRange*2*cell,townRange*2*cell);
    cityDesigner.landmarks.forEach((b,i)=>{ const x=Number(b.x||1)*cell,y=Number(b.y||1)*cell,w=Number(b.w||1)*cell,h=Number(b.h||1)*cell; ctx.fillStyle=i===cityDesigner.selected?'rgba(240,196,91,.45)':'rgba(126,73,55,.60)';ctx.fillRect(x,y,w,h);ctx.strokeStyle=i===cityDesigner.selected?'#f0c45b':'#cba06a';ctx.lineWidth=i===cityDesigner.selected?3:1;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#f6e8c7';ctx.font='11px system-ui';ctx.fillText(String(b.name||b.kind||'building').slice(0,18),x+3,y+13); if(i===cityDesigner.selected){ctx.fillStyle='#f0c45b';ctx.fillRect(x+w-8,y+h-8,8,8);} });
    const selected=cityDesigner.landmarks[cityDesigner.selected]; const label=document.getElementById('cityDesignerSelection'); if(label) label.textContent=selected ? `${selected.name||selected.id} — x:${selected.x} y:${selected.y} ${selected.w}×${selected.h}` : 'No building selected';
  }
  function initCityDesigner() {
    const canvas=document.getElementById('cityDesignerCanvas'); if(!canvas)return;
    cityDesigner={landmarks:cityReadLandmarks().map(x=>({...x})),selected:-1,drag:null}; cityDraw();
    const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}};
    canvas.onpointerdown=e=>{const p=point(e),cell=canvas.width/80;cityDesigner.selected=-1;for(let i=cityDesigner.landmarks.length-1;i>=0;i--){const b=cityDesigner.landmarks[i],x=Number(b.x)*cell,y=Number(b.y)*cell,w=Number(b.w)*cell,h=Number(b.h)*cell;if(p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h){cityDesigner.selected=i;const resize=p.x>x+w-14&&p.y>y+h-14;cityDesigner.drag={mode:resize?'resize':'move',start:p,base:{x:Number(b.x),y:Number(b.y),w:Number(b.w),h:Number(b.h)}};canvas.setPointerCapture(e.pointerId);break;}}cityDraw();};
    canvas.onpointermove=e=>{if(!cityDesigner.drag||cityDesigner.selected<0)return;const p=point(e),cell=canvas.width/80,b=cityDesigner.landmarks[cityDesigner.selected],dx=Math.round((p.x-cityDesigner.drag.start.x)/cell),dy=Math.round((p.y-cityDesigner.drag.start.y)/cell),base=cityDesigner.drag.base;if(cityDesigner.drag.mode==='move'){b.x=Math.max(1,Math.min(78-Number(b.w),base.x+dx));b.y=Math.max(1,Math.min(78-Number(b.h),base.y+dy));}else{b.w=Math.max(1,Math.min(10,base.w+dx));b.h=Math.max(1,Math.min(10,base.h+dy));b.w=Math.min(b.w,79-Number(b.x));b.h=Math.min(b.h,79-Number(b.y));}cityWriteLandmarks();};
    canvas.onpointerup=e=>{cityDesigner.drag=null;try{canvas.releasePointerCapture(e.pointerId)}catch{};cityWriteLandmarks();};
  }

'''
text=replace_once(text,del_anchor,designer+del_anchor,'designer functions')
write(path,text)

# 8) Regression contracts.
test=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorldManager } from '../engine/World.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { contentDB } from '../engine/ContentDB.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('9.7 entity nameplates are deferred, prioritized and distance-aware', () => {
  const source = read('src/game/entityNameplates.ts');
  assert.match(source, /class EntityNameplateLayout/);
  assert.match(source, /entries\.sort\(\(a,b\) => b\.priority - a\.priority/);
  assert.match(source, /alphaByDistance/);
  assert.match(source, /priority: boss \? 100 : targeted \? 80/);
  assert.match(source, /bossNameplateAccent/);
  const screen = read('src/components/GameScreen.tsx');
  assert.match(screen, /entityLabelLayout\.flush\(\)/);
  assert.match(screen, /Math\.hypot\(mx - p\.pos\.x, my - p\.pos\.y\)/);
});

test('9.7 Studio exposes bounded NPC monster and boss nameplate controls', () => {
  const schema = getContentStudioSchema('maps', contentDB);
  const ids = new Set(schema.fields);
  for (const id of ['npcNameplateFadeStart','npcNameplateHideDistance','npcNameplateShowRole','monsterNameplateBarWidth','monsterNameplateShowValues','bossNameplateScale','bossNameplateAccent']) assert.equal(ids.has(id), true, id);
  const sample = { id:'test_map_label', name:'Label Map', biome:'plains', levelRequired:1, seed:5, spawnX:40, spawnY:40, townX:40, townY:40, townRange:8, access:'public', portals:[], landmarks:[], districts:[], props:[], npcNameplateFadeStart:8, npcNameplateHideDistance:7 };
  assert.match(validateStudioRecord('maps', sample) || '', /greater than/);
});

test('9.7 authoritative map definitions round-trip entity nameplate presentation', () => {
  const world = new WorldManager();
  world.syncContentMaps([{ id:'label_world', name:'Label World', biome:'plains', levelRequired:1, seed:6, spawnX:40, spawnY:40, townX:40, townY:40, townRange:8, access:'public', portals:[], landmarks:[], districts:[], props:[], npcNameplateScale:1.1, monsterNameplateBarWidth:42, bossNameplateAccent:'#abcdef' }]);
  const def = world.getDefinitions().find(x=>x.id==='label_world');
  assert.equal(def.npcNameplateScale,1.1); assert.equal(def.monsterNameplateBarWidth,42); assert.equal(def.bossNameplateAccent,'#abcdef');
});

test('9.7 admin maps include a visual drag resize city designer and generic boolean/json fields', () => {
  const source = read('server/adminPanel.mjs');
  assert.match(source, /Visual City Designer/);
  assert.match(source, /cityAddHouse/);
  assert.match(source, /mode:resize\?'resize':'move'/);
  assert.match(source, /meta\?\.kind === 'boolean'/);
  assert.match(source, /meta\?\.kind === 'json'/);
  assert.match(source, /writes directly to the authoritative landmarks JSON/);
});
'''
write('server/test/entity-nameplates-city-designer-9-7.test.mjs',test)

print("Mor'ia 9.7 entity labels + visual city designer applied")
