# Mor'ia 9.36 — Grand Eldoria

## 9.36A — autoridade, migração e geometria urbana

Eldoria deixa de ser uma praça de 80×80 e passa a ser a primeira capital real do alpha: **160×160**, `settlementClass=capital`, centro em 80,80 e área urbana muralhada declarada por `urbanBounds`.

A expansão não é um scale automático. O layout possui mais de dez distritos, dezesseis landmarks autoritativos, dezenas de props, cinco portões e uma malha de avenidas principais, secundárias e anel interno. Dentro da área urbana, o gerador produz `floor/path`; a borda produz muralha sólida, mas portais e chegadas autoritativas continuam abrindo passagens caminháveis. Fora da muralha permanece o bioma de planícies.

### Migração segura

`grandCapitalVersion` é um marcador separado das versões legadas de ContentDB. A migração só transforma Eldoria quando suas dimensões ainda são as históricas 80×80 (ou quando já está explicitamente 160×160). Coordenadas de NPCs, monstros, houses, Node e portais só são movidas quando coincidem **exatamente** com os defaults antigos conhecidos. Qualquer coordenada, arquitetura ou dimensão editada pelo administrador é preservada.

As chegadas de Frostpeak, Sunreach, Ironwood, Shadowfen e Astra Sanctum também são reposicionadas para os novos portões, evitando teleporte para o antigo quadrante central.

### Housing e serviços

Os três lotes residenciais iniciais de Eldoria são redistribuídos por bairros sem sobreposição com landmarks. O gate 9.36A valida seus footprints e entradas contra o `HousingSystem` real. Serviços deixam de ficar concentrados no quadrante 40×40 e passam a ocupar mercado, biblioteca, guilda, estábulos, alfaiataria e magistratura.

### Paridade cliente/servidor

A regra de cidade muralhada é implementada com os mesmos eixos (±28) e anel interno (14 tiles) no gerador autoritativo e na predição do cliente. O 9.36A inclui teste explícito contra divergência dessa fórmula.

## Próximo passe — 9.36B

A prova visual usará a Eldoria real, não a capital sintética: minimapa, City Designer e uma visão panorâmica gerada com `generateMap`, `drawTile` e `drawBuilding` de produção. O passe só será encerrado após screenshots e revisão humana.
