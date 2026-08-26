from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Economy: sanitize premium currency and make auction escrow lossless on cancel.
# ---------------------------------------------------------------------
p = Path('src/game/economy.ts')
s = p.read_text()
s = replace_once(s,
'''export function getCoins(playerName: string): number {
  try {
    return JSON.parse(localStorage.getItem(`moria_coins_${playerName}`) || '0');
  } catch { return 0; }
}

export function setCoins(playerName: string, amount: number) {
  localStorage.setItem(`moria_coins_${playerName}`, JSON.stringify(Math.max(0, Math.floor(amount))));
}

export function addCoins(playerName: string, amount: number) {
  const cur = getCoins(playerName);
  setCoins(playerName, cur + amount);
}

export function spendCoins(playerName: string, amount: number): boolean {
  const cur = getCoins(playerName);
  if (cur < amount) return false;
  setCoins(playerName, cur - amount);
  return true;
}
''',
'''export function getCoins(playerName: string): number {
  try {
    const value = JSON.parse(localStorage.getItem(`moria_coins_${playerName}`) || '0');
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch { return 0; }
}

export function setCoins(playerName: string, amount: number) {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  localStorage.setItem(`moria_coins_${playerName}`, JSON.stringify(safe));
}

export function addCoins(playerName: string, amount: number) {
  if (!Number.isFinite(amount)) return;
  const cur = getCoins(playerName);
  setCoins(playerName, cur + Math.floor(amount));
}

export function spendCoins(playerName: string, amount: number): boolean {
  const cost = Number.isFinite(amount) ? Math.floor(amount) : 0;
  if (cost <= 0) return false;
  const cur = getCoins(playerName);
  if (cur < cost) return false;
  setCoins(playerName, cur - cost);
  return true;
}

export function claimDemoCoinGrant(playerName: string, amount = 500): boolean {
  const key = `moria_demo_coins_claimed_${playerName}`;
  if (localStorage.getItem(key) === '1') return false;
  localStorage.setItem(key, '1');
  addCoins(playerName, Math.max(0, Math.floor(amount)));
  return true;
}
''', 'coin sanitation')
s = replace_once(s,
'''export function saveAuctionListings(listings: AuctionListing[]) {
  // Auto-expire listings older than 24h
  const now = Date.now();
  const active = listings.filter((l) => l.expiresAt > now);
  localStorage.setItem(AH_KEY, JSON.stringify(active));
}

export function listOnAuction(listing: Omit<AuctionListing, 'id' | 'listedAt' | 'expiresAt'>): void {
  const listings = getAuctionListings();
  listings.push({
    ...listing,
    id: `ah_${Date.now()}_${Math.random()}`,
    listedAt: Date.now(),
    expiresAt: Date.now() + 86400000, // 24h
  });
  saveAuctionListings(listings);
}
''',
'''export function saveAuctionListings(listings: AuctionListing[]) {
  // Keep escrowed items until they are bought or explicitly cancelled. Automatic
  // expiry previously deleted the listing while the seller's item stayed removed.
  localStorage.setItem(AH_KEY, JSON.stringify(listings));
}

export function listOnAuction(listing: Omit<AuctionListing, 'id' | 'listedAt' | 'expiresAt'>): boolean {
  const price = Math.floor(listing.buyoutPrice);
  const quantity = Math.floor(listing.quantity);
  if (!listing.sellerName.trim() || !listing.itemName.trim() || !Number.isFinite(price) || price < 1 || !Number.isFinite(quantity) || quantity < 1) return false;
  const listings = getAuctionListings();
  listings.push({
    ...listing,
    buyoutPrice: price,
    quantity,
    id: `ah_${Date.now()}_${Math.random()}`,
    listedAt: Date.now(),
    // Retained for forward compatibility; expiration is not destructive until a
    // proper server-side return-to-seller escrow flow exists.
    expiresAt: Date.now() + 86400000,
  });
  saveAuctionListings(listings);
  return true;
}
''', 'auction escrow save')
s = replace_once(s,
'''export function cancelListing(listingId: string, sellerName: string): boolean {
  const listings = getAuctionListings();
  const listing = listings.find((l) => l.id === listingId && l.sellerName === sellerName);
  if (!listing) return false;
  saveAuctionListings(listings.filter((l) => l.id !== listingId));
  return true;
}
''',
'''export function cancelListing(listingId: string, sellerName: string): AuctionListing | null {
  const listings = getAuctionListings();
  const listing = listings.find((l) => l.id === listingId && l.sellerName === sellerName);
  if (!listing) return null;
  saveAuctionListings(listings.filter((l) => l.id !== listingId));
  return listing;
}
''', 'auction cancel return')
p.write_text(s)

