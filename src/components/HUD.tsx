import type { Player, Spell, Monster } from '../game/types';
import { computeDerivedStats } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/world';
import { T as Tooltip, SpellTooltip, StatTooltip } from './Tooltip';
import { getCoins } from '../game/economy';

interface Props {
  player: Player;
  tick: number;
  spells: Spell[];
  onCastSpell: (idx: number) => void;
  monsters?: Monster[];
}

export default function HUD({ player, spells, onCastSpell, monsters, tick }: Props) {
  const derived = computeDerivedStats(player);
  const hpPct = (player.hp / derived.totalMaxHp) * 100;
  const mpPct = (player.mana / derived.totalMaxMana) * 100;
  const xpPct = (player.xp / player.xpNext) * 100;
  const now = Date.now();
  const vocation = VOCATIONS[player.vocation];

  // Nearby monsters radar
  const nearby = (monsters || []).filter((m) => !m.dead && Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y) < 12);

  return (
    <div
      className="w-72 flex flex-col border-l-2 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #2a1a0a 0%, #1a0f05 100%)',
        borderColor: '#8b6914',
      }}
    >
      {/* Character header */}
      <div className="p-3 border-b border-amber-900/40">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
            style={{
              background: `radial-gradient(circle, ${vocation?.color || '#8b2e2e'}40, rgba(0,0,0,0.3))`,
              borderColor: vocation?.color || '#8b2e2e',
            }}
          >
            {vocation?.icon || '⚔'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-amber-100 font-bold text-sm truncate">{player.name}</div>
            <div className="text-amber-200/60 text-[10px]">{vocation?.name}</div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-amber-400 font-bold">Lv {player.level}</span>
              {player.mounted && <span className="text-green-400">🐎</span>}
            </div>
          </div>
        </div>

        <Bar label="❤ HP" value={player.hp} max={derived.totalMaxHp} pct={hpPct} from="#ff6060" to="#801010" textColor="#ff9090" />
        <div className="h-1.5" />
        <Bar label="✦ MP" value={player.mana} max={derived.totalMaxMana} pct={mpPct} from="#6090ff" to="#102080" textColor="#9bd4ff" />
        <div className="h-1.5" />
        <Bar label="★ XP" value={player.xp} max={player.xpNext} pct={xpPct} from="#f4e04d" to="#8b6914" textColor="#f4e04d" />
      </div>

      {/* Buffs */}
      {player.buffs.length > 0 && (
        <div className="p-2 border-b border-amber-900/40 flex flex-wrap gap-1">
          {player.buffs.map((b) => {
            const remaining = Math.max(0, b.duration - (now - b.startTime));
            return (
              <div key={b.id} className="px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1"
                   style={{ borderColor: b.color, background: `${b.color}20`, color: b.color }}
                   title={`${b.name} - ${Math.ceil(remaining / 1000)}s`}>
                <span className="text-xs">{b.icon}</span>
                <span>{Math.ceil(remaining / 1000)}s</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="p-2 border-b border-amber-900/40 grid grid-cols-2 gap-1.5 text-xs">
        <Tooltip position="left" content={
          <StatTooltip label="Attack" value={derived.totalAttack}
            description="Total damage potential. Includes base + equipment bonuses."
            breakdown={[
              { label: 'Base', value: player.attack, color: '#ff6060' },
              { label: 'Equipment', value: derived.totalAttack - player.attack, color: '#ffaa60' },
              { label: 'Crit Chance', value: derived.critChance, color: '#ff4444' },
              { label: 'Lifesteal', value: derived.lifesteal, color: '#c13030' },
            ]} />
        }>
          <Stat label="⚔ ATK" value={derived.totalAttack} color="#ff6060" />
        </Tooltip>
        <Tooltip position="left" content={
          <StatTooltip label="Defense" value={derived.totalDefense}
            description="Reduces incoming physical damage. Includes base + equipment."
            breakdown={[
              { label: 'Base', value: player.defense, color: '#6090ff' },
              { label: 'Equipment', value: derived.totalDefense - player.defense, color: '#80a0ff' },
              { label: 'Armor', value: derived.totalArmor, color: '#a8a8a8' },
              { label: 'Dmg Reduction', value: derived.damageReduction, color: '#4a90e2' },
              { label: 'Thorns', value: derived.thorns, color: '#4a7c3a' },
            ]} />
        }>
          <Stat label="🛡 DEF" value={derived.totalDefense} color="#6090ff" />
        </Tooltip>
        <Tooltip position="left" content={
          <StatTooltip label="Magic" value={derived.totalMagic}
            description="Boosts spell damage and healing."
            breakdown={[
              { label: 'Base', value: player.magic, color: '#9b59ff' },
              { label: 'Equipment', value: derived.totalMagic - player.magic, color: '#c880ff' },
            ]} />
        }>
          <Stat label="✦ MAG" value={derived.totalMagic} color="#9b59ff" />
        </Tooltip>
        <Tooltip position="left" content={
          <StatTooltip label="Gold" value={player.gold}
            description="Currency for shops, training, and resting. Bank gold is safe on death."
            breakdown={[
              { label: 'On hand', value: player.gold, color: '#f4e04d' },
              { label: 'In bank', value: player.bankGold, color: '#8b6914' },
              { label: 'XP Bonus', value: derived.xpBonus, color: '#f4e04d' },
              { label: 'Gold Bonus', value: derived.goldBonus, color: '#f4e04d' },
            ]} />
        }>
          <Stat label="🪙 Gold" value={player.gold} color="#f4e04d" />
        </Tooltip>
        <Stat label="💎 Coins" value={getCoins(player.name)} color="#c8a0ff" />
      </div>

      {/* Skills - VERTICAL bars (Tibia-style) */}
      <div className="p-2 border-b border-amber-900/40">
        <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">SKILLS</div>
        <div className="grid grid-cols-4 gap-2">
          {(['sword', 'magic', 'shielding', 'distance'] as const).map((sk) => {
            const skill = player.skills[sk];
            const pct = (skill.progress / (skill.level * 10)) * 100;
            const icons: Record<string, string> = { sword: '⚔', magic: '🔮', shielding: '🛡', distance: '🏹' };
            return (
              <div key={sk} className="flex flex-col items-center">
                <div className="text-[9px] text-amber-200/70 mb-0.5">{icons[sk]}</div>
                <div className="text-[11px] text-amber-300 font-bold mb-1">{skill.level}</div>
                {/* Vertical progress bar */}
                <div className="relative w-3 h-16 bg-black/70 rounded-full overflow-hidden border border-amber-900/50">
                  <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                       style={{ height: `${pct}%`, background: 'linear-gradient(0deg, #f4e04d 0%, #ff8c00 100%)' }} />
                </div>
                <div className="text-[8px] text-amber-200/50 mt-0.5">{Math.round(pct)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spells */}
      <div className="p-2 border-b border-amber-900/40">
        <div className="text-[10px] text-amber-200/60 tracking-widest mb-1.5">SPELLS</div>
        <div className="grid grid-cols-2 gap-1.5">
          {spells.map((spell, i) => {
            const onCd = now - spell.lastCast < spell.cooldown;
            const noMana = player.mana < spell.mana;
            const locked = (spell.levelRequired || 1) > player.level;
            return (
              <Tooltip
                position="left"
                content={
                  <SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />
                }
              >
                <button
                  onClick={() => onCastSpell(i)}
                  disabled={onCd || noMana || locked}
                  className={`relative aspect-square rounded border-2 flex flex-col items-center justify-center transition-all ${
                    locked ? 'opacity-60 cursor-not-allowed border-red-700/60 bg-red-950/30'
                    : onCd || noMana ? 'opacity-50 cursor-not-allowed border-gray-700'
                                  : 'border-amber-700/60 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(255,180,50,0.4)]'
                  }`}
                  style={{ background: 'linear-gradient(180deg, rgba(60,40,20,0.8) 0%, rgba(30,20,10,0.9) 100%)' }}
                >
                  <div className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${spell.color})` }}>{locked ? '🔒' : spell.icon}</div>
                  <div className="text-[9px] text-amber-200/80">{spell.name}</div>
                  <div className="text-[8px] text-blue-300">{locked ? `Lv ${spell.levelRequired}` : `${spell.mana} mp`}</div>
                  <div className="absolute top-0 right-0 text-[8px] bg-black/80 text-amber-300 px-1 rounded-bl rounded-tr border-l border-b border-amber-700/50">
                    {i + 1}
                  </div>
                  {onCd && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded">
                      <span className="text-xs text-white font-bold">
                        {((spell.cooldown - (now - spell.lastCast)) / 1000).toFixed(1)}
                      </span>
                    </div>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Mini Map */}
      <div className="p-2 border-b border-amber-900/40">
        <div className="text-[10px] text-amber-200/60 tracking-widest mb-1 flex items-center justify-between">
          <span>🗺 WORLD</span>
          <span className="text-amber-300 font-mono">{player.pos.x},{player.pos.y}</span>
        </div>
        <MiniMap player={player} monsters={monsters || []} tick={tick} />
      </div>

      {/* Nearby radar */}
      {nearby.length > 0 && (
        <div className="p-2 border-b border-amber-900/40">
          <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">👁 NEARBY ({nearby.length})</div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {nearby.slice(0, 5).map((m) => {
              const dist = Math.round(Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y));
              const hpPctM = (m.hp / m.maxHp) * 100;
              return (
                <div key={m.id} className="text-[10px] flex items-center gap-1">
                  <span>{m.emoji}</span>
                  <span className={m.type === 'boss' ? 'text-yellow-400' : m.type === 'elite' ? 'text-purple-400' : 'text-amber-100'}>
                    {m.name}
                  </span>
                  <span className="text-amber-200/50">Lv{m.level}</span>
                  <div className="flex-1 h-1 bg-black/60 rounded overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${hpPctM}%` }} />
                  </div>
                  <span className="text-amber-200/50">{dist}m</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls help */}
      <div className="mt-auto p-2 border-t border-amber-900/40 text-[9px] text-amber-200/50 space-y-0.5">
        <div>🎮 WASD: Move · Click: Attack</div>
        <div>⌨ 1-4: Spells · P: HP · M: MP</div>
        <div>📦 I: Inv · C: Char · Q: Quests</div>
        <div>🌟 T: Talents · R: Auto-Atk</div>
        <div>📖 B: Bestiary · D: DPS</div>
        <div>🗣 E: Talk NPC · Space: Mount</div>
      </div>
    </div>
  );
}

function Bar({ label, value, max, pct, from, to, textColor }: {
  label: string; value: number; max: number; pct: number; from: string; to: string; textColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5" style={{ color: textColor }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-black/60 rounded overflow-hidden border border-black/50">
        <div className="h-full transition-all"
             style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-black/40 rounded px-2 py-1 border border-amber-900/30 flex justify-between items-center">
      <span className="text-amber-200/70 text-[10px]">{label}</span>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}

function MiniMap({ player, monsters, tick: _tick }: { player: Player; monsters: Monster[]; tick: number }) {
  const size = 200;
  const scale = size / MAP_WIDTH;
  const px = player.pos.x * scale;
  const py = player.pos.y * scale;

  const tiles: Array<{ x: number; y: number; color: string }> = [];
  for (let y = 0; y < MAP_HEIGHT; y += 4) {
    for (let x = 0; x < MAP_WIDTH; x += 4) {
      let color = '#3a5a2a';
      if (x === 0 || y === 0 || x >= MAP_WIDTH - 4 || y >= MAP_HEIGHT - 4) color = '#1a1a1a';
      else if (x >= 35 && x <= 48 && y >= 35 && y <= 45) color = '#8a6f47';
      else if (Math.hypot(x - 18, y - 18) < 8) color = '#1e4782';
      else if (Math.hypot(x - 65, y - 65) < 6) color = '#8b0000';
      else if ((x < 25 && y < 30) || (x > 50 && y < 30)) color = '#2a4020';
      else if (x > 55 && y > 55) color = '#5a4a3a';
      else if (x < 25 && y > 55) color = '#2a4020';
      tiles.push({ x, y, color });
    }
  }

  // Closest monsters on map
  const mapMonsters = monsters
    .filter((m) => !m.dead)
    .slice(0, 40);

  return (
    <div className="relative rounded border-2 border-amber-700/60 overflow-hidden mx-auto"
         style={{ width: `${size}px`, height: `${size * (MAP_HEIGHT / MAP_WIDTH)}px`, background: '#0a0503', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}>
      {tiles.map((t, i) => (
        <div key={i} className="absolute"
             style={{ left: `${t.x * scale}px`, top: `${t.y * scale}px`, width: `${4 * scale}px`, height: `${4 * scale}px`, background: t.color }} />
      ))}
      {mapMonsters.map((m) => (
        <div key={m.id} className="absolute rounded-full"
             style={{
               left: `${m.pos.x * scale - 1}px`,
               top: `${m.pos.y * scale * (MAP_HEIGHT / MAP_WIDTH) - 1}px`,
               width: '2px', height: '2px',
               background: m.type === 'boss' ? '#ffd700' : m.type === 'elite' ? '#c832ff' : '#ff4444',
             }} />
      ))}
      {/* Player dot */}
      <div className="absolute rounded-full bg-amber-400"
           style={{ left: `${px - 3}px`, top: `${py * (MAP_HEIGHT / MAP_WIDTH) - 3}px`, width: '6px', height: '6px', boxShadow: '0 0 8px rgba(255,200,80,0.8)' }} />
      <div className="absolute rounded-full border-2 border-amber-400 animate-ping"
           style={{ left: `${px - 6}px`, top: `${py * (MAP_HEIGHT / MAP_WIDTH) - 6}px`, width: '12px', height: '12px', opacity: 0.5 }} />
     </div>
   );
}
