from pathlib import Path
import json,re

ROOT=Path('.')

def write(path, content):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content,encoding='utf-8')

def replace(path, old, new):
    p=ROOT/path; s=p.read_text(encoding='utf-8')
    if old not in s: raise SystemExit(f'marker not found in {path}: {old[:80]}')
    p.write_text(s.replace(old,new,1),encoding='utf-8')

i18n = r'''// Mor'ia 9.28 — internationalization foundation.
// Canonical IDs/protocol values remain untranslated. Only presentation text is localized.
export type MoriaLocale = 'pt-BR' | 'en-US';

const STORAGE_KEY = 'moria_locale';

const PT_BR_EXACT: Record<string, string> = {
  "VALIDATING MOR'IA SESSION...": "VALIDANDO SESSÃO DE MOR'IA...",
  'Account recovery': 'Recuperação de conta',
  'Save your recovery code': 'Salve seu código de recuperação',
  'This code is shown once. Store it somewhere private: anyone holding it can recover the account.': 'Este código é exibido uma única vez. Guarde-o em um local privado: qualquer pessoa que o possua poderá recuperar a conta.',
  'I SAVED IT — CONTINUE': 'SALVEI O CÓDIGO — CONTINUAR',
  'Persistent online realm': 'Mundo online persistente',
  'Enter a world built for danger, mastery and legend.': 'Entre em um mundo feito de perigo, domínio e lenda.',
  "Mor'ia blends old-school MMO tension with a modern authoritative server, living progression and a world that grows with its players.": "Mor'ia combina a tensão dos MMOs clássicos com um servidor autoritativo moderno, progressão viva e um mundo que cresce com seus jogadores.",
  'Authoritative': 'Autoritativo', 'Server-owned combat': 'Combate controlado pelo servidor',
  'Persistent': 'Persistente', 'Characters & quests': 'Personagens e missões',
  'Evolving': 'Em evolução', 'Live world content': 'Conteúdo vivo do mundo',
  'Realm of Shadows': 'Reino das Sombras',
  'SECURE ACCOUNT · AUTHORITATIVE WORLD': 'CONTA SEGURA · MUNDO AUTORITATIVO',
  'LOGIN': 'ENTRAR', 'REGISTER': 'CADASTRAR', 'RECOVER': 'RECUPERAR',
  'New adventurer': 'Novo aventureiro', 'Create your character': 'Crie seu personagem',
  'CHARACTER NAME': 'NOME DO PERSONAGEM', 'VOCATION': 'VOCAÇÃO', 'SELECTED': 'SELECIONADO', 'CHOOSE': 'ESCOLHER',
  'ACCOUNT NAME': 'NOME DA CONTA', 'RECOVERY CODE': 'CÓDIGO DE RECUPERAÇÃO', 'NEW PASSWORD': 'NOVA SENHA', 'PASSWORD': 'SENHA',
  "ENTER MOR'IA": "ENTRAR EM MOR'IA", 'CREATE ACCOUNT': 'CRIAR CONTA', 'RESET PASSWORD': 'REDEFINIR SENHA', 'CREATE HERO': 'CRIAR HERÓI',
  '▶ OFFLINE QUICK PLAY': '▶ JOGO RÁPIDO OFFLINE',
  'Passwords are hashed server-side and never stored in browser account lists.': 'As senhas são protegidas no servidor e nunca são armazenadas em listas de contas do navegador.',
  'Inventory': 'Inventário', 'INVENTORY': 'INVENTÁRIO', 'Character': 'Personagem', 'CHARACTER': 'PERSONAGEM',
  'Skills': 'Habilidades', 'SKILLS': 'HABILIDADES', 'Quests': 'Missões', 'QUESTS': 'MISSÕES',
  'Map': 'Mapa', 'MAP': 'MAPA', 'Settings': 'Configurações', 'SETTINGS': 'CONFIGURAÇÕES',
  'Logout': 'Sair', 'LOGOUT': 'SAIR', 'Close': 'Fechar', 'CLOSE': 'FECHAR',
  'Search': 'Buscar', 'SEARCH': 'BUSCAR', 'Buy': 'Comprar', 'BUY': 'COMPRAR', 'Sell': 'Vender', 'SELL': 'VENDER',
  'Create': 'Criar', 'CREATE': 'CRIAR', 'Craft': 'Fabricar', 'CRAFT': 'FABRICAR',
  'Equip': 'Equipar', 'EQUIP': 'EQUIPAR', 'Unequip': 'Desequipar', 'UNEQUIP': 'DESEQUIPAR',
  'Use': 'Usar', 'USE': 'USAR', 'Drop': 'Soltar', 'DROP': 'SOLTAR', 'Delete': 'Excluir', 'DELETE': 'EXCLUIR',
  'Confirm': 'Confirmar', 'CONFIRM': 'CONFIRMAR', 'Cancel': 'Cancelar', 'CANCEL': 'CANCELAR',
  'Back': 'Voltar', 'BACK': 'VOLTAR', 'Next': 'Próximo', 'NEXT': 'PRÓXIMO', 'Previous': 'Anterior', 'PREVIOUS': 'ANTERIOR',
  'Name': 'Nome', 'NAME': 'NOME', 'Description': 'Descrição', 'DESCRIPTION': 'DESCRIÇÃO',
  'Requirements': 'Requisitos', 'REQUIREMENTS': 'REQUISITOS', 'Reward': 'Recompensa', 'REWARD': 'RECOMPENSA',
  'Rewards': 'Recompensas', 'REWARDS': 'RECOMPENSAS', 'Stats': 'Atributos', 'STATS': 'ATRIBUTOS',
  'Health': 'Vida', 'HEALTH': 'VIDA', 'Mana': 'Mana', 'MANA': 'MANA', 'Level': 'Nível', 'LEVEL': 'NÍVEL',
  'Experience': 'Experiência', 'EXPERIENCE': 'EXPERIÊNCIA', 'Attack': 'Ataque', 'ATTACK': 'ATAQUE',
  'Defense': 'Defesa', 'DEFENSE': 'DEFESA', 'Magic': 'Magia', 'MAGIC': 'MAGIA',
  'Damage': 'Dano', 'DAMAGE': 'DANO', 'Critical': 'Crítico', 'CRITICAL': 'CRÍTICO',
  'Resistance': 'Resistência', 'RESISTANCE': 'RESISTÊNCIA', 'Weakness': 'Fraqueza', 'WEAKNESS': 'FRAQUEZA',
  'Physical': 'Físico', 'Arcane': 'Arcano', 'Fire': 'Fogo', 'Water': 'Água', 'Earth': 'Terra',
  'Lightning': 'Raio', 'Ice': 'Gelo', 'Death': 'Morte', 'Holy': 'Sagrado', 'Nature': 'Natureza',
  'Poison': 'Veneno', 'Shadow': 'Sombra', 'Wet': 'Molhado', 'Chilled': 'Resfriado', 'Frozen': 'Congelado',
  'Shocked': 'Eletrizado', 'Cursed': 'Amaldiçoado', 'Unstable': 'Instável', 'Fractured': 'Fraturado', 'Rooted': 'Enraizado',
  'Stun': 'Atordoamento', 'Slow': 'Lentidão', 'Burn': 'Queimadura', 'Silence': 'Silêncio', 'Vulnerable': 'Vulnerável',
  'Common': 'Comum', 'Uncommon': 'Incomum', 'Rare': 'Raro', 'Epic': 'Épico', 'Legendary': 'Lendário', 'Relic': 'Relíquia',
  'Normal': 'Normal', 'Elite': 'Elite', 'Boss': 'Chefe', 'World Boss': 'Chefe Mundial',
  'Auction House': 'Casa de Leilões', 'Mailbox': 'Correio', 'Depot': 'Depósito', 'Bestiary': 'Bestiário',
  'Adventure Board': 'Quadro de Aventuras', 'Quest Log': 'Diário de Missões', 'Talent Tree': 'Árvore de Talentos',
  'Guild': 'Guilda', 'Party': 'Grupo', 'Friends': 'Amigos', 'Ignore': 'Ignorar', 'Online': 'Online', 'Offline': 'Offline',
  'Living Realm': 'Mundo Vivo', 'Living Nodes': 'Nodes Vivos', 'Faction': 'Facção', 'Factions': 'Facções',
  'Chronicle': 'Crônica', 'Grand Crafting': 'Grande Artesanato', 'Taming': 'Doma', 'Breeding': 'Criação',
  'Regional Economy': 'Economia Regional', 'Profession Specialization': 'Especialização de Profissão',
  'Faction Politics': 'Política de Facções', 'Siege Warfare': 'Guerra de Cerco', 'Dynamic World': 'Mundo Dinâmico',
  'Dungeon Blueprints': 'Projetos de Masmorra', 'Quest Consequences': 'Consequências de Missões', 'Functional Housing': 'Moradia Funcional',
  'Node': 'Node', 'Treasury': 'Tesouro', 'Supply': 'Suprimentos', 'Morale': 'Moral', 'Influence': 'Influência',
  'Reputation': 'Reputação', 'Rank': 'Patente', 'War': 'Guerra', 'Siege': 'Cerco', 'Occupation': 'Ocupação', 'Recovery': 'Recuperação',
  'Peace': 'Paz', 'Preparation': 'Preparação', 'Claim': 'Reivindicar', 'Attack Node': 'Atacar Node',
  'Workshop': 'Oficina', 'Shopfront': 'Loja', 'Library': 'Biblioteca', 'Stable': 'Estábulo', 'Siege Foundry': 'Fundição de Cerco',
  'Game Editor': 'Editor do Jogo', 'City Designer': 'Designer de Cidades', 'Content Studio': 'Estúdio de Conteúdo', 'Admin Panel': 'Painel Administrativo',
  'ADMIN PANEL': 'PAINEL ADMINISTRATIVO', 'GAME EDITOR': 'EDITOR DO JOGO',
  'Save': 'Salvar', 'SAVE': 'SALVAR', 'Publish': 'Publicar', 'PUBLISH': 'PUBLICAR', 'Validate': 'Validar', 'VALIDATE': 'VALIDAR',
  'Add': 'Adicionar', 'ADD': 'ADICIONAR', 'Remove': 'Remover', 'REMOVE': 'REMOVER', 'Edit': 'Editar', 'EDIT': 'EDITAR',
  'Enabled': 'Ativado', 'Disabled': 'Desativado', 'Active': 'Ativo', 'Inactive': 'Inativo',
  'Clear': 'Limpar', 'Day': 'Dia', 'Night': 'Noite', 'Dawn': 'Amanhecer', 'Dusk': 'Entardecer',
  'Storm': 'Tempestade', 'Rain': 'Chuva', 'Snow': 'Neve', 'Fog': 'Névoa',
  'Target': 'Alvo', 'Range': 'Alcance', 'Cooldown': 'Recarga', 'Cost': 'Custo', 'Duration': 'Duração',
  'Reactive combos': 'Combos reativos', 'Influence chain': 'Cadeia de influência',
  'Knight': 'Cavaleiro', 'Paladin': 'Paladino', 'Sorcerer': 'Feiticeiro', 'Druid': 'Druida', 'Warlock': 'Bruxo',
  'Rogue': 'Ladino', 'Priest': 'Sacerdote', 'Death Knight': 'Cavaleiro da Morte', 'Monk': 'Monge', 'Ranger': 'Patrulheiro',
  'Necromancer': 'Necromante', 'Berserker': 'Berserker', 'Shaman': 'Xamã', 'Templar': 'Templário',
  'Wolf': 'Lobo', 'Bear': 'Urso', 'Rat': 'Rato', 'Spider': 'Aranha', 'Snake': 'Serpente', 'Dragon': 'Dragão',
  'Skeleton': 'Esqueleto', 'Zombie': 'Zumbi', 'Demon': 'Demônio', 'Ghost': 'Fantasma', 'Bat': 'Morcego', 'Boar': 'Javali',
  'Forest': 'Floresta', 'Mountain': 'Montanha', 'Cave': 'Caverna', 'Citadel': 'Cidadela', 'Coast': 'Costa', 'Isle': 'Ilha',
  'Blacksmith': 'Ferreiro', 'Merchant': 'Mercador', 'Guard': 'Guarda', 'Healer': 'Curandeiro', 'Trainer': 'Treinador',
  'System': 'Sistema', 'Too far away.': 'Muito longe.', 'Not enough mana!': 'Mana insuficiente!',
  'Not enough gold.': 'Ouro insuficiente.', 'Inventory full.': 'Inventário cheio.', 'Invalid target.': 'Alvo inválido.',
};

const PT_BR_PATTERNS: Array<[RegExp, string]> = [
  [/^Signed in as (.+)$/i, 'Conectado como $1'],
  [/^Level\s+(\d+)$/i, 'Nível $1'],
  [/^Lv\.?\s*(\d+)$/i, 'Nv. $1'],
  [/^(\d+)\s+gold$/i, '$1 de ouro'],
  [/^Requires level\s+(\d+)$/i, 'Requer nível $1'],
  [/^Cooldown:\s*(.+)$/i, 'Recarga: $1'],
  [/^Range:\s*(.+)$/i, 'Alcance: $1'],
  [/^Damage:\s*(.+)$/i, 'Dano: $1'],
  [/^Defense:\s*(.+)$/i, 'Defesa: $1'],
  [/^Attack:\s*(.+)$/i, 'Ataque: $1'],
  [/^(.+) reached Lv\s*(\d+)$/i, '$1 alcançou Nv. $2'],
  [/^Fill in account name and password\.$/i, 'Preencha o nome da conta e a senha.'],
  [/^Password must be at least (\d+) characters\.$/i, 'A senha deve ter pelo menos $1 caracteres.'],
  [/^New password must be at least (\d+) characters\.$/i, 'A nova senha deve ter pelo menos $1 caracteres.'],
  [/^Character name must be at least (\d+) characters\.$/i, 'O nome do personagem deve ter pelo menos $1 caracteres.'],
  [/^Authenticating with server\.\.\.$/i, 'Autenticando com o servidor...'],
  [/^Creating secure server account\.\.\.$/i, 'Criando conta segura no servidor...'],
  [/^Creating server-owned character\.\.\.$/i, 'Criando personagem controlado pelo servidor...'],
  [/^Verifying recovery code\.\.\.$/i, 'Verificando código de recuperação...'],
  [/^Authentication failed\.$/i, 'Falha na autenticação.'],
  [/^Account creation failed\.$/i, 'Falha ao criar a conta.'],
  [/^Character creation failed\.$/i, 'Falha ao criar o personagem.'],
  [/^Recovery failed\.$/i, 'Falha na recuperação.'],
];

const WORDS: Array<[RegExp,string]> = [
  [/\bWeapon\b/g, 'Arma'], [/\bArmor\b/g, 'Armadura'], [/\bHelmet\b/g, 'Capacete'], [/\bShield\b/g, 'Escudo'],
  [/\bBoots\b/g, 'Botas'], [/\bGloves\b/g, 'Luvas'], [/\bRing\b/g, 'Anel'], [/\bAmulet\b/g, 'Amuleto'], [/\bCloak\b/g, 'Capa'],
  [/\bBelt\b/g, 'Cinto'], [/\bQuest\b/g, 'Missão'], [/\bMonster\b/g, 'Monstro'], [/\bMonsters\b/g, 'Monstros'],
  [/\bItem\b/g, 'Item'], [/\bItems\b/g, 'Itens'], [/\bRecipe\b/g, 'Receita'], [/\bRecipes\b/g, 'Receitas'],
  [/\bProfession\b/g, 'Profissão'], [/\bProfessions\b/g, 'Profissões'], [/\bResources\b/g, 'Recursos'],
  [/\bOwner\b/g, 'Dono'], [/\bPrice\b/g, 'Preço'], [/\bQuantity\b/g, 'Quantidade'], [/\bQuality\b/g, 'Qualidade'],
  [/\bSuccess\b/g, 'Sucesso'], [/\bFailed\b/g, 'Falhou'], [/\bLocked\b/g, 'Bloqueado'], [/\bUnlocked\b/g, 'Desbloqueado'],
];

export function getLocale(): MoriaLocale {
  if (typeof window === 'undefined') return 'pt-BR';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en-US' ? 'en-US' : 'pt-BR';
}

export function setLocale(locale: MoriaLocale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  window.location.reload();
}

function preserveWhitespace(source: string, translated: string) {
  const lead = source.match(/^\s*/)?.[0] || '';
  const tail = source.match(/\s*$/)?.[0] || '';
  return lead + translated + tail;
}

export function translateGameText(value: unknown, locale: MoriaLocale = getLocale()): string {
  const source = String(value ?? '');
  if (!source || locale === 'en-US') return source;
  const core = source.trim();
  if (!core) return source;
  const exact = PT_BR_EXACT[core];
  if (exact) return preserveWhitespace(source, exact);
  for (const [pattern, replacement] of PT_BR_PATTERNS) {
    if (pattern.test(core)) return preserveWhitespace(source, core.replace(pattern, replacement));
  }
  let translated = core;
  for (const [pattern,replacement] of WORDS) translated = translated.replace(pattern,replacement);
  return preserveWhitespace(source, translated);
}

export function t(source: string, vars?: Record<string, string | number>) {
  let text = translateGameText(source);
  if (vars) for (const [key,value] of Object.entries(vars)) text = text.replaceAll(`{${key}}`, String(value));
  return text;
}
'''
write(Path('src/i18n/index.ts'), i18n)

