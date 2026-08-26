import { useState } from 'react';
import type { Player } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { serverSync } from '../game/ServerSync';

interface Props {
  player: Player;
  setPlayer: (p: Player) => void;
  onClose: () => void;
}

interface Talent {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxRank: number;
  currentRank: number;
  requires?: string;
  effects: Partial<{
    hpBonus: number;
    manaBonus: number;
    attackBonus: number;
    defenseBonus: number;
    magicBonus: number;
    critChance: number;
    xpBonus: number;
    goldBonus: number;
    damageReduction: number;
    healBonus: number;
    speedBonus: number;
  }>;
}

function getTalents(_vocation: string, currentRanks: Record<string, number>): Talent[] {
  const base: Talent[] = [
    { id: 'vitality', name: 'Vitality', icon: '❤', description: '+10 HP per rank', maxRank: 5, currentRank: currentRanks.vitality || 0, effects: { hpBonus: 10 } },
    { id: 'wisdom', name: 'Wisdom', icon: '✦', description: '+8 Mana per rank', maxRank: 5, currentRank: currentRanks.wisdom || 0, effects: { manaBonus: 8 } },
    { id: 'might', name: 'Might', icon: '⚔', description: '+2 Attack per rank', maxRank: 5, currentRank: currentRanks.might || 0, effects: { attackBonus: 2 } },
    { id: 'toughness', name: 'Toughness', icon: '🛡', description: '+2 Defense per rank', maxRank: 5, currentRank: currentRanks.toughness || 0, effects: { defenseBonus: 2 } },
    { id: 'precision', name: 'Precision', icon: '🎯', description: '+1% crit chance per rank', maxRank: 5, currentRank: currentRanks.precision || 0, requires: 'might', effects: { critChance: 1 } },
    { id: 'arcane_mastery', name: 'Arcane Mastery', icon: '🔮', description: '+3 Magic per rank', maxRank: 5, currentRank: currentRanks.arcane_mastery || 0, requires: 'wisdom', effects: { magicBonus: 3 } },
    { id: 'resilience', name: 'Resilience', icon: '💎', description: '+2% damage reduction per rank', maxRank: 3, currentRank: currentRanks.resilience || 0, requires: 'toughness', effects: { damageReduction: 2 } },
    { id: 'bounty', name: 'Bounty Hunter', icon: '🪙', description: '+5% gold per rank', maxRank: 3, currentRank: currentRanks.bounty || 0, requires: 'vitality', effects: { goldBonus: 5 } },
    { id: 'savant', name: 'Savant', icon: '🌟', description: '+10% XP per rank', maxRank: 3, currentRank: currentRanks.savant || 0, requires: 'bounty', effects: { xpBonus: 10 } },
    { id: 'lethal', name: 'Lethal Strikes', icon: '💀', description: '+3% crit chance per rank', maxRank: 2, currentRank: currentRanks.lethal || 0, requires: 'precision', effects: { critChance: 3 } },
    { id: 'archmage', name: 'Archmage', icon: '✨', description: '+20% heal bonus per rank', maxRank: 2, currentRank: currentRanks.archmage || 0, requires: 'arcane_mastery', effects: { healBonus: 20 } },
    { id: 'fortitude', name: 'Fortitude', icon: '⛰', description: '+5% damage reduction per rank', maxRank: 2, currentRank: currentRanks.fortitude || 0, requires: 'resilience', effects: { damageReduction: 5 } },
    { id: 'berserker', name: 'Berserker Rage', icon: '🔥', description: '+15 Attack, +5% crit', maxRank: 1, currentRank: currentRanks.berserker || 0, requires: 'lethal', effects: { attackBonus: 15, critChance: 5 } },
    { id: 'transcendence', name: 'Transcendence', icon: '🌈', description: '+50 HP, +30 Mana, +8 Magic', maxRank: 1, currentRank: currentRanks.transcendence || 0, requires: 'archmage', effects: { hpBonus: 50, manaBonus: 30, magicBonus: 8 } },
  ];
  return base;
}

