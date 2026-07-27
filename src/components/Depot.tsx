import { useState } from 'react';
import type { Player, Item } from '../game/types';
import { RARITY_COLORS } from '../game/equipment';
import { T as Tooltip, ItemTooltip } from './Tooltip';

interface Props {
  player: Player;
  inventory: Item[];
  setInventory: (items: Item[]) => void;
  onClose: () => void;
}

const DEPOT_SLOTS = 40;

function getDepot(playerName: string): Item[] {
  try {
    return JSON.parse(localStorage.getItem(`tibia_depot_${playerName}`) || '[]');
  } catch { return []; }
}

function saveDepot(playerName: string, items: Item[]) {
  localStorage.setItem(`tibia_depot_${playerName}`, JSON.stringify(items));
}

export default function Depot({ player, inventory, setInventory, onClose }: Props) {
  const [depot, setDepot] = useState<Item[]>(getDepot(player.name));

  const updateDepot = (items: Item[]) => {
    setDepot(items);
    saveDepot(player.name, items);
  };

  const moveToDepot = (item: Item) => {
    // For stackables, move all; otherwise move one
    const isStack = item.type === 'misc' || item.type === 'potion' || item.type === 'material';
    const qty = isStack ? item.quantity : 1;
    const newDepot = [...depot];
    if (isStack) {
      const existing = newDepot.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += qty;
      } else {
        newDepot.push({ ...item, quantity: qty });
      }
    } else {
      newDepot.push({ ...item, quantity: 1 });
    }
    updateDepot(newDepot);

    // Remove from inventory
    let newInv;
    if (isStack) {
      newInv = inventory.filter((i) => i.id !== item.id);
    } else {
      newInv = inventory.filter((i) => i.id !== item.id);
    }
    setInventory(newInv);
  };

  const moveToInventory = (item: Item) => {
    const isStack = item.type === 'misc' || item.type === 'potion' || item.type === 'material';
    const qty = isStack ? item.quantity : 1;
    const newInv = [...inventory];
    if (isStack) {
      const existing = newInv.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += qty;
      } else {
        newInv.push({ ...item, quantity: qty });
      }
    } else {
      newInv.push({ ...item, quantity: 1 });
    }
    setInventory(newInv);

    // Remove from depot
    const newDepot = depot.filter((i) => i.id !== item.id);
    updateDepot(newDepot);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-xl border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(60,45,20,0.98) 0%, rgba(30,22,8,0.98) 100%)', borderColor: '#f4e04d', boxShadow: '0 0 50px rgba(244,224,77,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>
            🗄 DEPOT CHEST
          </h2>
          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>
        </div>
        <div className="text-xs text-amber-200/60 mb-3">
          Safe storage for your items. Items here are <span className="text-green-400">never lost on death</span>. Gold in bank: <span className="text-amber-300 font-bold">{player.bankGold.toLocaleString()} 🪙</span>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Depot side */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-amber-300 tracking-widest font-bold">🗄 DEPOT ({depot.length}/{DEPOT_SLOTS})</div>
            </div>
            <div className="grid grid-cols-6 gap-1.5 overflow-y-auto p-1 rounded border border-amber-900/40 bg-black/30" style={{ maxHeight: '50vh' }}>
              {depot.map((item) => (
                <Tooltip key={item.id} position="right" content={<ItemTooltip item={item} />}>
                  <button onClick={() => moveToInventory(item)}
                          className="relative aspect-square rounded border-2 flex items-center justify-center hover:scale-105 transition-all"
                          style={{
                            background: item.equipment ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment.rarity]}30 0%, rgba(20,10,5,0.9) 100%)` : 'linear-gradient(180deg, rgba(40,30,15,0.8) 0%, rgba(20,10,5,0.9) 100%)',
                            borderColor: item.equipment ? RARITY_COLORS[item.equipment.rarity] : '#8b6914',
                          }}>
                    <span className="text-2xl">{item.icon}</span>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-amber-300 px-1 rounded">{item.quantity}</span>
                    )}
                  </button>
                </Tooltip>
              ))}
              {Array.from({ length: Math.max(0, DEPOT_SLOTS - depot.length) }).slice(0, DEPOT_SLOTS).map((_, i) => (
                <div key={`de_${i}`} className="aspect-square rounded border border-amber-900/20 bg-black/30" />
              ))}
            </div>
            <div className="text-[10px] text-amber-200/40 mt-1 text-center">Click an item to withdraw →</div>
          </div>

          {/* Inventory side */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-amber-300 tracking-widest font-bold">🎒 BACKPACK ({inventory.length})</div>
            </div>
            <div className="grid grid-cols-6 gap-1.5 overflow-y-auto p-1 rounded border border-amber-900/40 bg-black/30" style={{ maxHeight: '50vh' }}>
              {inventory.map((item) => (
                <Tooltip key={item.id} position="left" content={<ItemTooltip item={item} />}>
                  <button onClick={() => moveToDepot(item)}
                          className="relative aspect-square rounded border-2 flex items-center justify-center hover:scale-105 transition-all"
                          style={{
                            background: item.equipment ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment.rarity]}30 0%, rgba(20,10,5,0.9) 100%)` : 'linear-gradient(180deg, rgba(40,30,15,0.8) 0%, rgba(20,10,5,0.9) 100%)',
                            borderColor: item.equipment ? RARITY_COLORS[item.equipment.rarity] : '#8b6914',
                          }}>
                    <span className="text-2xl">{item.icon}</span>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-amber-300 px-1 rounded">{item.quantity}</span>
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
            <div className="text-[10px] text-amber-200/40 mt-1 text-center">← Click an item to deposit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
