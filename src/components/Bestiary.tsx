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

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4 z-20"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(50,30,10,0.98) 0%, rgba(25,15,5,0.98) 100%)',
          borderColor: '#8b6914',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>
              📖 BESTIARY
            </h2>
            <div className="text-xs text-amber-200/50">{completedCount}/{BESTIARY.length} completed</div>
          </div>
          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black'
                  : 'bg-black/40 text-amber-200/60 hover:bg-black/60'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Monster list */}
          <div className="w-1/2 overflow-y-auto space-y-1">
            {filtered.map((entry) => {
              const kills = progress[entry.name] || 0;
              const completed = kills >= entry.killsRequired;
              const typeColor = entry.type === 'boss' ? '#ffd700' : entry.type === 'elite' ? '#c832ff' : '#aaaaaa';
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-all ${
                    selectedEntry?.id === entry.id
                      ? 'border-amber-500 bg-amber-900/30'
                      : 'border-amber-900/30 bg-black/30 hover:border-amber-700/50'
                  }`}
                >
                  <span className="text-2xl">{entry.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm" style={{ color: typeColor }}>{entry.name}</span>
                      {entry.type !== 'normal' && (
                        <span className="text-[9px] px-1 rounded uppercase font-bold"
                              style={{ background: typeColor + '30', color: typeColor }}>
                          {entry.type}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-amber-200/50">{entry.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono" style={{ color: completed ? '#2ecc71' : '#ff6060' }}>
                      {kills}/{entry.killsRequired}
                    </div>
                    {completed && <div className="text-[10px] text-green-400">✓ Complete</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="w-1/2 overflow-y-auto">
            {selectedEntry ? (
              <div className="p-3 rounded border-2 border-amber-700/50 bg-black/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-5xl">{selectedEntry.emoji}</div>
                  <div>
                    <div className="text-lg font-bold" style={{
                      color: selectedEntry.type === 'boss' ? '#ffd700' : selectedEntry.type === 'elite' ? '#c832ff' : '#f4e04d'
                    }}>
                      {selectedEntry.name}
                    </div>
                    <div className="text-xs text-amber-200/60 capitalize">
                      {selectedEntry.category} · {selectedEntry.type} · Lv{
                        selectedEntry.type === 'boss' ? (selectedEntry.xp > 1000 ? 40 : selectedEntry.xp > 500 ? 25 : 35) :
                        selectedEntry.type === 'elite' ? 15 : 5
                      }
                    </div>
                  </div>
                </div>

                <div className="text-sm italic text-amber-200/80 mb-3 p-2 rounded bg-black/40 border-l-2 border-amber-600">
                  "{selectedEntry.description}"
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <StatRow icon="❤" label="HP" value={selectedEntry.hp} color="#ff6060" />
                  <StatRow icon="⚔" label="Attack" value={selectedEntry.attack} color="#ff9060" />
                  <StatRow icon="🛡" label="Defense" value={selectedEntry.defense} color="#6090ff" />
                  <StatRow icon="★" label="XP" value={selectedEntry.xp} color="#f4e04d" />
                  {selectedEntry.damageType && (
                    <StatRow icon="💀" label="Dmg Type" value={selectedEntry.damageType} color="#c832ff" />
                  )}
                  <StatRow icon="📍" label="Location" value={selectedEntry.location} color="#9bd4ff" />
                </div>

                <div className="mb-3">
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">DROPS</div>
                  <div className="flex gap-1 flex-wrap">
                    {selectedEntry.loot.map((l, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-amber-900/30 border border-amber-700/40 text-amber-200 text-xs">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedEntry.weaknesses && (
                  <div className="mb-2">
                    <div className="text-[10px] text-green-400 tracking-widest mb-1">WEAKNESSES</div>
                    <div className="flex gap-1">
                      {selectedEntry.weaknesses.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-green-900/30 border border-green-700/40 text-green-300 text-xs capitalize">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEntry.resistances && (
                  <div className="mb-2">
                    <div className="text-[10px] text-red-400 tracking-widest mb-1">RESISTANCES</div>
                    <div className="flex gap-1">
                      {selectedEntry.resistances.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-xs capitalize">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 p-2 rounded bg-black/40 border border-amber-900/30">
                  <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">YOUR PROGRESS</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-black/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, ((progress[selectedEntry.name] || 0) / selectedEntry.killsRequired) * 100)}%`,
                          background: 'linear-gradient(90deg, #f4e04d, #8b6914)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-amber-300">
                      {progress[selectedEntry.name] || 0}/{selectedEntry.killsRequired}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-amber-200/40 text-sm">
                Select a monster to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
      <span className="text-amber-200/70">{icon} {label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
