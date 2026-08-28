import { useState } from 'react';
import type { Player } from '../game/types';
import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, claimDemoCoinGrant, type CoinShopItem } from '../game/economy';
import { t as tr } from '../i18n';

interface Props {
  player: Player;
  onClose: () => void;
  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
  onPurchase: (item: CoinShopItem) => boolean;
}

export default function CoinShop({ player, onClose, addMessage, onPurchase }: Props) {
  const [coins, setCoins] = useState(getCoins(player.name));
  const [category, setCategory] = useState<'all' | 'mount' | 'boost' | 'pet' | 'blessing' | 'cosmetic'>('all');

  const refresh = () => setCoins(getCoins(player.name));

  const filtered = category === 'all' ? COIN_SHOP_ITEMS : COIN_SHOP_ITEMS.filter((i) => i.category === category);

  const isSupported = (item: CoinShopItem) => item.effect === 'allblessings';

  const handleBuy = (item: CoinShopItem) => {
    if (!isSupported(item)) {
      addMessage(tr('System'), `${tr(item.name)} ${tr('is a roadmap preview and is not for sale yet.')}`, '#9bd4ff', 'system');
      return;
    }
    if (coins < item.cost) {
      addMessage(tr('System'), tr('Not enough coins.'), '#ff9090', 'system');
      return;
    }
    if (!spendCoins(player.name, item.cost)) {
      addMessage(tr('System'), tr('Purchase could not be completed.'), '#ff9090', 'system');
      return;
    }
    if (!onPurchase(item)) {
      addCoins(player.name, item.cost);
      addMessage(tr('System'), tr('Effect unavailable. Your coins were refunded.'), '#ff9090', 'system');
      refresh();
      return;
    }
    addMessage(tr('System'), `💎 ${tr('Purchased')} ${item.icon} ${tr(item.name)}! (${item.cost} ${tr('coins')})`, '#c8a0ff', 'system');
    refresh();
  };

  const claimFree = () => {
    const claimed = claimDemoCoinGrant(player.name, 500);
    refresh();
    addMessage(tr('System'), claimed ? `🎁 ${tr('Claimed your one-time 500 coin demo grant!')}` : tr('Demo coin grant already claimed.'), claimed ? '#c8a0ff' : '#9bd4ff', 'system');
  };

  return (
    <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-violet-300/20 p-4 sm:p-6 flex flex-col"
           style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 55px rgba(139,92,246,.10)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(180deg, #c8a0ff 0%, #6a4a90 100%)' }}>💎 {tr('COIN SHOP')}</h2>
            <div className="px-3 py-1 rounded-lg border border-purple-500/50 bg-black/40">
              <span className="text-purple-200 font-bold">💎 {coins.toLocaleString()}</span>
              <span className="text-purple-200/50 text-xs ml-1">{tr('coins')}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl" aria-label={tr('Close coin shop')}>✕</button>
        </div>

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(['all', 'mount', 'boost', 'pet', 'blessing', 'cosmetic'] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded text-xs font-bold ${category === c ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'bg-black/40 text-purple-300/60 hover:text-purple-200'}`}>
              {{ all: tr('All'), mount: tr('Mounts'), boost: tr('Boosts'), pet: tr('Pets'), blessing: tr('Blessings'), cosmetic: tr('Cosmetics') }[c]}
            </button>
          ))}
        </div>

        <div className="moria-scrollbar flex-1 overflow-y-auto grid grid-cols-1 gap-2.5 pr-1 sm:grid-cols-2">
          {filtered.map((item) => {
            const supported = isSupported(item);
            const canBuy = supported && coins >= item.cost;
            const catColors: Record<string, string> = { mount: '#ff8c00', boost: '#2ecc71', pet: '#ff9bcc', blessing: '#f4e04d', cosmetic: '#9b59ff' };
            return (
              <div key={item.id} className="p-3 rounded-lg border-2 bg-black/40" style={{ borderColor: (catColors[item.category] || '#c8a0ff') + '50' }}>
                <div className="flex items-start gap-2">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 shrink-0"
                       style={{ borderColor: catColors[item.category] || '#c8a0ff', background: `${catColors[item.category] || '#c8a0ff'}20` }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: catColors[item.category] || '#c8a0ff' }}>{tr(item.name)}</div>
                    <div className="text-[10px] text-purple-200/60 italic">{tr(item.description)}</div>
                  </div>
                </div>
                {!supported && <div className="mt-2 text-[9px] uppercase tracking-widest text-sky-300/70">{tr('Roadmap preview · no charge')}</div>}
                <button onClick={() => handleBuy(item)} disabled={!canBuy}
                        className={`w-full mt-2 py-1.5 rounded text-xs font-bold ${canBuy ? 'moria-button-primary' : 'bg-black/40 text-gray-500 cursor-not-allowed'}`}>
                  {supported ? `💎 ${item.cost}${coins < item.cost ? ` (${tr('insufficient')})` : ''}` : tr('Coming soon')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Get coins section */}
        <div className="mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-900/10">
          <div className="text-xs text-purple-200/70 mb-2">💎 {tr('GET MORE COINS')}</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={claimFree} className="moria-button rounded-lg px-4 py-2 text-xs font-bold text-emerald-200">
              🎁 {tr('Claim one-time 500 Coin Demo Grant')}
            </button>
          </div>
          <div className="text-[10px] text-purple-200/40 mt-2">{tr('Only fully implemented effects can spend coins. Roadmap items are visible for design review but cannot be purchased.')}</div>
        </div>
      </div>
    </div>
  );
}
