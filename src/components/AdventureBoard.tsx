import { t as tr } from '../i18n';

export interface AdventureContractView {
  id: string;
  mapId: string;
  title: string;
  icon: string;
  targetLabel: string;
  count: number;
  rewardGold: number;
  rewardXp: number;
  levelRequired: number;
  tier: string;
  description: string;
  locked?: boolean;
}

export interface AdventureSnapshot {
  board: AdventureContractView[];
  active: (AdventureContractView & { progress: number; ready: boolean; startedAt: number }) | null;
  streak: number;
  completed: number;
  bestCombo: number;
  combo: { count: number; multiplier: number };
  nextCacheIn: number;
}

interface Props {
  state: AdventureSnapshot | null;
  connected: boolean;
  onStart: (contractId: string) => void;
  onAbandon: () => void;
  onClaim: () => void;
  onClose: () => void;
}

const TIER: Record<string, { label: string; color: string; glow: string }> = {
  bronze: { label: 'BRONZE', color: '#d9a066', glow: 'rgba(217,160,102,.16)' },
  silver: { label: 'SILVER', color: '#b9c7d8', glow: 'rgba(185,199,216,.16)' },
  gold: { label: 'GOLD', color: '#ffd87b', glow: 'rgba(255,216,123,.17)' },
  mythic: { label: 'MYTHIC', color: '#c084fc', glow: 'rgba(192,132,252,.18)' },
  void: { label: 'VOID', color: '#8b5cf6', glow: 'rgba(139,92,246,.22)' },
};

export default function AdventureBoard({ state, connected, onStart, onAbandon, onClaim, onClose }: Props) {
  const active = state?.active || null;
  return (
    <div className="moria-overlay absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="moria-panel relative w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}
           style={{ boxShadow: '0 35px 120px rgba(0,0,0,.72), 0 0 80px rgba(245,158,11,.08)' }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_5%,rgba(245,158,11,.10),transparent_30%),radial-gradient(circle_at_88%_15%,rgba(56,189,248,.08),transparent_28%)]" />
        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="moria-eyebrow text-amber-200/70">{tr('MVP ADVENTURE LOOP')}</div>
              <h2 className="moria-title mt-1 text-2xl font-black tracking-[0.14em] text-amber-100">⚔ {tr('HUNT BOARD')}</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400">{tr('Choose one hunt, chain kills to build Momentum, then claim escalating rewards. Every third contract awards an equipment cache.')}</p>
            </div>
            <button onClick={onClose} className="moria-button rounded-xl px-3 py-2 text-slate-300">✕</button>
          </div>

          {!connected ? (
            <div className="rounded-2xl border border-sky-300/20 bg-sky-950/20 p-8 text-center">
              <div className="text-4xl">🌐</div>
              <div className="mt-3 font-bold text-sky-100">{tr('Hunts are server-authoritative')}</div>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">{tr("Connect to the Mor'ia server to start contracts. Progress, Momentum, gold, XP and cache items are all verified and persisted by the server.")}</p>
            </div>
          ) : !state ? (
            <div className="py-12 text-center text-sm text-slate-400">{tr('Synchronizing Hunt Board…')}</div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat icon="🔥" label={tr('STREAK')} value={`${state.streak}`} note={`+${Math.min(state.streak, 5) * 10}% ${tr('next reward')}`} />
                <Stat icon="⚡" label={tr('MOMENTUM')} value={state.combo.count > 0 ? `${state.combo.count}x` : '—'} note={state.combo.count > 1 ? `+${Math.round((state.combo.multiplier - 1) * 100)}% ${tr('kill XP')}` : tr('Chain kills within 8s')} />
                <Stat icon="🏆" label={tr('COMPLETED')} value={`${state.completed}`} note={`${tr('Best combo')} ${state.bestCombo}x`} />
                <Stat icon="🎁" label={tr('NEXT CACHE')} value={`${state.nextCacheIn}`} note={tr('contracts remaining')} />
              </div>

              {active && (
                <div className="mb-5 rounded-2xl border p-4" style={{ borderColor: active.ready ? 'rgba(255,216,123,.55)' : 'rgba(125,211,252,.28)', background: active.ready ? 'rgba(92,63,18,.22)' : 'rgba(7,35,58,.28)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="text-4xl">{active.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[9px] font-black tracking-[0.18em] text-sky-300/70">{tr('ACTIVE HUNT')}</div>
                          <div className="text-lg font-black text-slate-100">{tr(active.title)}</div>
                        </div>
                        <div className="text-right text-xs text-amber-200">{active.rewardGold}g · {active.rewardXp} XP</div>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/50">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-amber-300 transition-all" style={{ width: `${Math.min(100, (active.progress / Math.max(1, active.count)) * 100)}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>{tr('Defeat')} {tr(active.targetLabel)}</span><span>{active.progress}/{active.count}</span></div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      {active.ready ? (
                        <button onClick={onClaim} className="moria-button-primary rounded-xl px-4 py-2 text-xs font-black tracking-wider text-amber-50">🏆 {tr('CLAIM')}</button>
                      ) : (
                        <button onClick={onAbandon} className="moria-button rounded-xl px-4 py-2 text-xs text-rose-200">{tr('Abandon')}</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {state.board.map((contract) => {
                  const tier = TIER[contract.tier] || TIER.bronze;
                  const disabled = Boolean(active) || contract.locked;
                  return (
                    <button key={contract.id} disabled={disabled} onClick={() => onStart(contract.id)}
                      className={`group rounded-2xl border p-4 text-left transition-all ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:-translate-y-0.5 hover:border-amber-200/40'}`}
                      style={{ borderColor: `${tier.color}38`, background: `linear-gradient(135deg, ${tier.glow}, rgba(5,8,13,.72))` }}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-3xl">{contract.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-black text-slate-100">{tr(contract.title)}</div>
                            <span className="text-[8px] font-black tracking-[0.18em]" style={{ color: tier.color }}>{tr(tier.label)}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-slate-400">{tr(contract.description)}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                            <span className="moria-chip rounded-lg px-2 py-1 text-sky-200">⚔ {contract.count} {tr(contract.targetLabel)}</span>
                            <span className="moria-chip rounded-lg px-2 py-1 text-amber-200">🪙 {contract.rewardGold}</span>
                            <span className="moria-chip rounded-lg px-2 py-1 text-violet-200">✦ {contract.rewardXp} XP</span>
                            {contract.locked && <span className="moria-chip rounded-lg px-2 py-1 text-rose-200">🔒 Lv {contract.levelRequired}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {state.board.length === 0 && <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-slate-400">{tr('No Hunt Board contracts are available in this region yet.')}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="text-[8px] font-black tracking-[0.16em] text-slate-500">{icon} {label}</div>
      <div className="mt-1 text-xl font-black text-slate-100">{value}</div>
      <div className="mt-0.5 text-[9px] text-slate-500">{note}</div>
    </div>
  );
}
