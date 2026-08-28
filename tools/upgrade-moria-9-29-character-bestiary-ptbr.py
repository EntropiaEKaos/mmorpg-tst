from pathlib import Path
import json

CATALOG = Path('src/i18n/pt-BR.928.json')

catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
catalog.update({
    # Bestiary surface
    'All': 'Todos',
    'Beasts': 'Feras',
    'Humanoids': 'Humanoides',
    'Undead': 'Mortos-vivos',
    'Demons': 'Demônios',
    'Dragons': 'Dragões',
    'Field knowledge': 'Conhecimento de campo',
    'Bestiary': 'Bestiário',
    'mastered': 'dominados',
    'DISCOVERY': 'DESCOBERTA',
    'MASTERED': 'DOMINADO',
    'Known habitat': 'Habitat conhecido',
    'DROPS': 'SAQUES',
    'WEAKNESSES': 'FRAQUEZAS',
    'RESISTANCES': 'RESISTÊNCIAS',
    'YOUR PROGRESS': 'SEU PROGRESSO',
    'Select an entry': 'Selecione uma entrada',
    'Choose a creature to inspect its stats, drops, weaknesses and mastery progress.': 'Escolha uma criatura para inspecionar seus atributos, saques, fraquezas e progresso de domínio.',
    'Close bestiary': 'Fechar bestiário',
    'beast': 'fera',
    'humanoid': 'humanoide',
    'undead': 'morto-vivo',
    'demon': 'demônio',
    'dragon': 'dragão',
    'boss': 'chefe',
    'fire': 'fogo',
    'ice': 'gelo',
    'death': 'morte',
    'holy': 'sagrado',
    'physical': 'físico',
    'Orc Warrior': 'Guerreiro Orc',
    'Orc King': 'Rei Orc',
    'Dragon Lord': 'Senhor Dragão',
    'A common sewer rat. Weak but annoying.': 'Um rato comum de esgoto. Fraco, mas irritante.',
    'Venomous serpent. Quick strikes.': 'Serpente venenosa. Ataca rapidamente.',
    'Giant web-spinning arachnid.': 'Aracnídeo gigante que tece enormes teias.',
    'Pack hunter of the eastern woods.': 'Caçador de matilha das florestas orientais.',
    'Massive brown bear. Extremely tough.': 'Urso-pardo gigantesco. Extremamente resistente.',
    'Savage green-skinned warrior.': 'Guerreiro selvagem de pele verde.',
    'Elite orc with battle scars.': 'Orc de elite marcado por cicatrizes de batalha.',
    'Animated bones. Death damage.': 'Ossos animados. Causa dano de morte.',
    'Ethereal spirit. Physical attacks pass through.': 'Espírito etéreo. Ataques físicos atravessam seu corpo.',
    'Massive green brute. Regenerates HP.': 'Brutamontes verde gigantesco. Regenera Vida.',
    'Hellfire incarnate. Fire damage.': 'Fogo infernal encarnado. Causa dano de fogo.',
    'Ruler of the orc horde. Commands legions.': 'Governante da horda orc. Comanda legiões.',
    'Undead sorcerer of immense power.': 'Feiticeiro morto-vivo de poder imenso.',
    'Ancient wyrm. The ultimate challenge.': 'Dragão ancestral. O desafio supremo.',
    'Town outskirts': 'Arredores da cidade',
    'Forest (NW)': 'Floresta (NO)',
    'Eastern Forest': 'Floresta Oriental',
    'Southern Wastes': 'Ermos do Sul',
    'Graveyard (SE)': 'Cemitério (SE)',
    'Orc Fortress': 'Fortaleza Orc',
    'Crypt (SE)': 'Cripta (SE)',
    'Dragon Lair (SE)': 'Covil do Dragão (SE)',
    'Cheese': 'Queijo',
    'Snake Skin': 'Pele de Serpente',
    'Spider Silk': 'Seda de Aranha',
    'Meat': 'Carne',
    'Bear Paw': 'Pata de Urso',
    'Orc Tooth': 'Dente de Orc',
    'Bone': 'Osso',
    'Ectoplasm': 'Ectoplasma',
    'Troll Hide': 'Couro de Troll',
    'Demon Horn': 'Chifre de Demônio',
    'Crown': 'Coroa',
    'Lich Staff': 'Cajado de Lich',
    'Dragon Scale': 'Escama de Dragão',
    'Magic Rune': 'Runa Mágica',

    # Character/equipment surface
    'Unknown': 'Desconhecido',
    'Head': 'Cabeça',
    'Neck': 'Pescoço',
    'Back': 'Costas',
    'Chest': 'Peitoral',
    'Hands': 'Mãos',
    'Ring L': 'Anel E',
    'Waist': 'Cintura',
    'Ring R': 'Anel D',
    'Legs': 'Pernas',
    'Feet': 'Pés',
    'Relic': 'Relíquia',
    'empty': 'vazio',
    'Click to unequip': 'Clique para desequipar',
    'Close character panel': 'Fechar painel do personagem',
    'EQUIPMENT (13 SLOTS)': 'EQUIPAMENTO (13 ESPAÇOS)',
    'STATS': 'ATRIBUTOS',
    'COMBAT': 'COMBATE',
    'BONUSES': 'BÔNUS',
    'SPELL PROGRESSION': 'PROGRESSÃO DE MAGIAS',
    'SET BONUSES': 'BÔNUS DE CONJUNTO',
    'PASSIVE': 'PASSIVA',
    'Max HP': 'Vida Máx.',
    'Max MP': 'Mana Máx.',
    'Thorns': 'Espinhos',
    'Move Speed': 'Velocidade de Movimento',
    'XP Bonus': 'Bônus de XP',
    'Gold Bonus': 'Bônus de Ouro',
    'heal': 'cura',
    'dmg': 'dano',
    'Unlocks at Lv': 'Desbloqueia no Nv.',
    'Equip matching set pieces!': 'Equipe peças do mesmo conjunto!',
    'OFFICIAL BLESSING': 'BÊNÇÃO OFICIAL',
    "Blessing of Mor'ia active": "Bênção de Mor'ia ativa",
    'No official blessing active': 'Nenhuma bênção oficial ativa',
    'PROFESSIONS · SERVER': 'PROFISSÕES · SERVIDOR',
    'REPUTATION · SERVER': 'REPUTAÇÃO · SERVIDOR',
    'STAMINA · SERVER': 'VIGOR · SERVIDOR',
    'SKILLS · SERVER': 'HABILIDADES · SERVIDOR',
    'Town of Antica': 'Cidade de Antica',
    'Shop discount': 'Desconto na loja',
    'remaining': 'restantes',
    'miner': 'minerador',
    'herbalist': 'herbalista',
    'fisher': 'pescador',
    'BLESSINGS': 'BÊNÇÃOS',
    'PROFESSIONS': 'PROFISSÕES',
    'REPUTATION': 'REPUTAÇÃO',
})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            print(f'optional anchor not found in {path}: {old[:90]}')
    p.write_text(text, encoding='utf-8')


