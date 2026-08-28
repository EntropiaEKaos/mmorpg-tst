# Mor'ia 9.34.1 — Visual Proof Hardening

## Motivo

A inspeção humana da primeira captura 9.34 encontrou dois problemas que o gate textual não detectou: a Árvore de Talentos ainda exibia `You have` em inglês e `actionbar.png` podia ser aceito mesmo com a barra fora do enquadramento. O endurecimento posterior provou que o slot estava habilitado e recebia foco; a fragilidade restante estava no acoplamento entre o trigger e o renderer singleton global no entrypoint isolado de QA.

## Correções

- adiciona `You have -> Você tem` ao catálogo PT-BR;
- fixa posição determinística da Action Bar somente no `visual-qa.html`;
- exige geometria real e enquadramento completo em 1440x1000;
- valida o título PT-BR sem depender da capitalização CSS;
- extrai `TooltipPortal`, preservando a renderização real no `body`;
- cada componente `T` passa a possuir o próprio estado de abertura e usa o portal compartilhado diretamente;
- remove o singleton obsoleto e mantém `GlobalTooltipRenderer` apenas como mount de compatibilidade;
- o trigger usa `onPointerEnter/onPointerLeave` e `onFocusCapture/onBlurCapture` diretamente no wrapper React, incluindo foco de controles filhos e eliminando a corrida entre render e `useEffect`;
- timers concorrentes são cancelados antes de novo agendamento;
- `data-tooltip-trigger`, `data-tooltip-open` e `data-tooltip-portal` fornecem contratos estruturais de QA sem alterar gameplay;
- a captura prova slot habilitado, `hover` real, estado local aberto, portal real no `document.body` e conteúdo real: `Fúria`, `ATALHO:`, `Custo de Mana:`, `Recarga:` e `COMBOS REATIVOS`;
- `You have` é vazamento proibido no print de Talentos.

## Escopo

Nenhuma regra de combate, cooldown, dano, progressão, talento, item ou autoridade do servidor é alterada. A mudança é de apresentação, acessibilidade e arquitetura do tooltip.

## Gate

A 9.34.1 só pode ser aprovada com auditoria PT-BR, typecheck/build, auditoria de dependências, 323 testes do servidor e quatro PNGs não vazios, seguidos de inspeção humana.

- O harness ancora a prova no wrapper real `[data-tooltip-trigger]` dentro da ActionBar e usa uma leitura DOM instantânea após o hover para evitar que o auto-wait do Playwright confunda reconciliação React com ausência do trigger.
- O QA revelou um bug real de compatibilidade: `buildSpellScalingBreakdown` podia desmontar a interface ao abrir um tooltip se um snapshot legado não tivesse `player.skills`. `skillLevel` agora trata `skills` ausente como catálogo vazio e mantém o fallback de nível 10.
- As asserções textuais respeitam a capitalização realmente renderizada pelos cabeçalhos técnicos (`ATALHO:` e `COMBOS REATIVOS`) sem reduzir a cobertura semântica do tooltip.
