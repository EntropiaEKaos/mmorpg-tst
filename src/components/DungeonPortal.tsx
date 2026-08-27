import { useState } from 'react';
import type { Player } from '../game/types';
import { DUNGEON_WAVES, getDungeonReward } from '../game/dungeons';

interface Props {
  player: Player;
  onClose: () => void;
  onEnterDungeon: (waves: number) => void;
  highestWave: number;
}

export default function DungeonPortal({ player: _player, onClose, onEnterDungeon, highestWave }: Props) {
  const [selectedWaves, setSelectedWaves] = useState(10);
  const completionReward = getDungeonReward(selectedWaves);

  return (
    <div
      className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="moria-panel moria-scrollbar w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-violet-300/25 p-4 sm:p-6"
        style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 60px rgba(139,92,246,.12)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(180deg, #c832ff 0%, #6a0a6a 100%)' }}>
              🌀 DUNGEON PORTAL
            </h2>
            <div className="text-xs text-purple-200/60 mt-1">Survive waves of monsters for epic rewards!</div>
          </div>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>
        </div>

        {/* Best score */}
        <div className="mb-4 p-3 rounded-lg border border-purple-600/40 bg-black/40 text-center">
          <div className="text-xs text-purple-200/60 tracking-widest">BEST WAVE CLEARED</div>
          <div className="text-3xl font-black text-purple-300">{highestWave > 0 ? `Wave ${highestWave}` : 'None yet'}</div>
        </div>

        {/* Wave selector */}
        <div className="mb-4">
          <div className="text-xs text-purple-200/60 tracking-widest mb-2">NUMBER OF WAVES</div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7, 10].map((n) => (
              <button key={n} onClick={() => setSelectedWaves(n)}
                      className={`py-2 rounded border-2 font-bold text-sm transition-all ${
                        selectedWaves === n
                          ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white border-purple-400'
                          : 'bg-black/40 text-purple-300 border-purple-700/40 hover:border-purple-500'
                      }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Wave preview */}
        <div className="mb-4">
          <div className="text-xs text-purple-200/60 tracking-widest mb-2">WAVE BREAKDOWN</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {DUNGEON_WAVES.slice(0, selectedWaves).map((w) => {
              const reward = getDungeonReward(w.wave);
              return (
                <div key={w.wave} className="flex items-center gap-2 p-2 rounded border border-purple-700/30 bg-black/30 text-xs">
                  <span className="font-bold text-purple-300 w-14">Wave {w.wave}</span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {w.monsters.map((m, i) => (
                      <span key={i} className="moria-chip rounded-md px-1.5 py-0.5 text-[10px] text-slate-300">{m.emoji} ×{m.count}</span>
                    ))}
                  </div>
                  <span className="text-amber-400">+{reward.gold}🪙</span>
                  <span className="text-green-400">+{reward.xp}XP</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total reward */}
        <div className="mb-4 p-3 rounded-lg border-2 border-amber-600/50 bg-amber-900/20">
          <div className="text-xs text-amber-300 tracking-widest mb-1">COMPLETION REWARD</div>
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-black text-amber-400">{completionReward.gold}🪙</div>
              <div className="text-[10px] text-amber-200/60">Gold</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-400">{completionReward.xp}</div>
              <div className="text-[10px] text-amber-200/60">XP</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-400">{selectedWaves >= 10 ? '★' : selectedWaves >= 7 ? '◆' : '○'}</div>
              <div className="text-[10px] text-amber-200/60">{selectedWaves >= 10 ? 'Guaranteed Epic' : selectedWaves >= 7 ? 'Rare Loot' : 'Normal'}</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 p-2 rounded border border-red-700/40 bg-red-900/20 text-xs text-red-300 text-center">
          ⚠ Warning: If you die, you leave the dungeon with no reward!
        </div>

        {/* Enter button */}
        <button
          onClick={() => onEnterDungeon(selectedWaves)}
          className="moria-button-primary w-full rounded-xl py-3 text-base font-black tracking-[0.12em] sm:text-lg"
          style={{
            background: 'linear-gradient(180deg, #c832ff 0%, #6a0a6a 100%)',
            boxShadow: '0 0 30px rgba(200,50,255,0.5)',
          }}
        >
          ⚔ ENTER DUNGEON ({selectedWaves} WAVES) ⚔
        </button>
      </div>
    </div>
  );
}
