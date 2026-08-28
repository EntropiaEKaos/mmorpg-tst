from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} anchor not found')
    return text.replace(old, new, 1)


CITY = Path('src/components/CityDesigner.tsx')
city = CITY.read_text(encoding='utf-8')

anchor = "const PROP_KINDS: CityProp['kind'][] = ['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune'];"
labels = anchor + r'''
const CITY_STYLE_PT_BR: Record<CityStyle, string> = {
  royal: 'Capital Real', harbor: 'Portuária', ironwood: 'Bosque de Ferro', alpine: 'Alpina', marsh: 'Pântano', forge: 'Forja',
  crystal: 'Cristalina', storm: 'Tempestade', void: 'Vazio', nightfall: 'Anoitecer', sanctum: 'Santuário',
};
const OPTION_LABELS: Record<string, string> = {
  nearby: 'Próximo', always: 'Sempre', hidden: 'Oculto',
  house: 'Casa', keep: 'Fortaleza', market: 'Mercado', temple: 'Templo', depot: 'Depósito', gate: 'Portão', forge: 'Forja', dock: 'Doca', arena: 'Arena', obelisk: 'Obelisco', library: 'Biblioteca', graveyard: 'Cemitério', lodge: 'Alojamento', tower: 'Torre',
  banner: 'Estandarte', lamp: 'Luminária', statue: 'Estátua', brazier: 'Braseiro', crystal: 'Cristal', grave: 'Túmulo', tent: 'Tenda', sign: 'Placa', barrel: 'Barril', cart: 'Carroça', pine: 'Pinheiro', mushroom: 'Cogumelo', anchor: 'Âncora', rune: 'Runa',
};
const TOOL_LABELS: Record<Tool, string> = { select: 'SELEÇÃO', landmark: 'CONSTRUIR', district: 'DISTRITO', prop: 'OBJETO' };
const SETTLEMENT_LABELS: Record<string, string> = { wilderness: 'ERMO', town: 'VILA', city: 'CIDADE', capital: 'CAPITAL' };
const optionLabel = (value: string) => OPTION_LABELS[value] || value;
'''
city = replace_once(city, anchor, labels, 'City Designer PT-BR label maps')

