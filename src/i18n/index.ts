// Mor'ia 9.28 — internationalization foundation.
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
  if (vars) for (const [key,value] of Object.entries(vars)) text = text.split(`{${key}}`).join(String(value));
  return text;
}
