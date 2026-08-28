from pathlib import Path
import shutil

CAPTURE = Path('/tmp/moria916-capture')
SHOTS = [
    'moria-9-16-gameplay.png',
    'moria-9-16-living-nodes.png',
    'moria-9-16-factions.png',
    'moria-9-16-chronicle.png',
    'moria-9-16-grand-crafting.png',
    'moria-9-16-taming-breeding.png',
]

out = Path('docs/screenshots')
out.mkdir(parents=True, exist_ok=True)
for name in SHOTS:
    src = CAPTURE / name
    if not src.exists() or src.stat().st_size == 0:
        raise SystemExit(f'missing screenshot: {name}')
    shutil.copy2(src, out / name)

readme = Path('README.md')
s = readme.read_text()
s = s.replace("<p><b>Versão atual: Mor'ia 9.10 — Elemental Reactions</b></p>", "<p><b>Versão atual: Mor'ia 9.16 — The Living Realm</b></p>")
section = """## 🏰 Mor'ia 9.11–9.16 — The Living Realm

A linha **Living Realm** transforma regiões em estruturas persistentes e disputáveis. Os **Living Nodes** evoluem por atividade real do servidor; facções são escolhidas durante a aventura; guerras passam por preparação, cerco, ocupação e recuperação; o **Mor'ia Chronicle** registra fatos do servidor; o **Grand Crafting** cria cadeias produtivas e qualidade de item; e o sistema de **Beast Taming & Breeding** exige criaturas reais próximas e gera animais persistentes com herança de atributos.

Tudo atravessa o `OfficialActionGateway`, snapshots públicos filtrados e o estado persistente oficial. A interface de jogador usa intents do servidor para facção, doações, guerra, crafting e doma; o **Living Realm Director 9.16** oferece uma visão editorial separada sem transferir autoridade ao cliente.

### Gameplay real — Mor'ia 9.16

![Mor'ia 9.16 gameplay](docs/screenshots/moria-9-16-gameplay.png)

### Living Nodes 9.11

![Mor'ia 9.16 Living Nodes](docs/screenshots/moria-9-16-living-nodes.png)

### Factions 9.12

![Mor'ia 9.16 Factions](docs/screenshots/moria-9-16-factions.png)

### Mor'ia Chronicle 9.14

![Mor'ia 9.16 Chronicle](docs/screenshots/moria-9-16-chronicle.png)

### Grand Crafting 9.15

![Mor'ia 9.16 Grand Crafting](docs/screenshots/moria-9-16-grand-crafting.png)

### Beast Taming & Breeding 9.16

![Mor'ia 9.16 Taming and Breeding](docs/screenshots/moria-9-16-taming-breeding.png)

Mais detalhes técnicos: **[Mor'ia 9.11–9.16 — The Living Realm](docs/MORIA_9_11_9_16_LIVING_REALM.md)**.

---

"""
marker = "## ⚡ Mor'ia 9.10 — Elemental Reactions"
if "## 🏰 Mor'ia 9.11–9.16 — The Living Realm" not in s:
    if marker not in s:
        raise SystemExit('README insertion marker missing')
    s = s.replace(marker, section + marker)
readme.write_text(s)

Path('docs/MORIA_9_11_9_16_LIVING_REALM.md').write_text("""# Mor'ia 9.11–9.16 — The Living Realm

## Objetivo

Transformar o mundo em um organismo persistente no qual atividade de jogadores altera desenvolvimento regional, alianças, guerra, memória histórica, economia produtiva e criaturas domesticadas.

## 9.11 — Living Nodes

- Nodes regionais persistentes com XP, treasury, supply, morale e HP.
- Estágios: Ruins, Camp, Settlement, Village, City, Fortress e Capital.
- Progressão derivada de ações autoritativas como combate e contribuições.
- Especializações e controle territorial permanecem data-driven.

## 9.12 — Factions

- Seis facções iniciais com identidade própria.
- Escolha de facção feita durante gameplay.
- Reputação/rank persistentes.
- Defecção com perda de reputação e cooldown político de 24 horas.

## 9.13 — Node Wars

- Fluxo de estado: Peace → Declared/Preparation → Siege → Occupied → Recovery.
- Declaração, ataque e claim passam pelo gateway autoritativo.
- Ataques exigem contexto válido do Node e do jogador.
- Siege Engineering e Battering Ram Kit participam do ecossistema de cerco.

## 9.14 — Mor'ia Chronicle

- Histórico server-side limitado e persistente.
- Registra guerras, evolução dos Nodes, bosses, crafts excepcionais, política e criaturas relevantes.
- O snapshot publica somente o histórico destinado ao cliente.

## 9.15 — Grand Crafting

- Cadeia: Gathering → Processing → Components → Master Craft.
- Qualidade deriva de materiais, skill, dificuldade, estação/Node, controle de facção e variação server-side limitada.
- Grades: Crude, Common, Fine, Masterwork, Epic e Relic.
- Reagentes Living Realm foram separados da tabela regional legada para preservar compatibilidade.

## 9.16 — Beast Taming & Breeding

- Doma exige espécie configurada e monstro compatível realmente próximo.
- Criaturas possuem temperament, strength, speed, endurance, intelligence, loyalty e wildness.
- Stable persistente com limite de segurança.
- Breeding herda atributos parentais dentro de limites e pode gerar mutações raras server-side.

## Arquitetura e compatibilidade

- `ContentDB.version` permanece em 3; Living Realm usa marcador aditivo próprio.
- `OfficialStateSchema` continua compatível com saves anteriores e normaliza os novos campos.
- Novas ações vivem no `OfficialActionRegistry`, evitando ampliar um handler monolítico.
- `GameScreen.tsx` permanece abaixo do teto de 155.000 bytes.
- O cliente envia intents; o servidor continua responsável por regras, proximidade, custos, progressão e persistência.

## Gate 9.16

O gate de produto executa audit de dependências, TypeScript, build Vite, syntax check server-side e toda a suíte Node. O gate visual adicional executa Chromium real, navega pelas superfícies Living Realm e falha em qualquer `console.error` ou `pageerror`.
""")

for name in SHOTS[1:]:
    if name not in readme.read_text():
        raise SystemExit(f'README screenshot reference missing: {name}')

print('Mor\'ia 9.16 screenshots and documentation finalized')