bridge = r'''import { useEffect } from 'react';
import { getLocale, setLocale, translateGameText, type MoriaLocale } from '../i18n';

const ATTRS = ['placeholder','title','aria-label'] as const;

function translateTree(root: Node) {
  if (getLocale() !== 'pt-BR') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(parent.tagName)) continue;
    const next = translateGameText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  if (root instanceof Element) {
    for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
      if (!(el instanceof HTMLElement)) continue;
      for (const attr of ATTRS) {
        const current = el.getAttribute(attr);
        if (!current) continue;
        const next = translateGameText(current);
        if (next !== current) el.setAttribute(attr, next);
      }
    }
  }
}

export default function LocaleBridge() {
  useEffect(() => {
    document.documentElement.lang = getLocale();
    document.documentElement.dataset.moriaLocale = getLocale();
    translateTree(document.body);
    const observer = new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.type === 'characterData') translateTree(entry.target);
        for (const node of Array.from(entry.addedNodes)) translateTree(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

export function LocaleToggle() {
  const locale = getLocale();
  const choose = (next: MoriaLocale) => { if (next !== locale) setLocale(next); };
  return (
    <div className="fixed right-3 top-3 z-[9999] flex rounded-lg border border-amber-200/15 bg-black/65 p-1 text-[9px] font-bold tracking-wider backdrop-blur-md">
      <button onClick={() => choose('pt-BR')} className={`rounded px-2 py-1 ${locale === 'pt-BR' ? 'bg-amber-200/15 text-amber-100' : 'text-slate-400'}`}>PT-BR</button>
      <button onClick={() => choose('en-US')} className={`rounded px-2 py-1 ${locale === 'en-US' ? 'bg-amber-200/15 text-amber-100' : 'text-slate-400'}`}>EN</button>
    </div>
  );
}
'''
write(Path('src/components/LocaleBridge.tsx'), bridge)

