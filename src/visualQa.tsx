import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BookLibrary from './components/BookLibrary';
import MailBox from './components/MailBox';
import SocialHub from './components/SocialHub';
import { saveBook, sendSystemMail } from './game/content';
import type { Item, Player } from './game/types';

const QA_PLAYER = {
  name: 'Aurora',
  level: 14,
  gold: 2480,
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
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100" data-visual-qa-ready={panel}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.14),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.08),transparent_30%)]" />
      {panel === 'library' && <BookLibrary player={QA_PLAYER} onClose={() => {}} />}
      {panel === 'mail' && <MailBox player={QA_PLAYER} inventory={inventory} setInventory={setInventory} onClose={() => {}} addMessage={() => {}} onClaimGold={() => {}} />}
      {panel === 'social' && <SocialHub player={QA_PLAYER} inventory={inventory} social={socialFixture} onAction={() => {}} onClose={() => {}} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><VisualQa /></StrictMode>);
