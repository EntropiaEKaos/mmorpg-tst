from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')

catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    'Signed in as': 'Conectado como',
    'Chat': 'Bate-papo',
    'ALL': 'TODOS', 'WORLD': 'MUNDO', 'SAY': 'FALAR', 'PARTY': 'GRUPO', 'GUILD': 'GUILDA',
    'TRADE': 'COMÉRCIO', 'BATTLE': 'BATALHA', 'LOOT': 'SAQUE', 'QUEST': 'MISSÃO', 'SYSTEM': 'SISTEMA',
    'SEND': 'ENVIAR', 'Collapse chat': 'Recolher bate-papo', 'Expand chat': 'Expandir bate-papo',
    'Message world...': 'Mensagem no mundo...', 'Message say...': 'Mensagem local...', 'Message party...': 'Mensagem no grupo...',
    'Message guild...': 'Mensagem na guilda...', 'Message trade...': 'Mensagem no comércio...',
    'Minimap': 'Minimapa', 'Spellbook': 'Livro de Magias', 'Nearby Threats': 'Ameaças Próximas',
    'Active Effects': 'Efeitos Ativos', 'ACTION BAR': 'BARRA DE AÇÕES', 'Action Bar': 'Barra de Ações',
    'Gold': 'Ouro', 'GOLD': 'OURO', 'Coins': 'Moedas', 'COINS': 'MOEDAS',
    'Dungeon': 'Masmorra', 'DUNGEON': 'MASMORRA', 'Mystery': 'Mistérios', 'Books': 'Livros',
    'Hunts': 'Caçadas', 'Char': 'Herói', 'Talents': 'Talentos', 'Pet': 'Companheiro', 'Companions': 'Companheiros',
    'AH': 'Leilões', 'Mail': 'Correio', 'Inv': 'Invent.', 'Hub': 'Central', 'Life': 'Vida', 'Mount': 'Montaria',
    'Debug': 'Depuração', 'Offline Debug Admin (Ctrl+Shift+A)': 'Admin de depuração offline (Ctrl+Shift+A)',
    'ITEMS': 'ITENS', 'CRAFTING': 'ARTESANATO', 'SOCKET': 'ENCAIXE', 'GEM SOCKETING': 'ENCAIXE DE GEMAS',
    'CRAFTING RECIPES': 'RECEITAS DE ARTESANATO', 'Close inventory': 'Fechar inventário',
    'No gems found! Defeat elite/boss monsters to obtain gems.': 'Nenhuma gema encontrada! Derrote monstros elite ou chefes para obter gemas.',
    'Select an item to socket:': 'Selecione um item para encaixar a gema:', 'Choose a gem to socket:': 'Escolha uma gema para encaixar:',
    'sockets filled': 'encaixes preenchidos', 'MERCHANT': 'MERCADOR', 'SHOP': 'LOJA',
    'Drop here to throw on ground': 'Solte aqui para jogar no chão', '(drag an item here)': '(arraste um item para cá)',
    'Click potions to use · Click equipment to equip · Drag to move/drop': 'Clique em poções para usar · Clique em equipamentos para equipar · Arraste para mover/soltar',
    'Rarity:': 'Raridade:', 'WARNING': 'ALERTA', 'WORLD EVENT': 'EVENTO MUNDIAL', 'World Event!': 'Evento Mundial!',
    'WORLD EVENTS': 'EVENTOS MUNDIAIS',
    'Global missions shared by all adventurers. Contribute to earn rewards!': 'Missões globais compartilhadas por todos os aventureiros. Contribua para ganhar recompensas!',
    'No active world events. Check back later or ask an admin to create one!': 'Nenhum evento mundial ativo. Volte mais tarde ou peça a um admin para criar um!',
    'Progress:': 'Progresso:', 'Your contribution:': 'Sua contribuição:', 'Kill target monsters to contribute!': 'Elimine os monstros-alvo para contribuir!',
    'Contribute': 'Contribuir', 'RECENTLY COMPLETED': 'CONCLUÍDOS RECENTEMENTE', 'Completed': 'Concluído',
    'Dragon Invasion': 'Invasão de Dragão', 'Rat Plague': 'Praga de Ratos', 'Skeleton Uprising': 'Levante dos Esqueletos', 'Demon Bounty': 'Recompensa por Demônios',
    'A Dragon Lord terrorizes the Voidlands! Slay it for glory.': 'Um Senhor Dragão aterroriza as Terras do Vazio! Derrote-o pela glória.',
    'Rats are invading Eldoria! Clear 20 of them.': 'Ratos estão invadindo Eldoria! Elimine 20 deles.',
    'The undead rise in Shadowfen. Destroy 15 skeletons.': 'Os mortos-vivos se erguem em Shadowfen. Destrua 15 esqueletos.',
    'A bounty has been placed on 5 Demons in Emberhold.': 'Há uma recompensa por 5 Demônios em Emberhold.',
    'Plague Rat': 'Rato da Praga', 'Skeleton Warrior': 'Guerreiro Esqueleto', 'Dragon Lord': 'Senhor Dragão',
    'Berserk': 'Fúria', 'Wound Heal': 'Cura de Feridas', 'Fierce Berserk': 'Fúria Implacável', 'Magic Shield': 'Escudo Mágico',
    'Health Potion': 'Poção de Vida', 'Mana Potion': 'Poção de Mana', 'Greater Health Potion': 'Poção Maior de Vida',
    'Restores 50 HP': 'Restaura 50 de Vida', 'Restores 50 Mana': 'Restaura 50 de Mana', 'Restores 200 HP': 'Restaura 200 de Vida',
    'VERDANT FRONTIER': 'FRONTEIRA VERDEJANTE', 'Temple of Dawn': 'Templo da Aurora', 'Royal Depot': 'Depósito Real', 'Grand Market': 'Grande Mercado',
    "Welcome to Mor'ia, Hero!": "Bem-vindo a Mor'ia, Herói!",
    '🟡 Local multiplayer active — other browser tabs can join your world!': '🟡 Multijogador local ativo — outras abas do navegador podem entrar no seu mundo!',
    '🌍 WORLD EVENT: 🐀 Rat Plague! Rats are invading Eldoria! Clear 20 of them.': '🌍 EVENTO MUNDIAL: 🐀 Praga de Ratos! Ratos estão invadindo Eldoria! Elimine 20 deles.',
    '🌍 WORLD EVENT: 🐉 Dragon Invasion! A Dragon Lord terrorizes the Voidlands! Slay it for glory.': '🌍 EVENTO MUNDIAL: 🐉 Invasão de Dragão! Um Senhor Dragão aterroriza as Terras do Vazio! Derrote-o pela glória.',
    '🌍 WORLD EVENT: 💀 Skeleton Uprising! The undead rise in Shadowfen. Destroy 15 skeletons.': '🌍 EVENTO MUNDIAL: 💀 Levante dos Esqueletos! Os mortos-vivos se erguem em Shadowfen. Destrua 15 esqueletos.',
    '🌍 WORLD EVENT: 😈 Demon Bounty! A bounty has been placed on 5 Demons in Emberhold.': '🌍 EVENTO MUNDIAL: 😈 Recompensa por Demônios! Há uma recompensa por 5 Demônios em Emberhold.',
    'WTS Excalibur 7k gold, pm me': 'Vendo Excalibur por 7k de ouro, mande PM',
    'Anyone doing the Dragon Invasion?': 'Alguém vai fazer a Invasão de Dragão?', 'LFG dungeon, need tank': 'Procuro grupo para masmorra, precisa de tanque',
    'Selling Greater Health Potions cheap in town': 'Vendendo Poções Maiores de Vida barato na cidade', 'gg easy boss kill': 'gg, chefe fácil',
    'How do I get to Frostpeak?': 'Como chego a Frostpeak?', 'Level 30 finally! 🎉': 'Finalmente nível 30! 🎉',
    'Watch out for the Orc King, he hits hard': 'Cuidado com o Rei Orc, ele bate forte', 'Buying Dragon Scales, paying well': 'Compro Escamas de Dragão, pago bem',
    'RIP my amulet of loss 💀': 'RIP meu amuleto da perda 💀',
    '🔊 Audio active! WASD/Arrows: move · Click monsters: attack · 1-4: spells · I: inventory · C: character': '🔊 Áudio ativo! WASD/Setas: mover · Clique nos monstros: atacar · 1-4: magias · I: inventário · C: personagem',
    'Talk to NPCs (walk up + press E) for quests, shops, and services!': 'Fale com NPCs (aproxime-se + pressione E) para missões, lojas e serviços!',
    '🧟 Killed monsters leave corpses! Walk over or click them to collect loot (Tibia-style).': '🧟 Monstros derrotados deixam corpos! Passe por cima ou clique neles para coletar o saque (estilo Tibia).',
    '🌀 Find glowing portals to travel between cities: Eldoria, Frostpeak, Shadowfen, Emberhold, Voidlands!': '🌀 Encontre portais brilhantes para viajar entre cidades: Eldoria, Frostpeak, Shadowfen, Emberhold e Voidlands!',
    '✦ Open Mystery Quests (top bar) to solve riddles and uncover hidden stories!': '✦ Abra Missões de Mistério (barra superior) para resolver enigmas e descobrir histórias ocultas!',
    '🗄 Talk to the Banker or use the Depot button to safely store items (never lost on death)!': '🗄 Fale com o Banqueiro ou use o botão Depósito para guardar itens com segurança (nunca perdidos ao morrer)!',
    '📮 Visit the Postmaster for mail! Books at the Library. Use + / − keys or bottom-right buttons to zoom.': '📮 Visite o Carteiro para ver o correio! Livros ficam na Biblioteca. Use + / − ou os botões inferiores direitos para aplicar zoom.',
    '⚙ Customize your UI panel order with the UI button in the top bar!': '⚙ Personalize a ordem dos painéis com o botão UI na barra superior!',
    '🔒 Spells, items, and regions unlock by level! Watch for 🔴 red portals (locked zones) and 🔒 spells. Level up to unlock more!': '🔒 Magias, itens e regiões são liberados por nível! Observe portais 🔴 vermelhos (zonas bloqueadas) e magias 🔒. Suba de nível para liberar mais!',
    '🏛 Visit the Auction House (top bar) to buy/sell items! Drag items in your inventory to drop them on the ground.': '🏛 Visite a Casa de Leilões (barra superior) para comprar/vender itens! Arraste itens do inventário para soltá-los no chão.',
    '⚔ Enable PvP (top-right) for skull system like Tibia. Aggression raises your skull: White→Yellow→Orange→Red→Black.': '⚔ Ative o PvP (canto superior direito) para o sistema de caveiras estilo Tibia. A agressão aumenta sua caveira: Branca→Amarela→Laranja→Vermelha→Preta.',
    '💎 Earn Moria Coins from hunts, dungeons, events and achievements, then spend them in the official Coin Shop.': '💎 Ganhe Moedas de Mor\'ia em caçadas, masmorras, eventos e conquistas e gaste-as na Loja de Moedas oficial.',
    '🌍 World Events happen automatically! Check the World button to join global missions for big rewards.': '🌍 Eventos Mundiais acontecem automaticamente! Use o botão Mundo para participar de missões globais com grandes recompensas.',
    '✨ Other adventurers roam the world. Loot is auto-collected when you walk near corpses!': '✨ Outros aventureiros percorrem o mundo. O saque é coletado automaticamente quando você passa perto dos corpos!',
    'Total damage potential. Includes base + equipment bonuses.': 'Potencial total de dano. Inclui base + bônus de equipamento.',
    'Reduces incoming physical damage.': 'Reduz o dano físico recebido.', 'Equipment': 'Equipamento', 'Crit Chance': 'Chance de Crítico',
    'Dmg Reduction': 'Redução de Dano', 'Armor': 'Armadura', 'Lifesteal': 'Roubo de Vida',
    'Drag to move · double-click to reset': 'Arraste para mover · clique duas vezes para restaurar', 'Reset panel position': 'Restaurar posição do painel',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path, replacements):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new, 1)
        elif new not in text:
            raise SystemExit(f'{path}: missing anchor: {old[:100]}')
    p.write_text(text, encoding='utf-8')

