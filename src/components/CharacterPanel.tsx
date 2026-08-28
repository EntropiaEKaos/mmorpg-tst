import type { Player, EquipmentSlot } from '../game/types';
import { computeDerivedStats } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { RARITY_COLORS } from '../game/equipment';
import { getBlessings, BLESSINGS, getProfessions, getReputation, getRepLevel, FACTIONS, getStamina, getStaminaMultiplier } from '../game/systems';
import { getActiveSetBonuses } from '../game/itemSets';
import { T as Tooltip } from './Tooltip';
import LivingRealmPlayerPanel916 from './LivingRealmPlayerPanel916';
import RoadToTenPlayerPanel926 from './RoadToTenPlayerPanel926';

interface Props {
  player: Player;
  onClose: () => void;
  onUnequip: (slot: keyof Player['equipment']) => void;
  official?: any;
}

const SLOTS: Array<{ slot: EquipmentSlot; label: string; icon: string }> = [
  { slot: 'helmet', label: 'Head', icon: '⛑' },
  { slot: 'amulet', label: 'Neck', icon: '📿' },
  { slot: 'cloak', label: 'Back', icon: '🧥' },
  { slot: 'weapon', label: 'Weapon', icon: '⚔' },
  { slot: 'armor', label: 'Chest', icon: '🎽' },
  { slot: 'shield', label: 'Shield', icon: '🛡' },
  { slot: 'gloves', label: 'Hands', icon: '🧤' },
  { slot: 'ring', label: 'Ring L', icon: '💍' },
  { slot: 'belt', label: 'Waist', icon: '🥋' },
  { slot: 'ring2', label: 'Ring R', icon: '💍' },
  { slot: 'legs', label: 'Legs', icon: '🦿' },
  { slot: 'boots', label: 'Feet', icon: '👢' },
  { slot: 'relic', label: 'Relic', icon: '💠' },
];

