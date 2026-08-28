from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    # Inventory residual surface
    'sockets filled': 'encaixes preenchidos',
    'Drop here to throw on ground': 'Solte aqui para jogar no chão',
    '(drag an item here)': '(arraste um item até aqui)',
    'Click potions to use · Click equipment to equip · Drag to move/drop': 'Clique em poções para usar · Clique em equipamentos para equipar · Arraste para mover/soltar',
    'Rarity:': 'Raridade:',
    'have': 'possui',
    'Common': 'Comum',
    'Uncommon': 'Incomum',
    'Rare': 'Raro',
    'Epic': 'Épico',
    'Legendary': 'Lendário',
    'common': 'comum',
    'uncommon': 'incomum',
    'rare': 'raro',
    'epic': 'épico',
    'legendary': 'lendário',

    # Depot
    'DEPOT CHEST': 'BAÚ DO DEPÓSITO',
    'Close depot': 'Fechar depósito',
    'Safe storage for your items. Items here are': 'Armazenamento seguro para seus itens. Itens aqui',
    'never lost on death': 'nunca são perdidos ao morrer',
    'Gold in bank:': 'Ouro no banco:',
    'DEPOT': 'DEPÓSITO',
    'BACKPACK': 'MOCHILA',
    'Click an item to withdraw →': 'Clique em um item para retirar →',
    '← Click an item to deposit': '← Clique em um item para depositar',
    'Depot is full': 'O depósito está cheio',
    'Withdraw something first.': 'Retire algo primeiro.',

    # Auction house
    'AUCTION HOUSE': 'CASA DE LEILÕES',
    'Auction House': 'Casa de Leilões',
    'Close auction house': 'Fechar casa de leilões',
    'Browse': 'Explorar',
    'Sell': 'Vender',
    'My Listings': 'Meus Anúncios',
    'Search items...': 'Buscar itens...',
    'All Rarities': 'Todas as Raridades',
    'No listings found.': 'Nenhum anúncio encontrado.',
    'Buyout': 'Comprar',
    'Cancel': 'Cancelar',
    'You have no active listings. Use the Sell tab to list items.': 'Você não possui anúncios ativos. Use a aba Vender para anunciar itens.',
    'SELECT ITEM TO SELL': 'SELECIONE UM ITEM PARA VENDER',
    'LISTING DETAILS': 'DETALHES DO ANÚNCIO',
    'Base value:': 'Valor base:',
    'Buyout Price (gold)': 'Preço de compra imediata (ouro)',
    'Tip: Price slightly below base value to sell faster. You keep 100% of the sale (gold sent via mail).': 'Dica: defina um preço um pouco abaixo do valor base para vender mais rápido. Você recebe 100% da venda (ouro enviado pelo correio).',
    'List on Auction House': 'Anunciar na Casa de Leilões',
    'Select an item to sell →': 'Selecione um item para vender →',
    'Listing could not be cancelled.': 'Não foi possível cancelar o anúncio.',
    'returned to your inventory.': 'retornou ao seu inventário.',
    'Purchase failed.': 'A compra falhou.',
    'Invalid auction listing.': 'Anúncio de leilão inválido.',
    'listed on Auction House for': 'anunciado na Casa de Leilões por',
    'Bought': 'Comprado',
    'for': 'por',
    'Merchant Guild': 'Guilda dos Mercadores',
    'Wandering Trader': 'Mercador Errante',
    'Alchemist': 'Alquimista',
    'Jeweler': 'Joalheiro',
    'Crown of Kings': 'Coroa dos Reis',
    'Dragon Mail': 'Cota do Dragão',
    'Soul Stone': 'Pedra da Alma',
    'Star Ruby': 'Rubi Estelar',
    'Boots of Haste': 'Botas da Celeridade',
    'The legendary sword of kings.': 'A lendária espada dos reis.',

    # Coin shop
    'COIN SHOP': 'LOJA DE MOEDAS',
    'Close coin shop': 'Fechar loja de moedas',
    'coins': 'moedas',
    'All': 'Todos',
    'Mounts': 'Montarias',
    'Boosts': 'Impulsos',
    'Pets': 'Companheiros',
    'Blessings': 'Bênçãos',
    'Cosmetics': 'Cosméticos',
    'Roadmap preview · no charge': 'Prévia do roadmap · sem cobrança',
    'insufficient': 'insuficiente',
    'Coming soon': 'Em breve',
    'GET MORE COINS': 'OBTER MAIS MOEDAS',
    'Claim one-time 500 Coin Demo Grant': 'Resgatar concessão única de 500 moedas de demonstração',
    'Only fully implemented effects can spend coins. Roadmap items are visible for design review but cannot be purchased.': 'Somente efeitos totalmente implementados podem consumir moedas. Itens do roadmap ficam visíveis para revisão de design, mas não podem ser comprados.',
    'Not enough coins.': 'Moedas insuficientes.',
    'Purchase could not be completed.': 'Não foi possível concluir a compra.',
    'Effect unavailable. Your coins were refunded.': 'Efeito indisponível. Suas moedas foram reembolsadas.',
    'is a roadmap preview and is not for sale yet.': 'é uma prévia do roadmap e ainda não está à venda.',
    'Claimed your one-time 500 coin demo grant!': 'Você resgatou sua concessão única de 500 moedas de demonstração!',
    'Demo coin grant already claimed.': 'A concessão de moedas de demonstração já foi resgatada.',
    'Phoenix Mount': 'Montaria Fênix',
    '+90% movement speed. Reborn from ashes.': '+90% de velocidade de movimento. Renascida das cinzas.',
    'Nightmare Steed': 'Corcel do Pesadelo',
    '+80% speed. A terrifying dark steed.': '+80% de velocidade. Um aterrorizante corcel sombrio.',
    'Crystal Drake': 'Draco de Cristal',
    '+95% speed. Soars on crystalline wings.': '+95% de velocidade. Voa com asas cristalinas.',
    'XP Elixir (1h)': 'Elixir de XP (1h)',
    '+100% XP for 1 hour.': '+100% de XP por 1 hora.',
    'Greater XP Elixir (24h)': 'Elixir Superior de XP (24h)',
    '+150% XP for 24 hours.': '+150% de XP por 24 horas.',
    'Greed Elixir (1h)': 'Elixir da Ganância (1h)',
    '+100% gold from monsters for 1 hour.': '+100% de ouro de monstros por 1 hora.',
    'Blessing Bundle': 'Pacote de Bênçãos',
    'Instantly grants all 5 blessings + AOL.': 'Concede instantaneamente as 5 bênçãos + AOL.',
    'Celestial Sprite': 'Espírito Celestial',
    'A radiant companion that boosts your magic.': 'Um companheiro radiante que fortalece sua magia.',
    'Title: Dragonslayer': 'Título: Matador de Dragões',
    'Display a legendary title above your name.': 'Exibe um título lendário acima do seu nome.',
    'Flame Aura': 'Aura Flamejante',
    'A burning aura surrounds you.': 'Uma aura ardente envolve você.',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            raise SystemExit(f'missing required anchor in {path}: {old[:140]}')
    p.write_text(text, encoding='utf-8')