app=Path('src/App.tsx').read_text(encoding='utf-8')
app=app.replace("import GlobalTooltipRenderer from './components/Tooltip';", "import GlobalTooltipRenderer from './components/Tooltip';\nimport LocaleBridge, { LocaleToggle } from './components/LocaleBridge';\nimport { t } from './i18n';")
app=app.replace(">VALIDATING MOR'IA SESSION...</div>", ">{t(\"VALIDATING MOR'IA SESSION...\")}</div>")
app=app.replace("<>\n        <LoginScreen", "<>\n        <LocaleBridge />\n        <LocaleToggle />\n        <LoginScreen")
app=app.replace("<>\n      <GameScreen", "<>\n      <LocaleBridge />\n      <GameScreen")
Path('src/App.tsx').write_text(app,encoding='utf-8')

# Character revamp: keep base pixel matrices but add vocation-specific silhouette/equipment identity.
p=Path('src/game/playerAvatar.ts'); s=p.read_text(encoding='utf-8')
insert = r'''

type VocationVisualProfile = {
  family: 'warrior' | 'holy' | 'caster' | 'nature' | 'ranger' | 'rogue' | 'monk' | 'berserker';
  accent: string;
  weapon: 'sword' | 'bow' | 'staff' | 'daggers' | 'mace' | 'axe' | 'fists';
  offhand?: 'shield' | 'orb' | 'totem';
  hood?: boolean;
  helm?: boolean;
  aura?: 'holy' | 'arcane' | 'nature' | 'shadow' | 'death' | 'storm' | 'rage';
};

const VOCATION_VISUALS: Record<string, VocationVisualProfile> = {
  knight: { family:'warrior', accent:'#c8d4df', weapon:'sword', offhand:'shield', helm:true },
  paladin: { family:'holy', accent:'#f1d56e', weapon:'bow', aura:'holy' },
  sorcerer: { family:'caster', accent:'#77baff', weapon:'staff', offhand:'orb', aura:'arcane' },
  druid: { family:'nature', accent:'#8fd769', weapon:'staff', offhand:'orb', aura:'nature' },
  warlock: { family:'caster', accent:'#b56ce3', weapon:'staff', offhand:'orb', hood:true, aura:'shadow' },
  rogue: { family:'rogue', accent:'#a68ad7', weapon:'daggers', hood:true },
  priest: { family:'holy', accent:'#fff0a0', weapon:'mace', offhand:'orb', aura:'holy' },
  deathknight: { family:'warrior', accent:'#a43a45', weapon:'sword', offhand:'shield', helm:true, aura:'death' },
  monk: { family:'monk', accent:'#f0b742', weapon:'fists', aura:'holy' },
  ranger: { family:'ranger', accent:'#7fc56b', weapon:'bow', hood:true, aura:'nature' },
  necromancer: { family:'caster', accent:'#b27be8', weapon:'staff', offhand:'orb', hood:true, aura:'death' },
  berserker: { family:'berserker', accent:'#e66a37', weapon:'axe', aura:'rage' },
  shaman: { family:'nature', accent:'#65cce6', weapon:'staff', offhand:'totem', aura:'storm' },
  templar: { family:'holy', accent:'#f0cf71', weapon:'mace', offhand:'shield', helm:true, aura:'holy' },
};

function vocationProfile(style: string): VocationVisualProfile {
  const key = String(style || '').toLowerCase().replace(/[ _-]/g,'');
  return VOCATION_VISUALS[key] || VOCATION_VISUALS.knight;
}

function drawVocationIdentity(
  ctx: CanvasRenderingContext2D,
  cx: number,
  feetY: number,
  size: number,
  direction: string,
  style: string,
  colors: AvatarColors,
  time: number,
) {
  const profile = vocationProfile(style);
  const cell = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 24));
  const top = Math.round(feetY - 24 * cell);
  const mirror = direction === 'left';
  const side = mirror ? -1 : 1;
  const primary = safeColor(colors.primary, DEFAULT_COLORS.primary);
  const secondary = safeColor(colors.secondary, DEFAULT_COLORS.secondary);
  const accent = profile.accent;
  const pulse = (Math.sin(time / 280) + 1) * .5;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Class silhouette: shoulder mass, cloak/hood and head profile.
  if (profile.helm) {
    ctx.fillStyle = shade(secondary,.62); ctx.fillRect(cx-cell*4, top+cell*2, cell*8, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*2, top+cell, cell*4, cell);
  } else if (profile.hood) {
    ctx.fillStyle = shade(secondary,.56); ctx.fillRect(cx-cell*4, top+cell*2, cell*8, cell*5);
    ctx.fillStyle = shade(primary,.72); ctx.fillRect(cx-cell*3, top+cell*4, cell*6, cell*2);
  }
  if (profile.family === 'berserker') {
    ctx.fillStyle = '#6a4a32'; ctx.fillRect(cx-cell*6, top+cell*9, cell*4, cell*3); ctx.fillRect(cx+cell*2, top+cell*9, cell*4, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*5, top+cell*10, cell*2, cell); ctx.fillRect(cx+cell*3, top+cell*10, cell*2, cell);
  } else if (profile.family === 'holy' || profile.family === 'warrior') {
    ctx.fillStyle = shade(secondary,.68); ctx.fillRect(cx-cell*6, top+cell*10, cell*4, cell*3); ctx.fillRect(cx+cell*2, top+cell*10, cell*4, cell*3);
    ctx.fillStyle = accent; ctx.fillRect(cx-cell*5, top+cell*10, cell*2, cell); ctx.fillRect(cx+cell*3, top+cell*10, cell*2, cell);
  }

  // Weapons/offhands are deliberately pixel-rect based to remain crisp at native scale.
  const handY = top + cell*13;
  const weaponX = cx + side*cell*8;
  ctx.fillStyle = '#2a211a';
  if (profile.weapon === 'sword') {
    ctx.fillRect(weaponX, handY-cell*6, cell, cell*9); ctx.fillStyle='#dce4e8'; ctx.fillRect(weaponX-side*cell, handY-cell*8, cell*2, cell*7); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell*2, handY-cell*2, cell*4, cell);
  } else if (profile.weapon === 'mace') {
    ctx.fillRect(weaponX, handY-cell*5, cell, cell*8); ctx.fillStyle=accent; ctx.fillRect(weaponX-cell*2, handY-cell*7, cell*5, cell*4); ctx.fillStyle='#fff0b0'; ctx.fillRect(weaponX-cell, handY-cell*6, cell*2, cell*2);
  } else if (profile.weapon === 'staff') {
    ctx.fillRect(weaponX, handY-cell*8, cell*2, cell*12); ctx.fillStyle=accent; ctx.fillRect(weaponX-cell, handY-cell*10, cell*4, cell*4); ctx.fillStyle='#eff7ff'; ctx.fillRect(weaponX, handY-cell*9, cell*2, cell*2);
  } else if (profile.weapon === 'bow') {
    ctx.fillStyle='#7b522c'; ctx.fillRect(weaponX, handY-cell*8, cell, cell*11); ctx.fillRect(weaponX+side*cell, handY-cell*8, cell, cell); ctx.fillRect(weaponX+side*cell, handY+cell*2, cell, cell); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell, handY-cell*3, cell*3, cell);
  } else if (profile.weapon === 'daggers') {
    ctx.fillStyle='#e5e6e7'; ctx.fillRect(cx-cell*8, handY-cell*2, cell*5, cell); ctx.fillRect(cx+cell*3, handY-cell*2, cell*5, cell); ctx.fillStyle=accent; ctx.fillRect(cx-cell*4, handY-cell*3, cell, cell*3); ctx.fillRect(cx+cell*3, handY-cell*3, cell, cell*3);
  } else if (profile.weapon === 'axe') {
    ctx.fillStyle='#5a3925'; ctx.fillRect(weaponX, handY-cell*6, cell*2, cell*10); ctx.fillStyle='#c7c5c0'; ctx.fillRect(weaponX-side*cell*4, handY-cell*8, cell*7, cell*4); ctx.fillStyle=accent; ctx.fillRect(weaponX-side*cell*3, handY-cell*7, cell*2, cell*2);
  } else if (profile.weapon === 'fists') {
    ctx.fillStyle=accent; ctx.fillRect(cx-cell*7, handY-cell*2, cell*3, cell*3); ctx.fillRect(cx+cell*4, handY-cell*2, cell*3, cell*3);
  }

  if (profile.offhand === 'shield') {
    const ox = cx - side*cell*8; ctx.fillStyle=shade(secondary,.5); ctx.fillRect(ox-cell*3, handY-cell*5, cell*6, cell*8); ctx.fillStyle=secondary; ctx.fillRect(ox-cell*2, handY-cell*4, cell*4, cell*6); ctx.fillStyle=accent; ctx.fillRect(ox-cell, handY-cell*3, cell*2, cell*4); ctx.fillRect(ox-cell*2, handY-cell*2, cell*4, cell);
  } else if (profile.offhand === 'orb' || profile.offhand === 'totem') {
    const ox = cx-side*cell*7; ctx.fillStyle=accent; ctx.globalAlpha=.72+.20*pulse; ctx.fillRect(ox-cell*2, handY-cell*4, cell*4, cell*4); ctx.fillStyle='#f4fbff'; ctx.fillRect(ox-cell, handY-cell*3, cell*2, cell*2); ctx.globalAlpha=1;
  }

  if (profile.aura) {
    const auraColor = profile.aura === 'nature' ? '#86e56b' : profile.aura === 'holy' ? '#ffe580' : profile.aura === 'storm' ? '#73dfff' : profile.aura === 'rage' ? '#ff6a36' : profile.aura === 'death' ? '#b26ee8' : profile.aura === 'shadow' ? '#8b58bf' : '#69a9ff';
    ctx.fillStyle = auraColor; ctx.globalAlpha = .18 + pulse*.16;
    const y = feetY + cell; for (let i=0;i<4;i++) { const dx=((i*5+Math.floor(time/220))%17)-8; ctx.fillRect(cx+dx*cell, y-(i%2)*cell*2, cell, cell); }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
'''
marker='const DEFAULT_COLORS: AvatarColors = {'
s=s.replace(marker, insert+'\n'+marker,1)
# explicit vocation ID is appended to drawPixelHuman and drawAvatar while preserving backwards compatibility.
s=s.replace("  time: number,\n) {\n  const primary = safeColor(colors.primary", "  time: number,\n  vocationId?: string,\n) {\n  const primary = safeColor(colors.primary",1)
s=s.replace("  const frame = frameForStyle(style);", "  const resolvedStyle = vocationId || style;\n  const frame = frameForStyle(resolvedStyle);")
s=s.replace("  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');", "  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');\n  drawVocationIdentity(ctx, cx, feetY + idle, size, direction, resolvedStyle, colors, time);")
# append vocationId to drawAvatar signature and call into drawPixelHuman.
needle="  nameplate?: AvatarNameplateOptions | null,\n) {"
if needle not in s: raise SystemExit('drawAvatar signature marker missing')
s=s.replace(needle,"  nameplate?: AvatarNameplateOptions | null,\n  vocationId?: string,\n) {",1)
# locate call by permissive substitution.
s=re.sub(r"drawPixelHuman\(ctx, cx, ([^;]+?), time\);", lambda m: m.group(0)[:-2]+", vocationId);", s, count=1)
p.write_text(s,encoding='utf-8')

