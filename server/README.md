# ⚔ Mor'ia MMO Server — Alpha Edition 9.2

Servidor autoritativo do **Mor'ia — Realm of Shadows**. O processo Node.js serve o cliente compilado, expõe APIs HTTP de autenticação/administração e mantém o multiplayer em tempo real por WebSocket na mesma porta.

## Estado atual

- Contas persistentes com senha derivada por `scrypt`, recovery code e sessões rotativas.
- Personagens vinculados à conta e nomes globais protegidos contra colisão.
- Servidor autoritativo para movimento, combate, inventário, equipamento, talentos, quests, aventura e sistemas oficiais.
- Conteúdo data-driven com painel administrativo e validação de referências.
- Alpha 9.1/9.2: 11 mapas, conteúdo regional 1–60, shops/loot tables editáveis, Ilha GM com roster server-side, Tasks, Housing, Outfits e Mounts.
- Alpha 9.2: relógio mundial autoritativo com dawn/day/dusk/night e skills contextuais que podem resolver efeitos diferentes em self/aliados/inimigos, incluindo multiplicadores por relação e período do dia.
- WebSocket com payload limitado, heartbeat e estado controlado pelo servidor.
- Rate limiting de autenticação bounded para impedir crescimento ilimitado de memória sob tráfego distribuído.
- CI de produção em todo push para `master`: audit, typecheck, build, syntax check e suíte server-side.

## Quick start local

```bash
# raiz do projeto
npm ci
npm run typecheck
npm run build

# servidor
cd server
npm ci
npm run check
npm test
npm start
```

Por padrão o jogo fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Uso |
|---|---:|---|---|
| `PORT` | não | `3000` | Porta HTTP/WebSocket |
| `ADMIN_TOKEN` | produção: sim | vazio | Habilita e protege `/admin` e `/admin/api/*` |
| `TRUST_PROXY` | não | `false` | Usa o primeiro `X-Forwarded-For` para rate limiting quando atrás de proxy confiável |
| `AUTH_RATE_LIMIT_MAX_ENTRIES` | não | `10000` | Limite global de janelas ativas do rate limiter de autenticação |
| `MORIA_ACCOUNT_DB` | não | `server/moria-accounts.json` | Caminho do banco persistente de contas |
| `MORIA_DAY_LENGTH_MS` | não | `1440000` | Duração real de um dia completo do mundo; servidor limita entre 5 min e 2 h |

> Só habilite `TRUST_PROXY=true` quando o processo estiver realmente atrás de um proxy/reverse proxy controlado. Caso contrário um cliente pode falsificar `X-Forwarded-For`.

## APIs HTTP principais

### Saúde

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Saúde, jogadores online, tick e contagem resumida de conteúdo |
| `GET` | `/status` | Alias do health check |

### Autenticação e personagens

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cria conta e devolve sessão + recovery code inicial |
| `POST` | `/api/auth/login` | Autentica e cria nova sessão |
| `POST` | `/api/auth/recover` | Recupera a conta e rotaciona recovery code |
| `GET` | `/api/auth/session` | Valida e rotaciona a sessão atual |
| `POST` | `/api/auth/logout` | Revoga a sessão atual |
| `POST` | `/api/auth/password` | Altera senha e revoga sessões anteriores |
| `GET` | `/api/characters` | Lista personagens da conta autenticada |
| `POST` | `/api/characters` | Cria personagem pertencente à conta |

As rotas autenticadas usam `Authorization: Bearer <sessionToken>`.

### Administração

- `GET /admin` — painel web; exige `ADMIN_TOKEN`.
- `/admin/api/*` — CRUD/ações administrativas protegidas pelo mesmo token.
- O token pode ser estabelecido inicialmente por `/admin?token=...`; o servidor redireciona e grava cookie `HttpOnly`/`SameSite=Strict` para o painel.
- Catálogos editáveis: items, monsters, NPCs, spells, quests, maps, events, shops, loot tables, GM roster e catálogos dos sistemas 9.2. Mapas publicados reconstroem o runtime determinístico; referências inválidas são bloqueadas antes da persistência.
- O schema declarativo de spells permite `targetMode`, efeitos de aliado/inimigo, multiplicadores de relação, multiplicadores day/night e drain, todos semanticamente validados antes de persistir.

