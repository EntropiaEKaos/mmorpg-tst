from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    # Talent tree / progression
    'TALENT TREE': 'ÁRVORE DE TALENTOS',
    'Points:': 'Pontos:',
    'Reset all talents (500 gold)': 'Redefinir todos os talentos (500 de ouro)',
    'Reset': 'Redefinir',
    'Close talent tree': 'Fechar árvore de talentos',
    'talent point to spend': 'ponto de talento para gastar',
    'talent points to spend': 'pontos de talento para gastar',
    'TIER': 'NÍVEL',
    'ULTIMATE': 'SUPREMO',
    'ADVANCED': 'AVANÇADO',
    'IMPROVED': 'APRIMORADO',
    'BASIC': 'BÁSICO',
    'Requires:': 'Requer:',
    'MAXED': 'MÁXIMO',
    '1 talent point per level · Reset costs 500 gold · Effects are permanent until reset': '1 ponto de talento por nível · Redefinir custa 500 de ouro · Os efeitos são permanentes até a redefinição',
    'Vitality': 'Vitalidade',
    '+10 HP per rank': '+10 de Vida por nível',
    'Wisdom': 'Sabedoria',
    '+8 Mana per rank': '+8 de Mana por nível',
    'Might': 'Poder',
    '+2 Attack per rank': '+2 de Ataque por nível',
    'Toughness': 'Robustez',
    '+2 Defense per rank': '+2 de Defesa por nível',
    'Precision': 'Precisão',
    '+1% crit chance per rank': '+1% de chance crítica por nível',
    'Arcane Mastery': 'Maestria Arcana',
    '+3 Magic per rank': '+3 de Magia por nível',
    'Resilience': 'Resiliência',
    '+2% damage reduction per rank': '+2% de redução de dano por nível',
    'Bounty Hunter': 'Caçador de Recompensas',
    '+5% gold per rank': '+5% de ouro por nível',
    'Savant': 'Erudito',
    '+10% XP per rank': '+10% de XP por nível',
    'Lethal Strikes': 'Golpes Letais',
    '+3% crit chance per rank': '+3% de chance crítica por nível',
    'Archmage': 'Arquimago',
    '+20% heal bonus per rank': '+20% de bônus de cura por nível',
    'Fortitude': 'Fortitude',
    '+5% damage reduction per rank': '+5% de redução de dano por nível',
    'Berserker Rage': 'Fúria Berserker',
    '+15 Attack, +5% crit': '+15 de Ataque, +5% crítico',
    'Transcendence': 'Transcendência',
    '+50 HP, +30 Mana, +8 Magic': '+50 de Vida, +30 de Mana, +8 de Magia',

    # Action bar / cast
    'Action Bar': 'Barra de Ações',
    'CASTING': 'CONJURANDO',
    'Berserk': 'Fúria',
    'Wound Heal': 'Cura de Ferimentos',
    'Fierce Berserk': 'Fúria Intensa',
    'Magic Shield': 'Escudo Mágico',
    'attack': 'ataque',
    'aoe': 'área',
    'heal': 'cura',

    # DPS meter
    'Combat analytics': 'Análise de combate',
    'DPS Meter': 'Medidor de DPS',
    'RESET': 'REINICIAR',
    'Close DPS meter': 'Fechar medidor de DPS',
    'Duration': 'Duração',
    'Total Damage': 'Dano Total',
    'Total Healing': 'Cura Total',
    'Crit Rate': 'Taxa Crítica',
    'Hits': 'Golpes',
    'Crits': 'Críticos',
    'Max Hit': 'Maior Golpe',
    'RECENT COMBAT': 'COMBATE RECENTE',
    'latest': 'últimos',
    'Awaiting combat': 'Aguardando combate',
    'Damage and healing will appear automatically from your first combat event.': 'Dano e cura aparecerão automaticamente a partir do seu primeiro evento de combate.',
    'physical': 'físico',
    'magical': 'mágico',

    # Generic tooltip labels
    'Attack': 'Ataque',
    'Defense': 'Defesa',
    'Armor': 'Armadura',
    'Magic': 'Magia',
    'Crit': 'Crítico',
    'Lifesteal': 'Roubo de Vida',
    'Thorns': 'Espinhos',
    'Speed': 'Velocidade',
    'Dmg Taken': 'Dano Recebido',
    'Power': 'Poder',
    'Resistance': 'Resistência',
    'Vulnerability': 'Vulnerabilidade',
    'skill': 'habilidade',
    'resist pierce': 'perfuração de resistência',
    'Value:': 'Valor:',
    'Hotkey:': 'Atalho:',
    'Required Level:': 'Nível Necessário:',
    'Mana Cost:': 'Custo de Mana:',
    'Base Heal': 'Cura Base',
    'Base Damage': 'Dano Base',
    'Cooldown:': 'Recarga:',
    'Range:': 'Alcance:',
    'Self': 'Próprio',
    'Melee': 'Corpo a corpo',
    'tiles': 'espaços',
    'Element:': 'Elemento:',
    'Scaling:': 'Escalonamento:',
    'Influence chain': 'Cadeia de influência',
    'stat': 'atributo',
    'gear': 'equipamento',
    'resistance pierce': 'perfuração de resistência',
    'Estimated power': 'Poder estimado',
    'Reactive combos': 'Combos reativos',
    'Pierce:': 'Perfuração:',
    'Hits:': 'Golpes:',
    'Variance:': 'Variação:',
    'Contextual skill': 'Habilidade contextual',
    'Ally:': 'Aliado:',
    'Enemy:': 'Inimigo:',
    'Drain:': 'Dreno:',
    'Locked - Level': 'Bloqueado - Nível',
    'required': 'necessário',
    'On Cooldown': 'Em Recarga',
    'Not enough mana': 'Mana insuficiente',
    'XP Reward:': 'Recompensa de XP:',
    'Damage Type:': 'Tipo de Dano:',
    'normal': 'normal',
    'elite': 'elite',

    # Damage schools commonly surfaced by tooltip meta
    'Physical': 'Físico',
    'Fire': 'Fogo',
    'Water': 'Água',
    'Lightning': 'Raio',
    'Ice': 'Gelo',
    'Earth': 'Terra',
    'Arcane': 'Arcano',
    'Death': 'Morte',
    'Holy': 'Sagrado',
    'Nature': 'Natureza',
    'Poison': 'Veneno',
    'Shadow': 'Sombra',

    # Elemental reaction hints shown in SpellTooltip
    'Frozen': 'Congelado',
    'Shatter': 'Estilhaçar',
    'Consumes Frozen + heavy stagger': 'Consome Congelado + forte desequilíbrio',
    'Fractured': 'Fraturado',
    'Fracture Exploit': 'Explorar Fratura',
    'Ignores 25% target defense': 'Ignora 25% da defesa do alvo',
    'Wet': 'Molhado',
    'Steam Burst': 'Explosão de Vapor',
    'Consumes Wet; target briefly vulnerable': 'Consome Molhado; alvo fica brevemente vulnerável',
    'Thermal Shock': 'Choque Térmico',
    'Consumes Frozen': 'Consome Congelado',
    'Otherwise': 'Caso contrário',
    'Burn': 'Queimadura',
    'Applies Burn': 'Aplica Queimadura',
    'Burning': 'Queimando',
    'Extinguishes Burn + applies Wet': 'Extingue Queimadura + aplica Molhado',
    'Primes Lightning and Ice': 'Prepara Raio e Gelo',
    'Conductive Burst': 'Explosão Condutiva',
    'Consumes Wet + brief stun': 'Consome Molhado + breve atordoamento',
    'Shocked': 'Eletrizado',
    'Applies Shocked': 'Aplica Eletrizado',
    'Flash Freeze': 'Congelamento Súbito',
    'Consumes Wet + Frozen/stun': 'Consome Molhado + Congelado/atordoamento',
    'Chilled': 'Resfriado',
    'Deep Freeze': 'Congelamento Profundo',
    'Converts Chilled to Frozen': 'Converte Resfriado em Congelado',
    'Applies Chilled': 'Aplica Resfriado',
    'Grounded': 'Aterrado',
    'Consumes Shocked': 'Consome Eletrizado',
    'Primes Physical damage': 'Prepara dano Físico',
    'Unstable': 'Instável',
    'Arcane Detonation': 'Detonação Arcana',
    'Consumes Unstable': 'Consome Instável',
    'Next non-Arcane school catalyzes ×1.18': 'A próxima escola não Arcana catalisa ×1.18',
    'Cursed': 'Amaldiçoado',
    'Soul Rend': 'Ruptura da Alma',
    'Refreshes Cursed': 'Renova Amaldiçoado',
    'Primes Holy/Shadow interactions': 'Prepara interações Sagrado/Sombra',
    'Purify': 'Purificar',
    'Consumes Cursed': 'Consome Amaldiçoado',
    'Death-aligned': 'Alinhado à Morte',
    'Exorcism': 'Exorcismo',
    'Bonus vs Death-school monsters': 'Bônus contra monstros da escola Morte',
    'Poisoned': 'Envenenado',
    'Toxic Bloom': 'Florescimento Tóxico',
    'Amplifies poisoned target': 'Amplifica alvo envenenado',
    'Rooted': 'Enraizado',
    'Applies Root + Slow': 'Aplica Enraizamento + Lentidão',
    'Venom Bloom': 'Florescimento Venenoso',
    'Amplifies rooted target': 'Amplifica alvo enraizado',
    'Poison': 'Veneno',
    'Applies Poison': 'Aplica Veneno',
    'Eclipse': 'Eclipse',
    'Amplifies cursed target': 'Amplifica alvo amaldiçoado',
    'Applies Cursed': 'Aplica Amaldiçoado',
    'Any': 'Qualquer',
    'Pure Magic': 'Magia Pura',
    'No intrinsic state; keeps generic magic scaling': 'Sem estado intrínseco; mantém escalonamento mágico genérico',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            raise SystemExit(f'missing required anchor in {path}: {old[:150]}')
    p.write_text(text, encoding='utf-8')


