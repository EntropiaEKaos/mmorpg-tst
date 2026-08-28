import { useState } from 'react';
import type { Item, ShopItem } from '../game/types';
import { RARITY_COLORS } from '../game/equipment';
import { T as Tooltip, ItemTooltip } from './Tooltip';
import { RECIPES, canCraft } from '../game/crafting';
import { GEMS } from '../game/itemSets';
import { getItemMastery } from '../game/economy';
import { Draggable, DropZone } from './DragDrop';
import { t as tr } from '../i18n';

interface Props {
  items: Item[];
  onClose: () => void;
  onUse: (item: Item) => void;
  onEquip?: (item: Item) => void;
  shopItems?: ShopItem[];
  onBuy?: (item: ShopItem) => void;
  showShop?: boolean;
  shopName?: string;
  onCraft?: (resultName: string, resultIcon: string, resultValue: number, resultDesc?: string) => void;
  playerLevel?: number;
  playerName?: string;
  onSocketGem?: (itemId: string, gemId: string) => void;
  onDropItem?: (item: Item) => void;
}

export default function Inventory({ items, onClose, onUse, onEquip, shopItems, onBuy, showShop, shopName, onCraft, playerLevel = 1, playerName, onSocketGem, onDropItem }: Props) {
  const [tab, setTab] = useState<'items' | 'craft' | 'socket'>('items');
  const [selectedSocketItem, setSelectedSocketItem] = useState<Item | null>(null);

  // Items with sockets and gems
  const socketableItems = items.filter((i) => i.type === 'equipment' && i.equipment);
  const gemsInInventory = items.filter((i) => GEMS.some((g) => g.name === i.name));
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-scrollbar moria-fade-up max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-200/20 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('items')}
              className={`px-3 py-1 rounded font-bold text-xs tracking-widest transition-all ${
                tab === 'items' ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black' : 'text-amber-200/60 hover:text-amber-200'
              }`}
            >
              📦 {tr('ITEMS')}
            </button>
            <button
              onClick={() => setTab('craft')}
              className={`px-3 py-1 rounded font-bold text-xs tracking-widest transition-all ${
                tab === 'craft' ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black' : 'text-amber-200/60 hover:text-amber-200'
              }`}
            >
              ⚒ {tr('CRAFTING')}
            </button>
            <button
              onClick={() => setTab('socket')}
              className={`px-3 py-1 rounded font-bold text-xs tracking-widest transition-all ${
                tab === 'socket' ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'text-purple-200/60 hover:text-purple-200'
              }`}
            >
              💎 {tr('SOCKET')}
            </button>
          </div>
          <button onClick={onClose} className="moria-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-slate-400" aria-label={tr('Close inventory')}>✕</button>
        </div>

        {tab === 'socket' && onSocketGem && (
          <div className="mb-3 p-3 rounded border border-purple-700/50 bg-black/40">
            <div className="text-xs text-purple-300 tracking-widest mb-2">💎 {tr('GEM SOCKETING')}</div>
            {gemsInInventory.length === 0 ? (
              <div className="text-purple-200/40 text-xs italic text-center py-4">
                {tr('No gems found! Defeat elite/boss monsters to obtain gems.')}
              </div>
            ) : !selectedSocketItem ? (
              <div>
                <div className="text-[10px] text-purple-200/60 mb-1.5">{tr('Select an item to socket:')}</div>
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                  {socketableItems.map((item) => {
                    const eq = item.equipment!;
                    const sockets = eq.sockets ?? 0;
                    const filled = eq.socketedGems?.length ?? 0;
                    const available = sockets - filled;
                    return (
                      <button key={item.id} onClick={() => { if (available > 0) setSelectedSocketItem(item); }}
                              disabled={available <= 0}
                              className={`p-2 rounded border text-center transition-all ${available > 0 ? 'border-purple-600/60 bg-purple-900/20 hover:bg-purple-900/40 cursor-pointer' : 'border-gray-700/40 bg-black/40 opacity-40 cursor-not-allowed'}`}>
                        <div className="text-2xl">{item.icon}</div>
                        <div className="text-[9px] text-purple-200 truncate">{tr(item.name)}</div>
                        <div className="text-[9px] mt-0.5">{filled}/{sockets} 💎</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 p-2 rounded bg-purple-900/20 border border-purple-600/40">
                  <span className="text-2xl">{selectedSocketItem.icon}</span>
                  <div className="flex-1">
                    <div className="text-purple-200 font-bold text-xs">{tr(selectedSocketItem.name)}</div>
                    <div className="text-[9px] text-purple-200/60">{selectedSocketItem.equipment!.socketedGems?.length ?? 0}/{selectedSocketItem.equipment!.sockets ?? 0} {tr('sockets filled')}</div>
                  </div>
                  <button onClick={() => setSelectedSocketItem(null)} className="text-purple-200/60 text-xs">✕</button>
                </div>
                <div className="text-[10px] text-purple-200/60 mb-1.5">{tr('Choose a gem to socket:')}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {gemsInInventory.map((gem) => {
                    const gemData = GEMS.find((g) => g.name === gem.name);
                    if (!gemData) return null;
                    return (
                      <button key={gem.id} onClick={() => { onSocketGem(selectedSocketItem.id, gemData.id); setSelectedSocketItem(null); }}
                              className="p-2 rounded border border-purple-600/60 bg-purple-900/20 hover:bg-purple-900/40 text-center transition-all">
                        <div className="text-xl">{gem.icon}</div>
                        <div className="text-[9px] text-purple-200 truncate">{tr(gem.name)}</div>
                        <div className="text-[9px]" style={{ color: gemData.color }}>{tr(gemData.description)}</div>
                        <div className="text-[8px] text-amber-300">×{gem.quantity}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'craft' && onCraft && (
          <div className="mb-3 p-3 rounded border border-amber-700/50 bg-black/40">
            <div className="text-xs text-amber-300 tracking-widest mb-2">⚒ {tr('CRAFTING RECIPES')}</div>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
              {RECIPES.map((recipe) => {
                const available = canCraft(recipe, items, playerLevel);
                const levelOk = playerLevel >= recipe.levelRequired;
                return (
                  <button
                    key={recipe.id}
                    onClick={() => available && onCraft(recipe.result.name, recipe.result.icon, recipe.result.value, recipe.result.description)}
                    disabled={!available}
                    className={`p-2 rounded border text-left transition-all ${
                      available
                        ? 'border-green-600/50 bg-green-900/20 hover:bg-green-900/40 cursor-pointer'
                        : levelOk
                          ? 'border-red-700/40 bg-red-900/10 opacity-60 cursor-not-allowed'
                          : 'border-gray-700/40 bg-black/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{recipe.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-amber-100 font-bold text-xs truncate">{tr(recipe.name)}</div>
                        {!levelOk && <div className="text-red-400 text-[9px]">{tr('Lv')} {recipe.levelRequired}+</div>}
                      </div>
                    </div>
                    <div className="mt-1 text-[9px] space-y-0.5">
                      {recipe.ingredients.map((ing, i) => {
                        const have = items.find((it) => it.name === ing.name)?.quantity ?? 0;
                        const enough = have >= ing.quantity;
                        return (
                          <div key={i} className={enough ? 'text-green-300' : 'text-red-300'}>
                            {enough ? '✓' : '✗'} {tr(ing.name)} ×{ing.quantity} ({tr('have')} {have})
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'items' && showShop && shopItems && onBuy && (
          <div className="mb-4 p-3 rounded border-2"
               style={{ borderColor: '#f4e04d', background: 'rgba(244,224,77,0.05)' }}>
            <div className="moria-eyebrow mb-2">🛒 {tr(shopName || 'MERCHANT')} · {tr('SHOP')}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {shopItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onBuy(item)}
                  className="p-2 rounded border border-amber-700/50 bg-black/40 text-xs text-left hover:border-amber-400 hover:bg-amber-900/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-amber-100 font-bold">{tr(item.name)}</div>
                      {item.description && <div className="text-amber-200/60 text-[10px]">{tr(item.description)}</div>}
                      <div className="text-amber-400 font-bold">{item.price} 🪙</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'items' && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {items.map((item) => {
            const isEquipment = item.type === 'equipment' && item.equipment;
            const isPotion = item.type === 'potion';
            return (
              <Tooltip
                key={item.id}
                position="right"
                content={<ItemTooltip item={item} />}
              >
                <Draggable payload={{ type: 'item', data: item, source: 'inventory' }}
                           onDoubleClick={() => isPotion ? onUse(item) : isEquipment && onEquip?.(item)}>
                  <button
                    onClick={() => isPotion ? onUse(item) : isEquipment && onEquip?.(item)}
                    className={`relative aspect-square rounded border-2 flex flex-col items-center justify-center transition-all ${
                      isPotion || isEquipment ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                    }`}
                    style={{
                      background: isEquipment
                        ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment!.rarity]}24 0%, rgba(7,11,18,0.96) 100%)`
                        : 'linear-gradient(180deg, rgba(25,34,48,0.86) 0%, rgba(7,11,18,0.96) 100%)',
                      borderColor: isEquipment ? RARITY_COLORS[item.equipment!.rarity] : 'rgba(229,196,119,0.22)',
                    }}
                  >
                  <div className="text-2xl">{item.icon}</div>
                  {item.quantity > 0 && (
                    <div className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-amber-300 px-1 rounded border border-amber-700/50">
                      {item.quantity}
                    </div>
                  )}
                  {isEquipment && (
                    <div className="absolute top-0.5 left-0.5 text-[8px] px-1 rounded"
                         style={{ background: RARITY_COLORS[item.equipment!.rarity] + '80', color: '#fff' }}>
                      {item.equipment!.rarity[0].toUpperCase()}
                    </div>
                  )}
                  {/* Mastery percentage bar (like skills) - shown for equipment when playerName provided */}
                  {isEquipment && playerName && item.equipment && (() => {
                    const mastery = getItemMastery(playerName, item.equipment.id);
                    const mPct = Math.max(0, Math.min(100, (mastery.progress / Math.max(1, mastery.level * 10)) * 100));
                    return mastery.level > 1 ? (
                      <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5 pointer-events-none">
                        <div className="text-[7px] text-amber-300 text-center font-bold leading-tight" style={{ textShadow: '0 0 2px #000' }}>{tr('Lv')}{mastery.level}</div>
                        <div className="h-0.5 bg-black/70 rounded overflow-hidden">
                          <div className="h-full" style={{ width: `${mPct}%`, background: 'linear-gradient(90deg,#f4e04d,#ff8c00)' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5 pointer-events-none">
                        <div className="h-1 bg-black/70 rounded overflow-hidden">
                          <div className="h-full" style={{ width: `${mPct}%`, background: 'linear-gradient(90deg,#4a7c3a,#2ecc71)' }} />
                        </div>
                      </div>
                    );
                   })()}
                  </button>
                </Draggable>
              </Tooltip>
            );
          })}
          {Array.from({ length: Math.max(0, 32 - items.length) }).map((_, i) => (
            <div key={`e_${i}`} className="aspect-square rounded border border-amber-900/30 bg-black/40" />
          ))}
        </div>
        )}

        {/* Drop on ground zone */}
        {onDropItem && (
          <DropZone onDrop={(p) => { if (p.type === 'item' && p.source === 'inventory') onDropItem(p.data); }}
                    className="mt-3 mx-auto w-1/2 border-2 border-dashed border-red-700/50 rounded-lg p-2 text-center hover:bg-red-900/20 transition-all"
                    activeClassName="border-red-500 bg-red-900/30">
            <div className="text-[10px] text-red-300/70">🗑 {tr('Drop here to throw on ground')}<br/><span className="text-[9px] text-red-300/40">{tr('(drag an item here)')}</span></div>
          </DropZone>
        )}

        <div className="mt-3 text-[10px] text-amber-200/60 text-center space-y-0.5">
          <div>{tr('Click potions to use · Click equipment to equip · Drag to move/drop')}</div>
          <div className="text-amber-300">
            {tr('Rarity:')} <span style={{ color: RARITY_COLORS.common }}>{tr('Common')}</span> ·
            <span style={{ color: RARITY_COLORS.uncommon }}> {tr('Uncommon')}</span> ·
            <span style={{ color: RARITY_COLORS.rare }}> {tr('Rare')}</span> ·
            <span style={{ color: RARITY_COLORS.epic }}> {tr('Epic')}</span> ·
            <span style={{ color: RARITY_COLORS.legendary }}> {tr('Legendary')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
