# Mor'ia 9.38 — Grand Ironwood

## 9.38A — Capital florestal autoritativa

Ironwood deixa de ser um assentamento 80×80 e passa a ser uma capital 160×160 com identidade própria. A composição não reutiliza o grid cerimonial de Eldoria nem o porto em crescente de Sunreach: o novo `urbanPlan: forest-rings` usa paliçadas vivas, quatro portões, eixos cardeais, duas trilhas circulares, vias de lenhadores/caçadores, clareira central e bosques internos com árvores de colisão real.

### Conteúdo urbano

- mapa 160×160, classe `capital`;
- 12 distritos;
- 40 footprints de arquitetura autoritativa;
- pelo menos 90 props de ambientação;
- Salão dos Marchwardens, Árvore-Mãe Ironbark, Grande Mercado da Madeira, Filhos da Natureza, caçadores, domadores, serraria, carpinteiros, curtume, depósito, arena, torres de paliçada, vigílias, biblioteca e Poço Lunar;
- `townRange` continua 18 e permanece somente como raio local de serviços.

### Migração segura

A migração só promove o mapa legado Ironwood 80×80 quando as coordenadas-base ainda correspondem ao conteúdo oficial. Dimensões administrativas customizadas (por exemplo 120×120) bloqueiam toda a promoção e também bloqueiam migrações colaterais de NPC, monstro e Node.

NPCs, monstros e Node mudam apenas quando ainda estão nas coordenadas legadas exatas. Portais administrativos são preservados. Apenas o conjunto oficial intacto de dois portais recebe automaticamente a terceira rota oficial de retorno para Sunreach.

Chegadas oficiais:
- Eldoria → Ironwood: 26,78;
- Sunreach → Ironwood: 80,134.

### Convergência de banco novo

A 9.38A também corrige uma assimetria de inicialização: um banco criado do zero agora percorre a mesma cadeia de Grand Capitals que um banco já existente. Eldoria, Sunreach e Ironwood são migradas de forma idempotente, e o seed inicial também materializa os catálogos Road-to-10 antes de gravar os marcadores de versão.

`grandCapitalVersion` avança para 4 sem alterar a versão-base de conteúdo.

### Studio e integridade

`urbanPlan` passa a fazer parte do schema declarativo do Content Studio, com opções autoritativas `royal-grid`, `harbor-crescent` e `forest-rings`. Tanto a validação semântica quanto a validação de referências falham de forma fechada para topologias desconhecidas.

### Paridade cliente/servidor

O algoritmo `forest-rings` é espelhado no servidor e no cliente para manter colisão, previsão e visual consistentes.

## Próxima etapa

A 9.38B fará a prova visual autoritativa com:
- minimapa 160×160;
- City Designer;
- panorâmica de produção;
- verificação de massa verde/árvores, trilhas circulares e principais marcos de Ironwood.


## 9.38B — Prova visual autoritativa

A aceitação visual usa o servidor real em banco temporário e o renderer de produção. São capturados minimapa, City Designer e panorâmica da área urbana. O gate exige 160×160, 12 distritos, 40 footprints, Poço Lunar no setor sudeste, uma massa mínima de árvores, trilhas e gramados gerados pelo `forest-rings`, além de presença mínima de pixels verdes no canvas para detectar regressões que apaguem a identidade florestal.
