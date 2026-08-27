from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / 'src/components/GameScreen.tsx'
ACTION_BAR = ROOT / 'src/components/ActionBar.tsx'
TARGET_FRAME = ROOT / 'src/components/CombatTargetFrame.tsx'
SERVER_SYNC = ROOT / 'src/game/ServerSync.ts'
CSS = ROOT / 'src/index.css'
TEST = ROOT / 'server/test/combat-presentation.test.mjs'
DOC = ROOT / 'docs/MORIA_8_2_COMBAT_FEEL.md'

# -------------------------------------------------------------------
# Target frame: isolated combat UI with danger/health/distance reading.
# -------------------------------------------------------------------
TARGET_FRAME.write_text(r'''import { memo } from 'react';

export interface CombatTargetView {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  emoji?: string;
  type?: string;
  level?: number;
  attack?: number;
  defense?: number;
  pos?: { x: number; y: number };
  x?: number;
  y?: number;
}

interface Props {
  target: CombatTargetView | null;
  playerLevel: number;
  playerPos: { x: number; y: number };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function CombatTargetFrameInner({ target, playerLevel, playerPos }: Props) {
  if (!target) return null;

  const maxHp = Math.max(1, Number(target.maxHp) || 1);
  const hp = clamp(Number(target.hp) || 0, 0, maxHp);
  const hpPct = clamp((hp / maxHp) * 100, 0, 100);
  const level = Math.max(1, Math.floor(Number(target.level) || 1));
  const delta = level - Math.max(1, playerLevel);
  const tx = Number.isFinite(target.pos?.x) ? Number(target.pos?.x) : Number(target.x);
  const ty = Number.isFinite(target.pos?.y) ? Number(target.pos?.y) : Number(target.y);
  const distance = Number.isFinite(tx) && Number.isFinite(ty)
    ? Math.hypot(tx - playerPos.x, ty - playerPos.y)
    : null;
  const isBoss = target.type === 'boss';
  const isElite = target.type === 'elite';
  const tierLabel = isBoss ? 'BOSS TARGET' : isElite ? 'ELITE TARGET' : 'TARGET LOCKED';
  const accent = isBoss ? '#ffd87b' : isElite ? '#b88aff' : '#ff818d';
  const danger = delta >= 5 ? 'DEADLY' : delta >= 2 ? 'DANGEROUS' : delta <= -5 ? 'TRIVIAL' : 'EVEN';

  return (
    <div
      className={`moria-panel moria-target-frame absolute left-3 top-3 z-20 w-[min(300px,calc(100%-24px))] rounded-2xl border p-3 ${isBoss ? 'moria-target-boss' : ''}`}
      style={{ borderColor: `${accent}88` }}
      aria-label={`Combat target ${target.name}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="moria-eyebrow text-[8px]" style={{ color: accent }}>{tierLabel}</div>
        <div className="flex items-center gap-1 text-[8px] font-black tracking-wider">
          <span className={delta >= 5 ? 'text-rose-300' : delta >= 2 ? 'text-amber-300' : delta <= -5 ? 'text-slate-500' : 'text-emerald-300'}>{danger}</span>
          {distance !== null && <span className="text-slate-500">· {distance.toFixed(1)}m</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-black/35 text-2xl" style={{ borderColor: `${accent}55`, boxShadow: `0 0 24px ${accent}18` }}>
          <span className={isBoss ? 'moria-soft-pulse' : ''}>{target.emoji || '☠'}</span>
          {isBoss && <span className="absolute -right-1 -top-1 text-[10px]">♛</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-black text-amber-50">{target.name}</span>
            <span className="shrink-0 text-[10px] font-bold" style={{ color: accent }}>Lv {level}</span>
          </div>
          <div className="relative mt-1.5 h-3 overflow-hidden rounded-full border border-rose-900/50 bg-black/70">
            <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${isBoss ? '#9f1f35' : '#a72a3b'}, ${accent})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.16),transparent_48%)]" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px]">
            <span className="font-mono text-rose-200">{Math.ceil(hp).toLocaleString()} / {Math.ceil(maxHp).toLocaleString()}</span>
            <span className="font-black text-slate-400">{hpPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {(Number.isFinite(target.attack) || Number.isFinite(target.defense)) && (
        <div className="mt-2 flex gap-2 text-[9px] font-bold text-slate-400">
          {Number.isFinite(target.attack) && <span className="moria-chip rounded-md px-1.5 py-0.5">⚔ {Math.floor(Number(target.attack))}</span>}
          {Number.isFinite(target.defense) && <span className="moria-chip rounded-md px-1.5 py-0.5">🛡 {Math.floor(Number(target.defense))}</span>}
        </div>
      )}
    </div>
  );
}

export default memo(CombatTargetFrameInner);
''', encoding='utf-8')

