from pathlib import Path

readme = Path('README.md')
s = readme.read_text(encoding='utf-8')
s = s.replace("Versão atual: Mor'ia 9.26.1 — Road to 10 Candidate", "Versão atual: Mor'ia 9.27 — Deep Visual Revamp")
anchor = "## ✦ Mor'ia 9.17–9.26.1 — Road to 10"
assert anchor in s, 'README insertion anchor not found'
section = r'''## 🎨 Mor'ia 9.27 — Deep Visual Revamp

A **9.27** é uma reforma gráfica profunda e exclusivamente de apresentação, construída antes da Road to 10 para elevar o mundo sem transferir autoridade do servidor para o cliente. O visual clássico/pixel foi preservado, mas recebeu uma nova camada de profundidade: materiais menos planos, arquitetura 2.5D, sombras de contato, vegetação em massas, silhuetas mais presentes, acabamento cinematográfico por bioma e uma revisão completa da leitura de HUD, inventário e combate.

O mundo agora combina **micro-bevel e variação estável por coordenada nos tiles**, água/lava com acabamento vivo, fachadas com plano lateral, fundação e sombra de beiral, telhados com oclusão de primeiro plano, árvores com sombra de copa e props urbanos ancorados ao chão. Lampiões, braseiros e cristais possuem halos emissivos preservando o núcleo pixelado; a intensidade reage à escuridão de apresentação e produz um reflexo curto no piso durante a noite.

Clima também passou a alterar a leitura material. **Rain/Storm** aplicam resposta molhada, brilho especular discreto e gradação fria; tempestades ganham pressão atmosférica e exposição rara de relâmpago. O passe continua estritamente visual: não altera colisão, combate, economia, movimentação, IA ou qualquer estado autoritativo.

O combate recebeu VFX extraídos para módulo próprio, com trails e partículas aditivas, enquanto `GameScreen.tsx` permanece dentro do budget arquitetural e o contrato histórico de escala de sprites da 9.7 é preservado. A interface mantém `prefers-reduced-motion` e a revisão real em Chromium terminou sem erros de console/página.

### Entrada — direção dark-fantasy

![Mor'ia 9.27 login revamp](docs/screenshots/moria-9-27-login-revamp.png)

### Eldoria — dia claro

![Mor'ia 9.27 world day](docs/screenshots/moria-9-27-world-day.png)

### Eldoria — noite e iluminação urbana

![Mor'ia 9.27 world night](docs/screenshots/moria-9-27-world-night.png)

### Eldoria — tempestade e superfícies reativas

![Mor'ia 9.27 world storm](docs/screenshots/moria-9-27-world-storm.png)

### Inventário + HUD

![Mor'ia 9.27 inventory HUD](docs/screenshots/moria-9-27-inventory-hud.png)

> Evidência visual versionada no próprio repositório: **todo print final de evolução deve entrar no README antes do merge**. A 9.27 fecha com uma matriz determinística de cinco capturas reais em Chromium.

Detalhes técnicos e limites de autoridade: **[Mor'ia 9.27 — Deep Visual Revamp](docs/MORIA_9_27_DEEP_VISUAL_REVAMP.md)**.

---

'''
s = s.replace(anchor, section + anchor, 1)
readme.write_text(s, encoding='utf-8')

doc = Path('docs/MORIA_9_27_DEEP_VISUAL_REVAMP.md')
doc.write_text(r'''# Mor'ia 9.27 — Deep Visual Revamp

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
''', encoding='utf-8')
print('Prepared Mor\'ia 9.27 release documentation')
