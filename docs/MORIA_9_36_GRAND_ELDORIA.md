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


## 9.36B — prova visual autoritativa

A aceitação visual de Grand Eldoria não usa uma cidade sintética. O `visual-qa.html` consulta o catálogo de mapas do servidor por uma sessão administrativa efêmera exclusiva do CI, sincroniza o mesmo registro usado pelo cliente e então produz três provas:

- minimapa real de Eldoria em 160×160, com geometria além do antigo limite 80;
- City Designer carregando os 16 marcos autoritativos e o orçamento de capital;
- panorama urbano renderizado com `generateMap`, `drawTile` e `drawBuilding` de produção, recortado pelos `urbanBounds` reais.

O workflow usa banco de conteúdo temporário para que a prova comece de uma instalação limpa, roda a suíte completa antes do navegador e publica os PNGs somente depois das asserções geométricas e de conteúdo.


## 9.36C — densidade urbana autoritativa

A revisão humana do primeiro panorama 9.36B detectou que a geometria monumental estava correta, porém a massa construída ainda parecia esparsa. A correção foi feita no mundo, não no screenshot.

Grand Eldoria v2 passa de 16 para 36 footprints arquitetônicos autoritativos. Vinte residências de bairro são `house` reais: bloqueiam movimento e visão pela mesma geometria consumida pelo servidor, aparecem no City Designer e são renderizadas pelo jogo. Elas usam `showOnMinimap:false` para que o minimapa continue legível.

A antiga camada `residentialRing` de apresentação foi desativada em Eldoria, eliminando casas visuais atravessáveis. A migração v2 só adiciona a malha residencial quando o conjunto 9.36A/B estiver exatamente intacto; qualquer arquitetura editada pelo administrador é preservada. Também foram removidos clamps 77/78 restantes de `cityPresentation.ts`, tornando edifícios e props ambientais dimension-aware para futuras capitais.


### 9.36C.1 — acabamento do City Designer

A revisão humana da prova 9.36C aprovou a densidade urbana, mas detectou compressão no rótulo **CONSTRUIR** da barra de ferramentas. A barra foi reorganizada de quatro colunas estreitas para uma grade 2×2, com alvos maiores, borda de estado e tipografia legível. A alteração é exclusivamente de apresentação do editor; IDs, ferramentas e autoridade do mapa permanecem inalterados.
