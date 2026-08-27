import { useState } from 'react';
import type { Player } from '../game/types';
import { PETS, getOwnedPets, getActivePet, setActivePet } from '../game/dungeons';

interface Props {
  player: Player;
  onClose: () => void;
  onBuyPet?: (petId: string, price: number) => boolean;
}

export default function PetShop({ player, onClose, onBuyPet }: Props) {
  const [owned, setOwned] = useState<string[]>(() => getOwnedPets(player.name));
  const [active, setActive] = useState<string | null>(() => getActivePet(player.name));

  const summon = (petId: string) => {
    if (setActivePet(player.name, petId)) setActive(petId);
  };
  const dismiss = () => {
    if (setActivePet(player.name, null)) setActive(null);
  };
  const buy = (petId: string, price: number) => {
    if (!onBuyPet?.(petId, price)) return;
    setOwned(getOwnedPets(player.name));
  };

  return (
    <div
      className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="moria-panel moria-scrollbar w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-fuchsia-300/20 p-4 sm:p-6"
        style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 55px rgba(244,114,182,.10)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff9bcc 0%, #c832ff 100%)' }}>
            🐾 COMPANIONS
          </h2>
          <button onClick={onClose} className="text-pink-200/60 hover:text-white text-2xl">✕</button>
        </div>

        <div className="text-xs text-pink-200/60 mb-3">
          Companions fight alongside you automatically. They attack your target and gain XP.
          {active && <span className="text-green-400 ml-2">● Active: {PETS.find((p) => p.id === active)?.name}</span>}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PETS.map((pet) => {
            const isOwned = owned.includes(pet.id);
            const isActive = active === pet.id;
            const canBuy = !isOwned && player.gold >= pet.price && player.level >= pet.levelRequired;
            return (
              <div key={pet.id}
                   className={`p-3 rounded-xl border-2 transition-all ${
                     isActive ? 'border-green-500 bg-green-900/20 shadow-[0_0_15px_rgba(0,255,100,0.3)]'
                     : isOwned ? 'border-pink-600/50 bg-pink-900/10'
                     : 'border-gray-700/40 bg-black/40'
                   }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2"
                       style={{ background: `radial-gradient(circle, ${pet.color}40, rgba(0,0,0,0.3))`, borderColor: pet.color }}>
                    {pet.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm" style={{ color: pet.color }}>{pet.name}</div>
                    <div className="text-[10px] text-pink-200/60">Lv {pet.levelRequired}+ required</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
                  <div className="bg-black/40 rounded px-1 py-0.5 text-center"><span className="text-red-300">⚔</span> {pet.attack}</div>
                  <div className="bg-black/40 rounded px-1 py-0.5 text-center"><span className="text-blue-300">🛡</span> {pet.defense}</div>
                  <div className="bg-black/40 rounded px-1 py-0.5 text-center"><span className="text-green-300">❤</span> {pet.hp}</div>
                </div>

                <div className="text-[10px] text-amber-200/70 italic mb-2">★ {pet.abilityDescription}</div>

                {isOwned ? (
                  isActive ? (
                    <button onClick={dismiss}
                            className="w-full py-1.5 rounded bg-red-900/40 hover:bg-red-700/60 text-red-200 text-xs font-bold border border-red-700/50">
                      ● Active (dismiss)
                    </button>
                  ) : (
                    <button onClick={() => summon(pet.id)}
                            className="w-full py-1.5 rounded bg-green-900/40 hover:bg-green-700/60 text-green-200 text-xs font-bold border border-green-700/50">
                      ✓ Summon
                    </button>
                  )
                ) : (
                  <button onClick={() => { if (canBuy) buy(pet.id, pet.price); }} disabled={!canBuy}
                          className={`w-full py-1.5 rounded text-xs font-bold border ${
                            canBuy ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black border-amber-400'
                                   : 'bg-black/40 text-gray-500 border-gray-700/40 cursor-not-allowed'
                          }`}>
                    {!isOwned && player.level < pet.levelRequired ? `Lv ${pet.levelRequired}+` : `${pet.price} 🪙`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