patch('src/components/TalentTree.tsx', [
    ("import { serverSync } from '../game/ServerSync';", "import { serverSync } from '../game/ServerSync';\nimport { t as tr } from '../i18n';"),
    ('              🌟 TALENT TREE', "              🌟 {tr('TALENT TREE')}"),
    ('{vocation?.icon} {vocation?.name} · Points:', "{vocation?.icon} {tr(vocation?.name || '')} · {tr('Points:')}"),
    ('title="Reset all talents (500 gold)"', "title={tr('Reset all talents (500 gold)')}"),
    ('              🔄 Reset (500🪙)', "              🔄 {tr('Reset')} (500🪙)"),
    ('aria-label="Close talent tree"', "aria-label={tr('Close talent tree')}"),
    ('            ✨ You have {availablePoints} talent point(s) to spend!', "            ✨ {tr('You have')} {availablePoints} {tr(availablePoints === 1 ? 'talent point to spend' : 'talent points to spend')}!"),
    ('                TIER {tierIdx + 1} {tierIdx === 3 ? \'(ULTIMATE)\' : tierIdx >= 2 ? \'(ADVANCED)\' : tierIdx === 1 ? \'(IMPROVED)\' : \'(BASIC)\'}', "                {tr('TIER')} {tierIdx + 1} {tierIdx === 3 ? `(${tr('ULTIMATE')})` : tierIdx >= 2 ? `(${tr('ADVANCED')})` : tierIdx === 1 ? `(${tr('IMPROVED')})` : `(${tr('BASIC')})`}"),
    ('>{talent.name}</div>', '>{tr(talent.name)}</div>'),
    ('>{talent.description}</div>', '>{tr(talent.description)}</div>'),
    ('                          Requires: {talents.find((t) => t.id === talent.requires)?.name}', "                          {tr('Requires:')} {tr(talents.find((t) => t.id === talent.requires)?.name || '')}"),
    ('{maxed && <div className="text-[10px] text-amber-400 font-bold mt-1">★ MAXED</div>}', "{maxed && <div className=\"text-[10px] text-amber-400 font-bold mt-1\">★ {tr('MAXED')}</div>}"),
    ('          1 talent point per level · Reset costs 500 gold · Effects are permanent until reset', "          {tr('1 talent point per level · Reset costs 500 gold · Effects are permanent until reset')}"),
])

