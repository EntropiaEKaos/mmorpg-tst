import { useState } from 'react';
import type { Player, Item } from '../game/types';
import { RARITY_COLORS } from '../game/equipment';
import { getAuctionListings, listOnAuction, buyFromAuction, cancelListing, seedAuctionHouse, type AuctionListing } from '../game/economy';
import { T as Tooltip, ItemTooltip } from './Tooltip';

interface Props {
  player: Player;
  inventory: Item[];
  setInventory: (items: Item[]) => void;
  setPlayer: (player: Player) => void;
  onClose: () => void;
  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
}

const RC: Record<string, string> = RARITY_COLORS as Record<string, string>;

export default function AuctionHouse({ player, inventory, setInventory, setPlayer, onClose, addMessage }: Props) {
  const [tab, setTab] = useState<'browse' | 'sell' | 'mine'>('browse');
  const [listings, setListings] = useState<AuctionListing[]>(() => { seedAuctionHouse(); return getAuctionListings(); });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common'>('all');
  const refresh = () => setListings(getAuctionListings());

  const addListingToInventory = (listing: AuctionListing) => {
    if (listing.itemData) {
      setInventory([...inventory, {
        id: `ah_${Date.now()}_${Math.random()}`,
        name: listing.itemName,
        icon: listing.itemIcon,
        type: 'equipment',
        quantity: 1,
        value: listing.buyoutPrice,
        equipment: listing.itemData,
      }]);
      return;
    }
    const existing = inventory.find((item) => item.name === listing.itemName);
    if (existing) {
      setInventory(inventory.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + listing.quantity } : item));
      return;
    }
    const potion = /potion/i.test(listing.itemName);
    setInventory([...inventory, {
      id: `ah_${Date.now()}_${Math.random()}`,
      name: listing.itemName,
      icon: listing.itemIcon,
      type: potion ? 'potion' : 'misc',
      quantity: listing.quantity,
      value: listing.buyoutPrice,
    }]);
  };

  const handleCancel = (listing: AuctionListing) => {
    const returned = cancelListing(listing.id, player.name);
    if (!returned) {
      addMessage('System', 'Listing could not be cancelled.', '#ff9090', 'system');
      refresh();
      return;
    }
    addListingToInventory(returned);
    refresh();
    addMessage('System', `↩ ${returned.itemName} returned to your inventory.`, '#9bd4ff', 'system');
  };

  const filtered = listings.filter((l) => {
    if (category !== 'all' && l.rarity !== category) return false;
    if (search && !l.itemName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleBuy = (l: AuctionListing) => {
    if (player.gold < l.buyoutPrice) {
      addMessage('System', 'Not enough gold.', '#ff9090', 'system');
      return;
    }
    const result = buyFromAuction(l.id, player.name);
    if (result.success) {
      setPlayer({ ...player, gold: player.gold - l.buyoutPrice });
      addListingToInventory(result.listing || l);
      addMessage('System', `🛒 Bought ${l.itemName} for ${l.buyoutPrice} gold!`, '#2ecc71', 'system');
      refresh();
    } else {
      addMessage('System', result.reason || 'Purchase failed.', '#ff9090', 'system');
    }
  };

  return (
    <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>🏛 AUCTION HOUSE</h2>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 text-sm font-bold">🪙 {player.gold.toLocaleString()} gold</span>
            <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {(['browse', 'sell', 'mine'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded font-bold text-xs tracking-wider transition-all ${tab === t ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black' : 'bg-black/40 text-amber-200/60 hover:bg-amber-900/30'}`}>
              {t === 'browse' ? '🔍 Browse' : t === 'sell' ? '💰 Sell' : '📦 My Listings'}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <>
            <div className="flex gap-2 mb-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..."
                     className="flex-1 px-3 py-1.5 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
              <select value={category} onChange={(e) => setCategory(e.target.value as any)}
                      className="px-3 py-1.5 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm">
                <option value="all">All Rarities</option>
                <option value="legendary">Legendary</option>
                <option value="epic">Epic</option>
                <option value="rare">Rare</option>
                <option value="uncommon">Uncommon</option>
                <option value="common">Common</option>
              </select>
              <button onClick={refresh} className="px-3 py-1.5 rounded bg-black/40 text-amber-200 text-sm border border-amber-900/50">🔄</button>
            </div>
            <div className="moria-scrollbar flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filtered.length === 0 ? (
                <div className="text-center text-amber-200/40 py-12">No listings found.</div>
              ) : (
                filtered.map((l) => {
                  const isOwn = l.sellerName === player.name;
                  const canBuy = !isOwn && player.gold >= l.buyoutPrice;
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg border bg-black/30"
                         style={{ borderColor: (l.rarity ? RC[l.rarity] : '#8b6914') + '50' }}>
                      <div className="w-10 h-10 rounded flex items-center justify-center text-xl border"
                           style={{ borderColor: l.rarity ? RC[l.rarity] : '#8b6914', background: `${l.rarity ? RC[l.rarity] : '#8b6914'}20` }}>
                        {l.itemIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: l.rarity ? RC[l.rarity] : '#f4e04d' }}>{l.itemName}</span>
                          {l.quantity > 1 && <span className="text-amber-200/60 text-xs">×{l.quantity}</span>}
                          {l.rarity && <span className="text-[9px] uppercase px-1 rounded" style={{ background: RC[l.rarity] + '30', color: RC[l.rarity] }}>{l.rarity}</span>}
                        </div>
                        <div className="text-[10px] text-amber-200/50">by {l.sellerName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-300 font-bold text-sm">{l.buyoutPrice.toLocaleString()} 🪙</div>
                        {isOwn ? (
                          <button onClick={() => handleCancel(l)}
                                  className="text-red-400 text-[10px] hover:text-red-300">Cancel</button>
                        ) : (
                          <button onClick={() => handleBuy(l)} disabled={!canBuy}
                                  className={`px-3 py-1 rounded text-[10px] font-bold ${canBuy ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-black/40 text-gray-500 cursor-not-allowed'}`}>
                            Buyout
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === 'sell' && (
          <SellTab player={player} inventory={inventory} setInventory={setInventory} addMessage={addMessage} refresh={refresh} />
        )}

        {tab === 'mine' && (
          <div className="moria-scrollbar flex-1 overflow-y-auto space-y-1.5 pr-1">
            {listings.filter((l) => l.sellerName === player.name).length === 0 ? (
              <div className="text-center text-amber-200/40 py-12">You have no active listings. Use the Sell tab to list items.</div>
            ) : (
              listings.filter((l) => l.sellerName === player.name).map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg border bg-black/30" style={{ borderColor: '#8b6914' + '50' }}>
                  <div className="text-xl">{l.itemIcon}</div>
                  <div className="flex-1"><span className="font-bold text-sm text-amber-100">{l.itemName}</span><span className="text-amber-200/50 text-xs ml-2">{l.buyoutPrice.toLocaleString()} 🪙</span></div>
                  <button onClick={() => handleCancel(l)}
                          className="px-3 py-1 rounded bg-red-900/50 text-red-200 text-[10px] border border-red-700/50">Cancel</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SellTab({ player, inventory, setInventory, addMessage, refresh }: {
  player: Player; inventory: Item[]; setInventory: (i: Item[]) => void;
  addMessage: Props['addMessage']; refresh: () => void;
}) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [price, setPrice] = useState(100);
  const sellable = inventory.filter((i) => i.type !== 'equipment' || i.equipment);

  const handleList = () => {
    if (!selected) return;
    if (price < 1) return;
    const listed = listOnAuction({
      sellerName: player.name,
      itemName: selected.name,
      itemIcon: selected.icon,
      buyoutPrice: price,
      quantity: selected.quantity,
      rarity: selected.equipment?.rarity,
      itemData: selected.equipment,
    });
    if (!listed) {
      addMessage('System', 'Invalid auction listing.', '#ff9090', 'system');
      return;
    }
    // Remove from inventory only after escrow accepted the listing.
    setInventory(inventory.filter((i) => i.id !== selected.id));
    addMessage('System', `📜 Listed ${selected.name} on Auction House for ${price} gold.`, '#f4e04d', 'system');
    setSelected(null);
    refresh();
  };

  return (
    <div className="flex-1 grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
      <div className="moria-scrollbar overflow-y-auto">
        <div className="text-[10px] text-amber-200/60 tracking-widest mb-2">SELECT ITEM TO SELL ({sellable.length})</div>
        <div className="grid grid-cols-5 gap-1.5">
          {sellable.map((item) => (
            <Tooltip key={item.id} position="right" content={<ItemTooltip item={item} />}>
              <button onClick={() => { setSelected(item); setPrice(item.value || 100); }}
                      className={`relative aspect-square rounded border-2 flex items-center justify-center hover:scale-105 transition-all ${selected?.id === item.id ? 'ring-2 ring-amber-400' : ''}`}
                      style={{
                        background: item.equipment ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment.rarity]}30 0%, rgba(20,10,5,0.9) 100%)` : 'linear-gradient(180deg, rgba(40,30,15,0.8) 0%, rgba(20,10,5,0.9) 100%)',
                        borderColor: item.equipment ? RARITY_COLORS[item.equipment.rarity] : '#8b6914',
                      }}>
                <span className="text-2xl">{item.icon}</span>
                {item.quantity > 1 && <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-amber-300 px-1 rounded">{item.quantity}</span>}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        {selected ? (
          <div className="p-3 rounded border-2 border-amber-700/50 bg-black/40">
            <div className="text-xs text-amber-300 tracking-widest mb-2">LISTING DETAILS</div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: selected.equipment ? RARITY_COLORS[selected.equipment.rarity] : '#f4e04d' }}>{selected.name}</div>
                <div className="text-[10px] text-amber-200/50">×{selected.quantity} · Base value: {selected.value}g</div>
              </div>
            </div>
            <label className="text-[10px] text-amber-200/60 block mb-1">Buyout Price (gold)</label>
            <input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                   className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
            <div className="text-[10px] text-amber-200/40 mt-1">💡 Tip: Price slightly below base value to sell faster. You keep 100% of the sale (gold sent via mail).</div>
            <button onClick={handleList}
                    className="w-full mt-3 py-2 rounded bg-gradient-to-b from-amber-500 to-amber-700 text-black font-bold text-sm">
              📜 List on Auction House
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-amber-200/40 text-sm">Select an item to sell →</div>
        )}
      </div>
    </div>
  );
}
