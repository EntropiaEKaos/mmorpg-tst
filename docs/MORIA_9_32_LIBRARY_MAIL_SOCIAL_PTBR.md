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