patch('src/components/ActionBar.tsx', [
    ("import MovableHudWindow from './MovableHudWindow';", "import MovableHudWindow from './MovableHudWindow';\nimport { t as tr } from '../i18n';"),
    ('      title="Action Bar"', "      title={tr('Action Bar')}"),
    ('>LV {spell.levelRequired}</div>', ">{tr('Lv')} {spell.levelRequired}</div>"),
    ('content={<div className="text-xs"><b>{label}</b><br/><span style={{ color: accent }}>{detail}</span></div>}', 'content={<div className="text-xs"><b>{tr(label)}</b><br/><span style={{ color: accent }}>{tr(detail)}</span></div>}'),
])

patch('src/components/CastBar.tsx', [
    ("import { memo, useEffect, useRef, useState } from 'react';", "import { memo, useEffect, useRef, useState } from 'react';\nimport { t as tr } from '../i18n';"),
    ('style={{ color: cast.color }}>CASTING</div>', "style={{ color: cast.color }}>{tr('CASTING')}</div>"),
    ('>{cast.name}</div>', '>{tr(cast.name)}</div>'),
])

patch('src/components/DPSMeter.tsx', [
    ("import { dpsMeter } from '../game/dpsMeter';", "import { dpsMeter } from '../game/dpsMeter';\nimport { t as tr } from '../i18n';"),
    ('<div className="moria-eyebrow text-rose-300">Combat analytics</div>', '<div className="moria-eyebrow text-rose-300">{tr(\'Combat analytics\')}</div>'),
    ('<h2 className="moria-title mt-1 text-2xl font-black">📊 DPS Meter</h2>', '<h2 className="moria-title mt-1 text-2xl font-black">📊 {tr(\'DPS Meter\')}</h2>'),
    ('>↻ RESET</button>', ">↻ {tr('RESET')}</button>"),
    ('aria-label="Close DPS meter"', "aria-label={tr('Close DPS meter')}"),
    ('<StatBox label="Duration"', '<StatBox label={tr(\'Duration\')}'),
    ('<StatBox label="Total Damage"', '<StatBox label={tr(\'Total Damage\')}'),
    ('<StatBox label="Total Healing"', '<StatBox label={tr(\'Total Healing\')}'),
    ('<StatBox label="Crit Rate"', '<StatBox label={tr(\'Crit Rate\')}'),
    ('<StatBox label="Hits"', '<StatBox label={tr(\'Hits\')}'),
    ('<StatBox label="Crits"', '<StatBox label={tr(\'Crits\')}'),
    ('<StatBox label="Max Hit"', '<StatBox label={tr(\'Max Hit\')}'),
    ('<div className="moria-eyebrow text-[8px]">RECENT COMBAT</div>', '<div className="moria-eyebrow text-[8px]">{tr(\'RECENT COMBAT\')}</div>'),
    ('>latest {recent.length}</div>', ">{tr('latest')} {recent.length}</div>"),
    ('>{record.target}</span>', '>{tr(record.target)}</span>'),
    ('>{record.type}</span>', '>{tr(record.type)}</span>'),
    ('<div className="moria-eyebrow mt-3">Awaiting combat</div>', '<div className="moria-eyebrow mt-3">{tr(\'Awaiting combat\')}</div>'),
    ('<div className="mt-2 text-xs text-slate-500">Damage and healing will appear automatically from your first combat event.</div>', '<div className="mt-2 text-xs text-slate-500">{tr(\'Damage and healing will appear automatically from your first combat event.\')}</div>'),
])