patch('src/components/Inventory.tsx', [
    ('<div className="text-purple-200 font-bold text-xs">{selectedSocketItem.name}</div>', '<div className="text-purple-200 font-bold text-xs">{tr(selectedSocketItem.name)}</div>'),
    ("{selectedSocketItem.equipment!.socketedGems?.length ?? 0}/{selectedSocketItem.equipment!.sockets ?? 0} sockets filled", "{selectedSocketItem.equipment!.socketedGems?.length ?? 0}/{selectedSocketItem.equipment!.sockets ?? 0} {tr('sockets filled')}"),
    ('<div className="text-red-400 text-[9px]">Lv {recipe.levelRequired}+</div>', "<div className=\"text-red-400 text-[9px]\">{tr('Lv')} {recipe.levelRequired}+</div>"),
    ('<div className="text-amber-100 font-bold">{item.name}</div>', '<div className="text-amber-100 font-bold">{tr(item.name)}</div>'),
    ('{item.description && <div className="text-amber-200/60 text-[10px]">{item.description}</div>}', '{item.description && <div className="text-amber-200/60 text-[10px]">{tr(item.description)}</div>}'),
    ('<div className="text-[7px] text-amber-300 text-center font-bold leading-tight" style={{ textShadow: \'0 0 2px #000\' }}>Lv{mastery.level}</div>', "<div className=\"text-[7px] text-amber-300 text-center font-bold leading-tight\" style={{ textShadow: '0 0 2px #000' }}>{tr('Lv')}{mastery.level}</div>"),
    ('<div className="text-[10px] text-red-300/70">🗑 Drop here to throw on ground<br/><span className="text-[9px] text-red-300/40">(drag an item here)</span></div>', "<div className=\"text-[10px] text-red-300/70\">🗑 {tr('Drop here to throw on ground')}<br/><span className=\"text-[9px] text-red-300/40\">{tr('(drag an item here)')}</span></div>"),
    ('<div>Click potions to use · Click equipment to equip · Drag to move/drop</div>', "<div>{tr('Click potions to use · Click equipment to equip · Drag to move/drop')}</div>"),
    ('Rarity: <span style={{ color: RARITY_COLORS.common }}>Common</span> ·', "{tr('Rarity:')} <span style={{ color: RARITY_COLORS.common }}>{tr('Common')}</span> ·"),
    ('<span style={{ color: RARITY_COLORS.uncommon }}> Uncommon</span> ·', "<span style={{ color: RARITY_COLORS.uncommon }}> {tr('Uncommon')}</span> ·"),
    ('<span style={{ color: RARITY_COLORS.rare }}> Rare</span> ·', "<span style={{ color: RARITY_COLORS.rare }}> {tr('Rare')}</span> ·"),
    ('<span style={{ color: RARITY_COLORS.epic }}> Epic</span> ·', "<span style={{ color: RARITY_COLORS.epic }}> {tr('Epic')}</span> ·"),
    ('<span style={{ color: RARITY_COLORS.legendary }}> Legendary</span>', "<span style={{ color: RARITY_COLORS.legendary }}> {tr('Legendary')}</span>"),
])