# Render pipeline accepts a vocation ID without changing existing callers.
p=Path('src/game/render.ts'); s=p.read_text(encoding='utf-8')
needle="  nameplate?: AvatarNameplateOptions | null,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana, nameplate);"
if needle not in s: raise SystemExit('render drawPlayer marker missing')
s=s.replace(needle,"  nameplate?: AvatarNameplateOptions | null,\n  vocationId?: string,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana, nameplate, vocationId);",1)
# Canvas-visible NPC/monster data passes through presentation localization where possible.
s=s.replace("import { drawAvatar, type AvatarAppearance, type AvatarMount, type AvatarNameplateOptions } from './playerAvatar';", "import { drawAvatar, type AvatarAppearance, type AvatarMount, type AvatarNameplateOptions } from './playerAvatar';\nimport { translateGameText } from '../i18n';")
s=s.replace("  drawClassicMonsterSprite(ctx, cx, cy, entitySize, monster, time);", "  drawClassicMonsterSprite(ctx, cx, cy, entitySize, { ...monster, name: translateGameText(monster.name) }, time);")
s=s.replace("  drawClassicNpcSprite(ctx, cx, cy, size, npc, time);", "  drawClassicNpcSprite(ctx, cx, cy, size, { ...npc, name: translateGameText(npc.name), role: translateGameText(npc.role) }, time);")
p.write_text(s,encoding='utf-8')