# Tooltip ownership: translate dynamic names plus technical labels at the component boundary.
patch('src/components/Tooltip.tsx', [
    ("import { reactionHintsForSchool } from '../game/elementalReactions';", "import { reactionHintsForSchool } from '../game/elementalReactions';\nimport { t as tr } from '../i18n';"),
    ('            {item.name}', '            {tr(item.name)}'),
    ('              {item.equipment.rarity} · Lv {item.equipment.level} · {item.equipment.slot}', "              {tr(item.equipment.rarity)} · {tr('Lv')} {item.equipment.level} · {tr(item.equipment.slot)}"),
    ('⚔ +{item.equipment.attack} Attack', "⚔ +{item.equipment.attack} {tr('Attack')}"),
    ('🛡 +{item.equipment.defense} Defense', "🛡 +{item.equipment.defense} {tr('Defense')}"),
    ('🎽 +{item.equipment.armor} Armor', "🎽 +{item.equipment.armor} {tr('Armor')}"),
    ('🔮 +{item.equipment.magic} Magic', "🔮 +{item.equipment.magic} {tr('Magic')}"),
    ('🎯 +{item.equipment.critChance}% Crit', "🎯 +{item.equipment.critChance}% {tr('Crit')}"),
    ('🩸 +{item.equipment.lifesteal}% Lifesteal', "🩸 +{item.equipment.lifesteal}% {tr('Lifesteal')}"),
    ('🌵 +{item.equipment.thorns} Thorns', "🌵 +{item.equipment.thorns} {tr('Thorns')}"),
    ('💨 +{item.equipment.moveSpeed}% Speed', "💨 +{item.equipment.moveSpeed}% {tr('Speed')}"),
    ('🪙 +{item.equipment.goldBonus}% Gold', "🪙 +{item.equipment.goldBonus}% {tr('Gold')}"),
    ('🛡 -{item.equipment.damageReduction}% Dmg Taken', "🛡 -{item.equipment.damageReduction}% {tr('Dmg Taken')}"),
    ('{SCHOOL_META[normalizeSchool(school)].label} Power', "{tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Power')}"),
    ('{SCHOOL_META[normalizeSchool(school)].label} Resistance', "{tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Resistance')}"),
    ('{SCHOOL_META[normalizeSchool(school)].label} Vulnerability', "{tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('Vulnerability')}"),
    ('{skill} skill', "{tr(skill)} {tr('skill')}"),
    ('{SCHOOL_META[normalizeSchool(school)].label} resist pierce', "{tr(SCHOOL_META[normalizeSchool(school)].label)} {tr('resist pierce')}"),
    ('>✦ {affix.name}</div>', '>✦ {tr(affix.name)}</div>'),
    ('>{affix.description}</div>', '>{tr(affix.description)}</div>'),
    ('          {item.description}', '          {tr(item.description)}'),
    ('>💰 Value: {item.value} gold</div>', ">💰 {tr('Value:')} {item.value} {tr('gold')}</div>"),
    ('>{spell.name}</div>', '>{tr(spell.name)}</div>'),
    ('            {spell.type} · Hotkey: {idx + 1}', "            {tr(spell.type)} · {tr('Hotkey:')} {idx + 1}"),
    ('>Required Level:</span>', ">{tr('Required Level:')}</span>"),
    ('>Lv {spell.levelRequired}</span>', ">{tr('Lv')} {spell.levelRequired}</span>"),
    ('>Mana Cost:</span>', ">{tr('Mana Cost:')}</span>"),
    (">{spell.type === 'heal' ? 'Base Heal' : 'Base Damage'}:</span>", ">{tr(spell.type === 'heal' ? 'Base Heal' : 'Base Damage')}:</span>"),
    ('>Cooldown:</span>', ">{tr('Cooldown:')}</span>"),
    ('>Range:</span>', ">{tr('Range:')}</span>"),
    ("{spell.range === 0 ? 'Self' : spell.range <= 1.5 ? 'Melee' : `${spell.range} tiles`}", "{spell.range === 0 ? tr('Self') : spell.range <= 1.5 ? tr('Melee') : `${spell.range} ${tr('tiles')}`}"),
    ('>Element:</span>', ">{tr('Element:')}</span>"),
    ('>{meta.icon} {meta.label}</span>', '>{meta.icon} {tr(meta.label)}</span>'),
    ('>Scaling:</span>', ">{tr('Scaling:')}</span>"),
    ('>Influence chain</div>', ">{tr('Influence chain')}</div>"),
    ('>{scaling.statKind} stat</span>', ">{tr(scaling.statKind)} {tr('stat')}</span>"),
    ('>{scaling.skillId} skill</span>', ">{tr(scaling.skillId)} {tr('skill')}</span>"),
    ('>gear · {meta.label}</span>', ">{tr('gear')} · {tr(meta.label)}</span>"),
    ('>resistance pierce</span>', ">{tr('resistance pierce')}</span>"),
    ('>Estimated power</span>', ">{tr('Estimated power')}</span>"),
    ('>Reactive combos</div>', ">{tr('Reactive combos')}</div>"),
    ('>{hint.when}</span>', '>{tr(hint.when)}</span>'),
    ('>{hint.name}{hint.multiplier', '>{tr(hint.name)}{hint.multiplier'),
    ('>{hint.result}</div>', '>{tr(hint.result)}</div>'),
    ('>Crit:</span>', ">{tr('Crit')}:</span>"),
    ('>Lifesteal:</span>', ">{tr('Lifesteal')}:</span>"),
    ('>Pierce:</span>', ">{tr('Pierce:')}</span>"),
    ('>Hits:</span>', ">{tr('Hits:')}</span>"),
    ('>Variance:</span>', ">{tr('Variance:')}</span>"),
    ('>Contextual skill</div>', ">{tr('Contextual skill')}</div>"),
    ('>🤝 Ally: {spell.allyEffect}', ">🤝 {tr('Ally:')} {tr(spell.allyEffect)}"),
    ('>⚔ Enemy: {spell.enemyEffect}', ">⚔ {tr('Enemy:')} {tr(spell.enemyEffect)}"),
    ('>🩸 Drain: {spell.drainPercent}%</div>', ">🩸 {tr('Drain:')} {spell.drainPercent}%</div>"),
    ('>🔒 Locked - Level {spell.levelRequired} required</div>', ">🔒 {tr('Locked - Level')} {spell.levelRequired} {tr('required')}</div>"),
    ('>⏱ On Cooldown</div>', ">⏱ {tr('On Cooldown')}</div>"),
    ('>Not enough mana</div>', ">{tr('Not enough mana')}</div>"),
    ('            {monster.name}', '            {tr(monster.name)}'),
    ("            {monster.type || 'normal'} · Lv {monster.level}", "            {tr(monster.type || 'normal')} · {tr('Lv')} {monster.level}"),
    ('>Attack:</span>', ">{tr('Attack')}:</span>"),
    ('>Defense:</span>', ">{tr('Defense')}:</span>"),
    ('>XP Reward:</span>', ">{tr('XP Reward:')}</span>"),
    ('>Damage Type:</span>', ">{tr('Damage Type:')}</span>"),
    ('>{monster.damageType}</span>', '>{tr(monster.damageType)}</span>'),
])

