import { memo, useEffect, useState } from 'react';
import type { Player, Spell } from '../game/types';
import { T as Tooltip, SpellTooltip } from './Tooltip';
import MovableHudWindow from './MovableHudWindow';

interface Props {
  player: Player;
  spells: Spell[];
  potions: { hp: number; mp: number; hpg: number };
  onCastSpell: (idx: number) => void;
  onUsePotion: (type: 'hp' | 'mp' | 'hpg') => void;
}

const SPELL_SLOTS = 10;

function ActionBarInner({ player, spells, potions, onCastSpell, onUsePotion }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <MovableHudWindow
      id="action-bar"
      title="Action Bar"
      className="moria-hotbar-window"
      contentClassName="p-1.5"
      defaultStyle={{ left: '50%', bottom: 10, transform: 'translateX(-50%)' }}
      compact
    >
      <div className="moria-hotbar-grid flex items-end gap-1">
        {Array.from({ length: SPELL_SLOTS }, (_, i) => {
          const spell = spells[i];
          if (!spell) return <EmptySlot key={`empty-${i}`} hotkey={i === 9 ? '0' : String(i + 1)} />;

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
                className={`moria-hotbar-slot relative flex h-[66px] w-[66px] shrink-0 flex-col items-center justify-center overflow-hidden ${locked ? 'opacity-65' : ready ? 'moria-action-ready' : ''}`}
                style={!locked && !onCd && !noMana ? { borderColor: `${spell.color}88`, boxShadow: `inset 0 0 0 1px ${spell.color}18, 0 0 12px ${spell.color}20` } : undefined}
              >
                <div className="text-[30px] leading-none" style={{ filter: `drop-shadow(0 2px 0 #000) drop-shadow(0 0 5px ${spell.color}70)` }}>{locked ? '🔒' : spell.icon}</div>
                <div className="absolute left-1 top-1 z-10 min-w-4 border border-amber-200/30 bg-black/80 px-1 text-center font-mono text-[9px] font-black text-amber-100">{i === 9 ? '0' : i + 1}</div>
                <div className="absolute bottom-1 right-1 z-10 border border-blue-300/20 bg-black/80 px-1 font-mono text-[8px] font-black text-blue-200">{spell.mana}</div>
                {onCd && !locked && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 opacity-95"
                      style={{ background: `conic-gradient(from 0deg, rgba(0,0,0,.88) ${cooldownFraction * 360}deg, rgba(0,0,0,.25) ${cooldownFraction * 360}deg)` }}
                    />
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <span className="font-mono text-sm font-black text-white drop-shadow-[0_2px_2px_#000]">{remaining >= 1000 ? (remaining / 1000).toFixed(1) : `${Math.ceil(remaining)}ms`}</span>
                    </div>
                  </>
                )}
                {noMana && !locked && !onCd && <div className="pointer-events-none absolute inset-x-1 bottom-1 h-1 bg-blue-500/80" />}
                {locked && <div className="absolute inset-x-0 bottom-0 bg-rose-950/90 py-0.5 text-center text-[8px] font-bold text-rose-200">LV {spell.levelRequired}</div>}
              </button>
            </Tooltip>
          );
        })}

        <div className="mx-0.5 h-[58px] w-px bg-amber-200/20" />
        <PotionSlot hotkey="P" icon="🧪" count={potions.hp} accent="#58d6a8" label="Health Potion" detail="+50 HP" onClick={() => onUsePotion('hp')} />
        <PotionSlot hotkey="M" icon="🧴" count={potions.mp} accent="#6ea8ff" label="Mana Potion" detail="+50 MP" onClick={() => onUsePotion('mp')} />
        <PotionSlot hotkey="G" icon="🍷" count={potions.hpg} accent="#ff7d8b" label="Greater Health Potion" detail="+200 HP" onClick={() => onUsePotion('hpg')} />
      </div>
    </MovableHudWindow>
  );
}

function EmptySlot({ hotkey }: { hotkey: string }) {
  return (
    <div className="moria-hotbar-slot relative flex h-[66px] w-[66px] shrink-0 items-center justify-center opacity-55">
      <span className="text-xl text-slate-700">+</span>
      <span className="absolute left-1 top-1 border border-white/10 bg-black/70 px-1 font-mono text-[9px] font-black text-slate-500">{hotkey}</span>
    </div>
  );
}

function PotionSlot({ hotkey, icon, count, accent, label, detail, onClick }: {
  hotkey: string;
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
        className="moria-hotbar-slot relative flex h-[66px] w-[66px] shrink-0 items-center justify-center"
        style={{ borderColor: `${accent}66` }}
      >
        <span className="text-[30px]" style={{ filter: `drop-shadow(0 2px 0 #000) drop-shadow(0 0 5px ${accent}55)` }}>{icon}</span>
        <span className="absolute left-1 top-1 border border-white/10 bg-black/75 px-1 font-mono text-[9px] font-black text-slate-300">{hotkey}</span>
        <span className="absolute bottom-1 right-1 min-w-5 border bg-black/85 px-1 text-center font-mono text-[9px] font-black" style={{ borderColor: `${accent}66`, color: accent }}>{count}</span>
      </button>
    </Tooltip>
  );
}

export const ActionBar = memo(ActionBarInner);
export default ActionBar;
