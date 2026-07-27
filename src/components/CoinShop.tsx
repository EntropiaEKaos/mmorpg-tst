import { useState } from 'react';
import type { Player } from '../game/types';
import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, type CoinShopItem } from '../game/economy';

interface Props {
  player: Player;
  onClose: () => void;
  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
}

export default function CoinShop({ player, onClose, addMessage }: Props) {
  const [coins, setCoins] = useState(getCoins(player.name));
  const [category, setCategory] = useState<'all' | 'mount' | 'boost' | 'pet' | 'blessing' | 'cosmetic'>('all');

  const refresh = () => setCoins(getCoins(player.name));

  const filtered = category === 'all' ? COIN_SHOP_ITEMS : COIN_SHOP_ITEMS.filter((i) => i.category === category);

  const handleBuy = (item: CoinShopItem) => {
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

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(35,25,50,0.98) 0%, rgba(18,12,28,0.98) 100%)', borderColor: '#c8a0ff', boxShadow: '0 0 50px rgba(200,160,255,0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(180deg, #c8a0ff 0%, #6a4a90 100%)' }}>💎 COIN SHOP</h2>
            <div className="px-3 py-1 rounded-lg border border-purple-500/50 bg-black/40">
              <span className="text-purple-200 font-bold">💎 {coins.toLocaleString()}</span>
              <span className="text-purple-200/50 text-xs ml-1">coins</span>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(['all', 'mount', 'boost', 'pet', 'blessing', 'cosmetic'] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded text-xs font-bold ${category === c ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'bg-black/40 text-purple-300/60 hover:text-purple-200'}`}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1) + 's'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5">
          {filtered.map((item) => {
            const canBuy = coins >= item.cost;
            const catColors: Record<string, string> = { mount: '#ff8c00', boost: '#2ecc71', pet: '#ff9bcc', blessing: '#f4e04d', cosmetic: '#9b59ff' };
            return (
              <div key={item.id} className="p-3 rounded-lg border-2 bg-black/40" style={{ borderColor: (catColors[item.category] || '#c8a0ff') + '50' }}>
                <div className="flex items-start gap-2">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 shrink-0"
                       style={{ borderColor: catColors[item.category] || '#c8a0ff', background: `${catColors[item.category] || '#c8a0ff'}20` }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: catColors[item.category] || '#c8a0ff' }}>{item.name}</div>
                    <div className="text-[10px] text-purple-200/60 italic">{item.description}</div>
                  </div>
                </div>
                <button onClick={() => handleBuy(item)} disabled={!canBuy}
                        className={`w-full mt-2 py-1.5 rounded text-xs font-bold ${canBuy ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'bg-black/40 text-gray-500 cursor-not-allowed'}`}>
                  💎 {item.cost} {canBuy ? '' : '(insufficient)'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Get coins section */}
        <div className="mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-900/10">
          <div className="text-xs text-purple-200/70 mb-2">💎 GET MORE COINS</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={claimFree} className="px-4 py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white text-xs font-bold">
              🎁 Claim 500 Coins (Free Demo)
            </button>
            <button onClick={() => { addCoins(player.name, 2000); refresh(); addMessage('System', '💎 +2000 coins!', '#c8a0ff', 'system'); }}
                    className="px-4 py-2 rounded bg-gradient-to-b from-purple-500 to-purple-700 text-white text-xs font-bold">
              💎 +2000 Coins (Free)
            </button>
          </div>
          <div className="text-[10px] text-purple-200/40 mt-2">Note: In a full release, coins are earned through gameplay or purchases. Here they are free for testing.</div>
        </div>
      </div>
    </div>
  );
}