# ---------------------------------------------------------------------
# Blessing bundle: one premium item has a complete, truthful effect today.
# ---------------------------------------------------------------------
p = Path('src/game/systems.ts')
s = p.read_text()
anchor = '''export function buyBlessing(player: Player, blessingId: string): boolean {
  const blessing = BLESSINGS.find((b) => b.id === blessingId);
  if (!blessing) return false;
  if (player.gold < blessing.cost || player.level < blessing.levelRequired) return false;
  const owned = getBlessings(player);
  if (owned.includes(blessingId)) return false;
  owned.push(blessingId);
  localStorage.setItem(`tibia_blessings_${player.name}`, JSON.stringify(owned));
  return true;
}
'''
addition = anchor + '''
export function grantAllBlessings(player: Player): void {
  const ids = BLESSINGS.map((blessing) => blessing.id);
  localStorage.setItem(`tibia_blessings_${player.name}`, JSON.stringify(ids));
  player.blessings = ids.length;
  player.aol = true;
}
'''
if 'export function grantAllBlessings' not in s:
    if anchor not in s: raise SystemExit('blessing anchor missing')
    s = s.replace(anchor, addition, 1)
p.write_text(s)

# ---------------------------------------------------------------------
# Coin Shop: never charge for roadmap-only effects; one-time demo grant.
# ---------------------------------------------------------------------
p = Path('src/components/CoinShop.tsx')
s = p.read_text()
s = s.replace("import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, type CoinShopItem } from '../game/economy';", "import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, claimDemoCoinGrant, type CoinShopItem } from '../game/economy';", 1)
s = replace_once(s,
'''  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
}

export default function CoinShop({ player, onClose, addMessage }: Props) {
''',
'''  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
  onPurchase: (item: CoinShopItem) => boolean;
}

export default function CoinShop({ player, onClose, addMessage, onPurchase }: Props) {
''', 'coin props')
s = replace_once(s,
'''  const handleBuy = (item: CoinShopItem) => {
    if (coins < item.cost) {
      addMessage('System', 'Not enough coins.', '#ff9090', 'system');
      return;
    }
    spendCoins(player.name, item.cost);
    // Apply effect
    addMessage('System', `💎 Purchased ${item.icon} ${item.name}! (${item.cost} coins)`, '#c8a0ff', 'system');
    addMessage('System', `Effect: ${item.effect || 'cosmetic'} - (configure in game)`, '#9bd4ff', 'system');
    refresh();
  };

  const claimFree = () => {
    addCoins(player.name, 500);
    refresh();
    addMessage('System', '🎁 Claimed 500 coins (demo bonus)!', '#c8a0ff', 'system');
  };
''',
'''  const isSupported = (item: CoinShopItem) => item.effect === 'allblessings';

  const handleBuy = (item: CoinShopItem) => {
    if (!isSupported(item)) {
      addMessage('System', `${item.name} is a roadmap preview and is not for sale yet.`, '#9bd4ff', 'system');
      return;
    }
    if (coins < item.cost) {
      addMessage('System', 'Not enough coins.', '#ff9090', 'system');
      return;
    }
    if (!spendCoins(player.name, item.cost)) {
      addMessage('System', 'Purchase could not be completed.', '#ff9090', 'system');
      return;
    }
    if (!onPurchase(item)) {
      addCoins(player.name, item.cost);
      addMessage('System', 'Effect unavailable. Your coins were refunded.', '#ff9090', 'system');
      refresh();
      return;
    }
    addMessage('System', `💎 Purchased ${item.icon} ${item.name}! (${item.cost} coins)`, '#c8a0ff', 'system');
    refresh();
  };

  const claimFree = () => {
    const claimed = claimDemoCoinGrant(player.name, 500);
    refresh();
    addMessage('System', claimed ? '🎁 Claimed your one-time 500 coin demo grant!' : 'Demo coin grant already claimed.', claimed ? '#c8a0ff' : '#9bd4ff', 'system');
  };
''', 'coin transactions')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(35,25,50,0.98) 0%, rgba(18,12,28,0.98) 100%)', borderColor: '#c8a0ff', boxShadow: '0 0 50px rgba(200,160,255,0.4)' }}>
''',
'''           className="moria-panel w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-violet-300/20 p-4 sm:p-6 flex flex-col"
           style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 55px rgba(139,92,246,.10)' }}>
