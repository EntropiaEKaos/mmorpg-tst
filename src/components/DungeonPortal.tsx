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

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4 z-20"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl border-2 p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(80,20,80,0.95) 0%, rgba(30,5,30,0.98) 100%)',
          borderColor: '#c832ff',
          boxShadow: '0 0 50px rgba(200,50,255,0.4)',
        }}
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
          <div className="grid grid-cols-5 gap-1.5">
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
                      <span key={i} className="text-base">{m.emoji}</span>
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
              <div className="text-2xl font-black text-amber-400">{selectedWaves * 100}🪙</div>
              <div className="text-[10px] text-amber-200/60">Gold</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-400">{selectedWaves * 150}</div>
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
          className="w-full py-3 rounded-lg font-black tracking-widest text-lg transition-all hover:scale-[1.02]"
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
