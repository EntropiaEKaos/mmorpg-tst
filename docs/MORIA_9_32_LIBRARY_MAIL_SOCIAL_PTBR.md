# Mor'ia 9.32 — Biblioteca, Correio, Social e Visual QA

## Objetivo

Fechar mais um bloco de superfícies visíveis ao jogador em PT-BR, mantendo intactos os contratos de dados e a autoridade do servidor.

## Escopo implementado

- Biblioteca: navegação, estado vazio, autoria, paginação, estado de leitura e conteúdo dinâmico passam pela camada de tradução.
- Correio: listagem, leitura, anexos, composição, datas pt-BR e conteúdo dinâmico passam pela camada de tradução.
- Social: navegação principal e campos dinâmicos de nível, mapa, cargo e itens passam pela camada de tradução; o catálogo cobre os textos estáticos do fluxo de amigos, grupo, guilda e troca.
- Acessibilidade: os fechamentos dos três painéis recebem `aria-label` localizado.
- Visual QA: `visual-qa.html` renderiza os componentes reais com fixtures determinísticas, sem alterar o fluxo normal do jogo.

## O que não mudou

- Nenhum ID de livro, correio, amizade, grupo, guilda ou troca.
- Nenhuma regra de servidor, custo, requisito, distância ou liquidação de trade.
- Nenhum formato persistido em localStorage ou snapshot do servidor.

## Validação obrigatória

O gate 9.32 exige:

1. auditoria de cobertura PT-BR;
2. `npm audit --audit-level=high`;
3. `npm run typecheck`;
4. `npm run build`;
5. limite estrutural de `GameScreen.tsx`;
6. auditoria, check e testes do servidor;
7. captura visual real dos componentes com Chromium/Playwright.

## Prints produzidos

O workflow publica o artefato `moria-9.32-screenshots` contendo:

- `library.png` — Biblioteca;
- `mail.png` — Correio;
- `social.png` — Salão Social.

Os PNGs são gerados pela build corrente, usando os componentes React reais. O harness de QA não é importado pelo `src/main.tsx` e não interfere no runtime normal do jogo.

## Próximo bloco sugerido

9.33: Inventário/Depot/Auction/Coin Shop, seguido de uma nova varredura de strings residuais e uma rodada de polish visual responsivo.


## 9.32.1 — Paridade do Visual QA

A primeira captura revelou que o harness isolado não carregava o `LocaleBridge` usado pelo `App.tsx`. O jogo normal já carregava essa camada, mas os screenshots ficaram parcialmente em inglês. A correção 9.32.1 faz o harness usar a mesma infraestrutura de locale do runtime real e adiciona uma barreira automática contra regressão: a captura falha se rótulos ingleses críticos reaparecerem em Biblioteca, Correio ou Social.

Isso transforma os prints em uma verificação funcional de localização, e não apenas em evidência visual.


## 9.32.2 — Fechamento explícito dos painéis

O gate visual da 9.32.1 foi mantido e deliberadamente não foi enfraquecido. Ele detectou que alguns rótulos estáticos ainda dependiam do bridge global de tradução. Nesta revisão, Biblioteca, Correio e Social passam a traduzir seus próprios rótulos críticos diretamente com `tr(...)`.

Também foi corrigido o assunto exibido na lista de correio, que ainda renderizava `m.subject` sem passar pelo catálogo. O objetivo é que cada painel seja corretamente localizado mesmo quando renderizado isoladamente em testes, Storybook futuro ou QA visual.

A captura continua falhando se os marcadores ingleses críticos reaparecerem. Portanto, screenshots e localização agora fazem parte do critério de aceite da versão, não apenas da documentação.


## 9.32.3 — Idempotência da tradução

A revisão humana dos PNGs 9.32.2 detectou `Guildaaa` no Salão Social. A causa não estava no componente Social, mas no fallback global: fragmentos de uma palavra eram substituídos por `split/join`, fazendo `Guild` casar novamente dentro de `Guilda`.

O motor de localização agora aplica limites de palavra aos fragmentos alfanuméricos de uma palavra. Isso torna traduções como `Guild → Guilda` idempotentes e evita corrupção progressiva quando o `LocaleBridge`, Strict Mode ou uma nova renderização processam texto já localizado.

A mesma rodada:

- corrige singular/plural do contador do Correio (`1 não lida · 1 mensagem`);
- apresenta IDs de regiões com capitalização canônica em superfícies sociais;
- faz o visual QA reprovar `Guildaa` e o ID cru `eldoria`;
- mantém os três prints como critério obrigatório de aceite.
