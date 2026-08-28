from pathlib import Path
import json

BRANCH_CATALOG = Path('src/i18n/pt-BR.928.json')

missing = {
    'Inventory':'Inventário',
    'DECOR SHOP · place at your current tile inside the house':'LOJA DE DECORAÇÃO · posicione no seu tile atual dentro da casa',
    'Claim Node':'Reivindicar Node',
    'REAL EVENTS FROM THIS SERVER':'EVENTOS REAIS DESTE SERVIDOR',
    'Creatures in this habitat':'Criaturas neste habitat',
    'Save your recovery code':'Salve seu código de recuperação',
    'Create your character':'Crie seu personagem',
    'CHARACTER NAME':'NOME DO PERSONAGEM',
    'ACCOUNT NAME':'NOME DA CONTA',
    'NEW PASSWORD':'NOVA SENHA',
    'Clue / Lore (shown to player)':'Pista / Lore (exibida ao jogador)',
    '🔗 ONE WORLD STATE':'🔗 UM ÚNICO ESTADO DE MUNDO',
    'Create party':'Criar grupo',
    'Create guild · 1000g · Lv10+':'Criar guilda · 1000g · Nv.10+',
    'XP Reward:':'Recompensa de XP:',
    'Deal 5000 damage':'Cause 5000 de dano',
    'Enter a world built for':'Entre em um mundo feito de',
    'danger':'perigo',
    ', mastery and legend.':', domínio e lenda.',
    "Mor'ia blends old-school MMO tension with a modern authoritative server, living progression and a world that grows with its players.":"Mor'ia combina a tensão dos MMOs clássicos com um servidor autoritativo moderno, progressão viva e um mundo que cresce com seus jogadores.",
    'Persistent online realm':'Mundo online persistente',
    'Authoritative':'Autoritativo',
    'Persistent':'Persistente',
    'Evolving':'Em evolução',
    'Characters & quests':'Personagens e missões',
    'LOGIN':'ENTRAR',
    'REGISTER':'CADASTRAR',
    'RECOVER':'RECUPERAR',
    'VOCATION':'VOCAÇÃO',
    'SELECTED':'SELECIONADO',
    'CHOOSE':'ESCOLHER',
    'RECOVERY CODE':'CÓDIGO DE RECUPERAÇÃO',
    'PASSWORD':'SENHA',
    "ENTER MOR'IA":"ENTRAR EM MOR'IA",
    'CREATE ACCOUNT':'CRIAR CONTA',
    'RESET PASSWORD':'REDEFINIR SENHA',
    'CREATE HERO':'CRIAR HERÓI',
    '▶ OFFLINE QUICK PLAY':'▶ JOGO RÁPIDO OFFLINE',
    'This code is shown once. Store it somewhere private: anyone holding it can recover the account.':'Este código é exibido uma única vez. Guarde-o em um local privado: qualquer pessoa que o possua poderá recuperar a conta.',
    'I SAVED IT — CONTINUE':'SALVEI O CÓDIGO — CONTINUAR',
    'Passwords are hashed server-side and never stored in browser account lists.':'As senhas são protegidas no servidor e nunca são armazenadas em listas de contas do navegador.',
    'Signed in as ':'Conectado como ',
}

catalog=json.loads(BRANCH_CATALOG.read_text(encoding='utf-8'))
catalog.update(missing)
BRANCH_CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')

index=Path('src/i18n/index.ts')
s=index.read_text(encoding='utf-8')
if "import PT_BR_RELEASE_928 from './pt-BR.928.json';" not in s:
    s="import PT_BR_RELEASE_928 from './pt-BR.928.json';\n"+s
old="  const exact = PT_BR_EXACT[core];"
new="  const exact = (PT_BR_RELEASE_928 as Record<string, string>)[core] ?? PT_BR_EXACT[core];"
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit('index.ts exact-lookup anchor not found')
index.write_text(s,encoding='utf-8')

