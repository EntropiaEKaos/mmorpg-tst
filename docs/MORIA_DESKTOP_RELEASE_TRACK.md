# MOR'IA — Desktop Release Track (a partir de 12/10/2026)

## Decisão do produto — CONGELAMENTO MOBILE

**Desktop é o único alvo de evolução até o primeiro release jogável certificado do ISO Next.**
O mobile fica **congelado na linha Visual 2.7**. Não apagar, desabilitar nem reescrever o que já funciona: D-pad, HUD, modo online, shaders CSS e screenshots existentes. Desabilitar somente o investimento em features/polish mobile.

Mudanças em componentes compartilhados ainda não devem causar regressões mobile. Executar o E2E mobile completo **manualmente** quando necessário e obrigatoriamente antes de retomar mobile ou promover uma alteração compartilhada para produção.

### Processo de desenvolvimento

1. **Um foco:** jornada de jogador desktop online, end-to-end, no servidor autoritativo. Não abrir PRs de apenas estética mobile.
2. **Gates rápidos em cada PR:** TypeScript, build, npm audit, testes servidor, smoke Chromium **DESKTOP** real (login HTTP+WebSocket, movimentação, cenário, HUD/paineis, logout). A suíte completa mobile/desktop permanece disponível sob acionamento manual.
3. **Sem falso pronto:** 408 testes do backend comprovam regressões cobertas, **não** conclusão de todos os fluxos ISO, balanceamento, infraestrutura, simultaneidade ou deploy.
4. **Produção intocada** até fechamento dos PRs encadeados #26–34, certificação do release candidate, rollback e aceite explícito.
5. Nenhuma imagem stock, ilustrativa ou IA deve ser identificada como screenshot MOR'IA. Somente capturas do cliente executado em Chromium real.
6. Não mensurar FPS do jogo através de contador de render calls. Benchmark GPU físico é gate separado.

## O gargalo atual

O backend autoritativo tem sistemas registrados e tests; o cliente ISO Next tem HUD, 17 janelas especializadas, hotbar, cast, ataque, diálogo, inventário/equipamento, chat, quests, viagem e comércio, mas o teste de navegador existente cobria majoritariamente **montagem do renderer, login, movimentação, câmera e logout**. Ainda não há evidência E2E integrada de progressão/loot/combat/quest/reconnect como uma jornada contínua.

## Prioridades de entrega — desktop

| Ordem | Trabalho | Evidência exigida | Estado inicial |
|---|---|---|---|
| P0 | **Desktop journey E2E**: criar conta+personagem; login; mover; abrir inventário, quest e skills; comandos/cooldowns; logout/login | CI Chromium, screenshots reais e eventos server-owned | EM EXECUÇÃO |
| P0 | **Combate/loot real no ISO**: selecionar alvo; atacar/conjurar; HP/cooldown; XP; ground loot; coleta | 2 clientes/estado servidor quando aplicável; sem client-authority | NÃO CERTIFICADO |
| P0 | **Missões e progressão**: NPC → aceitar quest → objetivo → finalizar → recompensa → relogar | estado persistido e recompensa única | NÃO CERTIFICADO |
| P0 | **Inventário/equipamento/economia**: loot, usar item, equipar, shop, banco, gold persistente | testes contra ações oficiais + UI + idempotência | NÃO CERTIFICADO |
| P1 | **Multiplayer desktop**: duas contas visíveis, posição/target/combat sincronizados; reconnect | dois navegadores, servidor real isolado | NÃO CERTIFICADO |
| P1 | **Viagem e mapa**: destinos liberados, transição, NPC/colisão por região, HUD e câmera | jornadas em mapas reais e rerender após viagem | NÃO CERTIFICADO |
| P1 | **Conteúdo jogável**: início/meio/fim de progressão, encontros, lojas, quests coerentes, checkpoints | plano de playtest com data + bugs e severidade | NÃO CERTIFICADO |
| P1 | **Estabilidade do backend**: restore, migration, backup, 2+ sessões, exploits, 24h soak | runbook executado, métricas, recuperação | NÃO CERTIFICADO |
| P2 | **Desktop visual polish**: arte/material legíveis em escala real, feedback de combate, performance GPU e acessibilidade | capturas reais e profiler GPU físico | EM PROGRESSO |
| P3 | **Retomar mobile** (pós-release desktop) | plano e novo ciclo de QA mobile | CONGELADO |

Estados são de **evidência de integração desktop**, não afirmação de que o backend não tenha a funcionalidade. Atualizar para PASS somente depois da prova exigida.

## Definição de pronto para desktop

Não promover a release enquanto faltar qualquer P0 e sem pelo menos: E2E com jornada real sem fake/offline, regressão desktop, 2 jogadores reais, retomada de sessão, persistência+backup/restore testados, taxas de erro, checklist segurança, servidor hospedado, playtest humano, comparações visuais do jogo e FPS em hardware físico.

### Políticas de CI

- Workflow ISO Browser Smoke em PR: `MORIA_DESKTOP_ONLY=1`.
- Mesmo workflow em `workflow_dispatch`: `MORIA_DESKTOP_ONLY=0`, retendo teste desktop+mobile inteiro.
- **O mobile está congelado, não apagado**; regressão completa deve ser acionada manualmente antes de merges arriscados ou retomada.
- O teste mobile online no Visual 2.7 foi intermitente na primeira tentativa e passou na segunda. Esta pendência continua aberta: https://trello.com/c/qIEOLbHQ/20-moria-qa-eliminar-flakiness-do-toque-online-antes-do-merge.

## Fase de merge

Esta branch parte do head #34, que por sua vez acumula PRs draft #26–34 (todos com base `master`). Não realizar merges arbitrários e não publicar o frontend da Vercel como se fosse o realm backend online. Auditar dependências, rearbase/squash e provar versão exata antes de qualquer lançamento.
