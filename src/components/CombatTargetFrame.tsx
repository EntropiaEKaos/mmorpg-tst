import { memo } from 'react';

export interface CombatTargetView {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  emoji?: string;
  type?: string;
  level?: number;
  attack?: number;
  defense?: number;
  pos?: { x: number; y: number };
  x?: number;
  y?: number;
}

interface Props {
  target: CombatTargetView | null;
  playerLevel: number;
  playerPos: { x: number; y: number };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function CombatTargetFrameInner({ target, playerLevel, playerPos }: Props) {
  if (!target) return null;

  const maxHp = Math.max(1, Number(target.maxHp) || 1);
  const hp = clamp(Number(target.hp) || 0, 0, maxHp);
  const hpPct = clamp((hp / maxHp) * 100, 0, 100);
  const level = Math.max(1, Math.floor(Number(target.level) || 1));
  const delta = level - Math.max(1, playerLevel);
  const tx = Number.isFinite(target.pos?.x) ? Number(target.pos?.x) : Number(target.x);
  const ty = Number.isFinite(target.pos?.y) ? Number(target.pos?.y) : Number(target.y);
  const distance = Number.isFinite(tx) && Number.isFinite(ty)
    ? Math.hypot(tx - playerPos.x, ty - playerPos.y)
    : null;
  const isBoss = target.type === 'boss';
  const isElite = target.type === 'elite';
  const tierLabel = isBoss ? 'BOSS TARGET' : isElite ? 'ELITE TARGET' : 'TARGET LOCKED';
  const accent = isBoss ? '#ffd87b' : isElite ? '#b88aff' : '#ff818d';
  const danger = delta >= 5 ? 'DEADLY' : delta >= 2 ? 'DANGEROUS' : delta <= -5 ? 'TRIVIAL' : 'EVEN';

  return (
    <div
      className={`moria-panel moria-target-frame absolute left-3 top-3 z-20 w-[min(300px,calc(100%-24px))] rounded-2xl border p-3 ${isBoss ? 'moria-target-boss' : ''}`}
      style={{ borderColor: `${accent}88` }}
      aria-label={`Combat target ${target.name}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="moria-eyebrow text-[8px]" style={{ color: accent }}>{tierLabel}</div>
        <div className="flex items-center gap-1 text-[8px] font-black tracking-wider">
          <span className={delta >= 5 ? 'text-rose-300' : delta >= 2 ? 'text-amber-300' : delta <= -5 ? 'text-slate-500' : 'text-emerald-300'}>{danger}</span>
          {distance !== null && <span className="text-slate-500">· {distance.toFixed(1)}m</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-black/35 text-2xl" style={{ borderColor: `${accent}55`, boxShadow: `0 0 24px ${accent}18` }}>
          <span className={isBoss ? 'moria-soft-pulse' : ''}>{target.emoji || '☠'}</span>
          {isBoss && <span className="absolute -right-1 -top-1 text-[10px]">♛</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-black text-amber-50">{target.name}</span>
            <span className="shrink-0 text-[10px] font-bold" style={{ color: accent }}>Lv {level}</span>
          </div>
          <div className="relative mt-1.5 h-3 overflow-hidden rounded-full border border-rose-900/50 bg-black/70">
            <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${isBoss ? '#9f1f35' : '#a72a3b'}, ${accent})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.16),transparent_48%)]" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px]">
            <span className="font-mono text-rose-200">{Math.ceil(hp).toLocaleString()} / {Math.ceil(maxHp).toLocaleString()}</span>
            <span className="font-black text-slate-400">{hpPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {(Number.isFinite(target.attack) || Number.isFinite(target.defense)) && (
        <div className="mt-2 flex gap-2 text-[9px] font-bold text-slate-400">
          {Number.isFinite(target.attack) && <span className="moria-chip rounded-md px-1.5 py-0.5">⚔ {Math.floor(Number(target.attack))}</span>}
          {Number.isFinite(target.defense) && <span className="moria-chip rounded-md px-1.5 py-0.5">🛡 {Math.floor(Number(target.defense))}</span>}
        </div>
      )}
    </div>
  );
}

export default memo(CombatTargetFrameInner);