# -------------------------------------------------------------------
# Action bar: independent 10fps clock + radial cooldown sweep.
# -------------------------------------------------------------------
ACTION_BAR.write_text(r'''import { memo, useEffect, useState } from 'react';
import type { Player, Spell } from '../game/types';
import { T as Tooltip, SpellTooltip } from './Tooltip';

interface Props {
  player: Player;
  spells: Spell[];
  potions: { hp: number; mp: number; hpg: number };
  onCastSpell: (idx: number) => void;
  onUsePotion: (type: 'hp' | 'mp' | 'hpg') => void;
}

function ActionBarInner({ player, spells, potions, onCastSpell, onUsePotion }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-auto absolute bottom-[168px] left-1/2 z-20 -translate-x-1/2 xl:bottom-5">
      <div className="moria-panel moria-glow-gold flex items-end gap-1.5 rounded-2xl px-2.5 py-2 shadow-2xl">
        <PotionSlot icon="🧪" count={potions.hp} accent="#58d6a8" label="Health Potion (P)" detail="+50 HP" onClick={() => onUsePotion('hp')} />
        <PotionSlot icon="🧴" count={potions.mp} accent="#6ea8ff" label="Mana Potion (M)" detail="+50 MP" onClick={() => onUsePotion('mp')} />
        {potions.hpg > 0 && (
          <PotionSlot icon="🍷" count={potions.hpg} accent="#ff7d8b" label="Greater Health Potion" detail="+200 HP" onClick={() => onUsePotion('hpg')} />
        )}

        <div className="mx-1.5 h-10 w-px bg-gradient-to-b from-transparent via-amber-200/25 to-transparent" />

        {spells.map((spell, i) => {
          const elapsed = now - spell.lastCast;
          const onCd = elapsed < spell.cooldown;
          const noMana = player.mana < spell.mana;
          const locked = (spell.levelRequired || 1) > player.level;
          const remaining = Math.max(0, spell.cooldown - elapsed);
          const cooldownFraction = spell.cooldown > 0 ? Math.max(0, Math.min(1, remaining / spell.cooldown)) : 0;
          const ready = !onCd && !noMana && !locked;

          return (
            <Tooltip key={spell.id} position="top" content={<SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />}>
              <button
                onClick={() => onCastSpell(i)}
                disabled={onCd || noMana || locked}
                className={`moria-slot relative flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-xl ${locked ? 'border-rose-400/20' : noMana ? 'border-blue-400/15' : ready ? 'moria-action-ready' : ''}`}
                style={!locked && !onCd && !noMana ? { borderColor: `${spell.color}66`, boxShadow: `inset 0 1px rgba(255,255,255,.06), 0 8px 22px rgba(0,0,0,.3), 0 0 14px ${spell.color}14` } : undefined}
              >
                <div className="text-2xl leading-none" style={{ filter: `drop-shadow(0 0 7px ${spell.color}80)` }}>{locked ? '🔒' : spell.icon}</div>
                <div className="absolute left-1 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-md border border-amber-200/20 bg-black/70 px-1 text-[9px] font-black text-amber-100">{i + 1}</div>
                <div className="absolute bottom-1 right-1 z-10 rounded-md border border-blue-300/15 bg-black/65 px-1 text-[8px] font-black text-blue-200">{spell.mana}</div>
                {onCd && !locked && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{ background: `conic-gradient(from 0deg, rgba(0,0,0,.82) ${cooldownFraction * 360}deg, rgba(0,0,0,.18) ${cooldownFraction * 360}deg)` }}
                    />
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                      <span className="text-sm font-black text-white drop-shadow-lg">{remaining >= 1000 ? (remaining / 1000).toFixed(1) : `${Math.ceil(remaining)}ms`}</span>
                    </div>
                  </>
                )}
                {noMana && !locked && !onCd && <div className="pointer-events-none absolute inset-x-1 bottom-1 h-0.5 rounded bg-blue-400/70" />}
                {locked && <div className="absolute inset-x-0 bottom-0 bg-rose-950/80 py-0.5 text-center text-[8px] font-bold text-rose-200">LV {spell.levelRequired}</div>}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function PotionSlot({ icon, count, accent, label, detail, onClick }: {
  icon: string;
  count: number;
  accent: string;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <Tooltip position="top" content={<div className="text-xs"><b>{label}</b><br/><span style={{ color: accent }}>{detail}</span></div>}>
      <button
        onClick={() => count > 0 && onClick()}
        disabled={count <= 0}
        className="moria-slot relative flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ borderColor: `${accent}44` }}
      >
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 7px ${accent}66)` }}>{icon}</span>
        <span className="absolute -bottom-1 -right-1 flex min-w-5 items-center justify-center rounded-full border bg-[#060912] px-1 text-[9px] font-black" style={{ borderColor: `${accent}66`, color: accent }}>{count}</span>
      </button>
    </Tooltip>
  );
}

export const ActionBar = memo(ActionBarInner);
export default ActionBar;
''', encoding='utf-8')