''', 'coin panel')
s = s.replace('className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5"', 'className="moria-scrollbar flex-1 overflow-y-auto grid grid-cols-1 gap-2.5 pr-1 sm:grid-cols-2"', 1)
s = replace_once(s,
'''          {filtered.map((item) => {
            const canBuy = coins >= item.cost;
''',
'''          {filtered.map((item) => {
            const supported = isSupported(item);
            const canBuy = supported && coins >= item.cost;
''', 'coin supported state')
s = replace_once(s,
'''                <button onClick={() => handleBuy(item)} disabled={!canBuy}
                        className={`w-full mt-2 py-1.5 rounded text-xs font-bold ${canBuy ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'bg-black/40 text-gray-500 cursor-not-allowed'}`}>
                  💎 {item.cost} {canBuy ? '' : '(insufficient)'}
                </button>
''',
'''                {!supported && <div className="mt-2 text-[9px] uppercase tracking-widest text-sky-300/70">Roadmap preview · no charge</div>}
                <button onClick={() => handleBuy(item)} disabled={!canBuy}
                        className={`w-full mt-2 py-1.5 rounded text-xs font-bold ${canBuy ? 'moria-button-primary' : 'bg-black/40 text-gray-500 cursor-not-allowed'}`}>
                  {supported ? `💎 ${item.cost}${coins < item.cost ? ' (insufficient)' : ''}` : 'Coming soon'}
                </button>
''', 'coin buy button')
s = replace_once(s,
'''          <div className="flex gap-2 flex-wrap">
            <button onClick={claimFree} className="px-4 py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white text-xs font-bold">
              🎁 Claim 500 Coins (Free Demo)
            </button>
            <button onClick={() => { addCoins(player.name, 2000); refresh(); addMessage('System', '💎 +2000 coins!', '#c8a0ff', 'system'); }}
                    className="px-4 py-2 rounded bg-gradient-to-b from-purple-500 to-purple-700 text-white text-xs font-bold">
              💎 +2000 Coins (Free)
            </button>
          </div>
          <div className="text-[10px] text-purple-200/40 mt-2">Note: In a full release, coins are earned through gameplay or purchases. Here they are free for testing.</div>
''',
'''          <div className="flex gap-2 flex-wrap">
            <button onClick={claimFree} className="moria-button rounded-lg px-4 py-2 text-xs font-bold text-emerald-200">
              🎁 Claim one-time 500 Coin Demo Grant
            </button>
          </div>
          <div className="text-[10px] text-purple-200/40 mt-2">Only fully implemented effects can spend coins. Roadmap items are visible for design review but cannot be purchased.</div>
''', 'coin demo grant')
p.write_text(s)

# ---------------------------------------------------------------------
# Auction House: React state updates and cancellation returns escrowed item.
# ---------------------------------------------------------------------
p = Path('src/components/AuctionHouse.tsx')
s = p.read_text()
s = replace_once(s,
'''  setInventory: (items: Item[]) => void;
  onClose: () => void;
''',
'''  setInventory: (items: Item[]) => void;
  setPlayer: (player: Player) => void;
  onClose: () => void;
''', 'auction setPlayer prop')
s = replace_once(s,
'''export default function AuctionHouse({ player, inventory, setInventory, onClose, addMessage }: Props) {
''',
'''export default function AuctionHouse({ player, inventory, setInventory, setPlayer, onClose, addMessage }: Props) {
''', 'auction props destructure')
insert_anchor = '''  const refresh = () => setListings(getAuctionListings());

'''
insert = insert_anchor + '''  const addListingToInventory = (listing: AuctionListing) => {
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

'''
if 'const handleCancel = (listing: AuctionListing)' not in s:
    if insert_anchor not in s: raise SystemExit('auction helper anchor missing')
    s = s.replace(insert_anchor, insert, 1)
s = replace_once(s,
'''      const p = player;
      p.gold -= l.buyoutPrice;
      // Add item to inventory
      let newInv;
      if (l.itemData) {
        newInv = [...inventory, {
          id: `ah_${Date.now()}_${Math.random()}`, name: l.itemName, icon: l.itemIcon,
          type: 'equipment' as const, quantity: 1, value: l.buyoutPrice, equipment: l.itemData,
        }];
      } else {
        const existing = inventory.find((i) => i.name === l.itemName);
        if (existing) {
          newInv = inventory.map((i) => i.name === l.itemName ? { ...i, quantity: i.quantity + l.quantity } : i);
        } else {
          newInv = [...inventory, { id: `ah_${Date.now()}_${Math.random()}`, name: l.itemName, icon: l.itemIcon, type: 'misc' as const, quantity: l.quantity, value: l.buyoutPrice }];
        }
      }
      setInventory(newInv);
''',
'''      setPlayer({ ...player, gold: player.gold - l.buyoutPrice });
      addListingToInventory(result.listing || l);
''', 'auction buy state')
s = s.replace("onClick={() => { cancelListing(l.id, player.name); refresh(); addMessage('System', 'Listing cancelled.', '#9bd4ff', 'system'); }}", 'onClick={() => handleCancel(l)}')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(40,35,15,0.98) 0%, rgba(20,18,8,0.98) 100%)', borderColor: '#f4e04d', boxShadow: '0 0 50px rgba(244,224,77,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6 flex flex-col">
''', 'auction panel')
s = s.replace('className="flex-1 overflow-y-auto space-y-1.5"', 'className="moria-scrollbar flex-1 overflow-y-auto space-y-1.5 pr-1"')
s = s.replace('className="flex-1 flex gap-3 overflow-hidden"', 'className="flex-1 grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 md:overflow-hidden"', 1)
s = s.replace('className="w-1/2 overflow-y-auto"', 'className="moria-scrollbar overflow-y-auto"', 1)
s = s.replace('className="w-1/2"', 'className="min-w-0"', 1)
s = replace_once(s,
'''    listOnAuction({
      sellerName: player.name,
      itemName: selected.name,
      itemIcon: selected.icon,
      buyoutPrice: price,
      quantity: selected.quantity,
      rarity: selected.equipment?.rarity,
      itemData: selected.equipment,
    });
    // Remove from inventory
''',
'''    const listed = listOnAuction({
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
''', 'auction listing transaction')
p.write_text(s)

# ---------------------------------------------------------------------
# GameScreen wiring: update player state, apply the only live coin-shop effect,
# and block local-only stores for the entire online-account lifecycle.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = s.replace('  FOOD_ITEMS, applyFoodBuff, getActiveFoodBonus,', '  FOOD_ITEMS, applyFoodBuff, getActiveFoodBonus, grantAllBlessings,', 1)
s = replace_once(s,
'''            <AuctionHouse player={player} inventory={inventory} setInventory={setInventory} onClose={() => setShowAuction(false)} addMessage={addMessage} />
''',
'''            <AuctionHouse player={player} inventory={inventory} setInventory={setInventory} setPlayer={setPlayer} onClose={() => setShowAuction(false)} addMessage={addMessage} />
''', 'auction invocation')
s = replace_once(s,
'''            <CoinShop player={player} onClose={() => setShowCoinShop(false)} addMessage={addMessage} />
''',
'''            <CoinShop
              player={player}
              onClose={() => setShowCoinShop(false)}
              addMessage={addMessage}
              onPurchase={(item) => {
                if (item.effect !== 'allblessings') return false;
                const p = playerRef.current;
                grantAllBlessings(p);
                setPlayer({ ...p });
                addToast('loot', 'Blessings Granted', 'All five blessings and AOL are active.', item.icon, '#f4e04d');
                return true;
              }}
            />
''', 'coin invocation')
# An authenticated online account must never mutate browser-local economy while
# the authoritative session is connecting, reconnecting, or active.
s = s.replace("serverSync.isActive() ? addMessage('System', 'Companions are local-only until server support lands.'", "onlineAccount ? addMessage('System', 'Companions are local-only until server support lands.'")
s = s.replace("serverSync.isActive() ? addMessage('System', 'Depot is local-only until server support lands.'", "onlineAccount ? addMessage('System', 'Depot is local-only until server support lands.'")
s = s.replace("serverSync.isActive() ? addMessage('System', 'Auction House is local-only until server support lands.'", "onlineAccount ? addMessage('System', 'Auction House is local-only until server support lands.'")
s = s.replace("serverSync.isActive() ? addMessage('System', 'Coin Shop is local-only until server support lands.'", "onlineAccount ? addMessage('System', 'Coin Shop is local-only until server support lands.'")
s = s.replace("serverSync.isActive() ? addMessage('System', 'Browser world events are disabled in authoritative mode.'", "onlineAccount ? addMessage('System', 'Browser world events are disabled in authoritative mode.'")
s = s.replace("serverSync.isActive() ? addMessage('System', 'Mail is local-only until server support lands.'", "onlineAccount ? addMessage('System', 'Mail is local-only until server support lands.'")
p.write_text(s)

print('market polish 3.5 applied')