replacements = {
    "useState('New House')": "useState('Nova Casa')",
    "useState('New District')": "useState('Novo Distrito')",
    "|| 'Landmark'": "|| 'Marco'",
    "|| 'District'": "|| 'Distrito'",
    "name: `${source.name} Copy`": "name: `${source.name} Cópia`",
    'return <div className="grid gap-3 xl:grid-cols-[330px_minmax(420px,1fr)_350px]">': 'return <div data-city-designer-root="true" className="grid gap-3 xl:grid-cols-[330px_minmax(420px,1fr)_350px]">',
    'CITY DESIGNER · DIRECT MANIPULATION': 'DESIGNER DE CIDADE · EDIÇÃO DIRETA',
    'Place, select, drag and resize real authoritative building footprints.': 'Posicione, selecione, arraste e redimensione áreas autoritativas de construções.',
    '>Map<select data-city-designer-map-select': '>MAPA<select data-city-designer-map-select',
    '>City style<select value={draft.cityStyle}': '>ESTILO DA CIDADE<select value={draft.cityStyle}',
    '{CITY_STYLE_LABELS[style]}': '{CITY_STYLE_PT_BR[style] || CITY_STYLE_LABELS[style]}',
    '<ColorField label="Accent"': '<ColorField label="Destaque"',
    '<ColorField label="Roof"': '<ColorField label="Telhado"',
    '<ColorField label="Walls"': '<ColorField label="Paredes"',
    '<ColorField label="Road"': '<ColorField label="Vias"',
    'WORLD LABEL POLICY': 'POLÍTICA DE RÓTULOS DO MUNDO',
    'SelectMini label="NPC labels"': 'SelectMini label="Rótulos de NPCs"',
    'NumberField label="NPC distance"': 'NumberField label="Distância de NPCs"',
    'SelectMini label="Monster labels"': 'SelectMini label="Rótulos de monstros"',
    'NumberField label="Monster distance"': 'NumberField label="Distância dos monstros"',
    'NumberField label="HP bar distance"': 'NumberField label="Distância da barra de PV"',
    'NumberField label="Font"': 'NumberField label="Fonte"',
    'NumberField label="Bar width"': 'NumberField label="Largura da barra"',
    'NumberField label="Boss scale ×10"': 'NumberField label="Escala de chefe ×10"',
    'Check label="Monster level"': 'Check label="Nível dos monstros"',
    'Check label="HP values"': 'Check label="Valores de PV"',
    'Check label="Boss always"': 'Check label="Chefes sempre visíveis"',
    '>APPLY TO WORLD</button>': '>APLICAR AO MUNDO</button>',
    '>RESET LOCAL</button>': '>REDEFINIR LOCAL</button>',
    "{tool === 'select' ? 'Select and drag footprints directly' : `Click map to place ${tool}`}": "{tool === 'select' ? 'Selecione e arraste áreas diretamente' : `Clique no mapa para posicionar ${TOOL_LABELS[tool].toLowerCase()}`}",
    "{(draft.settlementClass || 'city').toUpperCase()}": "{SETTLEMENT_LABELS[draft.settlementClass || 'city'] || String(draft.settlementClass || 'city').toUpperCase()}",
    "{draft.landmarks.length}/{landmarkLimit} buildings · {occupancy} blocked tiles": "{draft.landmarks.length}/{landmarkLimit} construções · {occupancy} tiles bloqueados",
    ' · drag to move': ' · arraste para mover',
    "{entry === 'landmark' ? 'BUILD' : entry}": "{TOOL_LABELS[entry]}",
    'TextField label="Building name"': 'TextField label="Nome da construção"',
    'SelectMini label="Building kind"': 'SelectMini label="Tipo da construção"',
    'Click the map: houses default to 3×3 and can be resized after placement.': 'Clique no mapa: casas começam em 3×3 e podem ser redimensionadas após o posicionamento.',
    'TextField label="District name"': 'TextField label="Nome do distrito"',
    'SelectMini label="Prop preset"': 'SelectMini label="Objeto predefinido"',
    'SELECTED BUILDING': 'CONSTRUÇÃO SELECIONADA',
    'TextField label="Name"': 'TextField label="Nome"',
    'SelectMini label="Kind"': 'SelectMini label="Tipo"',
    '>DUPLICATE</button>': '>DUPLICAR</button>',
    '>DELETE</button>': '>EXCLUIR</button>',
    'SELECTED DISTRICT': 'DISTRITO SELECIONADO',
    'NumberField label="Radius"': 'NumberField label="Raio"',
    'SELECTED PROP': 'OBJETO SELECIONADO',
    'Click a building, district or prop to inspect it. Drag it directly on the map. Building width/height update the same collision footprint used by the server.': 'Clique em uma construção, distrito ou objeto para inspecioná-lo. Arraste diretamente no mapa. A largura e a altura da construção atualizam a mesma área de colisão usada pelo servidor.',
}
for old, new in replacements.items():
    if old not in city:
        raise SystemExit(f'City Designer polish anchor not found: {old}')
    city = city.replace(old, new)

old_select = "function SelectMini({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className=\"block text-[9px] text-purple-200/60\">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className=\"mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100\">{options.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>; }"
new_select = "function SelectMini({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className=\"block text-[9px] text-purple-200/60\">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className=\"mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100\">{options.map((x) => <option key={x} value={x}>{optionLabel(x)}</option>)}</select></label>; }"
city = replace_once(city, old_select, new_select, 'City Designer translated option labels')

for forbidden in ['CITY DESIGNER · DIRECT MANIPULATION', 'RESET LOCAL', 'Select and drag footprints directly', 'SELECTED BUILDING', '>DUPLICATE</button>']:
    if forbidden in city:
        raise SystemExit(f'City Designer English UI leak remains: {forbidden}')
for required in ['DESIGNER DE CIDADE · EDIÇÃO DIRETA', 'Capital Real', 'Próximo', 'data-city-designer-root="true"']:
    if required not in city:
        raise SystemExit(f'City Designer polish marker missing: {required}')
CITY.write_text(city, encoding='utf-8')


VISUAL = Path('src/visualQa.tsx')
visual = VISUAL.read_text(encoding='utf-8')
old_minimap = '{panel === \'grand-minimap\' && <div className="relative z-10 flex min-h-screen items-center justify-center"><WorldMiniMap player={QA_GRAND_PLAYER} monsters={[]} mapId="qa_grand_capital" /></div>}'
new_minimap = '''{panel === 'grand-minimap' && <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-minimap-proof="true" className="rounded border border-amber-300/25 bg-black/65 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-amber-100">NOVA AURORIA · CAPITAL 160×160</div><div className="text-[10px] text-amber-100/55">Prova de escala · jogador 136,118 · Bastião do Horizonte 124,72</div></div><WorldMiniMap player={QA_GRAND_PLAYER} monsters={[]} mapId="qa_grand_capital" /></div></div>}'''
visual = replace_once(visual, old_minimap, new_minimap, 'grand minimap proof frame')
VISUAL.write_text(visual, encoding='utf-8')