login=Path('src/components/LoginScreen.tsx')
s=login.read_text(encoding='utf-8')
repls={
    '<div className="moria-eyebrow mb-1">Account recovery</div>':'<div className="moria-eyebrow mb-1">{tr(\'Account recovery\')}</div>',
    '<h2 className="moria-title text-2xl font-bold">Save your recovery code</h2>':'<h2 className="moria-title text-2xl font-bold">{tr(\'Save your recovery code\')}</h2>',
    '            This code is shown once. Store it somewhere private: anyone holding it can recover the account.':'            {tr(\'This code is shown once. Store it somewhere private: anyone holding it can recover the account.\')}',
    '            I SAVED IT — CONTINUE':'            {tr(\'I SAVED IT — CONTINUE\')}',
    '<div className="moria-eyebrow mb-5">Persistent online realm</div>':'<div className="moria-eyebrow mb-5">{tr(\'Persistent online realm\')}</div>',
    '            Enter a world built for <span className="text-amber-200">danger</span>, mastery and legend.':'            {tr(\'Enter a world built for\')} <span className="text-amber-200">{tr(\'danger\')}</span>{tr(\', mastery and legend.\')}',
    "            Mor'ia blends old-school MMO tension with a modern authoritative server, living progression and a world that grows with its players.":"            {tr(\"Mor'ia blends old-school MMO tension with a modern authoritative server, living progression and a world that grows with its players.\")}",
    '<p className="moria-eyebrow">Realm of Shadows</p>':'<p className="moria-eyebrow">{tr(\'Realm of Shadows\')}</p>',
    '<p className="mt-2 text-[11px] tracking-[0.16em] text-slate-400">SECURE ACCOUNT · AUTHORITATIVE WORLD</p>':'<p className="mt-2 text-[11px] tracking-[0.16em] text-slate-400">{tr(\'SECURE ACCOUNT · AUTHORITATIVE WORLD\')}</p>',
    '<div className="moria-eyebrow">New adventurer</div>':'<div className="moria-eyebrow">{tr(\'New adventurer\')}</div>',
    '<h2 className="moria-title mt-1 text-2xl font-bold">Create your character</h2>':'<h2 className="moria-title mt-1 text-2xl font-bold">{tr(\'Create your character\')}</h2>',
    '<p className="mt-1 text-xs text-slate-400">Signed in as {serverAccount?.username}</p>':'<p className="mt-1 text-xs text-slate-400">{tr(\'Signed in as \')}{serverAccount?.username}</p>',
    '<label className="mb-2 block text-[10px] font-bold tracking-[0.18em] text-slate-400">VOCATION</label>':'<label className="mb-2 block text-[10px] font-bold tracking-[0.18em] text-slate-400">{tr(\'VOCATION\')}</label>',
    '<span className="mr-1.5">⚠</span>{error}':'<span className="mr-1.5">⚠</span>{tr(error)}',
    '<span className="mr-1.5 inline-block moria-soft-pulse">✦</span>{status}':'<span className="mr-1.5 inline-block moria-soft-pulse">✦</span>{tr(status)}',
    "            {mode === 'login' ? 'ENTER MOR\\'IA' : mode === 'create' ? 'CREATE ACCOUNT' : mode === 'recover' ? 'RESET PASSWORD' : 'CREATE HERO'}":"            {tr(mode === 'login' ? \"ENTER MOR'IA\" : mode === 'create' ? 'CREATE ACCOUNT' : mode === 'recover' ? 'RESET PASSWORD' : 'CREATE HERO')}",
    '              ▶ OFFLINE QUICK PLAY':'              {tr(\'▶ OFFLINE QUICK PLAY\')}',
    '            Passwords are hashed server-side and never stored in browser account lists.':'            {tr(\'Passwords are hashed server-side and never stored in browser account lists.\')}',
    '<div className="mt-2 text-xs font-bold text-slate-100">{title}</div>':'<div className="mt-2 text-xs font-bold text-slate-100">{tr(title)}</div>',
    '<div className="mt-1 text-[10px] leading-4 text-slate-400">{subtitle}</div>':'<div className="mt-1 text-[10px] leading-4 text-slate-400">{tr(subtitle)}</div>',
    '      {children}\n    </button>':'      {typeof children === \'string\' ? tr(children) : children}\n    </button>',
    '<label className="mb-1.5 block text-[10px] font-bold tracking-[0.18em] text-slate-400">{label}</label>':'<label className="mb-1.5 block text-[10px] font-bold tracking-[0.18em] text-slate-400">{tr(label)}</label>',
}
for old,new in repls.items():
    if old in s:
        s=s.replace(old,new,1)
    elif new not in s:
        raise SystemExit(f'LoginScreen anchor missing: {old[:80]}')
login.write_text(s,encoding='utf-8')

# Branded Road-to-10 names intentionally remain unchanged in both locales.
audit=Path('tools/audit-moria-9-28-i18n.py')
s=audit.read_text(encoding='utf-8')
anchor="    'ROAD TO 10 · 9.26',\n}"
replacement="    'ROAD TO 10 · 9.26',\n    '✦ Road to 10 · 9.26',\n}"
if anchor in s:
    s=s.replace(anchor,replacement,1)
elif "    '✦ Road to 10 · 9.26'," not in s:
    raise SystemExit('audit unchanged allowlist anchor missing')
audit.write_text(s,encoding='utf-8')

print('Mor\'ia 9.28 PT-BR runtime integration applied')