# Pass vocation into the existing drawPlayer call. The last argument is the nameplate object.
p=Path('src/components/GameScreen.tsx'); s=p.read_text(encoding='utf-8')
# find a multiline drawPlayer(...) statement containing p.vocation color and nameplate; insert p.vocation before close when unique.
pattern=re.compile(r"drawPlayer\((.*?)\);", re.S)
changed=False
parts=[]; last=0
for m in pattern.finditer(s):
    body=m.group(1)
    if not changed and ('p.name' in body or 'p.characterName' in body) and 'vocation' in body and 'nameplate' in body:
        newbody=body.rstrip()+",\n        p.vocation"
        parts.append(s[last:m.start()]+"drawPlayer("+newbody+");")
        last=m.end(); changed=True
if changed:
    parts.append(s[last:]); s=''.join(parts)
else:
    # fallback: append vocation to the first playerRef rendering call identified by drawPlayer and VOCATIONS.
    idx=s.find('drawPlayer(')
    if idx<0: raise SystemExit('GameScreen drawPlayer call not found')
    end=s.find(');',idx)
    body=s[idx+len('drawPlayer('):end]
    s=s[:end]+", p.vocation"+s[end:]
Path('src/components/GameScreen.tsx').write_text(s,encoding='utf-8')

# Version bump.
for rel in ['package.json','server/package.json']:
    p=Path(rel); obj=json.loads(p.read_text(encoding='utf-8')); obj['version']='9.28.0'; p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Lockfiles carry a root package version in this project.
