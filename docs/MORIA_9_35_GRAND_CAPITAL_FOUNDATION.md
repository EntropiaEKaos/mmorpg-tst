# Mor'ia 9.35 — Grand Capital Foundation

## 9.35A — contrato autoritativo

Este passe remove a suposição de que todo mapa do reino mede 80×80 sem alterar mapas legados. Mapas sem dimensões declaradas continuam exatamente em 80×80. Novos mapas podem declarar `width` e `height` entre 40 e 192 tiles; a escala-alvo para grandes capitais é 160×160.

### Novos contratos de mapa
- `width` / `height`: dimensões físicas autoritativas;
- `settlementClass`: `wilderness`, `town`, `city` ou `capital`;
- `urbanBounds`: retângulo da área urbana, separado do tamanho físico do mapa;
- `townRange`: continua limitado a 0–20 e representa alcance local de serviços, nunca o tamanho da capital.

### Orçamento de autoria
Mapas comuns preservam 8 distritos, 12 landmarks e 80 props. Capitais podem usar até 24 distritos, 64 landmarks e 320 props, landmarks de até 20×20 e distritos de raio até 24.

### Segurança espacial
Spawn, centro urbano, landmarks, distritos, props, NPCs, monstros e houses passam a respeitar as dimensões reais do mapa. Portais validam a origem contra o mapa de origem e o destino contra as dimensões reais do mapa de destino. O runtime também descarta portais cujo destino esteja fora da área jogável.

### Compatibilidade
Os mapas existentes continuam 80×80 se não declararem dimensões. Housing já consumia `map.width`/`map.height` no runtime e agora o Studio deixa de bloquear coordenadas válidas acima de 78 em mapas grandes.

## Gate 9.35A
A fundação é aceita somente com auditoria de segurança, typecheck/build do cliente, testes completos do servidor e novos testes de regressão para 80×80, 160×160, teto 192×192, housing/NPCs/monstros acima de 78 e portais entre mapas de tamanhos diferentes.

## Próximo passe — 9.35B
O cliente passa a consumir dimensões reais no `maps.ts`, minimapa e City Designer. Um mapa sintético 160×160 será renderizado e capturado antes de iniciar a 9.36 Grand Eldoria.


## 9.35B — cliente, minimapa e City Designer

O cliente agora preserva `width`, `height`, `settlementClass` e `urbanBounds` recebidos do servidor. `generateMap()` deixa de iterar pela constante histórica 80×80 e usa as dimensões reais do mapa selecionado, mantendo 80×80 como fallback compatível.

O minimapa deriva escala, altura, amostragem, marcadores e posição do jogador das dimensões reais. Para evitar explosão de DOM, a amostragem cresce de forma limitada em mapas maiores sem mudar coordenadas de gameplay.

O City Designer passa a usar largura/altura reais para cliques, arraste, footprints, grid, estradas e limites de coordenadas. Capitais reconhecem o mesmo orçamento do servidor: 24 distritos, 64 landmarks, 320 props, landmarks de até 20×20 e raio distrital até 24. A dimensão continua sendo propriedade do Studio/servidor; o editor visual não redimensiona mapas implicitamente.

### Prova visual 160×160
O harness cria `qa_grand_capital`, uma capital sintética 160×160 com conteúdo após a coordenada 120. O Playwright exige que `Bastião do Horizonte` e o jogador apareçam na metade distante do minimapa, e que o mesmo landmark apareça à direita do centro no City Designer. O screenshot só é aceito após essas verificações geométricas.

### Próximo passo — 9.36 Grand Eldoria
Com servidor e cliente dimension-aware, Eldoria pode ser expandida deliberadamente para 160×160 com distritos, muralhas, vias, landmarks, housing e serviços planejados como uma capital real, sem ampliar automaticamente as demais regiões.


## 9.35B.1 — acabamento da prova visual

A revisão humana do primeiro artefato confirmou a geometria 160×160, mas rejeitou dois pontos de apresentação: o minimapa ocupava uma área muito pequena dentro de um screenshot de página inteira e o City Designer ainda expunha rótulos técnicos em inglês. Este passe não altera autoridade, IDs, enumerações ou dimensões.

O City Designer mantém valores internos como `nearby`, `always`, `hidden`, `house` e `keep`, porém apresenta labels PT-BR. Os screenshots passam a recortar exatamente o cartão de prova do minimapa e a raiz do editor, eliminando espaço vazio e tornando a inspeção humana útil. O Playwright também falha se os principais rótulos ingleses reaparecerem na superfície renderizada.