export default function TalentTree({ player, setPlayer, onClose }: Props) {
  const [ranks, setRanks] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`tibia_talents_${player.name}`) || '{}');
    } catch {
      return {};
    }
  });
  const vocation = VOCATIONS[player.vocation];
  const authoritative = serverSync.isActive();
  const effectiveRanks: Record<string, number> = authoritative
    ? (((player as any).talents || {}) as Record<string, number>)
    : ranks;

  const totalPoints = player.level;
  const spentPoints = Object.values(effectiveRanks).reduce((s, v) => s + v, 0);
  const availablePoints = totalPoints - spentPoints;
  const talents = getTalents(player.vocation, effectiveRanks);

  const canSpend = (talent: Talent): boolean => {
    if (availablePoints <= 0) return false;
    if (talent.currentRank >= talent.maxRank) return false;
    if (talent.requires) {
      const reqTalent = talents.find((t) => t.id === talent.requires);
      if (!reqTalent || reqTalent.currentRank < 1) return false;
    }
    return true;
  };

  const spendPoint = (talent: Talent) => {
    if (!canSpend(talent)) return;
    if (authoritative) {
      serverSync.sendTalent(talent.id);
      return;
    }

    const newRanks = { ...ranks, [talent.id]: (ranks[talent.id] || 0) + 1 };
    setRanks(newRanks);
    localStorage.setItem(`tibia_talents_${player.name}`, JSON.stringify(newRanks));

    const p = { ...player };
    if (talent.effects.hpBonus) { p.maxHp += talent.effects.hpBonus; p.hp = Math.min(p.hp + talent.effects.hpBonus, p.maxHp); }
    if (talent.effects.manaBonus) { p.maxMana += talent.effects.manaBonus; p.mana = Math.min(p.mana + talent.effects.manaBonus, p.maxMana); }
    if (talent.effects.attackBonus) p.attack += talent.effects.attackBonus;
    if (talent.effects.defenseBonus) p.defense += talent.effects.defenseBonus;
    if (talent.effects.magicBonus) p.magic += talent.effects.magicBonus;
    setPlayer(p);
  };

  const resetTalents = () => {
    if (authoritative) {
      serverSync.sendTalentReset();
      return;
    }
    if (player.gold < 500) return;

    const p = { ...player };
    for (const [id, rank] of Object.entries(ranks)) {
      const talent = talents.find((t) => t.id === id);
      if (!talent) continue;
      if (talent.effects.hpBonus) p.maxHp -= talent.effects.hpBonus * rank;
      if (talent.effects.manaBonus) p.maxMana -= talent.effects.manaBonus * rank;
      if (talent.effects.attackBonus) p.attack -= talent.effects.attackBonus * rank;
      if (talent.effects.defenseBonus) p.defense -= talent.effects.defenseBonus * rank;
      if (talent.effects.magicBonus) p.magic -= talent.effects.magicBonus * rank;
    }
    p.hp = Math.min(p.hp, p.maxHp);
    p.mana = Math.min(p.mana, p.maxMana);
    p.gold -= 500;
    setRanks({});
    localStorage.setItem(`tibia_talents_${player.name}`, '{}');
    setPlayer(p);
  };

  const tiers = [
    talents.filter((t) => !t.requires),
    talents.filter((t) => {
      const req = talents.find((tt) => tt.id === t.requires);
      return req && !req.requires;
    }),
    talents.filter((t) => {
      const req = talents.find((tt) => tt.id === t.requires);
      return req && req.requires && !talents.find((tt) => tt.id === req.requires)?.requires;
    }),
    talents.filter((t) => {
      const req = talents.find((tt) => tt.id === t.requires);
      if (!req) return false;
      const reqReq = talents.find((tt) => tt.id === req.requires);
      return reqReq && !reqReq.requires;
    }),
  ];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4 z-20"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(50,25,10,0.98) 0%, rgba(25,12,5,0.98) 100%)',
          borderColor: vocation?.color || '#8b6914',
          boxShadow: `0 0 40px ${vocation?.color || '#8b6914'}30`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(180deg, ${vocation?.color || '#f4e04d'} 0%, #8b6914 100%)` }}>
              🌟 TALENT TREE
            </h2>
            <div className="text-xs text-amber-200/60 mt-1">
              {vocation?.icon} {vocation?.name} · Points: <span className="text-amber-300 font-bold">{availablePoints}</span> / {totalPoints}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetTalents}
              disabled={player.gold < 500}
              className="px-3 py-1 text-xs rounded bg-red-900/40 hover:bg-red-700/60 text-red-200 border border-red-700/50 disabled:opacity-40"
              title="Reset all talents (500 gold)"
            >
              🔄 Reset (500🪙)
            </button>
            <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>
          </div>
        </div>

        {availablePoints > 0 && (
          <div className="mb-3 p-2 rounded border border-green-700/50 bg-green-900/20 text-center text-xs text-green-300 animate-pulse">
            ✨ You have {availablePoints} talent point(s) to spend!
          </div>
        )}

        <div className="space-y-4">
          {tiers.map((tier, tierIdx) => (
            <div key={tierIdx}>
              <div className="text-[10px] text-amber-200/50 tracking-widest mb-2 border-b border-amber-900/30 pb-1">
                TIER {tierIdx + 1} {tierIdx === 3 ? '(ULTIMATE)' : tierIdx >= 2 ? '(ADVANCED)' : tierIdx === 1 ? '(IMPROVED)' : '(BASIC)'}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {tier.map((talent) => {
                  const available = canSpend(talent);
                  const maxed = talent.currentRank >= talent.maxRank;
                  return (
                    <button
                      key={talent.id}
                      onClick={() => spendPoint(talent)}
                      disabled={!available}
                      className={`p-3 rounded border-2 text-left transition-all ${
                        maxed
                          ? 'border-amber-500 bg-amber-900/30 shadow-[0_0_10px_rgba(244,224,77,0.3)]'
                          : available
                            ? 'border-green-600/60 bg-green-900/20 hover:bg-green-900/40 hover:scale-[1.02] cursor-pointer'
                            : 'border-gray-700/40 bg-black/40 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{talent.icon}</span>
                        <div>
                          <div className={`font-bold text-xs ${maxed ? 'text-amber-300' : 'text-amber-100'}`}>{talent.name}</div>
                          <div className="text-[10px] text-amber-200/70">{talent.currentRank}/{talent.maxRank}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-200/70">{talent.description}</div>
                      {talent.requires && (
                        <div className="text-[9px] text-amber-200/40 mt-1">
                          Requires: {talents.find((t) => t.id === talent.requires)?.name}
                        </div>
                      )}
                      {maxed && <div className="text-[10px] text-amber-400 font-bold mt-1">★ MAXED</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-[10px] text-amber-200/40">
          1 talent point per level · Reset costs 500 gold · Effects are permanent until reset
        </div>
      </div>
    </div>
  );
}
