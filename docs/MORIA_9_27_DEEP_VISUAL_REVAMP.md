# Mor'ia 9.27 — Deep Visual Revamp

## Objetivo

A 9.27 é uma evolução visual profunda anterior à 10.0. A regra central é simples: **melhorar apresentação sem alterar autoridade de gameplay**. Todos os efeitos desta linha são derivados de estado já existente e desenhados no cliente.

## Direção de arte

- preservar a leitura clássica/pixel-first do Mor'ia;
- aumentar separação entre terreno, atores, props e arquitetura;
- usar volume por composição, sombra e materialidade em vez de trocar o jogo por arte vetorial genérica;
- manter combate e UI legíveis em dia, noite e clima severo;
- evitar bloom excessivo e pós-processamento que apague o pixel art.

## Mundo e materiais

`src/game/render.ts` recebe acabamento material orientado por coordenadas do mundo. Grass, caminhos, pisos e elementos naturais deixam de repetir apenas um tile plano: patches, desgaste, micro-bevels e detalhes determinísticos quebram a repetição sem alterar a malha autoritativa.

Árvores usam copa em clusters e sombras de contato em camadas. Edifícios ganham fachada 2.5D com plano lateral, fundação, ambient occlusion, beiral e janelas recuadas. O passe de oclusão de telhado continua sendo apenas composição visual.

## Atmosfera, clima e noite

`src/game/worldVisualRevamp927.ts` é o acabamento cinematográfico screen-space. Ele aplica gradação por bioma, luz direcional, motes, fog de biomas específicos e vinheta. Rain/Storm acrescentam resposta molhada e glints especulares; Storm também escurece a pressão atmosférica e pode produzir exposição curta de relâmpago.

`src/game/cityPresentation.ts` mantém props pixelados, mas lampiões, braseiros e cristais recebem halo local emissivo. `GameScreen` repassa apenas o valor de escuridão de apresentação já existente; isso aumenta luz e floor bounce à noite sem criar estado paralelo.

## Personagens, monstros e combate

A escala histórica `PIXEL_SPRITE_SCALE = 1.30` é preservada. A presença dos atores é aumentada por composição, sombra e proporção no renderer. VFX de combate ficam em `src/game/combatVfx927.ts`, extraídos do orquestrador: projéteis e partículas podem usar composição aditiva sem transferir cálculo de dano ou decisão de combate ao cliente.

## UI / HUD

A 9.27 consolida superfícies escuras, metal/vidro, bordas e contraste de slots, mantendo o mundo visível sob janelas e modais. O inventário foi revisado junto do HUD e continua funcionando sobre a mesma lógica preexistente. Motion decorativo respeita `prefers-reduced-motion`.

## Limites de autoridade

A linha visual não deve possuir chamadas de autoridade (`serverSync`, intents oficiais, `fetch` ou `WebSocket`) dentro dos módulos de acabamento. Colisão, movimento, teleporte, IA, economia, combate e persistência continuam fora desta camada.

## Gates de qualidade

A release é fechada somente depois de:

- `npm audit` cliente e servidor;
- TypeScript sem erros;
- build Vite de produção;
- syntax check server-side;
- suíte server-side completa;
- budget de `GameScreen` preservado;
- captura real em Chromium sem erros de console/página;
- cinco screenshots finais versionados no README;
- remoção dos applicators/workflows de release antes do PR final.

## Evidência visual final

- `docs/screenshots/moria-9-27-login-revamp.png`
- `docs/screenshots/moria-9-27-world-day.png`
- `docs/screenshots/moria-9-27-world-night.png`
- `docs/screenshots/moria-9-27-world-storm.png`
- `docs/screenshots/moria-9-27-inventory-hud.png`
