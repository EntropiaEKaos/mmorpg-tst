import { useState } from 'react';
import type { Player, Item } from '../game/types';
import { getMail, markMailRead, claimMail, deleteMail, sendMail, type MailItem } from '../game/content';
import { t as tr } from '../i18n';

interface Props {
  player: Player;
  inventory: Item[];
  setInventory: (items: Item[]) => void;
  onClose: () => void;
  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
  onClaimGold: (amount: number) => void;
}

export default function MailBox({ player, inventory, setInventory, onClose, addMessage, onClaimGold }: Props) {
  const [mail, setMail] = useState<MailItem[]>(getMail(player.name));
  const [active, setActive] = useState<MailItem | null>(null);
  const [composing, setComposing] = useState(false);

  const refresh = () => setMail(getMail(player.name));

  const handleClaim = (m: MailItem) => {
    const p = player;
    const claimed = claimMail(p.name, m.id);
    if (!claimed) return;
    if (claimed.gold && claimed.gold > 0) {
      onClaimGold(claimed.gold);
      addMessage(tr('Mail'), `Resgatado: ${claimed.gold} de ouro do correio.`, '#f4e04d', 'loot');
    }
    if (claimed.attachedItem) {
      const newInv = [...inventory, {
        id: `mail_${Date.now()}_${Math.random()}`, name: claimed.attachedItem.name, icon: claimed.attachedItem.icon,
        type: 'misc' as const, quantity: 1, value: claimed.attachedItem.value,
      }];
      setInventory(newInv);
      addMessage(tr('Mail'), `Resgatado: ${claimed.attachedItem.icon} ${tr(claimed.attachedItem.name)}`, '#f4e04d', 'loot');
    }
    refresh();
    setActive(null);
  };

  const unreadCount = mail.filter((m) => !m.read).length;

  return (
    <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}>
              📮 {tr('MAILBOX')}
            </h2>
            <div className="text-xs text-amber-200/60">{unreadCount} {tr(unreadCount === 1 ? 'unread message' : 'unread messages')} · {mail.length} {tr(mail.length === 1 ? 'message' : 'messages')}</div>
          </div>
          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl" aria-label={tr('Close mailbox')}>✕</button>
        </div>

        {!active && !composing && (
          <>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setComposing(true)} className="px-3 py-1.5 rounded bg-gradient-to-b from-amber-500 to-amber-700 text-black text-xs font-bold">
                ✏ {tr('Compose')}
              </button>
              <button onClick={refresh} className="px-3 py-1.5 rounded bg-black/40 text-amber-200 text-xs border border-amber-900/50">🔄 {tr('Refresh')}</button>
            </div>
            <div className="moria-scrollbar overflow-y-auto flex-1 space-y-2 pr-1">
              {mail.length === 0 ? (
                <div className="text-center text-amber-200/40 py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <div>{tr('Your mailbox is empty.')}</div>
                </div>
              ) : (
                mail.slice().reverse().map((m) => (
                  <div key={m.id} onClick={() => { setActive(m); if (!m.read) markMailRead(player.name, m.id); refresh(); }}
                       className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${m.read ? 'border-amber-900/40 bg-black/30' : 'border-amber-500/60 bg-amber-900/15'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.isSystem ? '📯' : '✉'}</span>
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${m.read ? 'text-amber-200/70' : 'text-amber-100'}`}>
                          {!m.read && <span className="text-amber-400">● </span>}{tr(m.subject)}
                        </div>
                        <div className="text-[10px] text-amber-200/50">{tr('From:')} {tr(m.from)} · {new Date(m.sentAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                      {(m.gold || m.attachedItem) && !m.claimed && <span className="text-green-400 text-xs">🎁</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {active && !composing && (
          <div className="flex-1 flex flex-col">
            <button onClick={() => setActive(null)} className="text-amber-300 hover:text-amber-100 text-xs mb-3 self-start">← {tr('Back to inbox')}</button>
            <div className="rounded-lg border-2 border-amber-700/50 p-4 flex-1 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-amber-100">{tr(active.subject)}</h3>
                {active.isSystem && <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">{tr('SYSTEM')}</span>}
              </div>
              <div className="text-xs text-amber-200/60 mb-3">{tr('From:')} {tr(active.from)} · {new Date(active.sentAt).toLocaleString('pt-BR')}</div>
              <div className="text-amber-100/90 text-sm leading-relaxed whitespace-pre-wrap">{tr(active.body)}</div>
              {(active.gold || active.attachedItem) && (
                <div className="mt-4 p-3 rounded border border-green-700/50 bg-green-900/20">
                  <div className="text-xs text-green-300 mb-2 tracking-widest">📦 {tr('ATTACHMENTS')}</div>
                  {active.gold && <div className="text-amber-300 text-sm">🪙 {active.gold} {tr('gold')}</div>}
                  {active.attachedItem && <div className="text-amber-100 text-sm">{active.attachedItem.icon} {tr(active.attachedItem.name)}</div>}
                  {!active.claimed ? (
                    <button onClick={() => handleClaim(active)} className="mt-2 px-4 py-1.5 rounded bg-gradient-to-b from-green-500 to-green-700 text-white text-xs font-bold">
                      {tr('Claim Attachments')}
                    </button>
                  ) : (
                    <div className="text-green-400 text-xs mt-1">✓ {tr('Claimed')}</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { deleteMail(player.name, active.id); refresh(); setActive(null); }}
                    className="mt-2 px-3 py-1 rounded bg-red-900/40 text-red-300 text-xs border border-red-700/50 self-end hover:bg-red-800/60">
              🗑 {tr('Delete')}
            </button>
          </div>
        )}

        {composing && <ComposeMail player={player} onClose={() => setComposing(false)} refresh={refresh} />}
      </div>
    </div>
  );
}

function ComposeMail({ player, onClose, refresh }: { player: Player; onClose: () => void; refresh: () => void }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!to.trim() || !subject.trim()) return;
    sendMail({ from: player.name, to: to.trim(), subject: subject.trim(), body: body.trim() });
    setSent(true);
    setTimeout(() => { onClose(); refresh(); }, 1200);
  };

  if (sent) {
    return <div className="flex-1 flex items-center justify-center text-green-400 text-lg">✓ {tr('Mail sent!')}</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <button onClick={onClose} className="text-amber-300 hover:text-amber-100 text-xs mb-3 self-start">← {tr('Cancel')}</button>
      <div className="space-y-2">
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={tr('Recipient character name...')}
               className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={tr('Subject...')}
               className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={tr('Your message...')} rows={6}
                  className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
        <button onClick={send} disabled={!to.trim() || !subject.trim()}
                className="w-full py-2 rounded bg-gradient-to-b from-amber-500 to-amber-700 text-black font-bold text-sm disabled:opacity-40">
          📨 {tr('Send Mail')}
        </button>
      </div>
    </div>
  );
}