patch('src/components/Depot.tsx', [
    ("import { T as Tooltip, ItemTooltip } from './Tooltip';", "import { T as Tooltip, ItemTooltip } from './Tooltip';\nimport { t as tr } from '../i18n';"),
    ("setNotice(`Depot is full (${DEPOT_SLOTS}/${DEPOT_SLOTS}). Withdraw something first.`);", "setNotice(`${tr('Depot is full')} (${DEPOT_SLOTS}/${DEPOT_SLOTS}). ${tr('Withdraw something first.')}`);"),
    ('            🗄 DEPOT CHEST', "            🗄 {tr('DEPOT CHEST')}"),
    ('<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>', '<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl" aria-label={tr(\'Close depot\')}>✕</button>'),
    ('          Safe storage for your items. Items here are <span className="text-green-400">never lost on death</span>. Gold in bank: <span className="text-amber-300 font-bold">{player.bankGold.toLocaleString()} 🪙</span>', "          {tr('Safe storage for your items. Items here are')} <span className=\"text-green-400\">{tr('never lost on death')}</span>. {tr('Gold in bank:')} <span className=\"text-amber-300 font-bold\">{player.bankGold.toLocaleString('pt-BR')} 🪙</span>"),
    ('>🗄 DEPOT ({depot.length}/{DEPOT_SLOTS})</div>', ">🗄 {tr('DEPOT')} ({depot.length}/{DEPOT_SLOTS})</div>"),
    ('>Click an item to withdraw →</div>', ">{tr('Click an item to withdraw →')}</div>"),
    ('>🎒 BACKPACK ({inventory.length})</div>', ">🎒 {tr('BACKPACK')} ({inventory.length})</div>"),
    ('>← Click an item to deposit</div>', ">{tr('← Click an item to deposit')}</div>"),
])

