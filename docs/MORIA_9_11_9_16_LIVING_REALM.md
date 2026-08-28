# Mor'ia 9.11–9.16 — The Living Realm

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