# Reusable vocation portrait: keep login cards compact and allow a larger character-sheet portrait.
Path('src/components/VocationPortrait.tsx').write_text("""import { useEffect, useRef } from 'react';
import { drawPixelHuman } from '../game/playerAvatar';

type PortraitSize = 'card' | 'hero';

export default function VocationPortrait({ id, color, active = false, size = 'card' }: { id: string; color: string; active?: boolean; size?: PortraitSize }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hero = size === 'hero';

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const colors = { head: '#d7a06b', primary: color, secondary: '#30394a', detail: '#d9c271' };
    drawPixelHuman(
      ctx,
      canvas.width / 2,
      canvas.height - (hero ? 9 : 6),
      hero ? 68 : 46,
      'down',
      id,
      colors,
      0,
      520,
      id,
    );
  }, [id, color, hero]);

  const frameSize = hero ? 'h-[116px] w-[108px]' : 'h-[76px] w-[72px]';
  const canvasSize = hero ? 'h-[116px] w-[108px]' : 'h-[76px] w-[72px]';

  return (
    <span className={`relative flex ${frameSize} shrink-0 items-end justify-center overflow-hidden rounded-xl border ${active ? 'border-amber-200/35 bg-amber-200/[0.055]' : 'border-white/8 bg-black/20'}`}>
      <span className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/35 blur-sm" />
      <span className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-amber-100/20 to-transparent" />
      <canvas
        ref={ref}
        width={hero ? 132 : 88}
        height={hero ? 144 : 92}
        className={`relative ${canvasSize} [image-rendering:pixelated]`}
        data-vocation-preview={id}
        aria-label={`Prévia visual: ${id}`}
      />
    </span>
  );
}
""", encoding='utf-8')


