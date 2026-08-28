# Mor'ia 9.43 — Grand Stormwatch Isle

## 9.43A — Capital autoritativa
Stormwatch Isle deixa de ser um assentamento legado 80×80 e passa a ser uma capital 160×160 de nível 44 com `urbanPlan: tempest-archipelago` e schema global de capitais 9.

A identidade urbana usa seis massas insulares assimétricas, mar dominante, costas rochosas bloqueadoras e causeways estreitos que ligam a Frota Norte, o cais de Crystal Deep, Thunderwatch, os bairros do sul e o esporão de Nightfall ao Olho da Tempestade. A geometria é determinística e compartilhada por servidor e cliente.

Conteúdo: 12 distritos, 42 edifícios autoritativos (20 maiores + 22 menores), três portais canônicos e quatro acessos físicos. As rotas históricas Emberhold → Stormwatch, Crystal Deep → Stormwatch e Nightfall → Stormwatch são migradas apenas quando ainda possuem as coordenadas exatas do seed legado.

NPCs, monstros e `node_stormwatch` também usam migração exact-default-only. Geometria ou coordenadas editadas por administradores não são sobrescritas.


## 9.43B — Prova visual autoritativa
A validação visual usa o mesmo `generateMap`, `drawTile`, `drawBuilding`, minimapa e City Designer do cliente de produção, sincronizados com `/admin/api/maps` do servidor autoritativo. O tile lógico não muda; a variante cosmética `storm` fornece mar profundo com whitecaps, costa de ardósia molhada, neve castigada por granizo e causeways metálicos.

O gate captura minimapa, Designer e panorâmica, mede os contadores reais de mar/pontes/rocha/neve/caminhos e também inspeciona a paleta de pixels para impedir regressão a água tropical ou superfície clara genérica.


## Provas versionadas no checkpoint

- [Minimapa](screenshots/moria-9-43-stormwatch-minimap.png)
- [City Designer](screenshots/moria-9-43-stormwatch-city-designer.png)
- [Panorâmica](screenshots/moria-9-43-stormwatch-panorama.png)
