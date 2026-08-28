import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Player, Spell, SchoolValues } from '../game/types';
import { buildSpellScalingBreakdown, normalizeSchool, SCHOOL_META } from '../game/elementalScaling';
import { reactionHintsForSchool } from '../game/elementalReactions';
import { t as tr } from '../i18n';

interface TooltipData {
  content: React.ReactNode;
  rect: DOMRect;
  preferred?: 'top' | 'bottom' | 'left' | 'right';
}

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

type TooltipSize = { width: number; height: number };

function resolveTooltipPosition(data: TooltipData, size: TooltipSize) {
  const edge = 4;
  const padding = 12;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const r = data.rect;
  const width = Math.min(size.width, Math.max(160, viewportW - edge * 2));
  const height = Math.min(size.height, Math.max(80, viewportH - edge * 2));
  const centerX = r.left + r.width / 2;
  const centerY = r.top + r.height / 2;
  const placements: Record<TooltipPlacement, { x: number; y: number }> = {
    top: { x: centerX - width / 2, y: r.top - height - padding },
    bottom: { x: centerX - width / 2, y: r.bottom + padding },
    left: { x: r.left - width - padding, y: centerY - height / 2 },
    right: { x: r.right + padding, y: centerY - height / 2 },
  };
  const preferred = (data.preferred || 'top') as TooltipPlacement;
  const opposite: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const perpendicular: Record<TooltipPlacement, TooltipPlacement[]> = {
    top: ['right', 'left'], bottom: ['right', 'left'], left: ['top', 'bottom'], right: ['top', 'bottom'],
  };
  const order = [preferred, opposite[preferred], ...perpendicular[preferred]];
  const fits = ({ x, y }: { x: number; y: number }) => x >= edge && y >= edge && x + width <= viewportW - edge && y + height <= viewportH - edge;
  const selected = order.map((placement) => placements[placement]).find(fits) || placements[preferred];
  return {
    x: Math.max(edge, Math.min(viewportW - width - edge, selected.x)),
    y: Math.max(edge, Math.min(viewportH - height - edge, selected.y)),
  };
}

