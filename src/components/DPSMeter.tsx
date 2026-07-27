import { useState, useEffect } from 'react';
import { dpsMeter } from '../game/dpsMeter';

interface Props {
  onClose: () => void;
}

export default function DPSMeter({ onClose }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const stats = dpsMeter.getStats();
  const recent = dpsMeter.getRecent(15);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4 z-20"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border-2 p-4 max-w-lg w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(50,20,20,0.98) 0%, rgba(25,10,10,0.98) 100%)',
          borderColor: '#c13030',
          boxShadow: '0 0 40px rgba(193,48,48,0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff6060 0%, #801010 100%)' }}>
            📊 DPS METER
          </h2>
          <div className="flex gap-2">
            <button onClick={() => { dpsMeter.clear(); setTick((t) => t + 1); }}
                    className="px-2 py-1 text-xs rounded bg-red-900/40 hover:bg-red-700/60 text-red-200 border border-red-700/50">
              🔄 Reset
            </button>
            <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBox label="DPS" value={stats.dps} color="#ff6060" icon="⚔" />
          <StatBox label="HPS" value={stats.hps} color="#2ecc71" icon="💚" />
          <StatBox label="Duration" value={`${stats.duration}s`} color="#9bd4ff" icon="⏱" />
          <StatBox label="Total Damage" value={stats.totalDamage} color="#ff9090" icon="💥" />
          <StatBox label="Total Healing" value={stats.totalHealing} color="#90ff90" icon="✨" />
          <StatBox label="Crit Rate" value={`${stats.critRate}%`} color="#f4e04d" icon="🎯" />
          <StatBox label="Hits" value={stats.hits} color="#aaaaaa" icon="👊" />
          <StatBox label="Crits" value={stats.crits} color="#f4e04d" icon="💥" />
          <StatBox label="Max Hit" value={stats.maxHit} color="#ff4444" icon="☠" />
        </div>

        {recent.length > 0 && (
          <div>
            <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">COMBAT LOG (recent)</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5 text-[10px] font-mono">
              {recent.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-amber-200/30">
                    {((r.timestamp - dpsMeter.getStats().duration * 1000) / 1000).toFixed(1)}s
                  </span>
                  <span style={{ color: r.type === 'heal' ? '#2ecc71' : '#ff6060' }}>
                    {r.critical ? '💥' : '⚔'} {r.amount}
                  </span>
                  <span className="text-amber-200/50">{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.hits === 0 && (
          <div className="text-center text-amber-200/40 text-sm py-4">
            No combat data yet. Start fighting!
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className="p-2 rounded border bg-black/40" style={{ borderColor: color + '50' }}>
      <div className="text-[9px] text-amber-200/50">{icon} {label}</div>
      <div className="font-bold text-lg" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