# Extend visual QA with progression/combat panels using the actual production components.
visual = Path('src/visualQa.tsx')
text = visual.read_text(encoding='utf-8')
text = text.replace("import { StrictMode, useState } from 'react';", "import { StrictMode, useEffect, useState } from 'react';", 1)
if "import TalentTree from './components/TalentTree';" not in text:
    text = text.replace(
        "import CoinShop from './components/CoinShop';",
        "import CoinShop from './components/CoinShop';\nimport TalentTree from './components/TalentTree';\nimport ActionBar from './components/ActionBar';\nimport CastBar, { triggerCast } from './components/CastBar';\nimport DPSMeter from './components/DPSMeter';\nimport GlobalTooltipRenderer from './components/Tooltip';",
        1,
    )
if "import { VOCATIONS } from './game/classes';" not in text:
    text = text.replace(
        "import { saveAuctionListings, setCoins } from './game/economy';",
        "import { saveAuctionListings, setCoins } from './game/economy';\nimport { VOCATIONS } from './game/classes';\nimport { dpsMeter } from './game/dpsMeter';",
        1,
    )
# Flesh out the QA player only when fields are absent.
text = text.replace(
    "  bankGold: 12650,\n  activeQuests: [],",
    "  bankGold: 12650,\n  vocation: 'knight',\n  hp: 420,\n  maxHp: 460,\n  mana: 115,\n  maxMana: 140,\n  attack: 52,\n  defense: 31,\n  magic: 12,\n  activeQuests: [],",
    1,
)
# Seed deterministic combat records once before rendering.
seed_marker = "  setCoins(QA_PLAYER.name, 850);\n"
seed_extra = seed_marker + "  dpsMeter.clear();\n  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 184, 'physical', false);\n  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 332, 'physical', true);\n  dpsMeter.record(QA_PLAYER.name, QA_PLAYER.name, 146, 'heal', false);\n"
if seed_marker in text and "dpsMeter.record(QA_PLAYER.name, 'Orc Warrior'" not in text:
    text = text.replace(seed_marker, seed_extra, 1)