/** Shared body-level portal renderer used by real tooltip triggers. */
function TooltipPortal({ data }: { data: TooltipData }) {
  const portalRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<TooltipSize>({ width: 280, height: 200 });
  const position = resolveTooltipPosition(data, measured);

  useLayoutEffect(() => {
    const node = portalRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = { width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
    setMeasured((current) => current.width === next.width && current.height === next.height ? current : next);
  }, [data.content]);

  return createPortal(
    <div
      ref={portalRef}
      data-tooltip-portal="true"
      style={{
        position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, maxWidth: '280px',
        maxHeight: 'calc(100vh - 8px)', overflowY: 'auto', zIndex: 99999, pointerEvents: 'none',
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
    document.body,
  );
}

/** Compatibility mount retained while trigger-owned portals handle real tooltips. */
function GlobalTooltipRenderer() {
  return null;
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [localData, setLocalData] = useState<TooltipData | null>(null);

  const handleEnter = useCallback(() => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const node = triggerRef.current;
      if (!node) return;
      setLocalData({ content, rect: node.getBoundingClientRect(), preferred: position });
    }, delay);
  }, [content, position, delay, disabled]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setLocalData(null);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        data-tooltip-trigger="true"
        data-tooltip-open={localData ? 'true' : 'false'}
        className="inline-flex"
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onFocusCapture={handleEnter}
        onBlurCapture={handleLeave}
      >
        {children}
      </div>
      {localData ? <TooltipPortal data={localData} /> : null}
    </>
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
            {tr(item.name)}
          </div>
          {item.equipment && (
            <div className="text-[10px] uppercase tracking-wider" style={{ color: rarityColors[item.equipment.rarity] }}>
              {tr(item.equipment.rarity)} · {tr('Lv')} {item.equipment.level} · {tr(item.equipment.slot)}
            </div>
          )}
        </div>
      </div>
      {item.equipment && (
        <div className="space-y-0.5 text-[11px] border-t border-purple-700/40 pt-1">
          {item.equipment.attack ? <div style={{ color: '#ff6060' }}>⚔ +{item.equipment.attack} {tr('Attack')}</div> : null}
          {item.equipment.defense ? <div style={{ color: '#6090ff' }}>🛡 +{item.equipment.defense} {tr('Defense')}</div> : null}
          {item.equipment.armor ? <div style={{ color: '#a0a0a0' }}>🎽 +{item.equipment.armor} {tr('Armor')}</div> : null}
          {item.equipment.hp ? <div style={{ color: '#2ecc71' }}>❤ +{item.equipment.hp} HP</div> : null}
          {item.equipment.mana ? <div style={{ color: '#3498db' }}>✦ +{item.equipment.mana} Mana</div> : null}
          {item.equipment.magic ? <div style={{ color: '#9b59ff' }}>🔮 +{item.equipment.magic} {tr('Magic')}</div> : null}
          {item.equipment.critChance ? <div style={{ color: '#ff4444' }}>🎯 +{item.equipment.critChance}% {tr('Crit')}</div> : null}
          {item.equipment.lifesteal ? <div style={{ color: '#c13030' }}>🩸 +{item.equipment.lifesteal}% {tr('Lifesteal')}</div> : null}
          {item.equipment.thorns ? <div style={{ color: '#4a7c3a' }}>🌵 +{item.equipment.thorns} {tr('Thorns')}</div> : null}
          {item.equipment.moveSpeed ? <div style={{ color: '#9bd4ff' }}>💨 +{item.equipment.moveSpeed}% {tr('Speed')}</div> : null}
          {item.equipment.xpBonus ? <div style={{ color: '#f4e04d' }}>⭐ +{item.equipment.xpBonus}% XP</div> : null}
          {item.equipment.goldBonus ? <div style={{ color: '#f4e04d' }}>🪙 +{item.equipment.goldBonus}% {tr('Gold')}</div> : null}
          {item.equipment.damageReduction ? <div style={{ color: '#4a90e2' }}>🛡 -{item.equipment.damageReduction}% {tr('Dmg Taken')}</div> : null}
          {Object.entries(item.equipment.damageBonuses || {}).map(([school,value]) => <div key={`power-${school}`} style={{ color: SCHOOL_META[normalizeSchool(school)].color }}>{SCHOOL_META[normalizeSchool(school)].icon} +{value}% {tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Power')}</div>)}
          {Object.entries(item.equipment.resistances || {}).map(([school,value]) => <div key={`res-${school}`} className="text-cyan-200">🛡 +{value}% {tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Resistance')}</div>)}
          {Object.entries(item.equipment.weaknesses || {}).map(([school,value]) => <div key={`weak-${school}`} className="text-rose-300">⚠ +{value}% {tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Vulnerability')}</div>)}
          {Object.entries(item.equipment.skillBonuses || {}).map(([skill,value]) => <div key={`skill-${skill}`} className="text-emerald-300">📈 +{value} {tr(skill)} {tr('skill')}</div>)}
          {Object.entries(item.equipment.resistancePierce || {}).map(([school,value]) => <div key={`pierce-${school}`} className="text-orange-300">✦ {value}% {tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('resist pierce')}</div>)}
          {(item.equipment.affixes || []).length > 0 && (
            <div className="mt-1 border-t border-fuchsia-500/30 pt-1 space-y-1">
              {(item.equipment.affixes || []).map((affix) => (
                <div key={affix.id}>
                  <div className="font-black text-fuchsia-300">✦ {tr(affix.name)}</div>
                  <div className="text-[9px] text-fuchsia-100/65">{tr(affix.description)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {item.description && (
        <div className="text-[10px] italic text-amber-200/70 border-t border-purple-700/40 pt-1">
          {tr(item.description)}
        </div>
      )}
      <div className="text-[10px] text-amber-400 border-t border-purple-700/40 pt-1">💰 {tr('Value:')} {item.value} {tr('gold')}</div>
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
  const reactionHints = reactionHintsForSchool(school);
  return (
    <div className="space-y-1 min-w-[190px]">
      <div className="flex items-center gap-2">
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${spell.color})` }}>{locked ? '🔒' : spell.icon}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: locked ? '#ff6060' : spell.color }}>{tr(spell.name)}</div>
          <div className="text-[10px] uppercase tracking-wider text-amber-200/60">
            {tr(spell.type)} · {tr('Hotkey:')} {idx + 1}
          </div>
        </div>
      </div>
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[11px]">
        {(spell.levelRequired ?? 1) > 1 && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">{tr('Required Level:')}</span>
            <span className={locked ? 'text-red-400 font-bold' : 'text-green-400'}>{tr('Lv')} {spell.levelRequired}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('Mana Cost:')}</span>
          <span className={noMana ? 'text-red-400 font-bold' : 'text-blue-300'}>{spell.mana}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr(spell.type === 'heal' ? 'Base Heal' : 'Base Damage')}:</span>
          <span className="text-amber-100">{spell.damage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('Cooldown:')}</span>
          <span className="text-amber-100">{(spell.cooldown / 1000).toFixed(1)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('Range:')}</span>
          <span className="text-amber-100">{spell.range === 0 ? tr('Self') : spell.range <= 1.5 ? tr('Melee') : `${spell.range} ${tr('tiles')}`}</span>
        </div>
      </div>
      {/* Detailed formula */}
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[10px]">
        {spell.damageType && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">{tr('Element:')}</span>
            <span className="capitalize" style={{ color: meta.color }}>{meta.icon} {tr(meta.label)}</span>
          </div>
        )}
        {spell.scalingCoeff && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Scaling:')}</span><span className="text-purple-300">×{spell.scalingCoeff} {(spell.scalingStat || (school==='physical'?'attack':'magic')).toUpperCase()}</span></div>
        )}
        {scaling && (
          <div className="mt-1 space-y-1 border-t border-fuchsia-400/20 pt-1">
            <div className="font-black uppercase tracking-wider text-fuchsia-200">{tr('Influence chain')}</div>
            <div className="flex justify-between"><span className="text-slate-400">{tr(scaling.statKind)} {tr('stat')}</span><span className="text-purple-200">{scaling.stat.toFixed(0)} × {scaling.coeff}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{tr(scaling.skillId)} {tr('skill')}</span><span className="text-emerald-300">Lv {scaling.effectiveSkill.toFixed(0)} → ×{scaling.skillMultiplier.toFixed(3)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{tr('gear')} · {tr(meta.label)}</span><span style={{color:meta.color}}>+{scaling.itemBonus.toFixed(1)}% → ×{scaling.itemMultiplier.toFixed(3)}</span></div>
            {scaling.pierce > 0 && <div className="flex justify-between"><span className="text-slate-400">{tr('resistance pierce')}</span><span className="text-orange-300">{scaling.pierce.toFixed(0)}%</span></div>}
            <div className="flex justify-between border-t border-white/10 pt-1 font-black"><span className="text-amber-100">{tr('Estimated power')}</span><span className="text-white">{scaling.estimated}</span></div>
          </div>
        )}
        <div className="mt-1 space-y-1 border-t border-cyan-300/20 pt-1">
          <div className="font-black uppercase tracking-wider text-cyan-200">{tr('Reactive combos')}</div>
          {reactionHints.slice(0,3).map((hint) => (
            <div key={`${hint.when}-${hint.name}`} className="rounded border border-white/5 bg-black/20 px-1.5 py-1">
              <div className="flex justify-between gap-2"><span className="text-slate-400">{tr(hint.when)}</span><span className="font-bold" style={{color:meta.color}}>{tr(hint.name)}{hint.multiplier ? ` ×${hint.multiplier.toFixed(2)}` : ''}</span></div>
              <div className="text-[9px] text-cyan-100/65">{tr(hint.result)}</div>
            </div>
          ))}
        </div>
        {(spell.critChance ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Crit')}:</span><span className="text-red-300">{spell.critChance}% (×{spell.critMult})</span></div>
        )}
        {(spell.lifestealPercent ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Lifesteal')}:</span><span className="text-pink-300">{spell.lifestealPercent}%</span></div>
        )}
        {(spell.piercePercent ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Pierce:')}</span><span className="text-orange-300">{spell.piercePercent}% DEF</span></div>
        )}
        {(spell.hitCount ?? 1) > 1 && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Hits:')}</span><span className="text-amber-100">×{spell.hitCount}</span></div>
        )}
        {(spell.variance ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-amber-200/70">{tr('Variance:')}</span><span className="text-amber-100">±{((spell.variance ?? 0) * 100).toFixed(0)}%</span></div>
        )}
        {(spell.allyEffect || spell.enemyEffect) && (
          <div className="mt-1 border-t border-cyan-400/20 pt-1 space-y-0.5">
            <div className="font-bold text-cyan-200">{tr('Contextual skill')}</div>
            {spell.allyEffect && spell.allyEffect !== 'none' && <div>🤝 {tr('Ally:')} {tr(spell.allyEffect)} ×{(spell.allyMultiplier ?? 1).toFixed(2)}</div>}
            {spell.enemyEffect && spell.enemyEffect !== 'none' && <div>⚔ {tr('Enemy:')} {tr(spell.enemyEffect)} ×{(spell.enemyMultiplier ?? 1).toFixed(2)}</div>}
            {((spell.dayMultiplier ?? 1) !== 1 || (spell.nightMultiplier ?? 1) !== 1) && <div>☀ ×{(spell.dayMultiplier ?? 1).toFixed(2)} · 🌙 ×{(spell.nightMultiplier ?? 1).toFixed(2)}</div>}
            {(spell.drainPercent ?? 0) > 0 && <div>🩸 {tr('Drain:')} {spell.drainPercent}%</div>}
          </div>
        )}
      </div>
      {locked && (
        <div className="text-red-400 text-center pt-1 font-bold border-t border-purple-700/40">🔒 {tr('Locked - Level')} {spell.levelRequired} {tr('required')}</div>
      )}
      {!locked && onCd && (
        <div className="text-red-400 text-center pt-1 font-bold border-t border-purple-700/40">⏱ {tr('On Cooldown')}</div>
      )}
      {!locked && !onCd && noMana && (
        <div className="text-red-400 text-center font-bold">{tr('Not enough mana')}</div>
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
            {tr(monster.name)}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: tColor }}>
            {tr(monster.type || 'normal')} · {tr('Lv')} {monster.level}
          </div>
        </div>
      </div>
      <div className="border-t border-purple-700/40 pt-1 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-amber-200/70">HP:</span>
          <span className="text-red-300">{monster.hp} / {monster.maxHp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('Attack')}:</span>
          <span className="text-red-300">{monster.attack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('Defense')}:</span>
          <span className="text-blue-300">{monster.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-200/70">{tr('XP Reward:')}</span>
          <span className="text-yellow-300">{monster.xp}</span>
        </div>
        {monster.damageType && (
          <div className="flex justify-between">
            <span className="text-amber-200/70">{tr('Damage Type:')}</span>
            <span className="text-purple-300 capitalize">{tr(monster.damageType)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
