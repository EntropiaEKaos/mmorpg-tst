import { useEffect, useState } from 'react';
import { dpsMeter } from '../game/dpsMeter';
import { t as tr } from '../i18n';

interface Props {
  onClose: () => void;
}

export default function DPSMeter({ onClose }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const stats = dpsMeter.getStats();
  const recent = dpsMeter.getRecent(15);
  const now = Date.now();

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/68 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-fade-up w-full max-w-2xl rounded-3xl border border-rose-300/20 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="moria-eyebrow text-rose-300">{tr('Combat analytics')}</div>
            <h2 className="moria-title mt-1 text-2xl font-black">📊 {tr('DPS Meter')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { dpsMeter.clear(); setTick((t) => t + 1); }} className="moria-button rounded-lg px-3 py-1.5 text-[10px] font-bold text-rose-200">↻ {tr('RESET')}</button>
            <button onClick={onClose} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label={tr('Close DPS meter')}>✕</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatBox label="DPS" value={stats.dps} color="#ff7b88" icon="⚔" hero />
          <StatBox label="HPS" value={stats.hps} color="#58d6a8" icon="💚" hero />
          <StatBox label={tr('Duration')} value={`${stats.duration}s`} color="#8fc8ff" icon="⏱" />
          <StatBox label={tr('Total Damage')} value={stats.totalDamage} color="#ff9aa5" icon="💥" />
          <StatBox label={tr('Total Healing')} value={stats.totalHealing} color="#8de8bd" icon="✨" />
          <StatBox label={tr('Crit Rate')} value={`${stats.critRate}%`} color="#e5c477" icon="🎯" />
          <StatBox label={tr('Hits')} value={stats.hits} color="#cbd5e1" icon="👊" />
          <StatBox label={tr('Crits')} value={stats.crits} color="#f4d47c" icon="✦" />
          <StatBox label={tr('Max Hit')} value={stats.maxHit} color="#ff6677" icon="☠" />
        </div>

        {recent.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="moria-eyebrow text-[8px]">{tr('RECENT COMBAT')}</div>
              <div className="text-[9px] text-slate-600">{tr('latest')} {recent.length}</div>
            </div>
            <div className="moria-scrollbar max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-white/[0.05] bg-black/20 p-2 font-mono">
              {[...recent].reverse().map((record, index) => {
                const ageSeconds = Math.max(0, (now - record.timestamp) / 1000);
                const heal = record.type === 'heal';
                const color = heal ? '#58d6a8' : record.critical ? '#ffd87b' : '#ff7b88';
                return (
                  <div key={`${record.timestamp}-${record.target}-${index}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] hover:bg-white/[0.025]">
                    <span className="w-11 shrink-0 text-slate-600">-{ageSeconds.toFixed(1)}s</span>
                    <span className="w-4 shrink-0 text-center">{heal ? '💚' : record.critical ? '💥' : '⚔'}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-400">{tr(record.target)}</span>
                    <span className="shrink-0 font-black" style={{ color }}>{heal ? '+' : '-'}{record.amount.toLocaleString()}</span>
                    <span className="w-14 shrink-0 text-right text-[8px] uppercase text-slate-600">{tr(record.type)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="moria-card mt-4 rounded-2xl p-7 text-center">
            <div className="text-3xl opacity-60">⚔</div>
            <div className="moria-eyebrow mt-3">{tr('Awaiting combat')}</div>
            <div className="mt-2 text-xs text-slate-500">{tr('Damage and healing will appear automatically from your first combat event.')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon, hero = false }: { label: string; value: string | number; color: string; icon: string; hero?: boolean }) {
  return (
    <div className={`moria-card rounded-2xl p-3 ${hero ? 'sm:row-span-1' : ''}`} style={{ borderColor: `${color}22` }}>
      <div className="text-[8px] font-bold tracking-widest text-slate-500">{icon} {label.toUpperCase()}</div>
      <div className={`${hero ? 'text-2xl' : 'text-lg'} mt-1 font-black`} style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