# -------------------------------------------------------------------
# Server event presentation callback: keeps authority server-side while the
# client is free to add non-authoritative particles/shake/audio presentation.
# -------------------------------------------------------------------
sync = SERVER_SYNC.read_text(encoding='utf-8')
old_sig = """    addFloatingText: (text: string, pos: { x: number; y: number }, color: string, big?: boolean) => void,
    addMessage: (sender: string, text: string, color: string, channel: any) => void,
  ): string[] {
"""
new_sig = """    addFloatingText: (text: string, pos: { x: number; y: number }, color: string, big?: boolean) => void,
    addMessage: (sender: string, text: string, color: string, channel: any) => void,
    onFeedback?: (event: any) => void,
  ): string[] {
"""
if old_sig not in sync:
    raise SystemExit('ServerSync processEvents signature marker missing')
sync = sync.replace(old_sig, new_sig, 1)
old_event = """      const event = state.events[index];
      const id = `${event.kind}_${event.targetId || ''}_${event.amount || ''}_${index}`;
"""
new_event = """      const event = state.events[index];
      try { onFeedback?.(event); } catch { /* presentation must never break snapshot consumption */ }
      const id = `${event.kind}_${event.targetId || ''}_${event.amount || ''}_${index}`;
"""
if old_event not in sync:
    raise SystemExit('ServerSync event loop marker missing')
sync = sync.replace(old_event, new_event, 1)
SERVER_SYNC.write_text(sync, encoding='utf-8')

# -------------------------------------------------------------------
# GameScreen: component extraction, authoritative target highlight and impact.
# -------------------------------------------------------------------
screen = SCREEN.read_text(encoding='utf-8')
import_anchor = "import SocialHub from './SocialHub';"
if import_anchor not in screen:
    raise SystemExit('GameScreen import anchor missing')
screen = screen.replace(import_anchor, import_anchor + "\nimport CombatTargetFrame, { type CombatTargetView } from './CombatTargetFrame';", 1)

quick_anchor = """  const orderedQuickActions = uiLayout.panelOrder.map((id) => ({ id, action: quickActions[id] })).filter((entry) => Boolean(entry.action));

  return (
"""
quick_replacement = """  const orderedQuickActions = uiLayout.panelOrder.map((id) => ({ id, action: quickActions[id] })).filter((entry) => Boolean(entry.action));
  const activeTarget: CombatTargetView | null = player.targetId
    ? ((serverSync.isActive()
        ? serverMonstersRef.current.find((monster: any) => monster.id === player.targetId && monster.hp > 0)
        : monstersRef.current.find((monster) => monster.id === player.targetId && !monster.dead)) as CombatTargetView | undefined) || null
    : null;

  return (
"""
if quick_anchor not in screen:
    raise SystemExit('GameScreen return anchor missing')
screen = screen.replace(quick_anchor, quick_replacement, 1)

frame_start = "          {/* Target Frame */}"
frame_end = "          {/* Active Hunt Tracker */}"
if frame_start not in screen or frame_end not in screen:
    raise SystemExit('Inline Target Frame markers missing')
start = screen.index(frame_start)
end = screen.index(frame_end, start)
new_frame = """          {/* Combat target presentation is isolated from the game orchestrator. */}
          <CombatTargetFrame target={activeTarget} playerLevel={player.level} playerPos={player.pos} />

"""
screen = screen[:start] + new_frame + screen[end:]

old_target_highlight_start = "    // Target highlight\n"
old_projectiles = "    // Projectiles\n"
if old_target_highlight_start not in screen or old_projectiles not in screen:
    raise SystemExit('Canvas target highlight markers missing')
