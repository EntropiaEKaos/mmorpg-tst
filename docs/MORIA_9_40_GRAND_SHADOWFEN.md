# Mor'ia 9.40 — Grand Shadowfen

## 9.40A — Capital pantanosa autoritativa

Shadowfen deixa de ser um núcleo legado de 80×80 e passa a ser uma capital autoritativa de **160×160**, nível 20, com plano urbano `marsh-wards`.

### Identidade urbana

- 12 distritos com funções próprias.
- 42 construções autorais entre grandes marcos e palafitas menores.
- Corte do Pântano no centro político.
- Mercado das Lanternas, Casa dos Boticários e Pavilhão dos Caçadores.
- Capela Afogada e Necrópole das Águas Mortas.
- Grande Cais dos Barqueiros e rede de docas.
- Turfeiras, arena, quartel e jardins de ervas.
- Três canais sinuosos estruturam a cidade e são cruzados por passarelas, pontes e calçadas.
- O perímetro urbano usa água como fronteira natural, com acessos físicos seguros.

### Topologia distinta

`marsh-wards` não reutiliza a grade real, o porto crescente, os anéis florestais nem os terraços de Frostpeak. O gerador usa canais sinuosos por seno, corredores de palafitas, uma ilha/corte central e passarelas que viram `bridge` somente quando cruzam água. As margens recebem vegetação de brejo determinística sem bloquear as vias principais.

### Contrato de migração

A migração é **exact-default-only**. Apenas a Shadowfen legado 80×80 com coordenadas conhecidas é promovida. Dimensões, topologia, marcos e coordenadas criadas por administradores são preservadas. NPCs, monstros, casas, node regional e destinos de portais são movidos somente quando ainda estão exatamente nos defaults históricos.

### Integração

O plano `marsh-wards` é compartilhado por servidor, cliente e Content Studio. O `grandCapitalVersion` avança para **6**. Seeds novas já nascem com Grand Shadowfen e bancos existentes convergem pela mesma migração idempotente.


## 9.40B — Prova visual autoritativa

A prova visual usa o servidor real em `/admin/api/maps`, sincroniza `MAPS.shadowfen` e renderiza a mesma topologia do gameplay por `generateMap`, `drawTile` e `drawBuilding`.

O gate captura e valida três superfícies de produção:

- minimapa 160×160 com 12 distritos, 42 marcos e os quatro acessos físicos;
- City Designer selecionado em Shadowfen, mostrando o orçamento real `42/64 construções`;
- panorâmica da área urbana completa com contagens de água, pontes, caminhos e vegetação de brejo.

A aprovação humana exige que os três canais sejam legíveis, que pontes/passarelas criem circulação coerente, que a Corte do Pântano e os bairros em palafitas tenham escala de capital e que Shadowfen não pareça uma Eldoria apenas recolorida.