for rel in ['package-lock.json','server/package-lock.json']:
    p=Path(rel); obj=json.loads(p.read_text(encoding='utf-8')); obj['version']='9.28.0';
    if isinstance(obj.get('packages'),dict) and '' in obj['packages']: obj['packages']['']['version']='9.28.0'
    p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Regression contract for 9.28.
test = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('9.28 ships pt-BR as default locale with canonical English fallback', () => {
  const src = read('src/i18n/index.ts');
  assert.match(src, /export type MoriaLocale = 'pt-BR' \| 'en-US'/);
  assert.match(src, /return stored === 'en-US' \? 'en-US' : 'pt-BR'/);
  assert.match(src, /INVENTÁRIO/);
  assert.match(src, /PAINEL ADMINISTRATIVO/);
});

test('9.28 legacy localization bridge covers text and accessibility attributes', () => {
  const src = read('src/components/LocaleBridge.tsx');
  assert.match(src, /MutationObserver/);
  assert.match(src, /placeholder/);
  assert.match(src, /aria-label/);
  assert.match(src, /document\.documentElement\.lang/);
});

test('9.28 class visuals explicitly cover all fourteen vocations', () => {
  const src = read('src/game/playerAvatar.ts');
  for (const id of ['knight','paladin','sorcerer','druid','warlock','rogue','priest','deathknight','monk','ranger','necromancer','berserker','shaman','templar']) {
    assert.match(src, new RegExp(`${id}: \\{`));
  }
  assert.match(src, /drawVocationIdentity/);
  assert.match(src, /weapon:'axe'/);
  assert.match(src, /weapon:'daggers'/);
  assert.match(src, /weapon:'bow'/);
});

test('9.28 keeps the historical pixel sprite scale contract', () => {
  const src = read('src/game/playerAvatar.ts');
  assert.match(src, /PIXEL_SPRITE_SCALE = 1\.30/);
});

test('9.28 localizes canvas-facing monster and npc presentation without changing IDs', () => {
  const src = read('src/game/render.ts');
  assert.match(src, /translateGameText\(monster\.name\)/);
  assert.match(src, /translateGameText\(npc\.name\)/);
  assert.doesNotMatch(src, /monster\.id\s*=\s*translateGameText/);
});
'''
write(Path('server/test/i18n-character-9-28.test.mjs'),test)

print('Mor\'ia 9.28 character + PT-BR migration applied')