# Login: eliminate a trailing-space key mismatch and allow long PT-BR vocation names to wrap.
patch('src/components/LoginScreen.tsx', [
    ("{tr('Signed in as ')}{serverAccount?.username}", "{tr('Signed in as')} {serverAccount?.username}"),
    ("<div className={`truncate text-xs font-bold ${active ? 'text-amber-100' : 'text-slate-200'}`}>{tr(v.name)}</div>",
     "<div className={`text-[11px] font-bold leading-tight ${active ? 'text-amber-100' : 'text-slate-200'}`}>{tr(v.name)}</div>"),
])

# All movable HUD titles are localized at render time, avoiding MutationObserver races on fast rerenders.
patch('src/components/MovableHudWindow.tsx', [
    ("import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';",
     "import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';\nimport { t as tr } from '../i18n';"),
    ('title="Drag to move · double-click to reset"', "title={tr('Drag to move · double-click to reset')}"),
    ('>{title}</span>', '>{tr(title)}</span>'),
    ('title="Reset panel position"', "title={tr('Reset panel position')}"),
])

# Chat: translate presentation labels/messages while channel IDs remain canonical English protocol values.
patch('src/components/Chat.tsx', [
    ("import MovableHudWindow from './MovableHudWindow';", "import MovableHudWindow from './MovableHudWindow';\nimport { t as tr } from '../i18n';"),
    ("type Filter = 'all' | ChatMessage['channel'];", "type Filter = 'all' | ChatMessage['channel'];\n\nconst CHANNEL_LABELS: Record<string, string> = { all:'TODOS', world:'MUNDO', say:'FALAR', party:'GRUPO', guild:'GUILDA', trade:'COMÉRCIO', battle:'BATALHA', loot:'SAQUE', quest:'MISSÃO', system:'SISTEMA' };"),
    ('title="Chat"', "title={tr('Chat')}"),
    ("{t === 'all' ? 'ALL' : t.toUpperCase()}</button>", "{CHANNEL_LABELS[t] || tr(t.toUpperCase())}</button>"),
    ("title={expanded ? 'Collapse chat' : 'Expand chat'}", "title={tr(expanded ? 'Collapse chat' : 'Expand chat')}"),
    ('style={{ color: m.color }}>{m.text}</span>', 'style={{ color: m.color }}>{tr(m.text)}</span>'),
    ('{sendChannels.map(channel => <option key={channel} value={channel}>{channel}</option>)}', '{sendChannels.map(channel => <option key={channel} value={channel}>{CHANNEL_LABELS[channel] || tr(channel)}</option>)}'),
    ('placeholder={`Message ${sendChannel}...`}', "placeholder={tr(`Message ${sendChannel}...`)}"),
    ('>SEND</button>', ">{tr('SEND')}</button>"),
])