start = screen.index(old_target_highlight_start)
end = screen.index(old_projectiles, start)
new_target_highlight = r'''    // Target highlight — use the same authoritative/local collection used to render monsters.
    if (p.targetId) {
      const t = renderMonsters.find((monster: any) => monster.id === p.targetId);
      if (t) {
        const targetX = t.pos ? t.pos.x : t.x;
        const targetY = t.pos ? t.pos.y : t.y;
        const tx = (targetX - cam.x) * TILE_SIZE;
        const ty = (targetY - cam.y) * TILE_SIZE;
        const boss = t.type === 'boss';
        const elite = t.type === 'elite';
        const accent = boss ? '#ffd87b' : elite ? '#b88aff' : '#ff6060';
        const pulse = 0.62 + Math.sin(now / 140) * 0.22;
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = boss ? 3 : 2;
        ctx.beginPath();
        ctx.ellipse(tx + TILE_SIZE / 2, ty + TILE_SIZE * 0.84, TILE_SIZE * (boss ? 0.52 : 0.43), TILE_SIZE * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.22 + pulse * 0.16;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.ellipse(tx + TILE_SIZE / 2, ty + TILE_SIZE * 0.84, TILE_SIZE * (boss ? 0.48 : 0.39), TILE_SIZE * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

'''
screen = screen[:start] + new_target_highlight + screen[end:]

# Make elite/boss silhouettes readable before target selection.
monster_anchor = """      drawMonster(ctx, sx, sy, TILE_SIZE, {
        name: m.name, hp: m.hp, maxHp: m.maxHp,
"""
monster_insert = """      if (m.type === 'boss' || m.type === 'elite') {
        const accent = m.type === 'boss' ? '#ffd87b' : '#b88aff';
        const aura = 0.24 + (Math.sin(now / (m.type === 'boss' ? 220 : 320)) + 1) * 0.09;
        ctx.save();
        ctx.globalAlpha = aura;
        ctx.strokeStyle = accent;
        ctx.lineWidth = m.type === 'boss' ? 3 : 2;
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE * (m.type === 'boss' ? 0.58 : 0.48), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      drawMonster(ctx, sx, sy, TILE_SIZE, {
        name: m.name, hp: m.hp, maxHp: m.maxHp,
"""
if monster_anchor not in screen:
    raise SystemExit('Monster render anchor missing')
screen = screen.replace(monster_anchor, monster_insert, 1)

# Spell hits should feel as physical as melee without changing damage values.
direct_spell_anchor = """        spawnParticles(target.pos, spell.damageType === 'ice' ? '#9bd4ff' : spell.damageType === 'fire' ? '#ff6a00' : spell.color, 8);
        addMessage('System', `${spell.name} → ${target.name}: ${finalDmg}${crit ? ' CRIT!' : ''}!`, spell.color, 'battle');
"""
direct_spell_replacement = """        spawnParticles(target.pos, spell.damageType === 'ice' ? '#9bd4ff' : spell.damageType === 'fire' ? '#ff6a00' : spell.color, crit ? 14 : 8);
        screenShakeRef.current = Math.max(screenShakeRef.current, crit ? 8 : 4);
        addMessage('System', `${spell.name} → ${target.name}: ${finalDmg}${crit ? ' CRIT!' : ''}!`, spell.color, 'battle');
"""
if direct_spell_anchor not in screen:
    raise SystemExit('Direct spell impact anchor missing')
screen = screen.replace(direct_spell_anchor, direct_spell_replacement, 1)

aoe_anchor = """      spawnParticles(p.pos, spell.color, 20);
    } else {
"""
aoe_replacement = """      spawnParticles(p.pos, spell.color, 20);
      if (hits > 0) screenShakeRef.current = Math.max(screenShakeRef.current, Math.min(9, 4 + hits));
    } else {
"""
if aoe_anchor not in screen:
    raise SystemExit('AOE impact anchor missing')
screen = screen.replace(aoe_anchor, aoe_replacement, 1)

server_events_anchor = "          serverSync.processEvents(addFloatingText, addMessage);"
server_events_replacement = """          serverSync.processEvents(addFloatingText, addMessage, (event) => {
            const eventPos = event?.pos || p.pos;
            if (event?.kind === 'damage') {
              const amount = Math.max(0, Number(event.amount) || 0);
              spawnParticles(eventPos, event.color || '#ff6060', amount >= 100 ? 12 : 6);
              screenShakeRef.current = Math.max(screenShakeRef.current, amount >= 100 ? 8 : amount >= 40 ? 5 : 3);
              if (amount >= 100) audio.hitCrit(); else audio.hit();
            } else if (event?.kind === 'heal') {
              spawnParticles(eventPos, event.color || '#58d6a8', 8);
              audio.heal();
            } else if (event?.kind === 'spell') {
              spawnParticles(eventPos, event.color || '#b398ff', 10);
            } else if (event?.kind === 'levelup') {
              spawnParticles(eventPos, event.color || '#f4e04d', 24);
              audio.levelUp();
            }
          });"""
