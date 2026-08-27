import { useMemo, useState } from 'react';
import type { Item, Player } from '../game/types';

export type OfficialTab = 'progress' | 'dungeon' | 'pets' | 'depot' | 'mail' | 'auction' | 'coins' | 'world' | 'services' | 'library' | 'crafting' | 'pvp';

interface Props {
  player: Player;
  inventory: Item[];
  official: any;
  nearbyPlayers: any[];
  initialTab?: OfficialTab;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  onClose: () => void;
}

const TABS: Array<{ id: OfficialTab; icon: string; label: string }> = [
  { id: 'progress', icon: '🏆', label: 'Progress' },
  { id: 'dungeon', icon: '🌀', label: 'Dungeon' },
  { id: 'pets', icon: '🐾', label: 'Pets' },
  { id: 'depot', icon: '🗄', label: 'Depot' },
  { id: 'mail', icon: '📮', label: 'Mail' },
  { id: 'auction', icon: '🏛', label: 'Auction' },
  { id: 'coins', icon: '💎', label: 'Coins' },
  { id: 'world', icon: '🌍', label: 'World' },
  { id: 'services', icon: '🏪', label: 'Services' },
  { id: 'library', icon: '📚', label: 'Lore' },
  { id: 'crafting', icon: '⚒', label: 'Craft' },
  { id: 'pvp', icon: '⚔', label: 'PvP' },
];

const card = 'rounded-2xl border border-slate-700/70 bg-black/30 p-3';
const button = 'moria-button rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40';
const input = 'moria-input w-full rounded-lg border px-2 py-1.5 text-xs';

