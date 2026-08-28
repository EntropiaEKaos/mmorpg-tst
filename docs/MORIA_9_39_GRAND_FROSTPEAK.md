# Mor'ia 9.39 — Grand Frostpeak

## 9.39A — Capital alpina autoritativa

Frostpeak passa de assentamento 80×80 para uma capital 160×160 com `urbanPlan: terraced-bastion`. A cidade é organizada como uma fortaleza de montanha escalonada: muralha externa, quatro patamares de contenção, três eixos verticais de rampas/escadarias, vias horizontais por nível e grandes pátios funcionais.

### Identidade

- mapa 160×160, classe `capital`;
- 12 distritos e 41 footprints autoritativos;
- 90+ props;
- Cidadela Frostguard no nível superior;
- Salão do Thane, Observatório da Aurora e Capela do Gelo Eterno;
- terraço de forjas, Mercado da Geada e bairro de expedições;
- quartéis, academia, arena, enfermaria, estábulos e bairro Snowpine;
- muralhas de retenção são colisão real, atravessadas apenas pelos eixos de subida.

### Migração segura

A promoção ocorre apenas quando o mapa ainda possui dimensões e centro legados oficiais. Mapas administrativos customizados bloqueiam a migração inteira. NPCs, monstros, casas e Node só se movem quando ainda estão nas coordenadas exatas conhecidas.

Chegadas oficiais atualizadas:
- Eldoria → Frostpeak: 28,82;
- Ironwood → Frostpeak: 80,136;
- Emberhold → Frostpeak: 130,112;
- Crystal Deep → Frostpeak: 80,20.

As duas casas legadas de Frostpeak são relocadas para lotes do terraço inferior e passam novamente pelo validador autoritativo de Housing.

### Schema global

`grandCapitalVersion` avança para 5 sem alterar `version=3`. Banco novo e banco existente percorrem Eldoria → Sunreach → Ironwood → Frostpeak de forma idempotente.

### Studio e paridade

`terraced-bastion` entra no vocabulário já exposto pelo Content Studio. Servidor e cliente compartilham os mesmos marcadores de patamares, rampas e pátios.

## Próxima etapa

A 9.39B fará minimapa, City Designer e panorâmica autoritativa com prova visual de muralhas de retenção, patamares e identidade alpina.

### Neve como terreno real

A 9.39 também transforma `snow` em tile de terreno caminhável de primeira classe no cliente e no renderer. Biomas nevados deixam de herdar grama verde como piso aberto; pátios de Frostpeak e áreas externas agora usam neve real, mantendo servidor e cliente em paridade.

## 9.39B — Prova visual autoritativa

A validação visual usa a mesma Grand Frostpeak entregue pelo servidor e sincronizada no cliente. O gate captura minimapa, City Designer e panorama pelo renderer de produção. As asserções exigem 160×160, `terraced-bastion`, 12 distritos, 41 construções, quatro acessos, densidade mínima de neve/caminhos/muralhas e pixels claros suficientes para provar que o terreno nevado está realmente renderizado.

A 9.39 só pode ser aprovada depois do CI visual e da inspeção humana dos três PNGs.