wrapper = """
function CastVisualQa() {
  useEffect(() => {
    const id = window.setTimeout(() => triggerCast('Fierce Berserk', '🔥', 4000, '#ff6a00'), 60);
    return () => window.clearTimeout(id);
  }, []);
  return <CastBar />;
}
"""
if 'function CastVisualQa()' not in text:
    text = text.replace('function VisualQa() {', wrapper + '\nfunction VisualQa() {', 1)

render_anchor = """      {panel === 'coinshop' && <CoinShop player={qaPlayer} onClose={() => {}} addMessage={() => {}} onPurchase={() => true} />}
"""
render_extra = render_anchor + """      {panel === 'talents' && <TalentTree player={qaPlayer} setPlayer={setQaPlayer} onClose={() => {}} />}
      {panel === 'actionbar' && <div data-qa-actionbar><GlobalTooltipRenderer /><ActionBar player={qaPlayer} spells={VOCATIONS.knight.spells} potions={{ hp: 4, mp: 3, hpg: 1 }} onCastSpell={() => {}} onUsePotion={() => {}} /></div>}
      {panel === 'castbar' && <CastVisualQa />}
      {panel === 'dps' && <DPSMeter onClose={() => {}} />}
"""
if render_anchor in text and "panel === 'talents'" not in text:
    text = text.replace(render_anchor, render_extra, 1)
