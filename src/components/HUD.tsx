import type { ReactNode } from 'react';
import type { Player, Spell, Monster } from '../game/types';
import { computeDerivedStats } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/world';
import { T as Tooltip, SpellTooltip, StatTooltip } from './Tooltip';
import { getCoins } from '../game/economy';
import MovableHudWindow from './MovableHudWindow';

interface Props {
  player: Player;
  tick: number;
  spells: Spell[];
  onCastSpell: (idx: number) => void;
  monsters?: Monster[];
  official?: any;
}

export default function HUD({ player, spells, onCastSpell, monsters, tick, official }: Props) {
  const authoritative = Boolean(official);
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
  const now = Date.now();
  const vocation = VOCATIONS[player.vocation];
  const nearby = (monsters || []).filter((m) => !m.dead && Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y) < 12);
  const coins = authoritative ? Number(official?.state?.coins || 0) : getCoins(player.name);

  return (
    <>
      <MovableHudWindow
        id="minimap"
        title={`Minimap · ${player.pos.x}, ${player.pos.y}`}
        className="w-[252px]"
        contentClassName="p-2"
        defaultStyle={{ left: 8, top: 8 }}
      >
        <MiniMap player={player} monsters={monsters || []} tick={tick} />
      </MovableHudWindow>

      <MovableHudWindow
        id="combat-profile"
        title={`${vocation?.name || player.vocation} · Lv ${player.level}`}
        className="w-[278px]"
        contentClassName="p-2"
        defaultStyle={{ right: 8, top: 8 }}
      >
        <div className="grid grid-cols-2 gap-1.5">
          <Tooltip position="left" content={<StatTooltip label="Attack" value={derived.totalAttack} description="Total damage potential. Includes base + equipment bonuses." breakdown={[
            { label: 'Base', value: player.attack, color: '#ff7b83' },
            { label: 'Equipment', value: derived.totalAttack - player.attack, color: '#ffbc76' },
            { label: 'Crit Chance', value: derived.critChance, color: '#ff5f6d' },
            { label: 'Lifesteal', value: derived.lifesteal, color: '#dc6680' },
          ]} />}>
            <Stat label="ATTACK" icon="⚔" value={derived.totalAttack} color="#ff737d" />
          </Tooltip>
          <Tooltip position="left" content={<StatTooltip label="Defense" value={derived.totalDefense} description="Reduces incoming physical damage." breakdown={[
            { label: 'Base', value: player.defense, color: '#76a9ff' },
            { label: 'Equipment', value: derived.totalDefense - player.defense, color: '#9fc1ff' },
            { label: 'Armor', value: derived.totalArmor, color: '#b7c1cf' },
            { label: 'Dmg Reduction', value: derived.damageReduction, color: '#72a5e8' },
          ]} />}>
            <Stat label="DEFENSE" icon="🛡" value={derived.totalDefense} color="#79aaff" />
          </Tooltip>
          <Stat label="MAGIC" icon="✦" value={derived.totalMagic} color="#bd8cff" />
          <Stat label="GOLD" icon="🪙" value={player.gold} color="#e5c477" />
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <MiniValue label="HP" value={`${Math.round(player.hp)}/${Math.round(derived.totalMaxHp)}`} color="#ff737d" />
          <MiniValue label="MANA" value={`${Math.round(player.mana)}/${Math.round(derived.totalMaxMana)}`} color="#72aefc" />
          <MiniValue label="COINS" value={String(coins)} color="#c6a9ff" />
          <MiniValue label="XP" value={`${Math.round(clampPct(player.xp, player.xpNext))}%`} color="#e5c477" />
        </div>
      </MovableHudWindow>

      <MovableHudWindow
        id="skills"
        title="Skills"
        className="w-[278px]"
        contentClassName="p-2"
        defaultStyle={{ right: 8, top: 218 }}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {(['sword', 'magic', 'shielding', 'distance'] as const).map((sk) => {
            const rawSkill: any = player.skills?.[sk];
            if (rawSkill == null) return null;
            const skill = typeof rawSkill === 'number' ? { level: rawSkill, progress: 0 } : rawSkill;
            const needed = Math.max(1, (Number(skill.level) || 1) * 10);
            const pct = Math.max(0, Math.min(100, ((Number(skill.progress) || 0) / needed) * 100));
            const icons: Record<string, string> = { sword: '⚔', magic: '🔮', shielding: '🛡', distance: '🏹' };
            return (
              <div key={sk} className="moria-hud-cell px-1 py-2 text-center">
                <div className="text-lg">{icons[sk]}</div>
                <div className="mt-0.5 font-mono text-xs font-black text-amber-100">{skill.level}</div>
                <div className="mt-1 h-1 overflow-hidden bg-black/70">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 font-mono text-[7px] text-slate-500">{Math.round(pct)}%</div>
              </div>
            );
          })}
        </div>
      </MovableHudWindow>

      <MovableHudWindow
        id="spellbook"
        title={`Spellbook · ${vocation?.name || player.vocation}`}
        className="w-[278px]"
        contentClassName="p-2"
        defaultStyle={{ right: 8, top: 350 }}
      >
        <div className="space-y-1">
          {spells.map((spell, i) => {
            const onCd = now - spell.lastCast < spell.cooldown;
            const noMana = player.mana < spell.mana;
            const locked = (spell.levelRequired || 1) > player.level;
            return (
              <Tooltip key={spell.id} position="left" content={<SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />}>
                <button
                  onClick={() => onCastSpell(i)}
                  disabled={onCd || noMana || locked}
                  className="moria-hud-cell relative flex min-h-[43px] w-full items-center gap-2 px-2 py-1.5 text-left disabled:opacity-50"
                  style={!locked && !onCd && !noMana ? { borderColor: `${spell.color}55` } : undefined}
                >
                  <span className="flex h-8 w-8 items-center justify-center border border-white/10 bg-black/35 text-lg" style={{ filter: `drop-shadow(0 0 5px ${spell.color}66)` }}>{locked ? '🔒' : spell.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-bold text-slate-100">{spell.name}</div>
                    <div className="font-mono text-[8px] text-blue-300/80">{locked ? `LV ${spell.levelRequired}` : `${spell.mana} MP`}</div>
                  </div>
                  <div className="border border-amber-200/20 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-black text-amber-100">{i + 1}</div>
                  {onCd && !locked && <span className="absolute inset-0 flex items-center justify-center bg-black/65 font-mono text-xs font-black text-white">{((spell.cooldown - (now - spell.lastCast)) / 1000).toFixed(1)}</span>}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </MovableHudWindow>

      {nearby.length > 0 && (
        <MovableHudWindow
          id="nearby-threats"
          title={`Nearby Threats · ${nearby.length}`}
          className="w-[278px]"
          contentClassName="p-2"
          defaultStyle={{ right: 8, bottom: 8 }}
        >
          <div className="space-y-1">
            {nearby.slice(0, 5).map((m) => {
              const dist = Math.round(Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y));
              const hpPctM = clampPct(m.hp, m.maxHp);
              return (
                <div key={m.id} className="moria-hud-cell px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span>{m.emoji}</span>
                    <span className={`min-w-0 flex-1 truncate font-bold ${m.type === 'boss' ? 'text-amber-200' : m.type === 'elite' ? 'text-violet-300' : 'text-slate-200'}`}>{m.name}</span>
                    <span className="font-mono text-slate-500">Lv{m.level}</span>
                    <span className="font-mono text-slate-500">{dist}m</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden border border-black/40 bg-black/65">
                    <div className="h-full bg-rose-600" style={{ width: `${hpPctM}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </MovableHudWindow>
      )}

      {(player.buffs || []).length > 0 && (
        <MovableHudWindow
          id="active-effects"
          title="Active Effects"
          className="max-w-[330px]"
          contentClassName="flex flex-wrap gap-1 p-1.5"
          defaultStyle={{ left: 8, top: 286 }}
          compact
        >
          {player.buffs.map((b) => {
            const expiresAt = Number((b as any).expiresAt);
            const remaining = expiresAt > now ? expiresAt - now : Math.max(0, Number((b as any).duration || 0) - (now - Number(b.startTime || now)));
            return <div key={b.id} className="moria-hud-cell flex items-center gap-1 px-1.5 py-1 text-[8px]" style={{ borderColor: `${b.color}55`, color: b.color }} title={`${b.name} - ${Math.ceil(remaining / 1000)}s`}><span>{b.icon}</span><span className="font-bold">{Math.ceil(remaining / 1000)}s</span></div>;
          })}
        </MovableHudWindow>
      )}
    </>
  );
}

function Stat({ label, icon, value, color }: { label: string; icon: string; value: number; color: string }) {
  return (
    <div className="moria-hud-cell flex items-center gap-2 px-2 py-2">
      <span className="text-base">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[7px] font-bold tracking-widest text-slate-500">{label}</div>
        <div className="font-mono text-sm font-black" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function MiniValue({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="moria-hud-cell flex items-center justify-between gap-2 px-2 py-1.5 text-[8px]"><span className="font-bold tracking-wider text-slate-500">{label}</span><span className="font-mono font-black" style={{ color }}>{value}</span></div>;
}

function MiniMap({ player, monsters, tick: _tick }: { player: Player; monsters: Monster[]; tick: number }) {
  const size = 232;
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

  return (
    <div className="relative overflow-hidden border border-[#806437] bg-[#070a10] shadow-[inset_0_0_18px_rgba(0,0,0,.85)]" style={{ width: `${size}px`, height: `${height}px` }}>
      {tiles.map((t, i) => <div key={i} className="absolute" style={{ left: `${t.x * scale}px`, top: `${t.y * scale}px`, width: `${4 * scale}px`, height: `${4 * scale}px`, background: t.color }} />)}
      {monsters.filter((m) => !m.dead).slice(0, 40).map((m) => <div key={m.id} className="absolute z-20" style={{ left: `${m.pos.x * scale - 1.5}px`, top: `${m.pos.y * scale - 1.5}px`, width: '3px', height: '3px', background: m.type === 'boss' ? '#ffd87b' : m.type === 'elite' ? '#b88aff' : '#ff5666' }} />)}
      <div className="absolute z-30 bg-amber-200" style={{ left: `${px - 3}px`, top: `${py - 3}px`, width: '6px', height: '6px', boxShadow: '0 0 6px rgba(255,225,160,.95)' }} />
    </div>
  );
}

function clampPct(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function HudSection({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