patch('src/components/AuctionHouse.tsx', [
    ("import { T as Tooltip, ItemTooltip } from './Tooltip';", "import { T as Tooltip, ItemTooltip } from './Tooltip';\nimport { t as tr } from '../i18n';"),
    ("addMessage('System', 'Listing could not be cancelled.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Listing could not be cancelled.'), '#ff9090', 'system');"),
    ("addMessage('System', `↩ ${returned.itemName} returned to your inventory.`, '#9bd4ff', 'system');", "addMessage(tr('System'), `↩ ${tr(returned.itemName)} ${tr('returned to your inventory.')}`, '#9bd4ff', 'system');"),
    ("addMessage('System', 'Not enough gold.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Not enough gold.'), '#ff9090', 'system');"),
    ("addMessage('System', `🛒 Bought ${l.itemName} for ${l.buyoutPrice} gold!`, '#2ecc71', 'system');", "addMessage(tr('System'), `🛒 ${tr('Bought')} ${tr(l.itemName)} ${tr('for')} ${l.buyoutPrice} ${tr('gold')}!`, '#2ecc71', 'system');"),
    ("addMessage('System', result.reason || 'Purchase failed.', '#ff9090', 'system');", "addMessage(tr('System'), tr(result.reason || 'Purchase failed.'), '#ff9090', 'system');"),
    ('style={{ backgroundImage: \'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)\' }}>🏛 AUCTION HOUSE</h2>', "style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>🏛 {tr('AUCTION HOUSE')}</h2>"),
    ('<span className="text-amber-300 text-sm font-bold">🪙 {player.gold.toLocaleString()} gold</span>', "<span className=\"text-amber-300 text-sm font-bold\">🪙 {player.gold.toLocaleString('pt-BR')} {tr('gold')}</span>"),
    ('<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>', '<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl" aria-label={tr(\'Close auction house\')}>✕</button>'),
    ("{t === 'browse' ? '🔍 Browse' : t === 'sell' ? '💰 Sell' : '📦 My Listings'}", "{t === 'browse' ? `🔍 ${tr('Browse')}` : t === 'sell' ? `💰 ${tr('Sell')}` : `📦 ${tr('My Listings')}`}"),
    ('placeholder="Search items..."', "placeholder={tr('Search items...')}"),
    ('<option value="all">All Rarities</option>', "<option value=\"all\">{tr('All Rarities')}</option>"),
    ('<option value="legendary">Legendary</option>', "<option value=\"legendary\">{tr('Legendary')}</option>"),
    ('<option value="epic">Epic</option>', "<option value=\"epic\">{tr('Epic')}</option>"),
    ('<option value="rare">Rare</option>', "<option value=\"rare\">{tr('Rare')}</option>"),
    ('<option value="uncommon">Uncommon</option>', "<option value=\"uncommon\">{tr('Uncommon')}</option>"),
    ('<option value="common">Common</option>', "<option value=\"common\">{tr('Common')}</option>"),
    ('>No listings found.</div>', ">{tr('No listings found.')}</div>"),
    ('>{l.itemName}</span>', '>{tr(l.itemName)}</span>'),
    ('>{l.rarity}</span>', '>{tr(l.rarity)}</span>'),
    ('>by {l.sellerName}</div>', ">{tr('by')} {tr(l.sellerName)}</div>"),
    ('>Cancel</button>', ">{tr('Cancel')}</button>"),
    ('                            Buyout', "                            {tr('Buyout')}"),
    ('>You have no active listings. Use the Sell tab to list items.</div>', ">{tr('You have no active listings. Use the Sell tab to list items.')}</div>"),
    ('>{l.itemName}</span><span', '>{tr(l.itemName)}</span><span'),
    ("addMessage('System', 'Invalid auction listing.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Invalid auction listing.'), '#ff9090', 'system');"),
    ("addMessage('System', `📜 Listed ${selected.name} on Auction House for ${price} gold.`, '#f4e04d', 'system');", "addMessage(tr('System'), `📜 ${tr(selected.name)} ${tr('listed on Auction House for')} ${price} ${tr('gold')}.`, '#f4e04d', 'system');"),
    ('>SELECT ITEM TO SELL ({sellable.length})</div>', ">{tr('SELECT ITEM TO SELL')} ({sellable.length})</div>"),
    ('>LISTING DETAILS</div>', ">{tr('LISTING DETAILS')}</div>"),
    ('>{selected.name}</div>', '>{tr(selected.name)}</div>'),
    ('>×{selected.quantity} · Base value: {selected.value}g</div>', ">×{selected.quantity} · {tr('Base value:')} {selected.value}g</div>"),
    ('>Buyout Price (gold)</label>', ">{tr('Buyout Price (gold)')}</label>"),
    ('>💡 Tip: Price slightly below base value to sell faster. You keep 100% of the sale (gold sent via mail).</div>', ">💡 {tr('Tip: Price slightly below base value to sell faster. You keep 100% of the sale (gold sent via mail).')}</div>"),
    ('              📜 List on Auction House', "              📜 {tr('List on Auction House')}"),
    ('>Select an item to sell →</div>', ">{tr('Select an item to sell →')}</div>"),
])