## Combate contextual e relógio mundial

`WorldClock.mjs` deriva o horário a partir do relógio do servidor e projeta `worldClock` nos snapshots. O navegador usa essa projeção para apresentação, mas não escolhe a fase usada nos cálculos online.

`ContextualSkillEngine.mjs` mantém compatibilidade com as spells antigas e permite comportamento por relação. `GameState.mjs` decide target, alcance, relação, efeito, mana, cooldown e potência final. Skills podem curar ou buffar jogadores aliados e, no mesmo contrato, causar dano ou drain em monstros. Dawn e dusk interpolam os multiplicadores day/night para evitar saltos bruscos de poder. O sistema não transforma automaticamente outro jogador em alvo hostil; PvP continua passando pelas regras autoritativas e opt-in já existentes.

## WebSocket

Endpoint: `WS /ws`.

O cliente envia intenções e o servidor decide o resultado. Coordenadas, dano, recompensas, inventário, progressão e demais estados relevantes não devem ser aceitos como verdade enviada pelo navegador.

O WebSocket possui limite de payload (`64 KiB`) e integra sessão/ownership de personagem antes de disponibilizar controle autoritativo do jogador.

## Persistência

A arquitetura atual separa credenciais de estado de personagem:

- `moria-accounts.json`: contas, credenciais derivadas e ownership dos personagens.
- Player/content stores: estado autoritativo de personagem e catálogos do jogo.
- Sessões ficam em memória e são deliberadamente invalidadas quando o processo reinicia.
- O horário mundial não precisa de save por personagem: é derivado deterministicamente do relógio do servidor e da duração configurada do dia.

Para múltiplas instâncias horizontais, o próximo passo arquitetural é mover persistência e coordenação compartilhada para serviços externos (por exemplo PostgreSQL + Redis), sem abandonar a autoridade server-side.

## Segurança operacional

O servidor aplica limites independentes para registro, login e recuperação. Desde a edição 6.2, as janelas são mantidas por `BoundedWindowRateLimiter`; entradas expiradas são removidas e o número de chaves simultâneas nunca ultrapassa `AUTH_RATE_LIMIT_MAX_ENTRIES`.

Também existem limites de corpo HTTP, payload WebSocket, validação de path para arquivos estáticos, comparação timing-safe do token administrativo e validação de referências antes de mutações de conteúdo.

## CI / quality gate

O workflow `.github/workflows/ci.yml` roda em `master` e branches de evolução suportadas. Ele executa:

```text
npm ci
npm audit --audit-level=high
npm run typecheck
npm run build
npm ci --prefix server
npm audit --prefix server --audit-level=high
npm run check --prefix server
npm test --prefix server
```

Commits em `master` portanto voltam a ter validação automática de produção.

## Estrutura relevante

```text
server/
├── server.js
├── adminPanel.mjs
├── engine/
│   ├── AuthService.mjs
│   ├── ContentDB.mjs
│   ├── ContentIntegrity.mjs
│   ├── ContextualSkillEngine.mjs
│   ├── GameState.mjs
│   ├── OfficialSystems.mjs
│   ├── RateLimiter.mjs
│   ├── WorldClock.mjs
│   └── ...
├── test/
│   ├── auth*.test.mjs
│   ├── contextual-skills-9-2.test.mjs
│   ├── hardening.test.mjs
│   ├── official-systems.test.mjs
│   ├── rate-limiter.test.mjs
│   └── ...
└── tools/
    └── migrate-legacy-character.mjs
```

## Regra de evolução

Novos sistemas que alterem economia, progressão, combate, ownership ou recompensa devem permanecer **autoritativos no servidor**, possuir teste de regressão e passar pelo quality gate antes de serem considerados prontos para produção.
