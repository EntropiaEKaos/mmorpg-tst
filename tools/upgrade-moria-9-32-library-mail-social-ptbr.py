from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    # Library
    'LIBRARY': 'BIBLIOTECA',
    'Close library': 'Fechar biblioteca',
    'The library shelves are empty. An admin can create books to fill them!': 'As estantes da biblioteca estão vazias. Um administrador pode criar livros para preenchê-las!',
    'by': 'por',
    'pages': 'páginas',
    'Read': 'Lido',
    'Back to library': 'Voltar à biblioteca',
    'This volume has no written pages yet.': 'Este volume ainda não possui páginas escritas.',
    'Previous': 'Anterior',
    'Page': 'Página',
    'of': 'de',
    'Next': 'Próxima',

    # Mail
    'MAILBOX': 'CORREIO',
    'Close mailbox': 'Fechar correio',
    'unread': 'não lidas',
    'total': 'total',
    'Compose': 'Escrever',
    'Refresh': 'Atualizar',
    'Your mailbox is empty.': 'Sua caixa de correio está vazia.',
    'From:': 'De:',
    'SYSTEM': 'SISTEMA',
    'ATTACHMENTS': 'ANEXOS',
    'Claim Attachments': 'Resgatar Anexos',
    'Claimed': 'Resgatado',
    'Delete': 'Excluir',
    'Cancel': 'Cancelar',
    'Recipient character name...': 'Nome do personagem destinatário...',
    'Subject...': 'Assunto...',
    'Your message...': 'Sua mensagem...',
    'Mail sent!': 'Mensagem enviada!',
    'Send Mail': 'Enviar Mensagem',
    'Back to inbox': 'Voltar à caixa de entrada',
    'Mail': 'Correio',

    # Social
    'AUTHORITATIVE SOCIAL': 'SOCIAL AUTORITATIVO',
    "MOR'IA SOCIAL HALL": "SALÃO SOCIAL DE MOR'IA",
    'Close social hall': 'Fechar salão social',
    'Friends': 'Amigos',
    'Party': 'Grupo',
    'Guild': 'Guilda',
    'Trade': 'Troca',
    'FRIENDS': 'AMIGOS',
    'Remove': 'Remover',
    'Your friends list is empty.': 'Sua lista de amigos está vazia.',
    'NEARBY ADVENTURERS': 'AVENTUREIROS PRÓXIMOS',
    'Add': 'Adicionar',
    'Ignore': 'Ignorar',
    'No nearby players.': 'Nenhum jogador próximo.',
    'IGNORED': 'IGNORADOS',
    'Ignored players cannot reach you through social invitations or chat. Their online presence is intentionally hidden.': 'Jogadores ignorados não podem contatar você por convites sociais ou chat. A presença online deles fica ocultada intencionalmente.',
    'Unignore': 'Deixar de ignorar',
    'Nobody ignored.': 'Ninguém está ignorado.',
    'YOUR PARTY': 'SEU GRUPO',
    'invited you.': 'convidou você.',
    'Accept': 'Aceitar',
    'Create party': 'Criar grupo',
    'online': 'online',
    'offline': 'offline',
    'Leave party': 'Sair do grupo',
    'Invite': 'Convidar',
    'GUILD': 'GUILDA',
    'invited you to': 'convidou você para',
    'Guild name': 'Nome da guilda',
    'Create guild · 1000g · Lv10+': 'Criar guilda · 1000g · Nv10+',
    'Role:': 'Cargo:',
    'No guild message.': 'Nenhuma mensagem da guilda.',
    'Guild message': 'Mensagem da guilda',
    'Save': 'Salvar',
    'Leave guild': 'Sair da guilda',
    'MEMBERS & RECRUITING': 'MEMBROS E RECRUTAMENTO',
    'Demote': 'Rebaixar',
    'Officer': 'Oficial',
    'Kick': 'Expulsar',
    'leader': 'líder',
    'officer': 'oficial',
    'member': 'membro',
    'DIRECT TRADE': 'TROCA DIRETA',
    'wants to trade.': 'quer negociar.',
    'Request trade': 'Solicitar troca',
    'You': 'Você',
    'Confirmed': 'Confirmado',
    'Not confirmed': 'Não confirmado',
    'Confirm trade': 'Confirmar troca',
    'YOUR OFFER': 'SUA OFERTA',
    'Gold': 'Ouro',
    'Update offer': 'Atualizar oferta',
    'Your current offer is confirmed.': 'Sua oferta atual está confirmada.',
    'Trade requests require both characters to remain within 3 tiles. Settlement is server-side and atomic.': 'Solicitações de troca exigem que os dois personagens permaneçam a até 3 espaços. A liquidação ocorre no servidor de forma atômica.',

    # Visual QA fixtures (real components, deterministic data)
    'Chronicles of Eldoria': 'Crônicas de Eldoria',
    'Archivist Selene': 'Arquivista Selene',
    'Eldoria was raised around the first safe roads of the realm. Its walls became a promise: civilization could survive the darkness.': 'Eldoria foi erguida ao redor das primeiras estradas seguras do reino. Suas muralhas se tornaram uma promessa: a civilização poderia sobreviver à escuridão.',
    'Travelers still gather beneath the old banners, trading stories before crossing into the wilds.': 'Viajantes ainda se reúnem sob os antigos estandartes, trocando histórias antes de partir para as terras selvagens.',
    "Welcome to Mor'ia": "Bem-vindo a Mor'ia",
    'Your field report has been accepted. Supplies are attached for the next expedition.': 'Seu relatório de campo foi aceito. Há suprimentos anexados para a próxima expedição.',
    'Royal Courier': 'Mensageiro Real',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            print(f'optional anchor not found in {path}: {old[:110]}')
    p.write_text(text, encoding='utf-8')