patch('src/components/CoinShop.tsx', [
    ("import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, claimDemoCoinGrant, type CoinShopItem } from '../game/economy';", "import { COIN_SHOP_ITEMS, getCoins, spendCoins, addCoins, claimDemoCoinGrant, type CoinShopItem } from '../game/economy';\nimport { t as tr } from '../i18n';"),
    ("addMessage('System', `${item.name} is a roadmap preview and is not for sale yet.`, '#9bd4ff', 'system');", "addMessage(tr('System'), `${tr(item.name)} ${tr('is a roadmap preview and is not for sale yet.')}`, '#9bd4ff', 'system');"),
    ("addMessage('System', 'Not enough coins.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Not enough coins.'), '#ff9090', 'system');"),
    ("addMessage('System', 'Purchase could not be completed.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Purchase could not be completed.'), '#ff9090', 'system');"),
    ("addMessage('System', 'Effect unavailable. Your coins were refunded.', '#ff9090', 'system');", "addMessage(tr('System'), tr('Effect unavailable. Your coins were refunded.'), '#ff9090', 'system');"),
    ("addMessage('System', `💎 Purchased ${item.icon} ${item.name}! (${item.cost} coins)`, '#c8a0ff', 'system');", "addMessage(tr('System'), `💎 ${tr('Purchased')} ${item.icon} ${tr(item.name)}! (${item.cost} ${tr('coins')})`, '#c8a0ff', 'system');"),
    ("addMessage('System', claimed ? '🎁 Claimed your one-time 500 coin demo grant!' : 'Demo coin grant already claimed.', claimed ? '#c8a0ff' : '#9bd4ff', 'system');", "addMessage(tr('System'), claimed ? `🎁 ${tr('Claimed your one-time 500 coin demo grant!')}` : tr('Demo coin grant already claimed.'), claimed ? '#c8a0ff' : '#9bd4ff', 'system');"),
    ("style={{ backgroundImage: 'linear-gradient(180deg, #c8a0ff 0%, #6a4a90 100%)' }}>💎 COIN SHOP</h2>", "style={{ backgroundImage: 'linear-gradient(180deg, #c8a0ff 0%, #6a4a90 100%)' }}>💎 {tr('COIN SHOP')}</h2>"),
    ('<span className="text-purple-200/50 text-xs ml-1">coins</span>', "<span className=\"text-purple-200/50 text-xs ml-1\">{tr('coins')}</span>"),
    ('<button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>', '<button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl" aria-label={tr(\'Close coin shop\')}>✕</button>'),
    ("{c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1) + 's'}", "{{ all: tr('All'), mount: tr('Mounts'), boost: tr('Boosts'), pet: tr('Pets'), blessing: tr('Blessings'), cosmetic: tr('Cosmetics') }[c]}"),
    ('>{item.name}</div>', '>{tr(item.name)}</div>'),
    ('>{item.description}</div>', '>{tr(item.description)}</div>'),
    ('>Roadmap preview · no charge</div>', ">{tr('Roadmap preview · no charge')}</div>"),
    ("{supported ? `💎 ${item.cost}${coins < item.cost ? ' (insufficient)' : ''}` : 'Coming soon'}", "{supported ? `💎 ${item.cost}${coins < item.cost ? ` (${tr('insufficient')})` : ''}` : tr('Coming soon')}"),
    ('>💎 GET MORE COINS</div>', ">💎 {tr('GET MORE COINS')}</div>"),
    ('              🎁 Claim one-time 500 Coin Demo Grant', "              🎁 {tr('Claim one-time 500 Coin Demo Grant')}"),
    ('>Only fully implemented effects can spend coins. Roadmap items are visible for design review but cannot be purchased.</div>', ">{tr('Only fully implemented effects can spend coins. Roadmap items are visible for design review but cannot be purchased.')}</div>"),
])

