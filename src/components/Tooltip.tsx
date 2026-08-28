import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Player, Spell, SchoolValues } from '../game/types';
import { buildSpellScalingBreakdown, normalizeSchool, SCHOOL_META } from '../game/elementalScaling';

interface TooltipData {
  content: React.ReactNode;
  rect: DOMRect;
  preferred?: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_ID = '__global_tooltip_root__';

function ensureRoot(): HTMLElement {
  let root = document.getElementById(TOOLTIP_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = TOOLTIP_ID;
    root.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
    document.body.appendChild(root);
  }
  return root;
}

// Singleton tooltip state
let tooltipListeners: Array<(d: TooltipData | null) => void> = [];

function showGlobalTooltip(data: TooltipData) {
  tooltipListeners.forEach((fn) => fn(data));
}

function hideGlobalTooltip() {
  tooltipListeners.forEach((fn) => fn(null));
}

/** Portal-rendered tooltip that lives at the body level */
function GlobalTooltipRenderer() {
  const [data, setData] = useState<TooltipData | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tooltipListeners.push(setData);
    return () => {
      tooltipListeners = tooltipListeners.filter((fn) => fn !== setData);
    };
  }, []);

  if (!data) return null;

  // Calculate best position
  const padding = 12;
  const tooltipW = 280;
  const tooltipH = 200; // estimate
  const r = data.rect;
  let x = 0, y = 0;
  const preferred = data.preferred || 'top';

  // Try preferred position first
  if (preferred === 'top' && r.top - tooltipH - padding > 0) {
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.top - tooltipH - padding;
  } else if (preferred === 'bottom' && r.bottom + tooltipH + padding < window.innerHeight) {
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.bottom + padding;
  } else if (preferred === 'left' && r.left - tooltipW - padding > 0) {
    x = r.left - tooltipW - padding;
    y = r.top + r.height / 2 - tooltipH / 2;
  } else if (preferred === 'right' && r.right + tooltipW + padding < window.innerWidth) {
    x = r.right + padding;
    y = r.top + r.height / 2 - tooltipH / 2;
  } else {
    // Fallback: below
    x = r.left + r.width / 2 - tooltipW / 2;
    y = r.bottom + padding;
    // If would go below viewport, go above
    if (y + tooltipH > window.innerHeight) {
      y = Math.max(4, r.top - tooltipH - padding);
    }
  }

  // Clamp to viewport
  x = Math.max(4, Math.min(window.innerWidth - tooltipW - 4, x));
  y = Math.max(4, Math.min(window.innerHeight - tooltipH - 4, y));

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        maxWidth: `${tooltipW}px`,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div
        className="rounded-lg border-2 px-3 py-2 text-xs backdrop-blur-md shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(40,20,40,0.98) 0%, rgba(20,10,20,0.98) 100%)',
          borderColor: '#ff00ff',
          boxShadow: '0 0 20px rgba(255,0,255,0.4), 0 4px 30px rgba(0,0,0,0.8)',
          color: '#fff',
          minWidth: '160px',
        }}
      >
        {data.content}
      </div>
    </div>,
    ensureRoot()
  );
}

export default GlobalTooltipRenderer;

interface TriggerProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export function T({ content, children, position = 'top', delay = 150, disabled }: TriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>(undefined);

  const handleEnter = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        showGlobalTooltip({
          content,
          rect: triggerRef.current.getBoundingClientRect(),
          preferred: position,
        });
      }
    }, delay);
  }, [content, position, delay, disabled]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideGlobalTooltip();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      hideGlobalTooltip();
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="inline-flex"
    >
      {children}
    </div>
  );
}

/** Shorthand for T */
export const Tooltip = T;

