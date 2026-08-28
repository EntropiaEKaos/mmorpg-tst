from pathlib import Path


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            raise SystemExit(f'missing required anchor in {path}: {old[:120]}')
    p.write_text(text, encoding='utf-8')


patch('src/components/BookLibrary.tsx', [
    ('            📚 LIBRARY', "            📚 {tr('LIBRARY')}"),
    ('                <div>The library shelves are empty. An admin can create books to fill them!</div>', "                <div>{tr('The library shelves are empty. An admin can create books to fill them!')}</div>"),
    ('                ◀ Previous', "                ◀ {tr('Previous')}"),
    ('                Next ▶', "                {tr('Next')} ▶"),
])

patch('src/components/MailBox.tsx', [
    ('              📮 MAILBOX', "              📮 {tr('MAILBOX')}"),
    ('            <div className="text-xs text-amber-200/60">{unreadCount} unread · {mail.length} total</div>', "            <div className=\"text-xs text-amber-200/60\">{unreadCount} {tr('unread')} · {mail.length} {tr('total')}</div>"),
    ('                ✏ Compose', "                ✏ {tr('Compose')}"),
    ('              <button onClick={refresh} className="px-3 py-1.5 rounded bg-black/40 text-amber-200 text-xs border border-amber-900/50">🔄 Refresh</button>', "              <button onClick={refresh} className=\"px-3 py-1.5 rounded bg-black/40 text-amber-200 text-xs border border-amber-900/50\">🔄 {tr('Refresh')}</button>"),
    ('                  <div>Your mailbox is empty.</div>', "                  <div>{tr('Your mailbox is empty.')}</div>"),
    ("{!m.read && <span className=\"text-amber-400\">● </span>}{m.subject}", "{!m.read && <span className=\"text-amber-400\">● </span>}{tr(m.subject)}"),
    ('<span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">SYSTEM</span>', "<span className=\"text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50\">{tr('SYSTEM')}</span>"),
    ('                  <div className="text-xs text-green-300 mb-2 tracking-widest">📦 ATTACHMENTS</div>', "                  <div className=\"text-xs text-green-300 mb-2 tracking-widest\">📦 {tr('ATTACHMENTS')}</div>"),
    ('                  {active.gold && <div className="text-amber-300 text-sm">🪙 {active.gold} gold</div>}', "                  {active.gold && <div className=\"text-amber-300 text-sm\">🪙 {active.gold} {tr('gold')}</div>}"),
    ('                      Claim Attachments', "                      {tr('Claim Attachments')}"),
    ('                    <div className="text-green-400 text-xs mt-1">✓ Claimed</div>', "                    <div className=\"text-green-400 text-xs mt-1\">✓ {tr('Claimed')}</div>"),
    ('              🗑 Delete', "              🗑 {tr('Delete')}"),
    ('    return <div className="flex-1 flex items-center justify-center text-green-400 text-lg">✓ Mail sent!</div>;', "    return <div className=\"flex-1 flex items-center justify-center text-green-400 text-lg\">✓ {tr('Mail sent!')}</div>;"),
    ('      <button onClick={onClose} className="text-amber-300 hover:text-amber-100 text-xs mb-3 self-start">← Cancel</button>', "      <button onClick={onClose} className=\"text-amber-300 hover:text-amber-100 text-xs mb-3 self-start\">← {tr('Cancel')}</button>"),
    ('          📨 Send Mail', "          📨 {tr('Send Mail')}"),
])

