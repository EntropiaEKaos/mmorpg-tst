import { useMemo, useState } from 'react';
import type { Item, Player } from '../game/types';

interface Props {
  player: Player;
  inventory: Item[];
  social: any;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  onClose: () => void;
}

type Tab = 'friends' | 'party' | 'guild' | 'trade';
const card = 'rounded-2xl border border-slate-700/70 bg-black/30 p-3';
const button = 'moria-button rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40';
const input = 'moria-input w-full rounded-lg border px-2 py-1.5 text-xs';

export default function SocialHub({ player, inventory, social, onAction, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('friends');
  const [guildName, setGuildName] = useState('');
  const [motd, setMotd] = useState(social?.guild?.motd || '');
  const [tradeGold, setTradeGold] = useState('0');
  const [tradeItems, setTradeItems] = useState<string[]>([]);
  const act = (action: string, payload: Record<string, unknown> = {}) => onAction(action, payload);

  const nearby = Array.isArray(social?.nearby) ? social.nearby : [];
  const party = social?.party || null;
  const guild = social?.guild || null;
  const trade = social?.trade || null;
  const ownTrade = useMemo(() => trade?.players?.find((entry: any) => entry.self), [trade]);

  const toggleTradeItem = (itemId: string) => {
    setTradeItems((current) => current.includes(itemId) ? current.filter(id => id !== itemId) : current.length < 8 ? [...current, itemId] : current);
  };

  return (
    <div className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="moria-panel flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-cyan-300/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div><div className="moria-eyebrow text-cyan-300">AUTHORITATIVE SOCIAL</div><h2 className="text-xl font-black tracking-[0.14em] text-amber-100">MOR'IA SOCIAL HALL</h2></div>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="flex gap-1 border-b border-slate-800 p-2">
          {(['friends', 'party', 'guild', 'trade'] as const).map(id => <button key={id} onClick={() => setTab(id)} className={`${button} ${tab === id ? 'border-cyan-300/50 text-cyan-100' : 'border-slate-700 text-slate-400'}`}>{id === 'friends' ? '⭐ Friends' : id === 'party' ? '👥 Party' : id === 'guild' ? '🛡 Guild' : '🤝 Trade'}</button>)}
        </div>

        <div className="moria-scrollbar flex-1 overflow-y-auto p-4 text-sm">
          {tab === 'friends' && <div className="grid gap-4 lg:grid-cols-3">
            <div className={card}><div className="moria-eyebrow text-amber-300">FRIENDS</div><div className="mt-3 space-y-2">{Array.isArray(social?.friends) && social.friends.length ? social.friends.map((friend: any) => <div key={friend.key} className="rounded-xl border border-slate-800 bg-slate-950/55 p-2"><div className="flex items-center justify-between gap-2"><span><b>{friend.online ? '🟢' : '⚫'} {friend.name}</b>{friend.online && friend.player ? <small className="ml-2 text-slate-400">Lv {friend.player.level} · {friend.player.mapId}</small> : null}</span><button onClick={() => act('friend_remove', { targetKey: friend.key })} className={button}>Remove</button></div></div>) : <span className="text-slate-500">Your friends list is empty.</span>}</div></div>
            <div className={card}><div className="moria-eyebrow text-cyan-300">NEARBY ADVENTURERS</div><div className="mt-3 space-y-2">{nearby.length ? nearby.map((p: any) => <div key={p.id} className="rounded-xl bg-slate-900/60 p-2"><div className="flex items-center justify-between gap-2"><span><b>{p.name}</b> · Lv {p.level}</span><div className="flex gap-1"><button onClick={() => act('friend_add', { targetId: p.id })} className={button}>Add</button><button onClick={() => act('ignore_add', { targetId: p.id })} className={`${button} border-rose-500/40 text-rose-200`}>Ignore</button></div></div></div>) : <span className="text-slate-500">No nearby players.</span>}</div></div>
            <div className={card}><div className="moria-eyebrow text-rose-300">IGNORED</div><p className="mt-2 text-[11px] text-slate-500">Ignored players cannot reach you through social invitations or chat. Their online presence is intentionally hidden.</p><div className="mt-3 space-y-2">{Array.isArray(social?.ignored) && social.ignored.length ? social.ignored.map((entry: any) => <div key={entry.key} className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2"><span>🚫 {entry.name}</span><button onClick={() => act('ignore_remove', { targetKey: entry.key })} className={button}>Unignore</button></div>) : <span className="text-slate-500">Nobody ignored.</span>}</div></div>
          </div>}

          {tab === 'party' && <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <div className="moria-eyebrow text-sky-300">YOUR PARTY</div>
              {social?.partyInvite && !party && <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3"><b>{social.partyInvite.fromName}</b> invited you.<button onClick={() => act('party_accept')} className={`${button} ml-2`}>Accept</button></div>}
              {!party ? <button onClick={() => act('party_create')} className={`${button} mt-3`}>Create party</button> : <>
                <div className="mt-3 space-y-2">{party.members?.map((member: any) => <div key={member.key} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2"><span>{party.leaderKey === member.key ? '👑 ' : ''}{member.name || member.key} {member.online ? <small className="text-emerald-400">online</small> : <small className="text-slate-600">offline</small>}</span>{party.leaderKey === player.name.toLowerCase() && member.key !== party.leaderKey && <button onClick={() => act('party_kick', { targetKey: member.key })} className={button}>Remove</button>}</div>)}</div>
                <button onClick={() => act('party_leave')} className={`${button} mt-3 border-rose-500/40 text-rose-200`}>Leave party</button>
              </>}
            </div>
            <div className={card}><div className="moria-eyebrow text-violet-300">NEARBY ADVENTURERS</div><div className="mt-3 space-y-2">{nearby.length ? nearby.map((p: any) => <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2"><span>{p.name} · Lv {p.level}</span><button disabled={Boolean(party && party.leaderKey !== player.name.toLowerCase())} onClick={() => act('party_invite', { targetId: p.id })} className={button}>Invite</button></div>) : <span className="text-slate-500">No nearby players.</span>}</div></div>
          </div>}

          {tab === 'guild' && <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <div className="moria-eyebrow text-amber-300">GUILD</div>
              {social?.guildInvite && !guild && <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3"><b>{social.guildInvite.fromName}</b> invited you to <b>{social.guildInvite.guildName}</b>.<button onClick={() => act('guild_accept')} className={`${button} ml-2`}>Accept</button></div>}
              {!guild ? <div className="mt-3 space-y-2"><input value={guildName} onChange={e => setGuildName(e.target.value)} className={input} maxLength={32} placeholder="Guild name"/><button disabled={player.level < 10 || player.gold < 1000 || guildName.trim().length < 3} onClick={() => act('guild_create', { name: guildName })} className={`${button} w-full`}>Create guild · 1000g · Lv10+</button></div> : <>
                <h3 className="mt-3 text-xl font-black text-amber-100">🛡 {guild.name}</h3><div className="text-xs text-slate-400">Role: {guild.selfRole}</div><p className="mt-2 rounded bg-black/30 p-2 text-xs text-slate-300">{guild.motd || 'No guild message.'}</p>
                {['leader','officer'].includes(guild.selfRole) && <div className="mt-2 flex gap-1"><input value={motd} onChange={e => setMotd(e.target.value)} className={input} maxLength={160} placeholder="Guild message"/><button onClick={() => act('guild_motd', { motd })} className={button}>Save</button></div>}
                <button onClick={() => act('guild_leave')} className={`${button} mt-3 border-rose-500/40 text-rose-200`}>Leave guild</button>
              </>}
            </div>
            <div className={card}><div className="moria-eyebrow text-emerald-300">MEMBERS & RECRUITING</div>{guild && <div className="mt-3 space-y-2">{guild.members?.map((member: any) => <div key={member.key} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2"><span>{member.name} · {member.role} {member.online ? '🟢' : '⚫'}</span>{guild.selfRole === 'leader' && member.key !== player.name.toLowerCase() && <div className="flex gap-1"><button onClick={() => act('guild_role', { targetKey: member.key, role: member.role === 'officer' ? 'member' : 'officer' })} className={button}>{member.role === 'officer' ? 'Demote' : 'Officer'}</button><button onClick={() => act('guild_kick', { targetKey: member.key })} className={button}>Kick</button></div>}</div>)}</div>}{guild && ['leader','officer'].includes(guild.selfRole) && <div className="mt-4 space-y-2">{nearby.filter((p: any) => !guild.members?.some((m: any) => m.key === p.name.toLowerCase())).map((p: any) => <div key={p.id} className="flex justify-between"><span>{p.name}</span><button onClick={() => act('guild_invite', { targetId: p.id })} className={button}>Invite</button></div>)}</div>}</div>
          </div>}

          {tab === 'trade' && <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <div className="moria-eyebrow text-emerald-300">DIRECT TRADE</div>
              {social?.tradeInvite && !trade && <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3"><b>{social.tradeInvite.fromName}</b> wants to trade.<button onClick={() => act('trade_accept')} className={`${button} ml-2`}>Accept</button></div>}
              {!trade ? <div className="mt-3 space-y-2">{nearby.map((p: any) => <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2"><span>{p.name} · Lv {p.level}</span><button onClick={() => act('trade_request', { targetId: p.id })} className={button}>Request trade</button></div>)}</div> : <>
                <div className="mt-3 space-y-3">{trade.players?.map((entry: any) => <div key={entry.key} className="rounded-xl border border-slate-700/60 p-2"><div className="flex justify-between"><b>{entry.self ? 'You' : entry.name}</b><span className={entry.confirmed ? 'text-emerald-300' : 'text-slate-500'}>{entry.confirmed ? '✓ Confirmed' : 'Not confirmed'}</span></div><div className="text-amber-300">🪙 {entry.gold}g</div><div className="mt-1 flex flex-wrap gap-1">{entry.items?.map((item: any) => <span key={item.id} className="rounded bg-slate-900 px-2 py-1 text-xs">{item.icon} {item.name} ×{item.quantity}</span>)}</div></div>)}</div>
                <button onClick={() => act('trade_confirm')} className={`${button} mt-3 border-emerald-500/40 text-emerald-200`}>Confirm trade</button><button onClick={() => act('trade_cancel')} className={`${button} ml-2 mt-3 border-rose-500/40 text-rose-200`}>Cancel</button>
              </>}
            </div>
            <div className={card}><div className="moria-eyebrow text-sky-300">YOUR OFFER</div>{trade ? <><input type="number" min="0" max={player.gold} value={tradeGold} onChange={e => setTradeGold(e.target.value)} className={`${input} mt-3`} placeholder="Gold"/><div className="mt-3 max-h-64 space-y-1 overflow-y-auto">{inventory.map((item: any) => <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded bg-slate-900/50 p-2"><input type="checkbox" checked={tradeItems.includes(item.id)} onChange={() => toggleTradeItem(item.id)}/><span>{item.icon} {item.name} ×{item.quantity}</span></label>)}</div><button onClick={() => act('trade_offer', { gold: Number(tradeGold) || 0, itemIds: tradeItems })} className={`${button} mt-3 w-full`}>Update offer</button>{ownTrade?.confirmed && <div className="mt-2 text-center text-xs text-emerald-300">Your current offer is confirmed.</div>}</> : <p className="mt-3 text-xs text-slate-500">Trade requests require both characters to remain within 3 tiles. Settlement is server-side and atomic.</p>}</div>
          </div>}
        </div>
      </div>
    </div>
  );
}
