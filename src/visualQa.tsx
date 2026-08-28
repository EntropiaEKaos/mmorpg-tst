import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BookLibrary from './components/BookLibrary';
import MailBox from './components/MailBox';
import SocialHub from './components/SocialHub';
import Inventory from './components/Inventory';
import Depot from './components/Depot';
import AuctionHouse from './components/AuctionHouse';
import CoinShop from './components/CoinShop';
import LocaleBridge from './components/LocaleBridge';
import { saveBook, sendSystemMail } from './game/content';
import type { Item, Player } from './game/types';
import { saveAuctionListings, setCoins } from './game/economy';

const QA_PLAYER = {
  name: 'Aurora',
  level: 14,
  gold: 9480,
  bankGold: 12650,
  activeQuests: [],
} as unknown as Player;

function seedVisualQa() {
  localStorage.removeItem('moria_books');
  localStorage.removeItem('moria_read_books_Aurora');
  localStorage.removeItem('moria_mail_Aurora');
  saveBook({
    id: 'qa-eldoria',
    title: 'Chronicles of Eldoria',
    author: 'Archivist Selene',
    icon: '📜',
    color: '#9b59ff',
    pages: [
      'Eldoria was raised around the first safe roads of the realm. Its walls became a promise: civilization could survive the darkness.',
      'Travelers still gather beneath the old banners, trading stories before crossing into the wilds.',
    ],
    createdAt: 1,
  });
  sendSystemMail(
    QA_PLAYER.name,
    'Royal Courier',
    "Welcome to Mor'ia",
    'Your field report has been accepted. Supplies are attached for the next expedition.',
    275,
    { name: 'Health Potion', icon: '🧪', value: 50 },
  );
  localStorage.setItem(`tibia_depot_${QA_PLAYER.name}`, JSON.stringify([
    { id: 'depot-scale', name: 'Dragon Scale', icon: '🔷', type: 'material', quantity: 4, value: 800 },
    { id: 'depot-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 17, value: 12 },
  ]));
  saveAuctionListings([]);
  setCoins(QA_PLAYER.name, 850);
}

seedVisualQa();

const socialFixture = {
  friends: [
    { key: 'thane', name: 'Thane', online: true, player: { level: 18, mapId: 'eldoria' } },
    { key: 'lyra', name: 'Lyra', online: false },
  ],
  nearby: [
    { id: 'near-1', name: 'Kael', level: 12 },
    { id: 'near-2', name: 'Selene', level: 16 },
  ],
  ignored: [],
  party: null,
  guild: null,
  trade: null,
};

function VisualQa() {
  const panel = new URLSearchParams(window.location.search).get('panel') || 'library';
  const [inventory, setInventory] = useState<Item[]>([
    { id: 'qa-potion', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 3, value: 50 } as Item,
    { id: 'qa-mana', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 } as Item,
    { id: 'qa-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 8, value: 12 } as Item,
    { id: 'qa-sword', name: 'Steel Sword', icon: '⚔', type: 'equipment', quantity: 1, value: 120, equipment: { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 } } as Item,
  ]);
  const [qaPlayer, setQaPlayer] = useState<Player>(QA_PLAYER);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100" data-visual-qa-ready={panel}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.14),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.08),transparent_30%)]" />
      {panel === 'library' && <BookLibrary player={QA_PLAYER} onClose={() => {}} />}
      {panel === 'mail' && <MailBox player={QA_PLAYER} inventory={inventory} setInventory={setInventory} onClose={() => {}} addMessage={() => {}} onClaimGold={() => {}} />}
      {panel === 'social' && <SocialHub player={QA_PLAYER} inventory={inventory} social={socialFixture} onAction={() => {}} onClose={() => {}} />}
      {panel === 'inventory' && <Inventory items={inventory} onClose={() => {}} onUse={() => {}} onEquip={() => {}} playerLevel={qaPlayer.level} playerName={qaPlayer.name} onDropItem={() => {}} showShop shopName="Gorn" shopItems={[{ name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' } as any]} onBuy={() => {}} />}
      {panel === 'depot' && <Depot player={qaPlayer} inventory={inventory} setInventory={setInventory} onClose={() => {}} />}
      {panel === 'auction' && <AuctionHouse player={qaPlayer} inventory={inventory} setInventory={setInventory} setPlayer={setQaPlayer} onClose={() => {}} addMessage={() => {}} />}
      {panel === 'coinshop' && <CoinShop player={qaPlayer} onClose={() => {}} addMessage={() => {}} onPurchase={() => true} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><LocaleBridge /><VisualQa /></StrictMode>);