patch('src/components/BookLibrary.tsx', [
    ("import { getAllBooks, getReadBooks, markBookRead, type Book } from '../game/content';", "import { getAllBooks, getReadBooks, markBookRead, type Book } from '../game/content';\nimport { t as tr } from '../i18n';"),
    ('<button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>', '<button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl" aria-label={tr(\'Close library\')}>✕</button>'),
    ('>{book.title}</div>', '>{tr(book.title)}</div>'),
    ('>by {book.author}</div>', ">{tr('by')} {tr(book.author)}</div>"),
    ('>{book.pages.length} pages</div>', ">{book.pages.length} {tr('pages')}</div>"),
    ('>✓ Read</div>', ">✓ {tr('Read')}</div>"),
    ('>← Back to library</button>', ">← {tr('Back to library')}</button>"),
    ('>{active.title}</h3>', '>{tr(active.title)}</h3>'),
    ('>by {active.author}</div>', ">{tr('by')} {tr(active.author)}</div>"),
    ("{active.pages[page] || 'This volume has no written pages yet.'}", "{active.pages[page] ? tr(active.pages[page]) : tr('This volume has no written pages yet.')}"),
    ('>◀ Previous\n              </button>', ">◀ {tr('Previous')}\n              </button>"),
    ('>Page {Math.min(page + 1, pageCount)} of {pageCount}</span>', ">{tr('Page')} {Math.min(page + 1, pageCount)} {tr('of')} {pageCount}</span>"),
    ('>Next ▶\n              </button>', ">{tr('Next')} ▶\n              </button>"),
])

patch('src/components/MailBox.tsx', [
    ("import { getMail, markMailRead, claimMail, deleteMail, sendMail, type MailItem } from '../game/content';", "import { getMail, markMailRead, claimMail, deleteMail, sendMail, type MailItem } from '../game/content';\nimport { t as tr } from '../i18n';"),
    ("addMessage('Mail', `Claimed ${claimed.gold} gold from mail.`, '#f4e04d', 'loot');", "addMessage(tr('Mail'), `Resgatado: ${claimed.gold} de ouro do correio.`, '#f4e04d', 'loot');"),
    ("addMessage('Mail', `Claimed ${claimed.attachedItem.icon} ${claimed.attachedItem.name}`, '#f4e04d', 'loot');", "addMessage(tr('Mail'), `Resgatado: ${claimed.attachedItem.icon} ${tr(claimed.attachedItem.name)}`, '#f4e04d', 'loot');"),
    ('<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>', '<button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl" aria-label={tr(\'Close mailbox\')}>✕</button>'),
    ('>{m.subject}</div>', '>{tr(m.subject)}</div>'),
    ('>From: {m.from} · {new Date(m.sentAt).toLocaleDateString()}</div>', ">{tr('From:')} {tr(m.from)} · {new Date(m.sentAt).toLocaleDateString('pt-BR')}</div>"),
    ('>← Back to inbox</button>', ">← {tr('Back to inbox')}</button>"),
    ('>{active.subject}</h3>', '>{tr(active.subject)}</h3>'),
    ('>From: {active.from} · {new Date(active.sentAt).toLocaleString()}</div>', ">{tr('From:')} {tr(active.from)} · {new Date(active.sentAt).toLocaleString('pt-BR')}</div>"),
    ('>{active.body}</div>', '>{tr(active.body)}</div>'),
    ('>{active.attachedItem.icon} {active.attachedItem.name}</div>', '>{active.attachedItem.icon} {tr(active.attachedItem.name)}</div>'),
    ('placeholder="Recipient character name..."', "placeholder={tr('Recipient character name...')}"),
    ('placeholder="Subject..."', "placeholder={tr('Subject...')}"),
    ('placeholder="Your message..."', "placeholder={tr('Your message...')}"),
])