# HUD: dynamic class/spell/monster labels are localized explicitly.
patch('src/components/HUD.tsx', [
    ("import MovableHudWindow from './MovableHudWindow';", "import MovableHudWindow from './MovableHudWindow';\nimport { t as tr } from '../i18n';"),
    ("title={`Minimap · ${MAPS[mapId]?.name || mapId} · ${player.pos.x}, ${player.pos.y}`}", "title={`${tr('Minimap')} · ${tr(MAPS[mapId]?.name || mapId)} · ${player.pos.x}, ${player.pos.y}`}`"),
    ("title={`${vocation?.name || player.vocation} · Lv ${player.level}`}", "title={`${tr(vocation?.name || player.vocation)} · ${tr(`Lv ${player.level}`)}`}"),
    ('title="Skills"', "title={tr('Skills')}"),
    ("title={`Spellbook · ${vocation?.name || player.vocation}`}", "title={`${tr('Spellbook')} · ${tr(vocation?.name || player.vocation)}`}"),
    ('>{spell.name}</div>', '>{tr(spell.name)}</div>'),
    ("{locked ? `LV ${spell.levelRequired}` : `${spell.mana} MP`}", "{locked ? tr(`Lv ${spell.levelRequired}`) : `${spell.mana} MP`}"),
    ("title={`Nearby Threats · ${nearby.length}`}", "title={`${tr('Nearby Threats')} · ${nearby.length}`}"),
    ('>{m.name}</span>', '>{tr(m.name)}</span>'),
    ('>Lv{m.level}</span>', '>{tr(`Lv ${m.level}`)}</span>'),
    ('title="Active Effects"', "title={tr('Active Effects')}"),
    ('>{label}</div>\n        <div className="font-mono text-sm font-black"', '>{tr(label)}</div>\n        <div className="font-mono text-sm font-black"'),
    ('>{label}</span><span className="font-mono font-black"', '>{tr(label)}</span><span className="font-mono font-black"'),
])