export default function CharacterPanel({ player, onClose, onUnequip, official }: Props) {
  const vocation = VOCATIONS[player.vocation];
  const authoritative = Boolean(official);
  const officialState = official?.state || {};
  const derived = authoritative ? {
    totalAttack: player.attack,
    totalDefense: player.defense,
    totalArmor: Number((player as any).armor) || 0,
    totalMagic: player.magic,
    totalMaxHp: player.maxHp,
    totalMaxMana: player.maxMana,
    critChance: Number((player as any).critChance) || 0,
    lifesteal: Number((player as any).lifesteal) || 0,
    thorns: Number((player as any).thorns) || 0,
    moveSpeed: Number((player as any).moveSpeed) || 0,
    xpBonus: Number((player as any).xpBonus) || 0,
    goldBonus: Number((player as any).goldBonus) || 0,
    damageReduction: Number((player as any).damageReduction) || 0,
  } : computeDerivedStats(player);
  const hpPct = Math.max(0, Math.min(100, (player.hp / Math.max(1, derived.totalMaxHp)) * 100));
  const mpPct = Math.max(0, Math.min(100, (player.mana / Math.max(1, derived.totalMaxMana)) * 100));
  const xpPct = Math.max(0, Math.min(100, (player.xp / Math.max(1, player.xpNext)) * 100));

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/68 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-scrollbar moria-fade-up max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border p-4 sm:p-6" style={{ borderColor: `${vocation?.color || '#e5c477'}55`, boxShadow: `0 30px 90px rgba(0,0,0,.55), 0 0 45px ${vocation?.color || '#e5c477'}14` }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2"
                 style={{ background: `radial-gradient(circle, ${vocation?.color || '#8b2e2e'}40, rgba(0,0,0,0.3))`, borderColor: vocation?.color || '#8b2e2e', boxShadow: `0 0 20px ${vocation?.color || '#8b2e2e'}60` }}>
              {vocation?.icon || '⚔'}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text"
                  style={{ backgroundImage: `linear-gradient(180deg, ${vocation?.color || '#f4e04d'} 0%, #8b6914 100%)` }}>
                {player.name}
              </h2>
              <div className="text-amber-200/70 text-xs">{vocation?.name || 'Unknown'} · Level {player.level}</div>
            </div>
          </div>
          <button onClick={onClose} className="moria-button flex h-9 w-9 items-center justify-center rounded-xl text-sm text-slate-400" aria-label="Close character panel">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Left: Paper Doll Equipment */}
          <div className="xl:col-span-5">
            <div className="text-[10px] text-amber-200/60 tracking-widest mb-2">⚔ EQUIPMENT (13 SLOTS)</div>
            <div className="moria-card rounded-2xl p-3">
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map(({ slot, label, icon }) => {
                  const eq = player.equipment[slot];
                  return (
                    <Tooltip key={slot} position="right" content={
                      eq ? (
                        <div>
                          <div className="font-bold" style={{ color: RARITY_COLORS[eq.rarity] }}>{eq.name}</div>
                          <div className="text-[9px] text-amber-200/60 uppercase">{slot} · {eq.rarity}</div>
                          <div className="text-[10px] text-amber-200/50 mt-1">Click to unequip</div>
                        </div>
                      ) : <div className="text-amber-200/60">{label} (empty)</div>
                    }>
                      <button
                        onClick={() => eq && onUnequip(slot)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs transition-all ${eq ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                        style={{
                          background: eq
                            ? `linear-gradient(180deg, ${RARITY_COLORS[eq.rarity]}28 0%, rgba(7,11,18,0.96) 100%)`
                            : 'linear-gradient(180deg, rgba(25,34,48,0.72) 0%, rgba(7,11,18,0.96) 100%)',
                          borderColor: eq ? RARITY_COLORS[eq.rarity] : 'rgba(150,170,202,0.18)',
                          boxShadow: eq ? `0 0 10px ${RARITY_COLORS[eq.rarity]}40` : 'none',
                        }}
                      >
                        <div className="text-2xl" style={{ filter: eq ? `drop-shadow(0 0 4px ${RARITY_COLORS[eq.rarity]})` : 'none' }}>{eq?.icon || icon}</div>
                        <div className="text-[8px] text-amber-200/60 mt-0.5">{label}</div>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Bars */}
            <div className="mt-3 space-y-1.5">
              <Bar label="❤ HP" value={player.hp} max={derived.totalMaxHp} color="red" pct={hpPct} />
              <Bar label="✦ MP" value={player.mana} max={derived.totalMaxMana} color="blue" pct={mpPct} />
              <Bar label="★ XP" value={player.xp} max={player.xpNext} color="amber" pct={xpPct} />
            </div>
          </div>

          {/* Middle: Core Stats */}
          <div className="space-y-3 xl:col-span-3">
            <div>
              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">📊 STATS</div>
              <div className="space-y-1">
                <StatRow icon="⚔" label="Attack" value={derived.totalAttack} base={player.attack} color="#ff6060" />
                <StatRow icon="🛡" label="Defense" value={derived.totalDefense} base={player.defense} color="#6090ff" />
                <StatRow icon="🎽" label="Armor" value={derived.totalArmor} base={0} color="#a8a8a8" />
                <StatRow icon="✦" label="Magic" value={derived.totalMagic} base={player.magic} color="#9b59ff" />
                <StatRow icon="❤" label="Max HP" value={derived.totalMaxHp} base={player.maxHp} color="#2ecc71" />
                <StatRow icon="💧" label="Max MP" value={derived.totalMaxMana} base={player.maxMana} color="#3498db" />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🎯 COMBAT</div>
              <div className="space-y-1">
                <SimpleStat icon="🎯" label="Crit Chance" value={`${derived.critChance}%`} color="#ff4444" />
                <SimpleStat icon="🩸" label="Lifesteal" value={`${derived.lifesteal}%`} color="#c13030" />
                <SimpleStat icon="🌵" label="Thorns" value={derived.thorns.toString()} color="#4a7c3a" />
                <SimpleStat icon="💨" label="Move Speed" value={`+${derived.moveSpeed}%`} color="#9bd4ff" />
                <SimpleStat icon="🛡" label="Dmg Reduction" value={`${derived.damageReduction}%`} color="#4a90e2" />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">💰 BONUSES</div>
              <div className="space-y-1">
                <SimpleStat icon="⭐" label="XP Bonus" value={`+${derived.xpBonus}%`} color="#f4e04d" />
                <SimpleStat icon="🪙" label="Gold Bonus" value={`+${derived.goldBonus}%`} color="#f4e04d" />
              </div>
            </div>

            {/* Spell Progression */}
            <div>
              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🔮 SPELL PROGRESSION</div>
              <div className="space-y-1">
                {vocation?.spells.map((spell) => {
                  const unlocked = player.level >= (spell.levelRequired || 1);
                  return (
                    <div key={spell.id} className={`flex items-center gap-1.5 p-1 rounded text-xs ${unlocked ? 'bg-black/30 border border-green-700/30' : 'bg-black/30 border border-red-700/30 opacity-60'}`}>
                      <span className="text-base">{unlocked ? spell.icon : '🔒'}</span>
                      <div className="flex-1 min-w-0">
                        <div className={unlocked ? 'font-bold' : 'font-bold text-red-300/70'} style={{ color: unlocked ? spell.color : undefined }}>{spell.name}</div>
                        <div className="text-[9px] text-amber-200/50">
                          {unlocked ? `${spell.damage} ${spell.type === 'heal' ? 'heal' : 'dmg'} · ${spell.mana}MP` : `Unlocks at Lv ${spell.levelRequired}`}
                        </div>
                      </div>
                      <span className="text-[9px]" style={{ color: unlocked ? '#2ecc71' : '#ff6060' }}>{unlocked ? '✓' : `Lv${spell.levelRequired}`}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Set Bonuses */}
            <div>
              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🎁 SET BONUSES</div>
              {getActiveSetBonuses(player).length === 0 ? (
                <div className="text-amber-200/40 text-xs italic">Equip matching set pieces!</div>
              ) : (
                <div className="space-y-1">
                  {getActiveSetBonuses(player).map((set) => (
                    <div key={set.setId} className="p-1.5 rounded border border-amber-600/50 bg-amber-900/20">
                      <div className="flex items-center gap-1 text-xs">
                        <span>{set.icon}</span>
                        <span className="text-amber-300 font-bold">{set.name}</span>
                        <span className="text-amber-400">({set.piecesEquipped})</span>
                      </div>
                      {set.activeBonuses.map((b, i) => (
                        <div key={i} className="text-[10px] text-green-400 pl-4">✓ {b.description}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {vocation && (
              <div className="p-2 rounded border border-amber-900/40 bg-black/30">
                <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">✨ PASSIVE</div>
                <div className="text-xs text-amber-100">{vocation.passive}</div>
              </div>
            )}
          </div>

          {/* Right: Blessings, Professions, Reputation, Stamina */}
          <div className="moria-scrollbar max-h-[70vh] space-y-3 overflow-y-auto pr-1 xl:col-span-4">
            {authoritative ? (
              <>
                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">✨ OFFICIAL BLESSING</div>
                  <div className="bg-black/30 rounded px-2 py-2 border border-amber-900/30 text-xs">
                    {Number(officialState.blessingsUntil || 0) > Date.now()
                      ? <span className="text-green-300">✓ Blessing of Mor'ia active</span>
                      : <span className="text-amber-200/50">No official blessing active</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">⛏ PROFESSIONS · SERVER</div>
                  <div className="space-y-1">
                    {Object.entries(officialState.professions || {}).map(([name, value]: any) => (
                      <div key={name} className="bg-black/30 rounded px-2 py-1 border border-amber-900/30 flex items-center justify-between text-xs">
                        <span className="capitalize text-amber-200/80">{name}</span>
                        <span className="text-amber-300 font-bold">Lv {value.level} · {value.xp} xp</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🏰 REPUTATION · SERVER</div>
                  <div className="bg-black/30 rounded px-2 py-1 border border-amber-900/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-200/80">🏰 Town of Antica</span>
                      <span className="text-green-300 font-bold">{Number(officialState.reputation?.town || 0).toLocaleString()} pts</span>
                    </div>
                    <div className="text-[9px] text-amber-200/50">Shop discount: {Math.round(Number(officialState.shopDiscount || 0) * 100)}%</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">⚡ STAMINA · SERVER</div>
                  <div className="bg-black/30 rounded px-2 py-1 border border-amber-900/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-200/80">⏱ {Math.floor(Number(officialState.stamina || 0) / 60)}h remaining</span>
                      <span className="text-emerald-300 font-bold">{officialState.stamina > 2400 ? '120%' : officialState.stamina < 840 ? '50%' : '100%'} XP</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🎯 SKILLS · SERVER</div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(player.skills || {}).map(([name, raw]: any) => {
                      const skill = typeof raw === 'number' ? { level: raw, progress: 0 } : raw;
                      return <div key={name} className="bg-black/30 rounded px-2 py-1 border border-amber-900/30 text-[10px] flex justify-between">
                        <span className="capitalize text-amber-200/70">{name}</span><b className="text-sky-200">Lv {skill.level} · {skill.progress}</b>
                      </div>;
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">✨ BLESSINGS ({getBlessings(player).length}/{BLESSINGS.length})</div>
                  <div className="space-y-1">
                    {BLESSINGS.map((b) => {
                      const owned = getBlessings(player).includes(b.id);
                      return <div key={b.id} className={`flex items-center gap-2 p-1.5 rounded text-xs ${owned ? 'bg-green-900/20 border border-green-700/40' : 'bg-black/30 border border-gray-700/30 opacity-50'}`}>
                        <span>{b.icon}</span><div className="flex-1 min-w-0"><div className={owned ? 'text-green-300 font-bold' : 'text-gray-400'}>{b.name}</div><div className="text-[9px] text-amber-200/50 truncate">{b.description}</div></div>{owned && <span className="text-green-400">✓</span>}
                      </div>;
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">⛏ PROFESSIONS</div>
                  <div className="space-y-1">{(['miner', 'herbalist', 'fisher'] as const).map((prof) => { const data = getProfessions(player)[prof]; return <div key={prof} className="bg-black/30 rounded px-2 py-1 border border-amber-900/30 text-xs flex justify-between"><span className="capitalize text-amber-200/80">{prof}</span><b className="text-amber-300">Lv {data.level}</b></div>; })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">🏰 REPUTATION</div>
                  {FACTIONS.map((faction) => { const value = getReputation(player)[faction.id] || 0; const level = getRepLevel(faction.id, value); return <div key={faction.id} className="bg-black/30 rounded px-2 py-1 border border-amber-900/30 text-xs flex justify-between"><span>{faction.icon} {faction.name}</span><b style={{ color: level.color }}>{level.name} · {value}</b></div>; })}
                </div>
                <div className="bg-black/30 rounded px-2 py-1 border border-amber-900/30 text-xs">⚡ Stamina: {Math.floor(getStamina(player) / 60)}h · {Math.round(getStaminaMultiplier(getStamina(player)) * 100)}% XP</div>
              </>
            )}
          </div>
        </div>
        <LivingRealmPlayerPanel916 player={player} official={official} />
        <RoadToTenPlayerPanel926 player={player} official={official} />
      </div>
    </div>
  );
}

function Bar({ label, value, max, color, pct }: { label: string; value: number; max: number; color: 'red' | 'blue' | 'amber'; pct: number }) {
  const colors = {
    red: { from: '#ff6060', to: '#801010', text: '#ff9090' },
    blue: { from: '#6090ff', to: '#102080', text: '#9bd4ff' },
    amber: { from: '#f4e04d', to: '#8b6914', text: '#f4e04d' },
  };
  const c = colors[color];
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5" style={{ color: c.text }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-black/60 rounded overflow-hidden border border-black/50">
        <div className="h-full" style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${c.from} 0%, ${c.to} 100%)` }} />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, base, color }: { icon: string; label: string; value: number; base: number; color: string }) {
  const bonus = value - base;
  return (
    <div className="bg-black/40 rounded px-2 py-1 border border-amber-900/30 flex items-center justify-between">
      <span className="text-amber-200/70 text-[11px]">{icon} {label}</span>
      <span className="font-bold text-sm">
        <span style={{ color }}>{value}</span>
        {bonus > 0 && <span className="text-green-400 text-[10px]"> (+{bonus})</span>}
      </span>
    </div>
  );
}

function SimpleStat({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-black/40 rounded px-2 py-1 border border-amber-900/30 flex items-center justify-between">
      <span className="text-amber-200/70 text-[11px]">{icon} {label}</span>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}