# Add one missing message label used by CoinShop.
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog['Purchased'] = 'Comprado'
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')

# Extend the real-component visual QA with the four 9.33 panels.
visual = Path('src/visualQa.tsx')
text = visual.read_text(encoding='utf-8')
if "import Inventory from './components/Inventory';" not in text:
    text = text.replace(
        "import SocialHub from './components/SocialHub';",
        "import SocialHub from './components/SocialHub';\nimport Inventory from './components/Inventory';\nimport Depot from './components/Depot';\nimport AuctionHouse from './components/AuctionHouse';\nimport CoinShop from './components/CoinShop';",
        1,
    )
if "import { saveAuctionListings, setCoins } from './game/economy';" not in text:
    text = text.replace(
        "import type { Item, Player } from './game/types';",
        "import type { Item, Player } from './game/types';\nimport { saveAuctionListings, setCoins } from './game/economy';",
        1,
    )
text = text.replace(
    "  gold: 2480,\n  activeQuests: [],",
    "  gold: 9480,\n  bankGold: 12650,\n  activeQuests: [],",
    1,
)
seed_anchor = """  sendSystemMail(
    QA_PLAYER.name,
    'Royal Courier',
    \"Welcome to Mor'ia\",
    'Your field report has been accepted. Supplies are attached for the next expedition.',
    275,
    { name: 'Health Potion', icon: '🧪', value: 50 },
  );
"""
seed_extra = seed_anchor + """  localStorage.setItem(`tibia_depot_${QA_PLAYER.name}`, JSON.stringify([
    { id: 'depot-scale', name: 'Dragon Scale', icon: '🔷', type: 'material', quantity: 4, value: 800 },
    { id: 'depot-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 17, value: 12 },
  ]));
  saveAuctionListings([]);
  setCoins(QA_PLAYER.name, 850);
"""
if seed_anchor in text and 'depot-scale' not in text:
    text = text.replace(seed_anchor, seed_extra, 1)

inventory_anchor = """  const [inventory, setInventory] = useState<Item[]>([
    { id: 'qa-potion', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 3, value: 50 } as Item,
  ]);
"""
inventory_new = """  const [inventory, setInventory] = useState<Item[]>([
    { id: 'qa-potion', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 3, value: 50 } as Item,
    { id: 'qa-mana', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 } as Item,
    { id: 'qa-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 8, value: 12 } as Item,
    { id: 'qa-sword', name: 'Steel Sword', icon: '⚔', type: 'equipment', quantity: 1, value: 120, equipment: { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 } } as Item,
  ]);
  const [qaPlayer, setQaPlayer] = useState<Player>(QA_PLAYER);
"""
if inventory_anchor in text:
    text = text.replace(inventory_anchor, inventory_new, 1)
elif 'const [qaPlayer, setQaPlayer]' not in text:
    raise SystemExit('visual QA inventory fixture anchor not found')

render_anchor = """      {panel === 'library' && <BookLibrary player={QA_PLAYER} onClose={() => {}} />}
      {panel === 'mail' && <MailBox player={QA_PLAYER} inventory={inventory} setInventory={setInventory} onClose={() => {}} addMessage={() => {}} onClaimGold={() => {}} />}
      {panel === 'social' && <SocialHub player={QA_PLAYER} inventory={inventory} social={socialFixture} onAction={() => {}} onClose={() => {}} />}
"""
render_new = render_anchor + """      {panel === 'inventory' && <Inventory items={inventory} onClose={() => {}} onUse={() => {}} onEquip={() => {}} playerLevel={qaPlayer.level} playerName={qaPlayer.name} onDropItem={() => {}} showShop shopName="Gorn" shopItems={[{ name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' } as any]} onBuy={() => {}} />}
      {panel === 'depot' && <Depot player={qaPlayer} inventory={inventory} setInventory={setInventory} onClose={() => {}} />}
      {panel === 'auction' && <AuctionHouse player={qaPlayer} inventory={inventory} setInventory={setInventory} setPlayer={setQaPlayer} onClose={() => {}} addMessage={() => {}} />}
      {panel === 'coinshop' && <CoinShop player={qaPlayer} onClose={() => {}} addMessage={() => {}} onPurchase={() => true} />}
"""
if render_anchor in text and "panel === 'inventory'" not in text:
    text = text.replace(render_anchor, render_new, 1)