# Inventory top-level interaction labels and dynamic content.
patch('src/components/Inventory.tsx', [
    ("import { Draggable, DropZone } from './DragDrop';", "import { Draggable, DropZone } from './DragDrop';\nimport { t as tr } from '../i18n';"),
    ('📦 ITEMS', "📦 {tr('ITEMS')}"),
    ('⚒ CRAFTING', "⚒ {tr('CRAFTING')}"),
    ('💎 SOCKET', "💎 {tr('SOCKET')}"),
    ('aria-label="Close inventory"', "aria-label={tr('Close inventory')}"),
    ('>💎 GEM SOCKETING</div>', ">💎 {tr('GEM SOCKETING')}</div>"),
    ('No gems found! Defeat elite/boss monsters to obtain gems.', "{tr('No gems found! Defeat elite/boss monsters to obtain gems.')}"),
    ('>Select an item to socket:</div>', ">{tr('Select an item to socket:')}</div>"),
    ('>{item.name}</div>', '>{tr(item.name)}</div>'),
    ('>Choose a gem to socket:</div>', ">{tr('Choose a gem to socket:')}</div>"),
    ('>{gem.name}</div>', '>{tr(gem.name)}</div>'),
    ('>{gemData.description}</div>', '>{tr(gemData.description)}</div>'),
    ('>⚒ CRAFTING RECIPES</div>', ">⚒ {tr('CRAFTING RECIPES')}</div>"),
    ('>{recipe.name}</div>', '>{tr(recipe.name)}</div>'),
    ('{enough ? \'✓\' : \'✗\'} {ing.name} ×{ing.quantity} (have {have})', "{enough ? '✓' : '✗'} {tr(ing.name)} ×{ing.quantity} ({tr('have')} {have})"),
    ("🛒 {shopName || 'MERCHANT'} · SHOP", "🛒 {tr(shopName || 'MERCHANT')} · {tr('SHOP')}"),
])