export default function OfficialSystemsHub({ player, inventory, official, nearbyPlayers, initialTab = 'progress', onAction, onClose }: Props) {
  const [tab, setTab] = useState<OfficialTab>(initialTab);
  const [bankAmount, setBankAmount] = useState('100');
  const [mailTarget, setMailTarget] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailGold, setMailGold] = useState('0');
  const [auctionItem, setAuctionItem] = useState('');
  const [auctionPrice, setAuctionPrice] = useState('100');
  const [socketItem, setSocketItem] = useState('');
  const [socketGem, setSocketGem] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const state = official?.state || {};
  const catalogs = official?.catalogs || {};
  const depot = Array.isArray(state.depot) ? state.depot : [];
  const pets = Array.isArray(catalogs.pets) ? catalogs.pets : [];
  const mail = Array.isArray(official?.mail) ? official.mail : [];
  const auctions = Array.isArray(official?.auctions) ? official.auctions : [];
  const recipes = Array.isArray(catalogs.recipes) ? catalogs.recipes : [];
  const gems = inventory.filter((item: any) => item?.type === 'gem' && item?.gemId);
  const socketable = inventory.filter((item: any) => item?.equipment && Number(item.equipment.sockets || 0) > (Array.isArray(item.equipment.socketedGems) ? item.equipment.socketedGems.length : 0));
  const worldEvent = official?.worldEvent || null;
  const pendingWorldRewards = Array.isArray(worldEvent?.pendingRewards) ? worldEvent.pendingRewards : [];
  const dailyClaimed = state.daily?.lastDay === new Date().toISOString().slice(0, 10);
  const ownedPets = Array.isArray(state.pets?.owned) ? state.pets.owned : [];
  const mysteryState = state.mysteries || {};

  const bestiaryRows = useMemo(() => Object.entries(state.bestiary || {}).sort((a: any, b: any) => Number(b[1]) - Number(a[1])).slice(0, 12), [state.bestiary]);
  const masteryRows = useMemo(() => Object.entries(state.mastery || {}).slice(0, 8), [state.mastery]);

  const act = (action: string, payload: Record<string, unknown> = {}) => onAction(action, payload);

  return (
    <div className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="moria-panel flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-sky-300/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div>
            <div className="moria-eyebrow text-sky-300">OFFICIAL ONLINE SYSTEMS</div>
            <h2 className="text-xl font-black tracking-[0.14em] text-amber-100">MOR'IA WORLD HUB</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span>🪙 {player.gold}</span><span>🏦 {player.bankGold}</span><span>💎 {state.coins || 0}</span>
            <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>
          </div>
        </div>

        <div className="moria-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 px-3 py-2">
          {TABS.map((entry) => (
            <button key={entry.id} onClick={() => setTab(entry.id)} className={`${button} shrink-0 ${tab === entry.id ? 'border-amber-300/60 bg-amber-300/10 text-amber-100' : 'border-slate-700 text-slate-400'}`}>
              {entry.icon} {entry.label}
            </button>
          ))}
        </div>

        <div className="moria-scrollbar flex-1 overflow-y-auto p-4 text-sm">
          {tab === 'progress' && (
            <div className="grid gap-3 lg:grid-cols-3">
              <div className={card}>
                <div className="moria-eyebrow text-amber-300">DAILY</div>
                <div className="mt-2 text-lg font-black text-amber-100">Day {state.daily?.streak || 0} streak</div>
                <p className="mt-1 text-xs text-slate-400">Server-time reward. Streak grows up to 7 days.</p>
                <button disabled={dailyClaimed} onClick={() => act('daily_claim')} className={`${button} mt-3 border-amber-400/50 text-amber-200`}>{dailyClaimed ? '✓ Claimed today' : '🎁 Claim Daily Reward'}</button>
              </div>
              <div className={card}>
                <div className="moria-eyebrow text-emerald-300">STAMINA</div>
                <div className="mt-2 text-2xl font-black text-emerald-200">{state.stamina ?? 0} min</div>
                <div className="text-xs text-slate-400">{(state.stamina || 0) > 2400 ? '+20% XP rested bonus' : (state.stamina || 0) < 840 ? 'Fatigued: 50% XP' : 'Normal XP rate'}</div>
                <button onClick={() => { setTab('services'); }} className={`${button} mt-3`}>Rest at services</button>
              </div>
              <div className={card}>
                <div className="moria-eyebrow text-violet-300">ACHIEVEMENTS</div>
                <div className="mt-2 text-2xl font-black text-violet-200">{state.achievements?.length || 0}/{catalogs.achievements?.length || 0}</div>
                <div className="mt-2 flex flex-wrap gap-1">{(catalogs.achievements || []).map((a: any) => <span key={a.id} title={a.name} className={`rounded px-2 py-1 text-xs ${state.achievements?.includes(a.id) ? 'bg-violet-500/20 text-violet-200' : 'bg-black/30 text-slate-600'}`}>{a.icon} {a.name}</span>)}</div>
              </div>
              <div className={`${card} lg:col-span-2`}>
                <div className="moria-eyebrow text-sky-300">BESTIARY · SERVER KILLS</div>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">{bestiaryRows.length ? bestiaryRows.map(([name, kills]: any) => <div key={name} className="rounded-lg bg-slate-900/60 p-2"><div className="font-bold capitalize text-slate-200">{String(name).replaceAll('_', ' ')}</div><div className="text-xs text-sky-300">{String(kills)} kills</div></div>) : <div className="text-slate-500">No kills recorded yet.</div>}</div>
              </div>
              <div className={card}>
                <div className="moria-eyebrow text-orange-300">PROFESSIONS</div>
                <div className="mt-2 space-y-1 text-xs">{Object.entries(state.professions || {}).map(([name, value]: any) => <div key={name} className="flex justify-between"><span className="capitalize text-slate-300">{name}</span><span className="text-orange-200">Lv {value.level} · {value.xp} xp</span></div>)}</div>
                <button onClick={() => act('gather')} className={`${button} mt-3 border-orange-400/40 text-orange-200`}>⛏ Gather adjacent resource</button>
              </div>
              <div className={`${card} lg:col-span-3`}>
                <div className="moria-eyebrow text-rose-300">WEAPON MASTERY</div>
                <div className="mt-2 flex flex-wrap gap-2">{masteryRows.length ? masteryRows.map(([id, value]: any) => <span key={id} className="rounded-lg bg-rose-950/30 px-2 py-1 text-xs text-rose-200">{id}: Lv {value.level} ({value.xp} xp)</span>) : <span className="text-slate-500">Equip a weapon and fight to build mastery.</span>}</div>
              </div>
            </div>
          )}

          {tab === 'dungeon' && (
            <div className="mx-auto max-w-3xl">
              <div className={`${card} border-violet-500/30 text-center`}>
                <div className="text-5xl">🌀</div><h3 className="mt-2 text-2xl font-black text-violet-200">AUTHORITATIVE DUNGEON</h3>
                {state.dungeon?.active ? <>
                  <div className="mt-4 text-lg text-violet-100">Wave {state.dungeon.wave}/{state.dungeon.maxWaves}</div>
                  <div className="text-sm text-slate-400">{state.dungeon.killsRemaining} enemies remain</div>
                  <button onClick={() => act('dungeon_abandon')} className={`${button} mt-4 border-rose-500/40 text-rose-300`}>Abandon run</button>
                </> : <>
                  <p className="mx-auto mt-3 max-w-xl text-xs text-slate-400">Private server-owned monsters spawn around you. Other players cannot steal your dungeon mobs or rewards.</p>
                  <div className="mt-5 grid grid-cols-3 gap-2">{[3, 5, 10].map((waves) => <button key={waves} onClick={() => act('dungeon_start', { waves })} className={`${button} border-violet-500/40 py-4 text-violet-200`}><b>{waves} waves</b><br/><span className="text-[10px] text-slate-400">Best {state.dungeon?.highestWave || 0}</span></button>)}</div>
                </>}
              </div>
            </div>
          )}

          {tab === 'pets' && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{pets.map((pet: any) => {
              const owned = ownedPets.includes(pet.id); const active = state.pets?.active === pet.id; const locked = player.level < pet.levelRequired;
              return <div key={pet.id} className={card} style={{ borderColor: active ? pet.color : undefined }}><div className="flex items-center gap-3"><span className="text-4xl">{pet.icon}</span><div><b style={{ color: pet.color }}>{pet.name}</b><div className="text-xs text-slate-400">ATK {pet.attack} · Lv {pet.levelRequired}+</div></div></div><div className="mt-3 text-xs text-slate-400">Server companion attacks your selected monster alongside you.</div>{owned ? <button onClick={() => act('pet_toggle', { petId: pet.id })} className={`${button} mt-3`}>{active ? 'Dismiss' : 'Summon'}</button> : <button disabled={locked || player.gold < pet.price} onClick={() => act('pet_buy', { petId: pet.id })} className={`${button} mt-3`}>Buy · {pet.price}g</button>}</div>;
            })}</div>
          )}

          {tab === 'depot' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-sky-300">INVENTORY</div><div className="mt-2 space-y-1">{inventory.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded bg-slate-900/50 p-2"><span>{item.icon} {item.name} ×{item.quantity}</span><button onClick={() => act('depot_put', { itemId: item.id })} disabled={depot.length >= 40} className={button}>Store</button></div>)}</div></div>
              <div className={card}><div className="moria-eyebrow text-amber-300">DEPOT {depot.length}/40</div><div className="mt-2 space-y-1">{depot.map((item: any) => <div key={item.depotId} className="flex items-center justify-between rounded bg-slate-900/50 p-2"><span>{item.icon} {item.name} ×{item.quantity}</span><button onClick={() => act('depot_take', { depotId: item.depotId })} className={button}>Take</button></div>)}</div></div>
            </div>
          )}

          {tab === 'mail' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-sky-300">INBOX</div><div className="mt-2 space-y-2">{mail.length ? [...mail].reverse().map((m: any) => <div key={m.id} className="rounded-xl border border-slate-700/60 p-2"><div className="flex justify-between"><b className="text-slate-200">{m.subject}</b><span className="text-[10px] text-slate-500">{m.from}</span></div><p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{m.body}</p>{m.gold > 0 && <div className="mt-1 text-xs text-amber-300">🪙 {m.gold} gold attached</div>}<div className="mt-2 flex gap-1"><button onClick={() => act('mail_read', { mailId: m.id })} className={button}>Read</button>{!m.claimed && <button onClick={() => act('mail_claim', { mailId: m.id })} className={button}>Claim</button>}<button onClick={() => act('mail_delete', { mailId: m.id })} className={button}>Delete</button></div></div>) : <div className="text-slate-500">Inbox empty.</div>}</div></div>
              <div className={card}><div className="moria-eyebrow text-violet-300">SEND MAIL · 5g POSTAGE</div><div className="mt-3 space-y-2"><input className={input} placeholder="Character name" value={mailTarget} onChange={e => setMailTarget(e.target.value)}/><input className={input} placeholder="Subject" value={mailSubject} onChange={e => setMailSubject(e.target.value)}/><textarea className={`${input} h-28`} placeholder="Message" value={mailBody} onChange={e => setMailBody(e.target.value)}/><input className={input} type="number" min="0" placeholder="Gold attachment" value={mailGold} onChange={e => setMailGold(e.target.value)}/><button onClick={() => { act('mail_send', { target: mailTarget, subject: mailSubject, body: mailBody, gold: Number(mailGold) || 0 }); setMailBody(''); }} className={`${button} w-full border-violet-500/40 text-violet-200`}>📮 Send</button></div></div>
            </div>
          )}

          {tab === 'auction' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-amber-300">MARKET LISTINGS</div><div className="mt-2 space-y-1">{auctions.length ? auctions.map((a: any) => <div key={a.id} className="flex items-center justify-between gap-2 rounded bg-slate-900/50 p-2"><span>{a.item?.icon} {a.item?.name}<small className="ml-2 text-slate-500">by {a.seller}</small></span><div className="flex items-center gap-1"><span className="text-amber-300">{a.price}g</span>{a.seller === player.name ? <button onClick={() => act('auction_cancel', { listingId: a.id })} className={button}>Cancel</button> : <button disabled={player.gold < a.price} onClick={() => act('auction_buy', { listingId: a.id })} className={button}>Buy</button>}</div></div>) : <div className="text-slate-500">No listings.</div>}</div></div>
              <div className={card}><div className="moria-eyebrow text-emerald-300">CREATE LISTING</div><select className={`${input} mt-3`} value={auctionItem} onChange={e => setAuctionItem(e.target.value)}><option value="">Choose item…</option>{inventory.map((i: any) => <option key={i.id} value={i.id}>{i.icon} {i.name} ×{i.quantity}</option>)}</select><input className={`${input} mt-2`} type="number" min="1" value={auctionPrice} onChange={e => setAuctionPrice(e.target.value)}/><button disabled={!auctionItem} onClick={() => { act('auction_list', { itemId: auctionItem, price: Number(auctionPrice) }); setAuctionItem(''); }} className={`${button} mt-2 w-full`}>List item</button></div>
            </div>
          )}

          {tab === 'coins' && (
            <div><div className="mb-4 text-center text-3xl font-black text-cyan-200">💎 {state.coins || 0} Mor'ia Coins</div><p className="mb-4 text-center text-xs text-slate-500">Coins are earned in gameplay. No client-side grant and no real-money claim is trusted by the game server.</p><div className="grid gap-3 md:grid-cols-2">{(catalogs.coinStore || []).map((entry: any) => <div key={entry.id} className={card}><div className="flex gap-3"><span className="text-3xl">{entry.icon}</span><div><b className="text-cyan-100">{entry.name}</b><div className="text-xs text-slate-400">{entry.description}</div></div></div><button disabled={(state.coins || 0) < entry.price} onClick={() => act('coin_buy', { itemId: entry.id })} className={`${button} mt-3`}>💎 {entry.price}</button></div>)}</div></div>
          )}

          {tab === 'world' && worldEvent && (
            <div className="mx-auto max-w-3xl"><div className={`${card} border-orange-500/30 text-center`}><div className="text-5xl">{worldEvent.icon}</div><h3 className="mt-2 text-2xl font-black text-orange-200">{worldEvent.name}</h3><div className="mt-1 text-xs uppercase text-slate-500">{worldEvent.mapId} · target {worldEvent.target}</div><div className="mx-auto mt-4 h-3 max-w-xl overflow-hidden rounded bg-black/60"><div className="h-full bg-gradient-to-r from-orange-700 to-amber-300" style={{ width: `${Math.min(100, (worldEvent.progress / Math.max(1, worldEvent.needed)) * 100)}%` }}/></div><div className="mt-1 text-sm text-orange-200">{worldEvent.progress}/{worldEvent.needed}</div><div className="mt-3 text-xs text-slate-400">Community reward: {worldEvent.rewardGold}g · {worldEvent.rewardXp} XP · 💎{worldEvent.rewardCoins}</div>{pendingWorldRewards.length > 0 && <button onClick={() => act('world_event_claim')} className={`${button} mt-4 border-amber-400/50 text-amber-200`}>🏆 Claim completed event reward</button>}</div></div>
          )}

          {tab === 'services' && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-amber-300">BANK</div><input className={`${input} mt-3`} type="number" value={bankAmount} onChange={e => setBankAmount(e.target.value)}/><div className="mt-2 flex gap-2"><button onClick={() => act('bank_deposit', { amount: Number(bankAmount) })} className={button}>Deposit</button><button onClick={() => act('bank_withdraw', { amount: Number(bankAmount) })} className={button}>Withdraw</button></div></div>
              <div className={card}><div className="moria-eyebrow text-emerald-300">INN & TRAINING</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => act('rest')} className={button}>💚 Rest · 50g</button><button onClick={() => act('train')} disabled={(state.training || 0) >= 20} className={button}>📚 Train · 200g ({state.training || 0}/20)</button></div></div>
              <div className={card}><div className="moria-eyebrow text-pink-300">FOOD BUFFS</div><div className="mt-2 space-y-1">{(catalogs.food || []).map((f: any) => <div key={f.id} className="flex items-center justify-between rounded bg-slate-900/50 p-2"><span>{f.icon} {f.name}<small className="ml-2 text-slate-500">{f.description}</small></span><button disabled={player.gold < f.price || player.level < f.levelRequired} onClick={() => act('food_buy', { foodId: f.id })} className={button}>{f.price}g</button></div>)}</div></div>
              <div className={card}><div className="moria-eyebrow text-sky-300">GENERAL SHOP</div><div className="mt-2 space-y-1">{(catalogs.shop || []).map((i: any) => <div key={i.id} className="flex items-center justify-between rounded bg-slate-900/50 p-2"><span>{i.icon} {i.name}</span><button disabled={player.gold < i.price || player.level < (i.levelRequired || 1)} onClick={() => act('shop_buy', { itemId: i.id, quantity: 1 })} className={button}>{i.price}g</button></div>)}</div></div>
            </div>
          )}

          {tab === 'library' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-sky-300">SERVER LIBRARY</div><div className="mt-2 space-y-2">{(catalogs.books || []).map((b: any) => <details key={b.id} className="rounded-lg border border-slate-700/50 p-2" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) act('book_read', { bookId: b.id }); }}><summary className="cursor-pointer font-bold text-slate-200">{b.icon} {b.title} <span className="text-[10px] text-slate-500">— {b.author}</span>{state.booksRead?.includes(b.id) && <span className="ml-2 text-emerald-400">✓</span>}</summary><div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-400">{b.pages.map((p: string, i: number) => <p key={i}>{p}</p>)}</div></details>)}</div></div>
              <div className={card}><div className="moria-eyebrow text-violet-300">MYSTERIES</div><div className="mt-2 space-y-3">{(catalogs.mysteries || []).map((m: any) => { const prog = mysteryState[m.id] || { solvedChapters: 0, completed: false }; const chapter = m.chapters?.[prog.solvedChapters]; return <div key={m.id} className="rounded-lg border border-violet-800/50 p-2"><div className="font-bold text-violet-200">{m.icon} {m.name} {prog.completed && '✓'}</div><div className="text-[10px] text-slate-500">Lv {m.requiredLevel}+ · {m.rewardGold}g · {m.rewardXp}XP</div>{!prog.completed && player.level >= m.requiredLevel && chapter && <><p className="mt-2 text-xs text-slate-400">{chapter.clue}</p><b className="text-xs text-violet-300">{chapter.riddle}</b><div className="mt-2 flex gap-1"><input className={input} value={answers[m.id] || ''} onChange={e => setAnswers(v => ({ ...v, [m.id]: e.target.value }))} placeholder="Answer…"/><button onClick={() => { act('mystery_answer', { mysteryId: m.id, answer: answers[m.id] || '' }); setAnswers(v => ({ ...v, [m.id]: '' })); }} className={button}>Answer</button></div><div className="mt-1 text-[10px] text-amber-300/70">Hint: {chapter.hint}</div></>}</div>; })}</div></div>
            </div>
          )}

          {tab === 'crafting' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-orange-300">RECIPES</div><div className="mt-2 space-y-2">{recipes.map((r: any) => <div key={r.id} className="rounded-lg bg-slate-900/50 p-2"><div className="flex items-center justify-between"><span><b>{r.icon} {r.name}</b><small className="ml-2 text-slate-500">Lv {r.levelRequired}</small></span><button disabled={player.level < r.levelRequired} onClick={() => act('craft', { recipeId: r.id })} className={button}>Craft</button></div><div className="mt-1 text-[10px] text-slate-500">{r.ingredients.map((i: any) => `${i.quantity}× ${i.name}`).join(' · ')}</div></div>)}</div></div>
              <div className={card}><div className="moria-eyebrow text-cyan-300">GEM SOCKETING</div><select className={`${input} mt-3`} value={socketItem} onChange={e => setSocketItem(e.target.value)}><option value="">Socketable equipment…</option>{socketable.map((i: any) => <option key={i.id} value={i.id}>{i.icon} {i.name}</option>)}</select><select className={`${input} mt-2`} value={socketGem} onChange={e => setSocketGem(e.target.value)}><option value="">Gem…</option>{gems.map((g: any) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}</select><button disabled={!socketItem || !socketGem} onClick={() => { act('socket_gem', { itemId: socketItem, gemItemId: socketGem }); setSocketGem(''); }} className={`${button} mt-2 w-full`}>💎 Socket gem</button><div className="mt-4 grid grid-cols-2 gap-1 text-[10px]">{(catalogs.gems || []).map((g: any) => <span key={g.id} style={{ color: g.color }}>{g.icon} {g.name}: +{g.value} {g.stat}</span>)}</div></div>
            </div>
          )}

          {tab === 'pvp' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={card}><div className="moria-eyebrow text-rose-300">PVP STATUS</div><div className="mt-3 text-xl font-black text-rose-200">{state.pvp?.enabled ? '⚔ ENABLED' : '🕊 DISABLED'}</div><div className="text-xs text-slate-400">Skull: {state.pvp?.skull || 'none'} · Aggression {state.pvp?.aggression || 0}/100</div><button onClick={() => act('pvp_toggle')} className={`${button} mt-3 border-rose-500/40 text-rose-200`}>{state.pvp?.enabled ? 'Disable PvP' : 'Enable PvP'}</button></div>
              <div className={card}><div className="moria-eyebrow text-orange-300">NEARBY PLAYERS</div><div className="mt-2 space-y-1">{(official?.nearbyPvp || nearbyPlayers || []).length ? (official?.nearbyPvp || nearbyPlayers).map((p: any) => <div key={p.id} className="flex items-center justify-between rounded bg-slate-900/50 p-2"><span>{p.name} · Lv {p.level} · {p.skull || 'none'}</span><button disabled={!state.pvp?.enabled || !p.enabled} onClick={() => act('pvp_attack', { targetId: p.id })} className={button}>Attack</button></div>) : <div className="text-slate-500">No nearby players.</div>}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
