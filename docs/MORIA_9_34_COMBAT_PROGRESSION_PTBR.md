# Mor'ia 9.34 — Progressão, Combate e Tooltips em PT-BR

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
