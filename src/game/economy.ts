// ============ PREMIUM CURRENCY (Coins) ============
export function getCoins(playerName: string): number {
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

// ============ COIN SHOP ITEMS ============
export interface CoinShopItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;       // in coins
  category: 'mount' | 'cosmetic' | 'boost' | 'pet' | 'blessing';
  effect?: string;    // effect description
}

export const COIN_SHOP_ITEMS: CoinShopItem[] = [
  // Mounts
  { id: 'phoenix_mount', name: 'Phoenix Mount', icon: '🔥', description: '+90% movement speed. Reborn from ashes.', cost: 800, category: 'mount', effect: 'mount:phoenix' },
  { id: 'nightmare_mount', name: 'Nightmare Steed', icon: '🐴', description: '+80% speed. A terrifying dark steed.', cost: 600, category: 'mount', effect: 'mount:nightmare' },
  { id: 'crystal_mount', name: 'Crystal Drake', icon: '🐲', description: '+95% speed. Soars on crystalline wings.', cost: 1500, category: 'mount', effect: 'mount:crystal' },
  // Boosts
  { id: 'xp_potion_1h', name: 'XP Elixir (1h)', icon: '⚗', description: '+100% XP for 1 hour.', cost: 150, category: 'boost', effect: 'xpboost:3600000:100' },
  { id: 'xp_potion_24h', name: 'Greater XP Elixir (24h)', icon: '🧪', description: '+150% XP for 24 hours.', cost: 800, category: 'boost', effect: 'xpboost:86400000:150' },
  { id: 'gold_elixir', name: 'Greed Elixir (1h)', icon: '💰', description: '+100% gold from monsters for 1 hour.', cost: 200, category: 'boost', effect: 'goldboost:3600000:100' },
  // Blessings bundle
  { id: 'blessing_bundle', name: 'Blessing Bundle', icon: '✨', description: 'Instantly grants all 5 blessings + AOL.', cost: 500, category: 'blessing', effect: 'allblessings' },
  // Pets
  { id: 'celestial_pet', name: 'Celestial Sprite', icon: '🌟', description: 'A radiant companion that boosts your magic.', cost: 700, category: 'pet', effect: 'pet:celestial' },
  // Cosmetic
  { id: 'title_slayer', name: 'Title: Dragonslayer', icon: '🐉', description: 'Display a legendary title above your name.', cost: 300, category: 'cosmetic', effect: 'title:Dragonslayer' },
  { id: 'aura_flame', name: 'Flame Aura', icon: '🔆', description: 'A burning aura surrounds you.', cost: 250, category: 'cosmetic', effect: 'aura:flame' },
];

// ============ AUCTION HOUSE ============
export interface AuctionListing {
  id: string;
  sellerName: string;
  itemName: string;
  itemIcon: string;
  buyoutPrice: number;     // gold
  quantity: number;
  rarity?: string;
  itemData?: any;          // full item (for equipment)
  listedAt: number;
  expiresAt: number;
}

const AH_KEY = 'moria_auction_house';

export function getAuctionListings(): AuctionListing[] {
  try {
    return JSON.parse(localStorage.getItem(AH_KEY) || '[]');
  } catch { return []; }
}