elif "panel === 'dps'" not in text:
    raise SystemExit('visual QA 9.34 render anchor not found')
visual.write_text(text, encoding='utf-8')

Path('tools/capture-moria-9-34.mjs').write_text("""import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.34-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const forbidden = {
  talents: ['TALENT TREE', 'Points:', 'Reset (500', 'Requires:', 'MAXED', 'TIER 1', 'talent point(s)'],
  actionbar: ['Action Bar', 'Hotkey:', 'Required Level:', 'Mana Cost:', 'Base Damage', 'Cooldown:', 'Range:', 'Reactive combos'],
  castbar: ['CASTING', 'Fierce Berserk'],
  dps: ['Combat analytics', 'DPS Meter', 'Duration', 'Total Damage', 'Total Healing', 'Crit Rate', 'RECENT COMBAT', 'physical'],
};

for (const panel of ['talents', 'actionbar', 'castbar', 'dps']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  if (panel === 'actionbar') {
    await page.locator('[data-qa-actionbar] .moria-hotbar-slot').first().hover();
    await page.waitForTimeout(260);
  } else if (panel === 'castbar') {
    await page.waitForTimeout(180);
  } else {
    await page.waitForTimeout(120);
  }
  const bodyText = await page.locator('body').innerText();
  const leaks = forbidden[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) throw new Error(`Mor'ia 9.34 PT-BR visual leak in ${panel}: ${leaks.join(', ')}`);
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.34 screenshots in ${output}`);
""", encoding='utf-8')

