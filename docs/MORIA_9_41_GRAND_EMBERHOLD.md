# Mor'ia 9.41 — Grand Emberhold

## Objetivo

Promover Emberhold de região legada 80×80 para a sexta capital autoritativa 160×160, mantendo identidade própria de cidade vulcânica e industrial em vez de reaproveitar a malha de Eldoria.

## Identidade urbana

- mapa: **160×160**;
- classe: `capital`;
- plano: **`caldera-radials`**;
- área urbana: `18,18 → 141,141`;
- 12 distritos;
- 42 construções autorais (20 marcos maiores + 22 oficinas/residências menores);
- nível canônico: **28**;
- estilo: `forge`.

O centro da capital é um cadinho/caldera de lava. Duas fissuras diagonais atravessam a malha, enquanto avenidas radiais, dois anéis industriais, vias de serviço e quatro grandes pátios de forja formam a circulação. Quando uma via cruza lava, a topologia gera `bridge`; lava fora das travessias continua não caminhável.

## Marcos principais

A Cidadela de Ember, a Grande Fundição, o Bazar das Cinzas, o Conselho do Cadinho, a Arena das Brasas, o Santuário da Chama, a Academia do Magma, a Guilda da Bigorna Negra e a Forja dos Dragões formam o núcleo cívico-industrial. Quatro portões físicos mantêm a capital legível e expansível para rotas futuras.

## Segurança de migração

A migração é **exact-default-only**. Ela só promove a geometria quando Emberhold ainda corresponde aos defaults históricos 80×80 e às posições de spawn/town conhecidas. Geometria criada por administrador bloqueia migração colateral.

Coordenadas históricas de NPCs, task master, monstros, casas e node industrial só mudam se coincidirem exatamente com seus defaults antigos. Entradas vindas de Frostpeak e Stormwatch também são corrigidas apenas quando ainda apontam para os antigos destinos.

## Compatibilidade

- Frostpeak passa a chegar ao novo acesso norte de Emberhold;
- Stormwatch mantém a rota histórica, agora apontando para o acesso sul interno;
- servidor e cliente compartilham o algoritmo explícito `caldera-radials`;
- Content Studio recebe o novo vocabulário pela lista autoritativa `URBAN_PLANS`;
- schema de Grandes Capitais avança de **6 para 7**;
- Voidlands passa a ser a sentinela histórica 80×80 nos testes de fundação enquanto ainda não for promovida.

## Gate 9.41A

A etapa A exige: contratos de fonte, auditoria PT-BR, `npm audit`, typecheck/build do cliente, validação do servidor, teste focado de Emberhold e suíte completa. A capital **não será considerada visualmente aprovada** até a etapa 9.41B gerar screenshots reais de minimapa, City Designer e panorâmica e esses arquivos passarem por inspeção humana.
