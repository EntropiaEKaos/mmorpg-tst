import { useState } from 'react';
import type { Player, Item } from '../game/types';
import { RARITY_COLORS } from '../game/equipment';
import { T as Tooltip, ItemTooltip } from './Tooltip';
import { t as tr } from '../i18n';

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
  const [notice, setNotice] = useState('');

  const updateDepot = (items: Item[]) => {
    setDepot(items);
    saveDepot(player.name, items);
  };

  const moveToDepot = (item: Item) => {
    // For stackables, move all; otherwise move one
    const isStack = item.type === 'misc' || item.type === 'potion' || item.type === 'material';
    const qty = isStack ? item.quantity : 1;
    const existing = isStack ? depot.find((i) => i.name === item.name) : undefined;
    if (!existing && depot.length >= DEPOT_SLOTS) {
      setNotice(`${tr('Depot is full')} (${DEPOT_SLOTS}/${DEPOT_SLOTS}). ${tr('Withdraw something first.')}`);
      return;
    }
    const newDepot = existing
      ? depot.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i)
      : [...depot, { ...item, quantity: isStack ? qty : 1 }];
    updateDepot(newDepot);
    setInventory(inventory.filter((i) => i.id !== item.id));
    setNotice('');
  };

  const moveToInventory = (item: Item) => {
    const isStack = item.type === 'misc' || item.type === 'potion' || item.type === 'material';
    const qty = isStack ? item.quantity : 1;
    const existing = isStack ? inventory.find((i) => i.name === item.name) : undefined;
    const newInv = existing
      ? inventory.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i)
      : [...inventory, { ...item, quantity: isStack ? qty : 1 }];
    setInventory(newInv);
    setNotice('');

    // Remove from depot
    const newDepot = depot.filter((i) => i.id !== item.id);
    updateDepot(newDepot);
  };

  return (
    <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>
            🗄 {tr('DEPOT CHEST')}
          </h2>
          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl" aria-label={tr('Close depot')}>✕</button>
        </div>
        <div className="text-xs text-amber-200/60 mb-3">
          {tr('Safe storage for your items. Items here are')} <span className="text-green-400">{tr('never lost on death')}</span>. {tr('Gold in bank:')} <span className="text-amber-300 font-bold">{player.bankGold.toLocaleString('pt-BR')} 🪙</span>
        </div>

        {notice && <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-950/35 px-3 py-2 text-xs text-rose-200">⚠ {notice}</div>}
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
          {/* Depot side */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-amber-300 tracking-widest font-bold">🗄 {tr('DEPOT')} ({depot.length}/{DEPOT_SLOTS})</div>
            </div>
            <div className="moria-scrollbar grid grid-cols-5 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2 sm:grid-cols-6" style={{ maxHeight: '50vh' }}>
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
            <div className="text-[10px] text-amber-200/40 mt-1 text-center">{tr('Click an item to withdraw →')}</div>
          </div>

          {/* Inventory side */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-amber-300 tracking-widest font-bold">🎒 {tr('BACKPACK')} ({inventory.length})</div>
            </div>
            <div className="moria-scrollbar grid grid-cols-5 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2 sm:grid-cols-6" style={{ maxHeight: '50vh' }}>
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
            <div className="text-[10px] text-amber-200/40 mt-1 text-center">{tr('← Click an item to deposit')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