Path('docs/MORIA_9_34_COMBAT_PROGRESSION_PTBR.md').write_text("""# Mor'ia 9.34 — Progressão, Combate e Tooltips em PT-BR

## Objetivo

Uniformizar as superfícies de progressão e leitura de combate em PT-BR usando os componentes reais existentes. O escopo evita criar painéis artificiais para sistemas que hoje vivem embutidos no `GameScreen`/NPCs.

## Escopo implementado

- Árvore de Talentos: cabeçalho, pontos, reset, tiers, requisitos, nomes e descrições de talentos.
- Barra de Ações: título, estado de nível e conteúdo dos tooltips de poções/magias.
- Barra de Conjuração: estado `CONJURANDO` e nome localizado da magia.
- Medidor de DPS: métricas, histórico recente e estado vazio.
- Tooltips de item, magia e monstro: nomes dinâmicos, raridade/slot, atributos, custo, alcance, recarga, escalonamento e estados de bloqueio.
- Reações elementais: condições, nomes e resultados usados no detalhamento de magias.

## Decisão arquitetural

Banco, treino e parte do grimório não existem hoje como módulos React independentes: seus fluxos estão integrados ao `GameScreen`, NPCs e sistemas de servidor. A 9.34 não inventa componentes apenas para satisfazer uma lista; ela fecha as superfícies reais reutilizáveis e documenta essa fronteira para a futura extração modular.

## Contratos preservados

- Nenhum talento, requisito, custo de reset ou efeito foi rebalanceado.
- Nenhum cooldown, mana, dano, alcance ou fórmula de scaling foi alterado.
- O DPS Meter mantém o mesmo modelo de sessão e retenção.
- Nenhum evento `tibia-cast` ou contrato da ActionBar mudou.
- A alteração é de apresentação/localização + QA visual.

## Visual QA

O gate gera quatro screenshots reais:

- `talents.png`
- `actionbar.png` — inclui hover real no primeiro slot para abrir `SpellTooltip` via portal.
- `castbar.png` — dispara o evento real `tibia-cast` no harness isolado.
- `dps.png` — usa registros reais do `dpsMeter` com fixture determinística.

Antes de salvar os PNGs, a captura reprova marcadores ingleses críticos de cada painel.

## Critério de aceite

1. auditoria PT-BR;
2. audit/typecheck/build do cliente;
3. audit/check/test do servidor;
4. Playwright estável e auditado;
5. quatro screenshots sem vazamentos críticos;
6. inspeção humana dos PNGs antes da próxima versão.

## Próximo bloco sugerido

9.35: extração/organização dos fluxos embutidos de Banco/Treino/Grimório em componentes menores somente se a auditoria estrutural demonstrar ganho real; caso contrário, priorizar HUD responsivo e screenshots de gameplay desktop/compacto.
""", encoding='utf-8')

print("Mor'ia 9.34 combat/progression PT-BR + visual QA applied")
