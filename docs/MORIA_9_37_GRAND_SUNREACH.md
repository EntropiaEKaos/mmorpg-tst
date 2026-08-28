# Mor'ia 9.37 — Grand Sunreach Coast

## Objetivo

A segunda capital gigante não reutiliza a malha real de Eldoria. Sunreach passa a ser uma capital marítima 160×160 governada por um plano urbano explícito `harbor-crescent`, sincronizado pelo servidor e reproduzido pelo cliente.

## Topologia autoritativa

- mapa 160×160; centro urbano em 80,70 e chegada em 80,78;
- 12 distritos, 20 marcos maiores e 18 volumes menores de moradia/armazéns, totalizando 38 footprints colidíveis;
- costa curva calculada a partir do centro, com mar não caminhável ao sul;
- quatro píeres `bridge` caminháveis, cais curvo e quebra-mar com canal central aberto;
- muralha apenas no lado terrestre, com estrada real ao norte e acesso de Ironwood a leste;
- mercado de sal, Liga Livre, capela marítima, estaleiro, alfândega, depósito da frota, guilda de pescadores, farol e bairros de armazéns;
- arquitetura menor usa `showOnMinimap:false` para preservar legibilidade.

## Migração

`GRAND_CAPITAL_SCHEMA_VERSION = 3`. Instalações na versão 2 reaplicam a migração idempotente de Eldoria e executam Sunreach. Somente o layout 80×80 com coordenadas legadas exatas é expandido. Dimensões, arquitetura, NPCs, monstros, nodes ou portais alterados pelo administrador não são sobrescritos.

O portal de Eldoria que chega a Sunreach é movido de 40,68 para 80,24 apenas quando ainda mantém o destino legado. Os três NPCs regionais, seis spawns do pack alpha e o node econômico também são movidos somente a partir de suas posições conhecidas.

## Paridade

O campo `urbanPlan` passa pelo ContentDB/World e chega ao cliente. `harborShoreY` e `harborCapitalTile` usam os mesmos marcadores e constantes nos dois lados. O gate 9.37A exige typecheck/build, auditoria, teste focado e suíte completa antes do commit automático.


## 9.37B — Prova visual autoritativa

A aceitação visual usa o servidor real em banco temporário e o renderer de produção. São capturados minimapa, City Designer e panorâmica da área portuária. O gate exige 160×160, 12 distritos, 38 footprints, Farol no setor sudeste e uma quantidade mínima de pixels azuis na panorâmica para impedir que a bacia marítima desapareça por regressão de renderização.