elif "panel === 'coinshop'" not in text:
    raise SystemExit('visual QA render anchor not found')
visual.write_text(text, encoding='utf-8')

Path('tools/capture-moria-9-33.mjs').write_text("""import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.33-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const forbidden = {
  inventory: ['Drop here to throw on ground', 'Click potions to use', 'Rarity:', 'Common ·'],
  depot: ['DEPOT CHEST', 'Safe storage for your items', 'BACKPACK', 'Click an item to withdraw', 'Click an item to deposit'],
  auction: ['AUCTION HOUSE', 'Browse', 'My Listings', 'Search items...', 'All Rarities', 'Buyout', 'by Merchant Guild'],
  coinshop: ['COIN SHOP', 'Roadmap preview', 'Coming soon', 'GET MORE COINS', 'Claim one-time 500 Coin Demo Grant'],
};

for (const panel of ['inventory', 'depot', 'auction', 'coinshop']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  await page.waitForTimeout(180);
  const bodyText = await page.locator('body').innerText();
  const leaks = forbidden[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) throw new Error(`Mor'ia 9.33 PT-BR visual leak in ${panel}: ${leaks.join(', ')}`);
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.33 screenshots in ${output}`);
""", encoding='utf-8')

Path('docs/MORIA_9_33_ITEMS_ECONOMY_PTBR.md').write_text("""# Mor'ia 9.33 — Itens, Depósito, Leilões e Coin Shop em PT-BR

## Objetivo

Fechar a camada visual e textual do bloco de itens/economia sem alterar regras de inventário, persistência de depósito, escrow de leilão ou consumo de moedas.

## Escopo

- Inventário: textos residuais de encaixes, raridade, instruções de uso/drag-and-drop, loja embutida e conteúdo dinâmico.
- Depósito: cabeçalho, capacidade, instruções, aviso de lotação, saldo bancário e acessibilidade.
- Casa de Leilões: navegação, busca, filtros, anúncios, vendedores, raridades, compra/cancelamento e formulário de venda.
- Coin Shop: categorias, saldo, estados de roadmap, itens/descrições, insuficiência de saldo e concessão demo.
- Conteúdo econômico dinâmico: nomes de vendedores e itens de seed do leilão, além dos itens atuais da Coin Shop.

## Contratos preservados

- Nenhum ID de item ou listing foi alterado.
- `moria_auction_house` continua usando o mesmo formato persistido.
- A lógica de escrow/cancelamento/compra do leilão não foi modificada.
- O Depósito mantém `tibia_depot_<player>` e limite atual de 40 slots.
- A Coin Shop continua permitindo gasto apenas no efeito já suportado (`allblessings`); itens de roadmap continuam não compráveis.
- Nenhum custo, preço, recompensa ou efeito foi rebalanceado nesta versão.

## Visual QA

A página isolada de QA renderiza os componentes React reais com fixtures determinísticas. O gate gera e publica quatro PNGs:

- `inventory.png`
- `depot.png`
- `auction.png`
- `coinshop.png`

O script de captura reprova rótulos ingleses críticos antes de salvar os screenshots.

## Critério de aceite

1. auditoria PT-BR;
2. `npm audit` do cliente e servidor;
3. typecheck + build;
4. check + suíte completa do servidor;
5. Playwright estável + audit;
6. quatro screenshots reais sem vazamentos críticos;
7. revisão humana dos PNGs antes de avançar.

## Próximo bloco sugerido

9.34: Bank/Skills/Spellbook/Training + revisão de Tooltips, seguida por uma rodada de screenshots de gameplay em resolução desktop e compacta.
""", encoding='utf-8')

print("Mor'ia 9.33 items/economy PT-BR + visual QA applied")
