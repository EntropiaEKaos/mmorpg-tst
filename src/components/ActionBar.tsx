import { memo } from 'react';
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
  const now = Date.now();
  return (
    <div className="absolute bottom-[170px] left-1/2 -translate-x-1/2 flex items-end gap-1.5 z-10 pointer-events-auto"
         style={{ paddingBottom: '4px' }}>
      {/* Potion slots (left) */}
      <Tooltip position="top" content={<div className="text-xs">Health Potion (P)<br/><span className="text-green-400">+50 HP</span></div>}>
        <button onClick={() => potions.hp > 0 && onUsePotion('hp')}
                disabled={potions.hp <= 0}
                className="relative w-12 h-12 rounded-lg border-2 border-red-700/60 bg-black/70 disabled:opacity-30 hover:bg-red-900/40 transition-all flex items-center justify-center">
          <span className="text-2xl">🧪</span>
          {potions.hp > 0 && <span className="absolute -bottom-1 -right-1 text-[9px] bg-black text-red-300 px-1 rounded-full border border-red-700">{potions.hp}</span>}
        </button>
      </Tooltip>
      <Tooltip position="top" content={<div className="text-xs">Mana Potion (M)<br/><span className="text-blue-400">+50 MP</span></div>}>
        <button onClick={() => potions.mp > 0 && onUsePotion('mp')}
                disabled={potions.mp <= 0}
                className="relative w-12 h-12 rounded-lg border-2 border-blue-700/60 bg-black/70 disabled:opacity-30 hover:bg-blue-900/40 transition-all flex items-center justify-center">
          <span className="text-2xl">🧴</span>
          {potions.mp > 0 && <span className="absolute -bottom-1 -right-1 text-[9px] bg-black text-blue-300 px-1 rounded-full border border-blue-700">{potions.mp}</span>}
        </button>
      </Tooltip>
      {potions.hpg > 0 && (
        <Tooltip position="top" content={<div className="text-xs">Greater HP Potion<br/><span className="text-green-400">+200 HP</span></div>}>
          <button onClick={() => onUsePotion('hpg')}
                  className="relative w-12 h-12 rounded-lg border-2 border-red-500/70 bg-black/70 hover:bg-red-900/40 transition-all flex items-center justify-center">
            <span className="text-2xl">🍷</span>
            <span className="absolute -bottom-1 -right-1 text-[9px] bg-black text-red-300 px-1 rounded-full border border-red-700">{potions.hpg}</span>
          </button>
        </Tooltip>
      )}

      {/* Divider */}
      <div className="w-px h-10 bg-amber-900/40 mx-1" />

      {/* Spell slots (center, horizontal) */}
      {spells.map((spell, i) => {
        const onCd = now - spell.lastCast < spell.cooldown;
        const noMana = player.mana < spell.mana;
        const locked = (spell.levelRequired || 1) > player.level;
        return (
          <Tooltip key={spell.id} position="top" content={<SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />}>
            <button
              onClick={() => onCastSpell(i)}
              disabled={onCd || noMana || locked}
              className={`relative w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                locked ? 'opacity-60 cursor-not-allowed border-red-700/60 bg-red-950/40'
                : onCd ? 'opacity-70 cursor-not-allowed border-gray-700 bg-black/70'
                : noMana ? 'opacity-60 cursor-not-allowed border-gray-700 bg-black/70'
                : 'border-amber-600/70 bg-black/70 hover:bg-amber-900/40 hover:scale-105'
              }`}
            >
              <div className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${spell.color})` }}>{locked ? '🔒' : spell.icon}</div>
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-black border border-amber-600 text-[10px] font-bold text-amber-300 flex items-center justify-center">{i + 1}</div>
              <div className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-black/90 border" style={{ color: spell.color, borderColor: spell.color }}>{spell.mana}</div>
              {onCd && !locked && (
                <div className="absolute inset-0 rounded-lg bg-black/70 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{((spell.cooldown - (now - spell.lastCast)) / 1000).toFixed(1)}</span>
                </div>
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

export const ActionBar = memo(ActionBarInner);
export default ActionBar;
