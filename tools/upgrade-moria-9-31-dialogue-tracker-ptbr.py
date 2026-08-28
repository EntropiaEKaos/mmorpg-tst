from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    # Dialog shell and NPC roles
    'Close dialogue': 'Fechar diálogo',
    'Wanderer': 'Andarilho',
    'merchant': 'mercador',
    'banker': 'banqueiro',
    'innkeeper': 'estalajadeiro',
    'quest': 'missão',
    'trainer': 'treinador',
    'guard': 'guarda',
    'Quest ready': 'Missão pronta',
    'Reward': 'Recompensa',
    'gold': 'ouro',
    'Active quest': 'Missão ativa',
    'Merchant stock': 'Estoque do mercador',
    'ACTIVE QUESTS': 'MISSÕES ATIVAS',

    # NPC names/titles shown to the player
    'Banker Elric': 'Banqueiro Elric',
    'Captain Thane': 'Capitão Thane',
    'Wizard Merlyn': 'Mago Merlyn',
    'Master Kai': 'Mestre Kai',
    'Town Guard': 'Guarda da Cidade',
    'Brother Aldric': 'Irmão Aldric',
    'Priestess Lyra': 'Sacerdotisa Lyra',
    'Postmaster Edwin': 'Mestre dos Correios Edwin',
    'Sage Eleanor': 'Sábia Eleanor',
    'Gate Guard Marcus': 'Guarda do Portão Marcus',

    # NPC dialogue and options
    'Farewell.': 'Adeus.',
    'Welcome to my shop, traveler! What would you like to buy?': 'Bem-vindo à minha loja, viajante! O que gostaria de comprar?',
    'Show me your wares.': 'Mostre-me suas mercadorias.',
    'Welcome to the bank. Your gold is safe here.': 'Bem-vindo ao banco. Seu ouro está seguro aqui.',
    'Deposit all gold': 'Depositar todo o ouro',
    'Welcome to the inn! Rest here to fully recover (50 gold).': 'Bem-vindo à estalagem! Descanse aqui para se recuperar totalmente (50 de ouro).',
    'Rest here (50 gold)': 'Descansar aqui (50 de ouro)',
    'Hero! The town is infested with rats. Will you help us?': 'Herói! A cidade está infestada de ratos. Você vai nos ajudar?',
    'I will help! (Accept quest)': 'Eu ajudarei! (Aceitar missão)',
    'Not now.': 'Agora não.',
    'Young adventurer, the orcs in the south are growing bold. Prove your strength!': 'Jovem aventureiro, os orcs do sul estão cada vez mais ousados. Prove sua força!',
    'I will slay them! (Accept quest)': 'Eu os derrotarei! (Aceitar missão)',
    'Maybe later.': 'Talvez mais tarde.',
    'Train with me to enhance your skills! (Free every 5 levels)': 'Treine comigo para aprimorar suas habilidades! (Grátis a cada 5 níveis)',
    'Train me! (200 gold)': 'Treine-me! (200 de ouro)',
    'Keep safe, adventurer. Watch out for monsters outside the walls.': 'Mantenha-se seguro, aventureiro. Cuidado com os monstros fora das muralhas.',
    'Thank you.': 'Obrigado.',
    'The forge burns hot! Need steel and armor, traveler?': 'A forja arde intensamente! Precisa de aço e armadura, viajante?',
    'The graveyard is restless, child. Undead walk where they should sleep. Will you cleanse them?': 'O cemitério está inquieto, criança. Mortos-vivos caminham onde deveriam repousar. Você os purificará?',
    'I shall cleanse the undead. (Accept)': 'Purificarei os mortos-vivos. (Aceitar)',
    'I must prepare first.': 'Preciso me preparar primeiro.',
    'May the light guide you. Rest here to restore body and soul (50 gold).': 'Que a luz guie você. Descanse aqui para restaurar corpo e alma (50 de ouro).',
    "Welcome to the Mor'ia Post! I handle all mail and parcels. Check your inbox anytime via the Mail button.": "Bem-vindo aos Correios de Mor'ia! Eu cuido de todas as cartas e encomendas. Consulte sua caixa de entrada a qualquer momento pelo botão Correio.",
    'Open my mailbox': 'Abrir minha caixa de correio',
    'Knowledge is power, traveler. Visit the Library to read ancient tomes and uncover lore.': 'Conhecimento é poder, viajante. Visite a Biblioteca para ler tomos antigos e descobrir histórias esquecidas.',
    'Open the Library': 'Abrir a Biblioteca',
    'The roads beyond the walls are dangerous. Dragons lurk in the southeast, and demons in the south.': 'As estradas além das muralhas são perigosas. Dragões espreitam a sudeste e demônios ao sul.',
    'Understood.': 'Entendido.',
    'Potions, reagents, and curiosities... step into my tent, brave one.': 'Poções, reagentes e curiosidades... entre em minha tenda, valente.',

    # Merchant item surface
    'Steel Sword': 'Espada de Aço',
    'Iron Helmet': 'Elmo de Ferro',
    'Leather Armor': 'Armadura de Couro',
    'Health Potion': 'Poção de Vida',
    'Mana Potion': 'Poção de Mana',
    'Greater Health Potion': 'Poção Superior de Vida',
    'Fishing Rod': 'Vara de Pesca',
    'Restores 50 HP': 'Restaura 50 de Vida',
    'Restores 50 Mana': 'Restaura 50 de Mana',
    'Restores 200 HP': 'Restaura 200 de Vida',
    'For catching fish': 'Usada para pescar',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            print(f'optional anchor not found in {path}: {old[:100]}')
    p.write_text(text, encoding='utf-8')