if server_events_anchor not in screen:
    raise SystemExit('Server event processing anchor missing')
screen = screen.replace(server_events_anchor, server_events_replacement, 1)

SCREEN.write_text(screen, encoding='utf-8')

# -------------------------------------------------------------------
# Global presentation animations.
# -------------------------------------------------------------------
css = CSS.read_text(encoding='utf-8')
css_add = r'''

/* Mor'ia 8.2 — combat readability and feedback */
@keyframes moria-target-enter {
  from { opacity: 0; transform: translateY(-7px) scale(0.975); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes moria-target-boss-breathe {
  0%, 100% { box-shadow: 0 24px 70px rgba(0,0,0,.48), 0 0 18px rgba(255,216,123,.05); }
  50% { box-shadow: 0 24px 70px rgba(0,0,0,.48), 0 0 34px rgba(255,216,123,.16); }
}

@keyframes moria-action-ready-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.08); }
}

.moria-target-frame {
  animation: moria-target-enter 180ms cubic-bezier(.2,.8,.2,1) both;
}

.moria-target-boss {
  animation: moria-target-enter 180ms cubic-bezier(.2,.8,.2,1) both, moria-target-boss-breathe 2s ease-in-out 180ms infinite;
}

.moria-action-ready:not(:disabled) {
  animation: moria-action-ready-pulse 2.4s ease-in-out infinite;
}
'''
if 'Mor\'ia 8.2 — combat readability and feedback' not in css:
    css = css + css_add
CSS.write_text(css, encoding='utf-8')

# -------------------------------------------------------------------
# Regression guards.
# -------------------------------------------------------------------
TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const screen = read('src/components/GameScreen.tsx');
const actionBar = read('src/components/ActionBar.tsx');
const targetFrame = read('src/components/CombatTargetFrame.tsx');
const sync = read('src/game/ServerSync.ts');

test('combat target presentation is extracted and authoritative targets stay highlighted', () => {
  assert.match(screen, /<CombatTargetFrame/);
  assert.match(screen, /renderMonsters\.find\(\(monster: any\) => monster\.id === p\.targetId\)/);
  assert.doesNotMatch(screen, /\{\/\* Target Frame \*\/\}[\s\S]{0,200}player\.targetId && \(\(\) =>/);
  assert.match(targetFrame, /BOSS TARGET/);
  assert.match(targetFrame, /DANGEROUS/);
});

test('action bar owns a live cooldown clock and renders radial cooldown progress', () => {
  assert.match(actionBar, /setInterval\(\(\) => setNow\(Date\.now\(\)\), 100\)/);
  assert.match(actionBar, /conic-gradient/);
  assert.match(actionBar, /cooldownFraction/);
});

test('authoritative server events expose presentation-only feedback without changing authority', () => {
  assert.match(sync, /onFeedback\?: \(event: any\) => void/);
  assert.match(sync, /onFeedback\?\.\(event\)/);
  assert.match(screen, /serverSync\.processEvents\(addFloatingText, addMessage, \(event\) =>/);
});
''', encoding='utf-8')

DOC.write_text(r'''# Mor'ia 8.2 — Combat Feel

## Goal

Make combat easier to read and more satisfying without moving any authoritative decision to the browser.

## Player-facing improvements

- Target frame is now a dedicated combat component with health %, level danger, distance, boss/elite identity and optional combat stats.
- Authoritative online targets use the same target highlight path as locally simulated monsters.
- Bosses and elites have subtle world-space aura rings before selection.
- Spell impacts now drive particles and screen shake, with stronger critical feedback.
- Authoritative server damage/heal/spell/level events can trigger presentation-only particles, audio and shake after the server event is consumed.
- Action-bar cooldowns own a 10fps presentation clock, so countdowns remain fluid even when memoized parent props do not change.
- Cooldowns use a radial sweep plus exact remaining time.

## Authority boundary

The 8.2 feedback callback receives already-authoritative snapshot events. It cannot apply damage, healing, loot, XP or progression. The server remains the only source of gameplay truth.
''', encoding='utf-8')

print(f'GameScreen bytes: {len(screen.encode("utf-8"))}')
print('Mor\'ia 8.2 combat-feel migration prepared')
