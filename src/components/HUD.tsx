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
  const hpPct = clampPct(player.hp, derived.totalMaxHp);
  const mpPct = clampPct(player.mana, derived.totalMaxMana);
  const xpPct = clampPct(player.xp, player.xpNext);
  const now = Date.now();
  const vocation = VOCATIONS[player.vocation];
  const nearby = (monsters || []).filter((m) => !m.dead && Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y) < 12);

  return (
    <aside className="moria-panel moria-scrollbar flex w-[304px] shrink-0 flex-col overflow-y-auto border-y-0 border-r-0 rounded-none">
      <div className="relative overflow-hidden border-b border-white/[0.06] p-4">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl" style={{ background: `${vocation?.color || '#e5c477'}22` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-black/35 text-3xl" style={{ borderColor: `${vocation?.color || '#e5c477'}66`, boxShadow: `0 0 28px ${vocation?.color || '#e5c477'}22` }}>
            <span style={{ filter: `drop-shadow(0 0 8px ${vocation?.color || '#e5c477'}88)` }}>{vocation?.icon || '⚔'}</span>
            <div className="absolute -bottom-1 -right-1 rounded-lg border border-amber-200/35 bg-[#090d15] px-1.5 py-0.5 text-[9px] font-black text-amber-100">{player.level}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="moria-eyebrow mb-0.5">{vocation?.name || player.vocation}</div>
            <div className="moria-title truncate text-lg font-bold">{player.name}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
              <span>Lv {player.level}</span>
              <span className="text-slate-700">•</span>
              <span>{player.mounted ? '🐎 Mounted' : 'On foot'}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-4 space-y-2.5">
          <Bar label="HEALTH" icon="❤" value={player.hp} max={derived.totalMaxHp} pct={hpPct} from="#ff6b79" to="#7d1f32" textColor="#ffb0b8" />
          <Bar label="MANA" icon="✦" value={player.mana} max={derived.totalMaxMana} pct={mpPct} from="#72b3ff" to="#3156a8" textColor="#b8dcff" />
          <Bar label="EXPERIENCE" icon="◆" value={player.xp} max={player.xpNext} pct={xpPct} from="#f0d184" to="#9d6e2c" textColor="#f8df9f" />
        </div>
      </div>

      {(player.buffs || []).length > 0 && (
        <Section title="ACTIVE EFFECTS" compact>
          <div className="flex flex-wrap gap-1.5">
            {player.buffs.map((b) => {
              const remaining = Math.max(0, b.duration - (now - b.startTime));
              return (
                <div key={b.id} className="moria-chip flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px]" style={{ borderColor: `${b.color}55`, color: b.color }} title={`${b.name} - ${Math.ceil(remaining / 1000)}s`}>
                  <span className="text-xs">{b.icon}</span>
                  <span className="font-bold">{Math.ceil(remaining / 1000)}s</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="COMBAT PROFILE" compact>
        <div className="grid grid-cols-2 gap-1.5">
          <Tooltip position="left" content={<StatTooltip label="Attack" value={derived.totalAttack} description="Total damage potential. Includes base + equipment bonuses." breakdown={[
            { label: 'Base', value: player.attack, color: '#ff7b83' },
            { label: 'Equipment', value: derived.totalAttack - player.attack, color: '#ffbc76' },
            { label: 'Crit Chance', value: derived.critChance, color: '#ff5f6d' },
            { label: 'Lifesteal', value: derived.lifesteal, color: '#dc6680' },
          ]} />}>
            <Stat label="ATK" icon="⚔" value={derived.totalAttack} color="#ff7b83" />
          </Tooltip>
          <Tooltip position="left" content={<StatTooltip label="Defense" value={derived.totalDefense} description="Reduces incoming physical damage. Includes base + equipment." breakdown={[
            { label: 'Base', value: player.defense, color: '#76a9ff' },
            { label: 'Equipment', value: derived.totalDefense - player.defense, color: '#9fc1ff' },
            { label: 'Armor', value: derived.totalArmor, color: '#b7c1cf' },
            { label: 'Dmg Reduction', value: derived.damageReduction, color: '#72a5e8' },
            { label: 'Thorns', value: derived.thorns, color: '#69b889' },
          ]} />}>
            <Stat label="DEF" icon="🛡" value={derived.totalDefense} color="#79aaff" />
          </Tooltip>
          <Tooltip position="left" content={<StatTooltip label="Magic" value={derived.totalMagic} description="Boosts spell damage and healing." breakdown={[
            { label: 'Base', value: player.magic, color: '#b18aff' },
            { label: 'Equipment', value: derived.totalMagic - player.magic, color: '#d1b5ff' },
          ]} />}>
            <Stat label="MAG" icon="✦" value={derived.totalMagic} color="#b18aff" />
          </Tooltip>
          <Tooltip position="left" content={<StatTooltip label="Gold" value={player.gold} description="Currency for shops, training, and resting. Bank gold is safe on death." breakdown={[
            { label: 'On hand', value: player.gold, color: '#e5c477' },
            { label: 'In bank', value: player.bankGold, color: '#b38a43' },
            { label: 'XP Bonus', value: derived.xpBonus, color: '#d9c272' },
            { label: 'Gold Bonus', value: derived.goldBonus, color: '#f2d77f' },
          ]} />}>
            <Stat label="GOLD" icon="🪙" value={player.gold} color="#e5c477" />
          </Tooltip>
          <div className="col-span-2">
            <Stat label="COINS" icon="💎" value={getCoins(player.name)} color="#c6a9ff" wide />
          </div>
        </div>
      </Section>

      <Section title="SKILL MASTERY" compact>
        <div className="grid grid-cols-4 gap-1.5">
          {(['sword', 'magic', 'shielding', 'distance'] as const).map((sk) => {
            const skill = player.skills[sk];
            if (!skill) return null;
            const needed = Math.max(1, skill.level * 10);
            const pct = Math.max(0, Math.min(100, (skill.progress / needed) * 100));
            const icons: Record<string, string> = { sword: '⚔', magic: '🔮', shielding: '🛡', distance: '🏹' };
            return (
              <div key={sk} className="moria-card rounded-xl px-1.5 py-2 text-center">
                <div className="text-base">{icons[sk]}</div>
                <div className="mt-1 text-xs font-black text-slate-100">{skill.level}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/50">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-200" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[8px] font-bold text-slate-500">{Math.round(pct)}%</div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="SPELLBOOK" compact>
        <div className="grid grid-cols-2 gap-1.5">
          {spells.map((spell, i) => {
            const onCd = now - spell.lastCast < spell.cooldown;
            const noMana = player.mana < spell.mana;
            const locked = (spell.levelRequired || 1) > player.level;
            return (
              <Tooltip key={spell.id} position="left" content={<SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />}>
                <button
                  onClick={() => onCastSpell(i)}
                  disabled={onCd || noMana || locked}
                  className="moria-slot relative min-h-[68px] overflow-hidden rounded-xl px-2 py-2 text-left"
                  style={!locked && !onCd && !noMana ? { borderColor: `${spell.color}44` } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" style={{ filter: `drop-shadow(0 0 6px ${spell.color}88)` }}>{locked ? '🔒' : spell.icon}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold text-slate-100">{spell.name}</div>
                      <div className="mt-0.5 text-[8px] font-semibold text-blue-300/80">{locked ? `LV ${spell.levelRequired}` : `${spell.mana} MP`}</div>
                    </div>
                  </div>
                  <div className="absolute right-1.5 top-1.5 rounded-md border border-white/10 bg-black/55 px-1 text-[8px] font-black text-amber-100">{i + 1}</div>
                  {onCd && !locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/72 backdrop-blur-[1px]">
                      <span className="text-xs font-black text-white">{((spell.cooldown - (now - spell.lastCast)) / 1000).toFixed(1)}</span>
                    </div>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </Section>

      <Section title="WORLD MAP" right={`${player.pos.x}, ${player.pos.y}`} compact>
        <MiniMap player={player} monsters={monsters || []} tick={tick} />
      </Section>

      {nearby.length > 0 && (
        <Section title={`NEARBY THREATS · ${nearby.length}`} compact>
          <div className="space-y-1.5">
            {nearby.slice(0, 5).map((m) => {
              const dist = Math.round(Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y));
              const hpPctM = clampPct(m.hp, m.maxHp);
              return (
                <div key={m.id} className="moria-card rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span>{m.emoji}</span>
                    <span className={`min-w-0 flex-1 truncate font-bold ${m.type === 'boss' ? 'text-amber-200' : m.type === 'elite' ? 'text-violet-300' : 'text-slate-200'}`}>{m.name}</span>
                    <span className="text-slate-500">Lv{m.level}</span>
                    <span className="text-slate-500">{dist}m</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/55">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-800 to-rose-400" style={{ width: `${hpPctM}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div className="mt-auto border-t border-white/[0.06] p-3 text-[9px] leading-5 text-slate-500">
        <div className="moria-eyebrow mb-1.5">Quick controls</div>
        <div>WASD move · Click attack · 1–4 spells</div>
        <div>I inventory · C character · Q quests · T talents</div>
        <div>B bestiary · D DPS · E talk · Space mount</div>
      </div>
    </aside>
  );
}

function Section({ title, right, compact = false, children }: { title: string; right?: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <section className={`border-b border-white/[0.055] ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="moria-eyebrow text-[9px] text-slate-400">{title}</div>
        {right && <div className="font-mono text-[9px] text-amber-200/70">{right}</div>}
      </div>
      {children}
    </section>
  );
}

function Bar({ label, icon, value, max, pct, from, to, textColor }: {
  label: string;
  icon: string;
  value: number;
  max: number;
  pct: number;
  from: string;
  to: string;
  textColor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold tracking-wider" style={{ color: textColor }}>
        <span>{icon} {label}</span>
        <span className="font-mono text-[9px] text-slate-300/80">{Math.max(0, Math.round(value))}/{Math.max(0, Math.round(max))}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-white/[0.055] bg-black/55 p-[1px] shadow-inner">
        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${to}, ${from})`, boxShadow: `0 0 12px ${from}55` }} />
      </div>
    </div>
  );
}

function Stat({ label, icon, value, color, wide = false }: { label: string; icon: string; value: number; color: string; wide?: boolean }) {
  return (
    <div className={`moria-card flex items-center gap-2 rounded-xl px-2.5 py-2 ${wide ? 'justify-center' : ''}`}>
      <span className="text-sm">{icon}</span>
      <div className={wide ? '' : 'min-w-0 flex-1'}>
        <div className="text-[8px] font-bold tracking-widest text-slate-500">{label}</div>
        <div className="text-sm font-black" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function MiniMap({ player, monsters, tick: _tick }: { player: Player; monsters: Monster[]; tick: number }) {
  const size = 220;
  const scale = size / MAP_WIDTH;
  const height = size * (MAP_HEIGHT / MAP_WIDTH);
  const px = player.pos.x * scale;
  const py = player.pos.y * scale;
  const tiles: Array<{ x: number; y: number; color: string }> = [];

  for (let y = 0; y < MAP_HEIGHT; y += 4) {
    for (let x = 0; x < MAP_WIDTH; x += 4) {
      let color = '#263847';
      if (x === 0 || y === 0 || x >= MAP_WIDTH - 4 || y >= MAP_HEIGHT - 4) color = '#0c1119';
      else if (x >= 35 && x <= 48 && y >= 35 && y <= 45) color = '#74654f';
      else if (Math.hypot(x - 18, y - 18) < 8) color = '#21466c';
      else if (Math.hypot(x - 65, y - 65) < 6) color = '#6f2833';
      else if ((x < 25 && y < 30) || (x > 50 && y < 30)) color = '#243c33';
      else if (x > 55 && y > 55) color = '#493f43';
      else if (x < 25 && y > 55) color = '#22392f';
      tiles.push({ x, y, color });
    }
  }

  const mapMonsters = monsters.filter((m) => !m.dead).slice(0, 40);

  return (
    <div className="relative mx-auto overflow-hidden rounded-2xl border border-slate-400/15 bg-[#070a10] shadow-[inset_0_0_32px_rgba(0,0,0,0.8),0_12px_28px_rgba(0,0,0,0.24)]" style={{ width: `${size}px`, height: `${height}px` }}>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,5,10,0.56)_100%)]" />
      {tiles.map((t, i) => (
        <div key={i} className="absolute" style={{ left: `${t.x * scale}px`, top: `${t.y * scale}px`, width: `${4 * scale}px`, height: `${4 * scale}px`, background: t.color }} />
      ))}
      {mapMonsters.map((m) => (
        <div key={m.id} className="absolute z-20 rounded-full" style={{ left: `${m.pos.x * scale - 1.5}px`, top: `${m.pos.y * scale - 1.5}px`, width: '3px', height: '3px', background: m.type === 'boss' ? '#ffd87b' : m.type === 'elite' ? '#b88aff' : '#ff6a76', boxShadow: '0 0 5px currentColor' }} />
      ))}
      <div className="absolute z-30 rounded-full bg-amber-200" style={{ left: `${px - 3}px`, top: `${py - 3}px`, width: '6px', height: '6px', boxShadow: '0 0 10px rgba(255,225,160,0.95)' }} />
      <div className="absolute z-30 rounded-full border border-amber-100/80 animate-ping" style={{ left: `${px - 7}px`, top: `${py - 7}px`, width: '14px', height: '14px', opacity: 0.45 }} />
    </div>
  );
}

function clampPct(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}