# Raid warnings are highly transient, so translate before React paints them.
patch('src/components/RaidWarning.tsx', [
    ("import { useEffect, useRef, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';\nimport { t as tr } from '../i18n';"),
    ('>WORLD EVENT</div>', ">{tr('WORLD EVENT')}</div>"),
    ('          {warning.text}', '          {tr(warning.text)}'),
])

# World-events panel translates display data only; event IDs/types remain untouched.
patch('src/components/WorldEvents.tsx', [
    ("import { getWorldEvents, contributeToWorldEvent, type WorldEvent } from '../game/worldEvents';", "import { getWorldEvents, contributeToWorldEvent, type WorldEvent } from '../game/worldEvents';\nimport { t as tr } from '../i18n';"),
    ('>🌍 WORLD EVENTS</h2>', ">🌍 {tr('WORLD EVENTS')}</h2>"),
    ('>Global missions shared by all adventurers. Contribute to earn rewards!</div>', ">{tr('Global missions shared by all adventurers. Contribute to earn rewards!')}</div>"),
    ('<div>No active world events. Check back later or ask an admin to create one!</div>', "<div>{tr('No active world events. Check back later or ask an admin to create one!')}</div>"),
    ('>{event.name}</div>', '>{tr(event.name)}</div>'),
    ('>{event.description}</div>', '>{tr(event.description)}</div>'),
    ('<span>Progress: {event.progress.current}/{event.progress.required}</span>', "<span>{tr('Progress:')} {event.progress.current}/{event.progress.required}</span>"),
    ('Your contribution: {myContribution}', "{tr('Your contribution:')} {myContribution}"),
    ('>Kill target monsters to contribute!</span>', ">{tr('Kill target monsters to contribute!')}</span>"),
    ('>Contribute</button>', ">{tr('Contribute')}</button>"),
    ('>✅ RECENTLY COMPLETED</div>', ">✅ {tr('RECENTLY COMPLETED')}</div>"),
    ('>{event.name}</span>', '>{tr(event.name)}</span>'),
    ('>Completed</span>', ">{tr('Completed')}</span>"),
])

# Persistent top bar: translate at React render time rather than waiting for DOM observation.
patch('src/components/GameScreen.tsx', [
    ('<span className="hidden text-slate-500 md:inline">{VOCATIONS[player.vocation]?.name} · Lv {player.level}</span>',
     '<span className="hidden text-slate-500 md:inline">{tr(VOCATIONS[player.vocation]?.name || player.vocation)} · {tr(`Lv ${player.level}`)}</span>'),
    ('title="Offline Debug Admin (Ctrl+Shift+A)"', "title={tr('Offline Debug Admin (Ctrl+Shift+A)')}"),
    ('<span>⚡</span><span className="hidden lg:inline">Debug</span>', "<span>⚡</span><span className=\"hidden lg:inline\">{tr('Debug')}</span>"),
    ('>🌀 DUNGEON · WAVE {dungeonWave}/{dungeonTotalWavesRef.current}</span>', ">🌀 {tr('DUNGEON')} · {tr('WAVE')} {dungeonWave}/{dungeonTotalWavesRef.current}</span>"),
    ('title={`${label} (${hotkey})`}', 'title={`${tr(label)} (${hotkey})`}'),
    ('{label}', '{tr(label)}'),
])

# Ensure generic dynamic welcome messages are localized without changing stored player names.
index = Path('src/i18n/index.ts')
s = index.read_text(encoding='utf-8')
anchor = "  [/^Signed in as (.+)$/i, 'Conectado como $1'],"
insert = "  [/^Signed in as (.+)$/i, 'Conectado como $1'],\n  [/^Welcome to Mor'ia, (.+)!$/i, \"Bem-vindo a Mor'ia, $1!\"],"
if anchor in s and "Welcome to Mor'ia" not in s[s.find('const PT_BR_PATTERNS'):s.find('const WORDS')]:
    s = s.replace(anchor, insert, 1)
index.write_text(s, encoding='utf-8')

print('Mor\'ia 9.28 PT-BR runtime closure applied')
