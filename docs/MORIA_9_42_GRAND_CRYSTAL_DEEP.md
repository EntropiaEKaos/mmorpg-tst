# Mor'ia 9.42 — Grand Crystal Deep

## Objetivo

Transformar Crystal Deep em uma capital subterrânea 160×160 cuja forma urbana nasce da própria caverna, não de muralhas e quarteirões de superfície.

## Identidade

- 160×160, `capital`, nível 36;
- plano **`geode-chambers`**;
- 12 distritos e 42 construções;
- oito câmaras circulares principais conectadas por galerias estreitas;
- quatro acessos físicos de poço/elevador;
- três rotas históricas: Frostpeak, Shadowfen e Stormwatch;
- variante visual `crystal` aplicada somente no cliente a `wall`, `floor` e `path`, sem mudar colisão.

A maior parte da área urbana continua sendo rocha não caminhável. A circulação existe apenas dentro das câmaras escavadas e dos túneis calculados por distância a segmentos. Isso cria uma topologia oposta às capitais de superfície.

## Renderer e minimapa

O renderer ganhou materiais cristalinos para parede, piso e galeria. O minimapa também reconhece a variante e usa uma paleta fria violeta/ciano. O servidor continua vendo exatamente os mesmos tipos lógicos e regras de movimento.

## Migração

A migração é `exact-default-only`: geometria 80×80 e coordenadas históricas precisam coincidir com os defaults para serem promovidas. Geometria administrativa bloqueia a migração colateral. Frostpeak, Shadowfen e Stormwatch só recebem novos destinos quando ainda usam os alvos antigos conhecidos.

O schema global de Grandes Capitais avança para **8**. O gate 9.42A exige auditoria PT-BR, segurança npm, typecheck/build, teste focado e suíte completa. A aprovação visual fica reservada para o 9.42B com screenshots reais e inspeção humana.