patch('src/components/Bestiary.tsx', [
    ("import { BESTIARY, getBestiaryProgress } from '../game/bestiary';", "import { BESTIARY, getBestiaryProgress } from '../game/bestiary';\nimport { t as tr } from '../i18n';"),
    ('<h2 className="moria-title text-2xl font-black">📖 Bestiary</h2>', '<h2 className="moria-title text-2xl font-black">📖 {tr(\'Bestiary\')}</h2>'),
    ('{completedCount}/{BESTIARY.length} mastered', "{completedCount}/{BESTIARY.length} {tr('mastered')}"),
    ('aria-label="Close bestiary"', "aria-label={tr('Close bestiary')}"),
    ('{category.icon} {category.name.toUpperCase()}', '{category.icon} {tr(category.name).toUpperCase()}'),
    ('>{entry.name}</span>', '>{tr(entry.name)}</span>'),
    ('>{entry.type}</span>', '>{tr(entry.type)}</span>'),
    ('📍 {entry.location}', '📍 {tr(entry.location)}'),
    ('{selectedEntry.category} · {selectedEntry.type}', '{tr(selectedEntry.category)} · {tr(selectedEntry.type)}'),
    ('>{selectedEntry.name}</div>', '>{tr(selectedEntry.name)}</div>'),
    ('Known habitat · {selectedEntry.location}', "{tr('Known habitat')} · {tr(selectedEntry.location)}"),
    ('“{selectedEntry.description}”', '“{tr(selectedEntry.description)}”'),
    ('>{icon} {label.toUpperCase()}</div>', '>{icon} {tr(label).toUpperCase()}</div>'),
    ('title={String(value)}>{value}</div>', "title={String(value)}>{typeof value === 'string' ? tr(value) : value}</div>"),
    ('style={{ color }}>{title}</div>', 'style={{ color }}>{tr(title)}</div>'),
    ('style={{ borderColor: `${color}40`, color }}>{item}</span>', 'style={{ borderColor: `${color}40`, color }}>{tr(item)}</span>'),
])


character = Path('src/components/CharacterPanel.tsx')
text = character.read_text(encoding='utf-8')
if "import VocationPortrait from './VocationPortrait';" not in text:
    text = text.replace(
        "import RoadToTenPlayerPanel926 from './RoadToTenPlayerPanel926';",
        "import RoadToTenPlayerPanel926 from './RoadToTenPlayerPanel926';\nimport VocationPortrait from './VocationPortrait';\nimport { t as tr } from '../i18n';",
        1,
    )
old_portrait = '''            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2"
                 style={{ background: `radial-gradient(circle, ${vocation?.color || '#8b2e2e'}40, rgba(0,0,0,0.3))`, borderColor: vocation?.color || '#8b2e2e', boxShadow: `0 0 20px ${vocation?.color || '#8b2e2e'}60` }}>
              {vocation?.icon || '⚔'}
            </div>'''
new_portrait = '''            <div className="relative shrink-0">
              <VocationPortrait id={player.vocation} color={vocation?.color || '#e5c477'} active size="hero" />
              <span className="absolute right-1 top-1 rounded-md border border-black/40 bg-black/55 px-1.5 py-0.5 text-sm shadow-lg">{vocation?.icon || '⚔'}</span>
            </div>'''
if old_portrait in text:
    text = text.replace(old_portrait, new_portrait, 1)

replacements = [
    ("{vocation?.name || 'Unknown'} · Level {player.level}", "{tr(vocation?.name || 'Unknown')} · {tr('Level')} {player.level}"),
    ('aria-label="Close character panel"', "aria-label={tr('Close character panel')}"),
    ('>{eq.name}</div>', '>{tr(eq.name)}</div>'),
    ('>{slot} · {eq.rarity}</div>', '>{tr(slot)} · {tr(eq.rarity)}</div>'),
    ('>Click to unequip</div>', ">{tr('Click to unequip')}</div>"),
    ('>{label} (empty)</div>', ">{tr(label)} ({tr('empty')})</div>"),
    ('<div className="text-[8px] text-amber-200/60 mt-0.5">{label}</div>', '<div className="text-[8px] text-amber-200/60 mt-0.5">{tr(label)}</div>'),
    ('>{spell.name}</div>', '>{tr(spell.name)}</div>'),
    ("spell.type === 'heal' ? 'heal' : 'dmg'", "spell.type === 'heal' ? tr('heal') : tr('dmg')"),
    ('`Unlocks at Lv ${spell.levelRequired}`', "`${tr('Unlocks at Lv')} ${spell.levelRequired}`"),
    ('>{set.name}</span>', '>{tr(set.name)}</span>'),
    ('>✓ {b.description}</div>', '>✓ {tr(b.description)}</div>'),
    ('>{vocation.passive}</div>', '>{tr(vocation.passive)}</div>'),
    ('>{b.name}</div>', '>{tr(b.name)}</div>'),
    ('>{b.description}</div>', '>{tr(b.description)}</div>'),
    ('className="capitalize text-amber-200/80">{name}</span>', 'className="capitalize text-amber-200/80">{tr(name)}</span>'),
    ('className="capitalize text-amber-200/80">{prof}</span>', 'className="capitalize text-amber-200/80">{tr(prof)}</span>'),
    ('>{faction.icon} {faction.name}</span>', '>{faction.icon} {tr(faction.name)}</span>'),
    ('>{level.name} · {value}</b>', '>{tr(level.name)} · {value}</b>'),
    ('>{icon} {label}</span>', '>{icon} {tr(label)}</span>'),
]
for old, new in replacements:
    if old in text:
        text = text.replace(old, new)
    elif new not in text:
        print(f'optional CharacterPanel anchor not found: {old[:90]}')
character.write_text(text, encoding='utf-8')

print("Mor'ia 9.29 character + bestiary PT-BR upgrade applied")
