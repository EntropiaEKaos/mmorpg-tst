# Mor'ia 9.6 — World Identity & City Designer

Mor'ia 9.6 torna as cidades e regiões reconhecíveis pela própria composição visual do mundo. A direção usa a legibilidade de MMORPGs 2D clássicos como referência — visão top-down, ruas fáceis de ler, landmarks, distritos e props — mas todos os nomes, presets, formas procedurais e assets permanecem originais de Mor'ia.

## Identidade urbana data-driven

Cada mapa pode publicar os seguintes campos através do Content Studio:

- `cityStyle`
- `cityAccent`
- `roofColor`
- `wallColor`
- `roadColor`
- `districts`
- `landmarks`
- `props`

O runtime normaliza esses campos no servidor e os projeta para o cliente junto das definições oficiais de mapa. O cliente não ganha autoridade sobre movimento, colisão, teleporte ou acesso ao mapa; a camada 9.6 é apresentação/conteúdo.

## 11 identidades de cidade

| Região | Estilo |
| --- | --- |
| Eldoria | Royal Capital |
| Sunreach Coast | Harbor City |
| Ironwood March | Frontier Stronghold |
| Frostpeak | Alpine Fortress |
| Shadowfen | Marsh Settlement |
| Emberhold | Forge Citadel |
| Crystal Deep | Crystal Enclave |
| Stormwatch Isle | Storm Bastion |
| Voidlands | Void Necropolis |
| Nightfall Citadel | Blacksteel Citadel |
| Astra Sanctum | Astral Sanctum |

Cada estilo possui paleta, distritos, landmarks e conjunto de decoração próprios. Exemplos incluem **Sunspire Keep**, **Temple of Dawn**, **Frostguard Keep**, **Lantern Market**, **Great Foundry**, **Crystal Spire**, **Thunderwatch** e **Black Obelisk**.

## City Designer

O antigo preview local de mapas foi substituído por `CityDesigner.tsx`, acessível no Game Editor. A ferramenta permite:

- selecionar um mapa;
- aplicar presets de identidade urbana;
- editar cores de arquitetura, telhados, vias e accent;
- mover o centro/radius urbano;
- clicar no preview para escolher coordenadas;
- adicionar/remover landmarks;
- adicionar/remover distritos;
- posicionar street props;
- aplicar a mudança imediatamente no mundo em Quick Play/offline;
- persistir o draft local no navegador.

No jogo conectado, os mesmos campos são editáveis no Content Studio autoritativo. O servidor valida os dados antes da publicação.

## Limites de integridade

Para evitar conteúdo corrompido ou payloads sem limite:

- até 8 distritos por mapa;
- até 12 landmarks por mapa;
- até 80 props por mapa;
- coordenadas limitadas à área jogável;
- dimensões de landmarks limitadas;
- cores em formato hexadecimal CSS;
- estilos, tipos de landmark e tipos de prop são whitelists.

## Minimap real

O minimapa 9.6 não desenha mais uma Eldoria hardcoded. Ele usa o `mapId` atual e apresenta:

- terreno real gerado pelo seed do mapa;
- biome/tiles;
- distritos;
- landmarks;
- portais;
- player;
- monstros/elites/bosses;
- nome do mapa.

O terreno do minimapa é memoizado por identidade de mapa para não regenerar a malha 80×80 a cada atualização da HUD.

## Arquitetura visual

A implementação foi separada em módulos:

- `src/game/cityIdentity.ts` — contratos, presets, paletas e defaults;
- `src/game/cityPresentation.ts` — buildings, props, roads, labels e minimap markers;
- `src/components/WorldMiniMap.tsx` — minimapa real;
- `src/components/CityDesigner.tsx` — editor visual;
- `server/engine/World.mjs` — normalização/projeção autoritativa;
- `server/engine/ContentStudio.mjs` — schema e validação semântica.

`GameScreen.tsx` permanece sob o guard arquitetural de 155 KB e apenas chama a camada de apresentação.

## Copyright / direção visual

A 9.6 não incorpora sprites, mapas ou recursos gráficos copiados de Tibia. O objetivo é alcançar a mesma classe de **clareza top-down e leitura espacial** através de uma linguagem visual original de Mor'ia.

## Screenshots

As capturas validadas da 9.6 são geradas executando o build real em navegador headless e ficam em `docs/screenshots/`. O README principal referencia as imagens da cidade e do City Designer depois da validação visual.