CAPTURE = Path('tools/capture-moria-9-35b.mjs')
capture = CAPTURE.read_text(encoding='utf-8')
capture = replace_once(capture, "await page.screenshot({ path: `${output}/grand-minimap.png`, fullPage: true });", "const minimapProof = page.locator('[data-grand-minimap-proof=\"true\"]');\nawait minimapProof.screenshot({ path: `${output}/grand-minimap.png` });", 'focused minimap screenshot')
capture = replace_once(capture, "await page.screenshot({ path: `${output}/grand-city-designer.png`, fullPage: true });", "const designerRoot = page.locator('[data-city-designer-root=\"true\"]');\nconst designerText = await designerRoot.innerText();\nfor (const forbidden of ['CITY DESIGNER', 'DIRECT MANIPULATION', 'City style', 'RESET LOCAL', 'Select and drag', 'buildings', 'blocked tiles', 'SELECTED BUILDING', 'DUPLICATE', 'DELETE', 'Royal Capital', 'nearby']) {\n  if (designerText.includes(forbidden)) throw new Error(`9.35B.1 City Designer English visual leak: ${forbidden}`);\n}\nfor (const required of ['DESIGNER DE CIDADE', 'ESTILO DA CIDADE', 'Capital Real', 'Próximo', '160×160', 'CAPITAL', '3/64 construções']) {\n  if (!designerText.includes(required)) throw new Error(`9.35B.1 City Designer PT-BR proof missing: ${required}`);\n}\nawait designerRoot.screenshot({ path: `${output}/grand-city-designer.png` });", 'focused translated City Designer screenshot')
CAPTURE.write_text(capture, encoding='utf-8')


TEST = Path('server/test/grand-capital-client-9-35.test.mjs')
test = TEST.read_text(encoding='utf-8')
extra = r'''

test('9.35B.1 City Designer keeps internal IDs while presenting PT-BR authoring labels', () => {
  const source = read('src/components/CityDesigner.tsx');
  assert.match(source, /DESIGNER DE CIDADE · EDIÇÃO DIRETA/);
  assert.match(source, /OPTION_LABELS/);
  assert.match(source, /nearby: 'Próximo'/);
  assert.match(source, /data-city-designer-root/);
  assert.doesNotMatch(source, /CITY DESIGNER · DIRECT MANIPULATION/);
  assert.doesNotMatch(source, />RESET LOCAL<\/button>/);
});

test('9.35B.1 screenshot proof is tightly framed instead of full-page empty space', () => {
  const source = read('tools/capture-moria-9-35b.mjs');
  assert.match(source, /minimapProof\.screenshot/);
  assert.match(source, /designerRoot\.screenshot/);
  assert.doesNotMatch(source, /fullPage: true/);
});
'''
if '9.35B.1 City Designer keeps internal IDs' not in test:
    test += extra
TEST.write_text(test, encoding='utf-8')


DOC = Path('docs/MORIA_9_35_GRAND_CAPITAL_FOUNDATION.md')
doc = DOC.read_text(encoding='utf-8')
extra_doc = r'''

## 9.35B.1 — acabamento da prova visual

A revisão humana do primeiro artefato confirmou a geometria 160×160, mas rejeitou dois pontos de apresentação: o minimapa ocupava uma área muito pequena dentro de um screenshot de página inteira e o City Designer ainda expunha rótulos técnicos em inglês. Este passe não altera autoridade, IDs, enumerações ou dimensões.

O City Designer mantém valores internos como `nearby`, `always`, `hidden`, `house` e `keep`, porém apresenta labels PT-BR. Os screenshots passam a recortar exatamente o cartão de prova do minimapa e a raiz do editor, eliminando espaço vazio e tornando a inspeção humana útil. O Playwright também falha se os principais rótulos ingleses reaparecerem na superfície renderizada.
'''
if '## 9.35B.1 — acabamento da prova visual' not in doc:
    doc += extra_doc
DOC.write_text(doc, encoding='utf-8')

print("Mor'ia 9.35B.1 City Designer visual polish prepared")
