import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BookLibrary from './components/BookLibrary';
import MailBox from './components/MailBox';
import SocialHub from './components/SocialHub';
import Inventory from './components/Inventory';
import Depot from './components/Depot';
import AuctionHouse from './components/AuctionHouse';
import CoinShop from './components/CoinShop';
import TalentTree from './components/TalentTree';
import ActionBar from './components/ActionBar';
import CastBar, { triggerCast } from './components/CastBar';
import DPSMeter from './components/DPSMeter';
import WorldMiniMap from './components/WorldMiniMap';
import CityDesigner from './components/CityDesigner';
import GlobalTooltipRenderer from './components/Tooltip';
import LocaleBridge from './components/LocaleBridge';
import { saveBook, sendSystemMail } from './game/content';
import type { Item, Player } from './game/types';
import { saveAuctionListings, setCoins } from './game/economy';
import { VOCATIONS } from './game/classes';
import { dpsMeter } from './game/dpsMeter';
import { syncServerMaps } from './game/maps';

const QA_PLAYER = {
  name: 'Aurora',
  level: 14,
  gold: 9480,
  bankGold: 12650,
  vocation: 'knight',
  hp: 420,
  maxHp: 460,
  mana: 115,
  maxMana: 140,
  attack: 52,
  defense: 31,
  magic: 12,
  activeQuests: [],
} as unknown as Player;


const QA_GRAND_MAP = {
  id: 'qa_grand_capital', name: 'Nova Auroria', description: 'Capital sintética para prova visual de escala.', biome: 'plains',
  width: 160, height: 160, settlementClass: 'capital', urbanBounds: { x: 28, y: 28, width: 104, height: 104 },
  seed: 935, spawnX: 80, spawnY: 80, townX: 80, townY: 80, townRange: 18,
  cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
  districts: [
    { id: 'qa_civic', name: 'Distrito Cívico', icon: '♜', x: 80, y: 80, radius: 14, color: '#d8b45a' },
    { id: 'qa_high', name: 'Distrito Alto', icon: '◇', x: 126, y: 68, radius: 11, color: '#caa6ff' },
  ],
  landmarks: [
    { id: 'qa_sun_keep', name: 'Fortaleza Solar', kind: 'keep', icon: '♜', x: 70, y: 62, w: 18, h: 14 },
    { id: 'qa_far_keep', name: 'Bastião do Horizonte', kind: 'tower', icon: '◆', x: 124, y: 72, w: 16, h: 12 },
    { id: 'qa_grand_market', name: 'Grande Mercado', kind: 'market', icon: '⚖', x: 102, y: 110, w: 14, h: 10 },
  ],
  props: [
    { id: 'qa_banner_far', kind: 'banner', x: 142, y: 118, color: '#d8b45a' },
    { id: 'qa_statue', kind: 'statue', x: 80, y: 94, color: '#f5de8f' },
  ],
  portals: [{ x: 150, y: 80, targetMap: 'eldoria', targetX: 40, targetY: 40, label: 'Portal de Eldoria' }],
};

const QA_GRAND_PLAYER = { ...QA_PLAYER, mapId: 'qa_grand_capital', pos: { x: 136, y: 118 } } as unknown as Player;

function seedVisualQa() {
  localStorage.removeItem('moria_books');
  localStorage.removeItem('moria_read_books_Aurora');
  localStorage.removeItem('moria_mail_Aurora');
  localStorage.removeItem('moria_city_designer_maps');
  syncServerMaps([QA_GRAND_MAP]);
  // Deterministic HUD position for screenshot proof. This only affects visual-qa.html.
  localStorage.setItem('moria:hud:action-bar:position', JSON.stringify({ x: 220, y: 820 }));
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
  dpsMeter.clear();
  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 184, 'physical', false);
  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 332, 'physical', true);
  dpsMeter.record(QA_PLAYER.name, QA_PLAYER.name, 146, 'heal', false);
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


function CastVisualQa() {
  useEffect(() => {
    const id = window.setTimeout(() => triggerCast('Fierce Berserk', '🔥', 4000, '#ff6a00'), 60);
    return () => window.clearTimeout(id);
  }, []);
  return <CastBar />;
}

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
      {panel === 'talents' && <TalentTree player={qaPlayer} setPlayer={setQaPlayer} onClose={() => {}} />}
      {panel === 'actionbar' && <div data-qa-actionbar><GlobalTooltipRenderer /><ActionBar player={qaPlayer} spells={VOCATIONS.knight.spells} potions={{ hp: 4, mp: 3, hpg: 1 }} onCastSpell={() => {}} onUsePotion={() => {}} /></div>}
      {panel === 'castbar' && <CastVisualQa />}
      {panel === 'dps' && <DPSMeter onClose={() => {}} />}
      {panel === 'grand-minimap' && <div className="relative z-10 flex min-h-screen items-center justify-center"><WorldMiniMap player={QA_GRAND_PLAYER} monsters={[]} mapId="qa_grand_capital" /></div>}
      {panel === 'grand-city-designer' && <div className="relative z-10 p-4"><CityDesigner /></div>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><LocaleBridge /><VisualQa /></StrictMode>);