export function saveAuctionListings(listings: AuctionListing[]) {
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

export function buyFromAuction(listingId: string, buyerName: string): { success: boolean; listing?: AuctionListing; reason?: string } {
  const listings = getAuctionListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return { success: false, reason: 'Listing not found' };
  if (listing.sellerName === buyerName) return { success: false, reason: 'Cannot buy your own listing' };
  // Remove listing
  saveAuctionListings(listings.filter((l) => l.id !== listingId));
  // Send gold to seller via mail
  const { sendSystemMail } = require('./content');
  sendSystemMail(listing.sellerName, 'Auction House',
    `Auction Sold: ${listing.itemName}`,
    `Your ${listing.itemName} sold on the Auction House for ${listing.buyoutPrice} gold!\n\nThe gold has been deposited to your account.`,
    listing.buyoutPrice);
  return { success: true, listing };
}

export function cancelListing(listingId: string, sellerName: string): boolean {
  const listings = getAuctionListings();
  const listing = listings.find((l) => l.id === listingId && l.sellerName === sellerName);
  if (!listing) return false;
  saveAuctionListings(listings.filter((l) => l.id !== listingId));
  return true;
}

// Seed the auction house with some NPC listings on first load
export function seedAuctionHouse() {
  const existing = getAuctionListings();
  if (existing.length > 0) return;
  const seedListings: Array<Omit<AuctionListing, 'id' | 'listedAt' | 'expiresAt'>> = [
    { sellerName: 'Merchant Guild', itemName: 'Excalibur', itemIcon: '⚔', buyoutPrice: 8000, quantity: 1, rarity: 'legendary', itemData: { id: 'excalibur', name: 'Excalibur', icon: '⚔', slot: 'weapon', attack: 45, hp: 50, critChance: 5, lifesteal: 3, rarity: 'legendary', level: 25, value: 5000, description: 'The legendary sword of kings.' } },
    { sellerName: 'Merchant Guild', itemName: 'Crown of Kings', itemIcon: '👑', buyoutPrice: 6000, quantity: 1, rarity: 'legendary', itemData: { id: 'crown', name: 'Crown of Kings', icon: '👑', slot: 'helmet', armor: 12, magic: 8, mana: 30, xpBonus: 5, goldBonus: 5, rarity: 'legendary', level: 20, value: 3500 } },
    { sellerName: 'Wandering Trader', itemName: 'Dragon Mail', itemIcon: '🎽', buyoutPrice: 3500, quantity: 1, rarity: 'epic', itemData: { id: 'dragon_mail', name: 'Dragon Mail', icon: '🎽', slot: 'armor', armor: 28, hp: 40, damageReduction: 5, rarity: 'epic', level: 18, value: 2000 } },
    { sellerName: 'Wandering Trader', itemName: 'Greater Health Potion', itemIcon: '🍷', buyoutPrice: 180, quantity: 10, rarity: 'common' },
    { sellerName: 'Alchemist', itemName: 'Health Potion', itemIcon: '🧪', buyoutPrice: 60, quantity: 50, rarity: 'common' },
    { sellerName: 'Alchemist', itemName: 'Mana Potion', itemIcon: '🧴', buyoutPrice: 60, quantity: 50, rarity: 'common' },
    { sellerName: 'Jeweler', itemName: 'Soul Stone', itemIcon: '💠', buyoutPrice: 2500, quantity: 1, rarity: 'epic', itemData: { id: 'soul_stone', name: 'Soul Stone', icon: '💠', slot: 'relic', magic: 8, mana: 40, lifesteal: 3, rarity: 'epic', level: 15, value: 1800 } },
    { sellerName: 'Jeweler', itemName: 'Star Ruby', itemIcon: '🌟', buyoutPrice: 1200, quantity: 1, rarity: 'legendary' },
    { sellerName: 'Merchant Guild', itemName: 'Boots of Haste', itemIcon: '👢', buyoutPrice: 700, quantity: 1, rarity: 'rare', itemData: { id: 'boots_haste', name: 'Boots of Haste', icon: '👢', slot: 'boots', armor: 2, moveSpeed: 15, rarity: 'rare', level: 10, value: 400 } },
  ];
  for (const l of seedListings) listOnAuction(l);
}

// ============ ITEM MASTERY / PERCENTAGE SYSTEM ============
// Like skills, items gain a percentage bar toward their next mastery level.
// Each mastery level boosts the item's stats slightly.
export function getItemMastery(playerName: string, itemInstanceKey: string): { level: number; progress: number } {
  try {
    const data = JSON.parse(localStorage.getItem(`moria_mastery_${playerName}`) || '{}');
    return data[itemInstanceKey] || { level: 1, progress: 0 };
  } catch { return { level: 1, progress: 0 }; }
}

export function setItemMastery(playerName: string, itemInstanceKey: string, mastery: { level: number; progress: number }) {
  try {
    const data = JSON.parse(localStorage.getItem(`moria_mastery_${playerName}`) || '{}');
    data[itemInstanceKey] = mastery;
    localStorage.setItem(`moria_mastery_${playerName}`, JSON.stringify(data));
  } catch {}
}

// Add mastery progress when the item is used in combat (called from equip/attack)
export function addItemMasteryProgress(playerName: string, itemInstanceKey: string, amount: number): { level: number; progress: number; leveledUp: boolean } {
  const cur = getItemMastery(playerName, itemInstanceKey);
  let { level, progress } = cur;
  progress += amount;
  let leveledUp = false;
  const needed = level * 10;
  while (progress >= needed) {
    progress -= needed;
    level++;
    leveledUp = true;
  }
  setItemMastery(playerName, itemInstanceKey, { level, progress });
  return { level, progress, leveledUp };
}

// Mastery bonus multiplier for equipped item stats
export function getMasteryMultiplier(masteryLevel: number): number {
  return 1 + (masteryLevel - 1) * 0.05; // +5% per mastery level
}
