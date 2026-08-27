import { memo, useEffect, useState } from 'react';
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