patch('src/components/SocialHub.tsx', [
    ("import type { Item, Player } from '../game/types';", "import type { Item, Player } from '../game/types';\nimport { t as tr } from '../i18n';"),
    ('<button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>', '<button onClick={onClose} className="text-xl text-slate-400 hover:text-white" aria-label={tr(\'Close social hall\')}>✕</button>'),
    ("{id === 'friends' ? '⭐ Friends' : id === 'party' ? '👥 Party' : id === 'guild' ? '🛡 Guild' : '🤝 Trade'}", "{id === 'friends' ? `⭐ ${tr('Friends')}` : id === 'party' ? `👥 ${tr('Party')}` : id === 'guild' ? `🛡 ${tr('Guild')}` : `🤝 ${tr('Trade')}`}"),
    ("Lv {friend.player.level} · {friend.player.mapId}", "{tr('Lv')} {friend.player.level} · {tr(friend.player.mapId)}"),
    ("<span><b>{p.name}</b> · Lv {p.level}</span>", "<span><b>{p.name}</b> · {tr('Lv')} {p.level}</span>"),
    ("<span>{p.name} · Lv {p.level}</span>", "<span>{p.name} · {tr('Lv')} {p.level}</span>"),
    ("<div className=\"text-xs text-slate-400\">Role: {guild.selfRole}</div>", "<div className=\"text-xs text-slate-400\">{tr('Role:')} {tr(guild.selfRole)}</div>"),
    ("<span>{member.name} · {member.role} {member.online ? '🟢' : '⚫'}</span>", "<span>{member.name} · {tr(member.role)} {member.online ? '🟢' : '⚫'}</span>"),
    ("{entry.self ? 'You' : entry.name}", "{entry.self ? tr('You') : entry.name}"),
    ("{item.icon} {item.name} ×{item.quantity}", "{item.icon} {tr(item.name)} ×{item.quantity}"),
])

Path('visual-qa.html').write_text("""<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mor'ia Visual QA</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/visualQa.tsx"></script>
  </body>
</html>
""", encoding='utf-8')

Path('src/visualQa.tsx').write_text("""import { StrictMode, useState } from 'react';
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
""", encoding='utf-8')

Path('tools/capture-moria-9-32.mjs').write_text("""import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.32-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

for (const panel of ['library', 'mail', 'social']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.32 screenshots in ${output}`);
""", encoding='utf-8')

Path('docs/MORIA_9_32_LIBRARY_MAIL_SOCIAL_PTBR.md').write_text("""# Mor'ia 9.32 — Biblioteca, Correio, Social e Visual QA

## Objetivo

Fechar mais um bloco de superfícies visíveis ao jogador em PT-BR, mantendo intactos os contratos de dados e a autoridade do servidor.

## Escopo implementado

- Biblioteca: navegação, estado vazio, autoria, paginação, estado de leitura e conteúdo dinâmico passam pela camada de tradução.
- Correio: listagem, leitura, anexos, composição, datas pt-BR e conteúdo dinâmico passam pela camada de tradução.
- Social: navegação principal e campos dinâmicos de nível, mapa, cargo e itens passam pela camada de tradução; o catálogo cobre os textos estáticos do fluxo de amigos, grupo, guilda e troca.
- Acessibilidade: os fechamentos dos três painéis recebem `aria-label` localizado.
- Visual QA: `visual-qa.html` renderiza os componentes reais com fixtures determinísticas, sem alterar o fluxo normal do jogo.

## O que não mudou

- Nenhum ID de livro, correio, amizade, grupo, guilda ou troca.
- Nenhuma regra de servidor, custo, requisito, distância ou liquidação de trade.
- Nenhum formato persistido em localStorage ou snapshot do servidor.

## Validação obrigatória

O gate 9.32 exige:

1. auditoria de cobertura PT-BR;
2. `npm audit --audit-level=high`;
3. `npm run typecheck`;
4. `npm run build`;
5. limite estrutural de `GameScreen.tsx`;
6. auditoria, check e testes do servidor;
7. captura visual real dos componentes com Chromium/Playwright.

## Prints produzidos

O workflow publica o artefato `moria-9.32-screenshots` contendo:

- `library.png` — Biblioteca;
- `mail.png` — Correio;
- `social.png` — Salão Social.

Os PNGs são gerados pela build corrente, usando os componentes React reais. O harness de QA não é importado pelo `src/main.tsx` e não interfere no runtime normal do jogo.

## Próximo bloco sugerido

9.33: Inventário/Depot/Auction/Coin Shop, seguido de uma nova varredura de strings residuais e uma rodada de polish visual responsivo.
""", encoding='utf-8')

print("Mor'ia 9.32 library + mail + social PT-BR and visual QA upgrade applied")