export function ItemTooltip({
  item,
}: {
  item: {
    name: string;
    icon: string;
    description?: string;
    value: number;
  equipment?: {
    attack?: number;
    defense?: number;
    armor?: number;
    hp?: number;
    mana?: number;
    magic?: number;
    critChance?: number;
    lifesteal?: number;
    thorns?: number;
    moveSpeed?: number;
    xpBonus?: number;
    goldBonus?: number;
    damageReduction?: number;
    damageBonuses?: SchoolValues; resistances?: SchoolValues; weaknesses?: SchoolValues; skillBonuses?: Record<string,number>; resistancePierce?: SchoolValues; spellPower?: number; physicalPower?: number;
    rarity: string;
    level: number;
    slot: string;
    affixes?: Array<{ id: string; name: string; description: string; stats: Record<string, number> }>;
  };
  };
}) {
  const rarityColors: Record<string, string> = {
    common: '#aaaaaa',
    uncommon: '#2ecc71',
    rare: '#3498db',
    epic: '#9b59ff',
    legendary: '#ff8c00',
  };

  return (
    <div className="space-y-1 min-w-[160px]">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{item.icon}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: item.equipment ? rarityColors[item.equipment.rarity] : '#f4e04d' }}>
            {item.name}
          </div>
          {item.equipment && (
            <div className="text-[10px] uppercase tracking-wider" style={{ color: rarityColors[item.equipment.rarity] }}>
              {item.equipment.rarity} · Lv {item.equipment.level} · {item.equipment.slot}
            </div>
          )}
        </div>
      </div>
      {item.equipment && (
        <div className="space-y-0.5 text-[11px] border-t border-purple-700/40 pt-1">
          {item.equipment.attack ? <div style={{ color: '#ff6060' }}>⚔ +{item.equipment.attack} Attack</div> : null}
          {item.equipment.defense ? <div style={{ color: '#6090ff' }}>🛡 +{item.equipment.defense} Defense</div> : null}
          {item.equipment.armor ? <div style={{ color: '#a0a0a0' }}>🎽 +{item.equipment.armor} Armor</div> : null}
          {item.equipment.hp ? <div style={{ color: '#2ecc71' }}>❤ +{item.equipment.hp} HP</div> : null}
          {item.equipment.mana ? <div style={{ color: '#3498db' }}>✦ +{item.equipment.mana} Mana</div> : null}
          {item.equipment.magic ? <div style={{ color: '#9b59ff' }}>🔮 +{item.equipment.magic} Magic</div> : null}
          {item.equipment.critChance ? <div style={{ color: '#ff4444' }}>🎯 +{item.equipment.critChance}% Crit</div> : null}
          {item.equipment.lifesteal ? <div style={{ color: '#c13030' }}>🩸 +{item.equipment.lifesteal}% Lifesteal</div> : null}
          {item.equipment.thorns ? <div style={{ color: '#4a7c3a' }}>🌵 +{item.equipment.thorns} Thorns</div> : null}
          {item.equipment.moveSpeed ? <div style={{ color: '#9bd4ff' }}>💨 +{item.equipment.moveSpeed}% Speed</div> : null}
          {item.equipment.xpBonus ? <div style={{ color: '#f4e04d' }}>⭐ +{item.equipment.xpBonus}% XP</div> : null}
          {item.equipment.goldBonus ? <div style={{ color: '#f4e04d' }}>🪙 +{item.equipment.goldBonus}% Gold</div> : null}
          {item.equipment.damageReduction ? <div style={{ color: '#4a90e2' }}>🛡 -{item.equipment.damageReduction}% Dmg Taken</div> : null}
          {Object.entries(item.equipment.damageBonuses || {}).map(([school,value]) => <div key={`power-${school}`} style={{ color: SCHOOL_META[normalizeSchool(school)].color }}>{SCHOOL_META[normalizeSchool(school)].icon} +{value}% {SCHOOL_META[normalizeSchool(school)].label} Power</div>)}
          {Object.entries(item.equipment.resistances || {}).map(([school,value]) => <div key={`res-${school}`} className="text-cyan-200">🛡 +{value}% {SCHOOL_META[normalizeSchool(school)].label} Resistance</div>)}
          {Object.entries(item.equipment.weaknesses || {}).map(([school,value]) => <div key={`weak-${school}`} className="text-rose-300">⚠ +{value}% {SCHOOL_META[normalizeSchool(school)].label} Vulnerability</div>)}
          {Object.entries(item.equipment.skillBonuses || {}).map(([skill,value]) => <div key={`skill-${skill}`} className="text-emerald-300">📈 +{value} {skill} skill</div>)}
          {Object.entries(item.equipment.resistancePierce || {}).map(([school,value]) => <div key={`pierce-${school}`} className="text-orange-300">✦ {value}% {SCHOOL_META[normalizeSchool(school)].label} resist pierce</div>)}
          {(item.equipment.affixes || []).length > 0 && (
            <div className="mt-1 border-t border-fuchsia-500/30 pt-1 space-y-1">
              {(item.equipment.affixes || []).map((affix) => (
                <div key={affix.id}>
                  <div className="font-black text-fuchsia-300">✦ {affix.name}</div>
                  <div className="text-[9px] text-fuchsia-100/65">{affix.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {item.description && (
        <div className="text-[10px] italic text-amber-200/70 border-t border-purple-700/40 pt-1">
          {item.description}
        </div>
      )}
      <div className="text-[10px] text-amber-400 border-t border-purple-700/40 pt-1">💰 Value: {item.value} gold</div>
    </div>
  );
}

export function SpellTooltip({
  spell,
  player,
  idx,
  noMana,
  onCd,
  locked,
}: {
  player?: Player;
  spell: {
    name: string;
    icon: string;
    mana: number;
    cooldown: number;
    damage: number;
    range: number;
    color: string;
    type: string;
    levelRequired?: number;
    damageType?: string; scalingStat?: 'attack'|'magic'|'hybrid'; skillId?: string; weaponSkill?: 'fist'|'sword'|'axe'|'club'|'distance'; skillScaling?: number;
    scalingCoeff?: number;
    critChance?: number;
    critMult?: number;
    lifestealPercent?: number;
    variance?: number;
    hitCount?: number;
    piercePercent?: number;
    targetMode?: string; allyEffect?: string; enemyEffect?: string;
    allyMultiplier?: number; enemyMultiplier?: number; selfMultiplier?: number;
    dayMultiplier?: number; nightMultiplier?: number; drainPercent?: number;
  };
  idx: number;
  noMana: boolean;
  onCd: boolean;
  locked?: boolean;
}) {
  const school = normalizeSchool(spell.damageType);
  const meta = SCHOOL_META[school];
  const scaling = player ? buildSpellScalingBreakdown(player, spell as Spell) : null;
  return (
    <div className="space-y-1 min-w-[190px]">
      <div className="flex items-center gap-2">
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${spell.color})` }}>{locked ? '🔒' : spell.icon}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: locked ? '#ff6060' : spell.color }}>{spell.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-amber-200/60">
            {spell.type} · Hotkey: {idx + 1}
          </div>
        </div>
      </div>
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[11px]">
        {(spell.levelRequired ?? 1) > 1 && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">Required Level:</span>
            <span className={locked ? 'text-red-400 font-bold' : 'text-green-400'}>Lv {spell.levelRequired}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-amber-200/70">Mana Cost:</span>
          <span className={noMana ? 'text-red-400 font-bold' : 'text-blue-300'}>{spell.mana}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{spell.type === 'heal' ? 'Base Heal' : 'Base Damage'}:</span>
          <span className="text-amber-100">{spell.damage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">Cooldown:</span>
          <span className="text-amber-100">{(spell.cooldown / 1000).toFixed(1)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">Range:</span>
          <span className="text-amber-100">{spell.range === 0 ? 'Self' : spell.range <= 1.5 ? 'Melee' : `${spell.range} tiles`}</span>
        </div>
      </div>
      {/* Detailed formula */}
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[10px]">
        {spell.damageType && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">Element:</span>
            <span className="capitalize" style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
          </div>
        )}
        {spell.scalingCoeff && (
          <div className="flex justify-between"><span className="text-amber-200/70">Scaling:</span><span className="text-purple-300">×{spell.scalingCoeff} {(spell.scalingStat || (school==='physical'?'attack':'magic')).toUpperCase()}</span></div>
        )}
        {scaling && (
          <div className="mt-1 space-y-1 border-t border-fuchsia-400/20 pt-1">
            <div className="font-black uppercase tracking-wider text-fuchsia-200">Influence chain</div>
            <div className="flex justify-between"><span className="text-slate-400">{scaling.statKind} stat</span><span className="text-purple-200">{scaling.stat.toFixed(0)} × {scaling.coeff}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{scaling.skillId} skill</span><span className="text-emerald-300">Lv {scaling.effectiveSkill.toFixed(0)} → ×{scaling.skillMultiplier.toFixed(3)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">gear · {meta.label}</span><span style={{color:meta.color}}>+{scaling.itemBonus.toFixed(1)}% → ×{scaling.itemMultiplier.toFixed(3)}</span></div>
            {scaling.pierce > 0 && <div className="flex justify-between"><span className="text-slate-400">resistance pierce</span><span className="text-orange-300">{scaling.pierce.toFixed(0)}%</span></div>}
            <div className="flex justify-between border-t border-white/10 pt-1 font-black"><span className="text-amber-100">Estimated power</span><span className="text-white">{scaling.estimated}</span></div>
          </div>
        )}
        {(spell.critChance ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">Crit:</span><span className="text-red-300">{spell.critChance}% (×{spell.critMult})</span></div>
        )}
        {(spell.lifestealPercent ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">Lifesteal:</span><span className="text-pink-300">{spell.lifestealPercent}%</span></div>
        )}
        {(spell.piercePercent ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">Pierce:</span><span className="text-orange-300">{spell.piercePercent}% DEF</span></div>
        )}
        {(spell.hitCount ?? 1) > 1 && (
          <div className="flex justify-between"><span className="text-amber-200/70">Hits:</span><span className="text-amber-100">×{spell.hitCount}</span></div>
        )}
        {(spell.variance ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">Variance:</span><span className="text-amber-100">±{((spell.variance ?? 0) * 100).toFixed(0)}%</span></div>
        )}
        {(spell.allyEffect || spell.enemyEffect) && (
          <div className="mt-1 border-t border-cyan-400/20 pt-1 space-y-0.5">
            <div className="font-bold text-cyan-200">Contextual skill</div>
            {spell.allyEffect && spell.allyEffect !== 'none' && <div>🤝 Ally: {spell.allyEffect} ×{(spell.allyMultiplier ?? 1).toFixed(2)}</div>}
            {spell.enemyEffect && spell.enemyEffect !== 'none' && <div>⚔ Enemy: {spell.enemyEffect} ×{(spell.enemyMultiplier ?? 1).toFixed(2)}</div>}
            {((spell.dayMultiplier ?? 1) !== 1 || (spell.nightMultiplier ?? 1) !== 1) && <div>☀ ×{(spell.dayMultiplier ?? 1).toFixed(2)} · 🌙 ×{(spell.nightMultiplier ?? 1).toFixed(2)}</div>}
            {(spell.drainPercent ?? 0) > 0 && <div>🩸 Drain: {spell.drainPercent}%</div>}
          </div>
        )}
      </div>
      {locked && (
        <div className="text-red-400 text-center pt-1 font-bold border-t border-purple-700/40">🔒 Locked - Level {spell.levelRequired} required</div>
      )}
      {!locked && onCd && (
        <div className="text-red-400 text-center pt-1 font-bold border-t border-purple-700/40">⏱ On Cooldown</div>
      )}
      {!locked && !onCd && noMana && (
        <div className="text-red-400 text-center font-bold">Not enough mana</div>
      )}
    </div>
  );
}

export function StatTooltip({
  label,
  value,
  description,
  breakdown,
}: {
  label: string;
  value: number;
  description: string;
  breakdown?: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="font-bold text-sm text-amber-100">{label}: {value}</div>
      <div className="text-[10px] text-amber-200/70 border-t border-purple-700/40 pt-1">{description}</div>
      {breakdown && (
        <div className="space-y-0.5 text-[10px] border-t border-purple-700/40 pt-1">
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-amber-200/70">{b.label}</span>
              <span style={{ color: b.color }}>{b.value > 0 ? '+' : ''}{b.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MonsterTooltip({
  monster,
}: {
  monster: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    xp: number;
    type?: string;
    emoji: string;
    damageType?: string;
  };
}) {
  const typeColors: Record<string, string> = {
    normal: '#aaaaaa',
    elite: '#c832ff',
    boss: '#ffd700',
  };
  const tColor = typeColors[monster.type || 'normal'] || '#aaaaaa';
  return (
    <div className="space-y-1 min-w-[160px]">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{monster.emoji}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: tColor }}>
            {monster.name}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: tColor }}>
            {monster.type || 'normal'} · Lv {monster.level}
          </div>
        </div>
      </div>
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-amber-200/70">HP:</span>
          <span className="text-red-300">{monster.hp} / {monster.maxHp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">Attack:</span>
          <span className="text-red-300">{monster.attack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">Defense:</span>
          <span className="text-blue-300">{monster.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">XP Reward:</span>
          <span className="text-yellow-300">{monster.xp}</span>
        </div>
        {monster.damageType && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">Damage Type:</span>
            <span className="text-purple-300 capitalize">{monster.damageType}</span>
          </div>
        )}
      </div>
    </div>
  );
}
