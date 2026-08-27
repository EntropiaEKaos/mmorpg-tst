import { useState } from 'react';
import type { Player } from '../game/types';
import { BESTIARY, getBestiaryProgress } from '../game/bestiary';

interface Props {
  player: Player;
  onClose: () => void;
}

export default function Bestiary({ player, onClose }: Props) {
  const progress = getBestiaryProgress(player);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<typeof BESTIARY[0] | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: '📖' },
    { id: 'beast', name: 'Beasts', icon: '🐺' },
    { id: 'humanoid', name: 'Humanoids', icon: '👹' },
    { id: 'undead', name: 'Undead', icon: '💀' },
    { id: 'demon', name: 'Demons', icon: '😈' },
    { id: 'dragon', name: 'Dragons', icon: '🐉' },
  ];

  const filtered = selectedCategory === 'all'
    ? BESTIARY
    : BESTIARY.filter((b) => b.category === selectedCategory);

  const completedCount = BESTIARY.filter((b) => (progress[b.name] || 0) >= b.killsRequired).length;
  const completionPct = BESTIARY.length > 0 ? Math.round((completedCount / BESTIARY.length) * 100) : 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/68 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-fade-up flex max-h-[91vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="moria-eyebrow">Field knowledge</div>
            <div className="mt-1 flex items-end gap-3">
              <h2 className="moria-title text-2xl font-black">📖 Bestiary</h2>
              <span className="mb-0.5 text-[10px] font-bold text-slate-500">{completedCount}/{BESTIARY.length} mastered</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden min-w-28 sm:block">
              <div className="mb-1 flex justify-between text-[8px] font-bold tracking-wider text-slate-500"><span>DISCOVERY</span><span>{completionPct}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/55"><div className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-200" style={{ width: `${completionPct}%` }} /></div>
            </div>
            <button onClick={onClose} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label="Close bestiary">✕</button>
          </div>
        </div>

        <div className="moria-scrollbar mb-4 flex shrink-0 gap-1 overflow-x-auto pb-1">
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black tracking-wide transition-all ${active ? 'border-amber-200/35 bg-amber-200/10 text-amber-100' : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'}`}>
                {category.icon} {category.name.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row">
          <div className="moria-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 lg:w-[46%] lg:flex-none">
            {filtered.map((entry) => {
              const kills = progress[entry.name] || 0;
              const required = Math.max(1, entry.killsRequired);
              const completed = kills >= entry.killsRequired;
              const pct = Math.max(0, Math.min(100, (kills / required) * 100));
              const typeColor = entry.type === 'boss' ? '#ffd87b' : entry.type === 'elite' ? '#b88aff' : '#94a3b8';
              const selected = selectedEntry?.id === entry.id;
              return (
                <button key={entry.id} onClick={() => setSelectedEntry(entry)} className={`moria-card group w-full rounded-xl border p-2.5 text-left transition-all ${selected ? 'border-amber-200/35 bg-amber-200/[0.06]' : 'hover:border-white/[0.12] hover:bg-white/[0.035]'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/25 text-2xl" style={{ filter: `drop-shadow(0 0 6px ${typeColor}66)` }}>{entry.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-black" style={{ color: entry.type !== 'normal' ? typeColor : '#e2e8f0' }}>{entry.name}</span>
                        {entry.type !== 'normal' && <span className="rounded-md border px-1 py-0.5 text-[7px] font-black uppercase" style={{ borderColor: `${typeColor}55`, color: typeColor }}>{entry.type}</span>}
                      </div>
                      <div className="mt-0.5 truncate text-[9px] text-slate-500">📍 {entry.location}</div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/55"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: completed ? '#58d6a8' : `linear-gradient(90deg, ${typeColor}88, ${typeColor})` }} /></div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[10px]" style={{ color: completed ? '#58d6a8' : '#94a3b8' }}>{kills}/{entry.killsRequired}</div>
                      <div className="mt-0.5 text-[8px] font-bold" style={{ color: completed ? '#58d6a8' : '#64748b' }}>{completed ? 'MASTERED' : `${Math.round(pct)}%`}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="moria-scrollbar min-h-0 flex-1 overflow-y-auto lg:w-[54%]">
            {selectedEntry ? (
              <div className="moria-card rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-black/25 text-5xl shadow-inner">{selectedEntry.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="moria-eyebrow" style={{ color: selectedEntry.type === 'boss' ? '#ffd87b' : selectedEntry.type === 'elite' ? '#b88aff' : '#94a3b8' }}>{selectedEntry.category} · {selectedEntry.type}</div>
                    <div className="moria-title mt-1 truncate text-2xl font-black">{selectedEntry.name}</div>
                    <div className="mt-1 text-[10px] text-slate-500">Known habitat · {selectedEntry.location}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border-l-2 bg-black/20 p-3 text-xs italic leading-5 text-slate-400" style={{ borderColor: selectedEntry.type === 'boss' ? '#ffd87b' : selectedEntry.type === 'elite' ? '#b88aff' : '#64748b' }}>
                  “{selectedEntry.description}”
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Stat icon="❤" label="HP" value={selectedEntry.hp} color="#ff7b88" />
                  <Stat icon="⚔" label="Attack" value={selectedEntry.attack} color="#ff9a6b" />
                  <Stat icon="🛡" label="Defense" value={selectedEntry.defense} color="#7eabff" />
                  <Stat icon="★" label="XP" value={selectedEntry.xp} color="#e5c477" />
                  <Stat icon="💀" label="Damage" value={selectedEntry.damageType || 'physical'} color="#b88aff" />
                  <Stat icon="📍" label="Region" value={selectedEntry.location} color="#8fc8ff" />
                </div>

                <InfoGroup title="DROPS" items={selectedEntry.loot} color="#e5c477" />
                {selectedEntry.weaknesses?.length ? <InfoGroup title="WEAKNESSES" items={selectedEntry.weaknesses} color="#58d6a8" /> : null}
                {selectedEntry.resistances?.length ? <InfoGroup title="RESISTANCES" items={selectedEntry.resistances} color="#ff7b88" /> : null}

                <div className="moria-card mt-4 rounded-xl p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="moria-eyebrow text-[8px]">YOUR PROGRESS</div>
                    <div className="font-mono text-[10px] text-amber-100">{progress[selectedEntry.name] || 0}/{selectedEntry.killsRequired}</div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/60 p-[1px]">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-200" style={{ width: `${Math.max(0, Math.min(100, ((progress[selectedEntry.name] || 0) / Math.max(1, selectedEntry.killsRequired)) * 100))}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="moria-card flex min-h-56 h-full items-center justify-center rounded-2xl p-8 text-center">
                <div>
                  <div className="text-4xl opacity-60">📚</div>
                  <div className="moria-eyebrow mt-3">Select an entry</div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">Choose a creature to inspect its stats, drops, weaknesses and mastery progress.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="moria-card min-w-0 rounded-xl p-2.5">
      <div className="text-[8px] font-bold tracking-widest text-slate-500">{icon} {label.toUpperCase()}</div>
      <div className="mt-1 truncate text-sm font-black" style={{ color }} title={String(value)}>{value}</div>
    </div>
  );
}

function InfoGroup({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="mt-4">
      <div className="moria-eyebrow mb-2 text-[8px]" style={{ color }}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => <span key={`${item}-${index}`} className="moria-chip rounded-lg px-2 py-1 text-[10px] capitalize" style={{ borderColor: `${color}40`, color }}>{item}</span>)}
      </div>
    </div>
  );
}