patch('src/components/SocialHub.tsx', [
    ('          <div><div className="moria-eyebrow text-cyan-300">AUTHORITATIVE SOCIAL</div><h2 className="text-xl font-black tracking-[0.14em] text-amber-100">MOR\'IA SOCIAL HALL</h2></div>', "          <div><div className=\"moria-eyebrow text-cyan-300\">{tr('AUTHORITATIVE SOCIAL')}</div><h2 className=\"text-xl font-black tracking-[0.14em] text-amber-100\">{tr(\"MOR'IA SOCIAL HALL\")}</h2></div>"),
    ('<div className={card}><div className="moria-eyebrow text-amber-300">FRIENDS</div>', "<div className={card}><div className=\"moria-eyebrow text-amber-300\">{tr('FRIENDS')}</div>"),
    ('className={button}>Remove</button>', "className={button}>{tr('Remove')}</button>"),
    ('<span className="text-slate-500">Your friends list is empty.</span>', "<span className=\"text-slate-500\">{tr('Your friends list is empty.')}</span>"),
    ('<div className={card}><div className="moria-eyebrow text-cyan-300">NEARBY ADVENTURERS</div>', "<div className={card}><div className=\"moria-eyebrow text-cyan-300\">{tr('NEARBY ADVENTURERS')}</div>"),
    ("className={button}>Add</button>", "className={button}>{tr('Add')}</button>"),
    ("className={`${button} border-rose-500/40 text-rose-200`}>Ignore</button>", "className={`${button} border-rose-500/40 text-rose-200`}>{tr('Ignore')}</button>"),
    ('<span className="text-slate-500">No nearby players.</span>', "<span className=\"text-slate-500\">{tr('No nearby players.')}</span>"),
    ('<div className={card}><div className="moria-eyebrow text-rose-300">IGNORED</div>', "<div className={card}><div className=\"moria-eyebrow text-rose-300\">{tr('IGNORED')}</div>"),
    ('<p className="mt-2 text-[11px] text-slate-500">Ignored players cannot reach you through social invitations or chat. Their online presence is intentionally hidden.</p>', "<p className=\"mt-2 text-[11px] text-slate-500\">{tr('Ignored players cannot reach you through social invitations or chat. Their online presence is intentionally hidden.')}</p>"),
    ('className={button}>Unignore</button>', "className={button}>{tr('Unignore')}</button>"),
    ('<span className="text-slate-500">Nobody ignored.</span>', "<span className=\"text-slate-500\">{tr('Nobody ignored.')}</span>"),
    ('<div className="moria-eyebrow text-sky-300">YOUR PARTY</div>', "<div className=\"moria-eyebrow text-sky-300\">{tr('YOUR PARTY')}</div>"),
    ('</b> invited you.<button', "</b> {tr('invited you.')}<button"),
    ("className={`${button} ml-2`}>Accept</button>", "className={`${button} ml-2`}>{tr('Accept')}</button>"),
    ("className={`${button} mt-3`}>Create party</button>", "className={`${button} mt-3`}>{tr('Create party')}</button>"),
    ('<small className="text-emerald-400">online</small>', "<small className=\"text-emerald-400\">{tr('online')}</small>"),
    ('<small className="text-slate-600">offline</small>', "<small className=\"text-slate-600\">{tr('offline')}</small>"),
    ("className={`${button} mt-3 border-rose-500/40 text-rose-200`}>Leave party</button>", "className={`${button} mt-3 border-rose-500/40 text-rose-200`}>{tr('Leave party')}</button>"),
    ('<div className={card}><div className="moria-eyebrow text-violet-300">NEARBY ADVENTURERS</div>', "<div className={card}><div className=\"moria-eyebrow text-violet-300\">{tr('NEARBY ADVENTURERS')}</div>"),
    ('className={button}>Invite</button>', "className={button}>{tr('Invite')}</button>"),
    ('<div className="moria-eyebrow text-amber-300">GUILD</div>', "<div className=\"moria-eyebrow text-amber-300\">{tr('GUILD')}</div>"),
    ('</b> invited you to <b>{social.guildInvite.guildName}</b>.', "</b> {tr('invited you to')} <b>{social.guildInvite.guildName}</b>."),
    ('placeholder="Guild name"', "placeholder={tr('Guild name')}"),
    ('>Create guild · 1000g · Lv10+</button>', ">{tr('Create guild · 1000g · Lv10+')}</button>"),
    ("{guild.motd || 'No guild message.'}", "{guild.motd ? tr(guild.motd) : tr('No guild message.') }"),
    ('placeholder="Guild message"', "placeholder={tr('Guild message')}"),
    ('className={button}>Save</button>', "className={button}>{tr('Save')}</button>"),
    ("className={`${button} mt-3 border-rose-500/40 text-rose-200`}>Leave guild</button>", "className={`${button} mt-3 border-rose-500/40 text-rose-200`}>{tr('Leave guild')}</button>"),
    ('<div className={card}><div className="moria-eyebrow text-emerald-300">MEMBERS & RECRUITING</div>', "<div className={card}><div className=\"moria-eyebrow text-emerald-300\">{tr('MEMBERS & RECRUITING')}</div>"),
    ("{member.role === 'officer' ? 'Demote' : 'Officer'}", "{member.role === 'officer' ? tr('Demote') : tr('Officer')}"),
    ('className={button}>Kick</button>', "className={button}>{tr('Kick')}</button>"),
    ('<div className="moria-eyebrow text-emerald-300">DIRECT TRADE</div>', "<div className=\"moria-eyebrow text-emerald-300\">{tr('DIRECT TRADE')}</div>"),
    ('</b> wants to trade.<button', "</b> {tr('wants to trade.')}<button"),
    ('className={button}>Request trade</button>', "className={button}>{tr('Request trade')}</button>"),
    ("{entry.confirmed ? '✓ Confirmed' : 'Not confirmed'}", "{entry.confirmed ? `✓ ${tr('Confirmed')}` : tr('Not confirmed')}"),
    ("className={`${button} mt-3 border-emerald-500/40 text-emerald-200`}>Confirm trade</button>", "className={`${button} mt-3 border-emerald-500/40 text-emerald-200`}>{tr('Confirm trade')}</button>"),
    ("className={`${button} ml-2 mt-3 border-rose-500/40 text-rose-200`}>Cancel</button>", "className={`${button} ml-2 mt-3 border-rose-500/40 text-rose-200`}>{tr('Cancel')}</button>"),
    ('<div className={card}><div className="moria-eyebrow text-sky-300">YOUR OFFER</div>', "<div className={card}><div className=\"moria-eyebrow text-sky-300\">{tr('YOUR OFFER')}</div>"),
    ('placeholder="Gold"', "placeholder={tr('Gold')}"),
    ("className={`${button} mt-3 w-full`}>Update offer</button>", "className={`${button} mt-3 w-full`}>{tr('Update offer')}</button>"),
    ('<div className="mt-2 text-center text-xs text-emerald-300">Your current offer is confirmed.</div>', "<div className=\"mt-2 text-center text-xs text-emerald-300\">{tr('Your current offer is confirmed.')}</div>"),
    ('<p className="mt-3 text-xs text-slate-500">Trade requests require both characters to remain within 3 tiles. Settlement is server-side and atomic.</p>', "<p className=\"mt-3 text-xs text-slate-500\">{tr('Trade requests require both characters to remain within 3 tiles. Settlement is server-side and atomic.')}</p>"),
])

# Extend the release notes with the finding produced by real screenshot QA.
doc = Path('docs/MORIA_9_32_LIBRARY_MAIL_SOCIAL_PTBR.md')
text = doc.read_text(encoding='utf-8')
section = """

## 9.32.2 — Fechamento explícito dos painéis

O gate visual da 9.32.1 foi mantido e deliberadamente não foi enfraquecido. Ele detectou que alguns rótulos estáticos ainda dependiam do bridge global de tradução. Nesta revisão, Biblioteca, Correio e Social passam a traduzir seus próprios rótulos críticos diretamente com `tr(...)`.

Também foi corrigido o assunto exibido na lista de correio, que ainda renderizava `m.subject` sem passar pelo catálogo. O objetivo é que cada painel seja corretamente localizado mesmo quando renderizado isoladamente em testes, Storybook futuro ou QA visual.

A captura continua falhando se os marcadores ingleses críticos reaparecerem. Portanto, screenshots e localização agora fazem parte do critério de aceite da versão, não apenas da documentação.
"""
if '## 9.32.2 — Fechamento explícito dos painéis' not in text:
    text += section
doc.write_text(text, encoding='utf-8')

print("Mor'ia 9.32.2 explicit panel PT-BR visual closure applied")