patch('src/components/DialogBox.tsx', [
    ("import { QUESTS } from '../game/quests';", "import { QUESTS } from '../game/quests';\nimport { t as tr } from '../i18n';"),
    ('aria-label="Close dialogue"', "aria-label={tr('Close dialogue')}"),
    (">{npc.role || 'Wanderer'}</div>", ">{tr(npc.role || 'Wanderer')}</div>"),
    ('>{npc.name}</h2>', '>{tr(npc.name)}</h2>'),
    ('</span>{dialogue.text}<span', '</span>{tr(dialogue.text)}<span'),
    ('<div className="moria-eyebrow mb-1">Quest ready</div>', '<div className="moria-eyebrow mb-1">{tr(\'Quest ready\')}</div>'),
    ('>{quest.name}</div>', '>{tr(quest.name)}</div>'),
    ('>Reward · {quest.rewards.xp} XP · {quest.rewards.gold} gold</div>', ">{tr('Reward')} · {quest.rewards.xp} XP · {quest.rewards.gold} {tr('gold')}</div>"),
    ('>Active quest · {quest.name}</div>', ">{tr('Active quest')} · {tr(quest.name)}</div>"),
    ("{o.current >= o.count ? '✓' : '○'} {o.targetName}", "{o.current >= o.count ? '✓' : '○'} {tr(o.targetName)}"),
    ('>{opt.text}</span>', '>{tr(opt.text)}</span>'),
    ('<div className="moria-eyebrow mb-2">Merchant stock</div>', '<div className="moria-eyebrow mb-2">{tr(\'Merchant stock\')}</div>'),
    ('>{item.name}</div>', '>{tr(item.name)}</div>'),
])

patch('src/components/ActiveQuestTracker.tsx', [
    ("import type { ActiveQuest, Quest } from '../game/types';", "import type { ActiveQuest, Quest } from '../game/types';\nimport { t as tr } from '../i18n';"),
    ('>📜 ACTIVE QUESTS</div>', ">📜 {tr('ACTIVE QUESTS')}</div>"),
    ('>{quest.name}</div>', '>{tr(quest.name)}</div>'),
    ("{objective.current >= objective.count ? '✅' : '○'} {objective.targetName}: {objective.current}/{objective.count}", "{objective.current >= objective.count ? '✅' : '○'} {tr(objective.targetName)}: {objective.current}/{objective.count}"),
])

print("Mor'ia 9.31 dialogue + quest tracker PT-BR upgrade applied")
