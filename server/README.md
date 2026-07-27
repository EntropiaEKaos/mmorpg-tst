# ⚔ Mor'ia MMO Server — Production Edition v2.0

Servidor **real** para o Mor'ia. Serve o cliente (HTML) + WebSocket multiplayer na **mesma porta** — perfeito para hospedagem gratuita.

## 🚀 Quick Start (Local)

```bash
# Na raiz do projeto:
npm install          # instala deps do cliente
npm run build        # compila o cliente para dist/

# Na pasta server:
cd server
npm install          # instala deps do servidor
npm start            # inicia em http://localhost:3000
```

Abra `http://localhost:3000` no navegador. Abra em múltiplas abas — os jogadores se veem!

## 🌐 Deploy Grátis (3 opções)

### Opção 1: Render.com (recomendado — mais fácil)

1. Faça push do código para o GitHub
2. Vá em [render.com](https://render.com) → **New → Web Service**
3. Conecte seu repositório
4. Settings:
   - **Build**: `cd server && npm install && cd .. && npm install && npm run build`
   - **Start**: `node server/server.js`
   - **Plan**: Free
5. Deploy! O Render detecta o `render.yaml` automaticamente.

URL final: `https://seu-app.onrender.com` — compartilhe com amigos!

### Opção 2: Railway.app

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Opção 3: Fly.io (com Docker)

```bash
npm i -g flyctl
fly launch
fly deploy
```

### Opção 4: Tunnel local (testar com amigos sem deploy)

```bash
cd server
npm install && npm start
# em outro terminal:
npx localtunnel --port 3000
# → dá uma URL pública tipo https://xyz.loca.lt
```

## ✨ Recursos do Servidor v2.0

| Recurso | Descrição |
|---------|-----------|
| **Single Port** | Cliente + WebSocket na mesma porta (ideal para free tier) |
| **Auto-detect URL** | Cliente detecta o servidor automaticamente — zero config |
| **Map Rooms** | Broadcast otimizado: só recebe updates de jogadores no MESMO mapa |
| **Anti-cheat** | Rate limiting + validação de movimento (rejeita teleport hack) |
| **Persistência** | Salva jogadores, chat e stats em arquivo JSON a cada 30s |
| **Health Check** | Endpoint `/health` para Render/Kubernetes |
| **Graceful Shutdown** | Salva DB e avisa jogadores antes de desligar |
| **Heartbeat** | Remove conexões mortas a cada 15s |
| **Chat API** | `GET /api/chat` retorna histórico de mensagens |
| **Online API** | `GET /api/online` retorna contagem de jogadores |

## 📡 Endpoints HTTP

| Rota | Descrição |
|------|-----------|
| `GET /` | Serve o jogo (HTML) |
| `GET /health` | Status do servidor (JSON) |
| `GET /api/online` | Contagem de jogadores online |
| `GET /api/chat` | Últimas 50 mensagens do chat |
| `WS /ws` | Conexão WebSocket para multiplayer |

## 🔌 Protocolo WebSocket

```jsonc
// Cliente → Servidor
{ "kind": "player:join", "payload": { "name": "Hero", "vocation": "knight", ... } }
{ "kind": "player:move", "payload": { "x": 40, "y": 40, "direction": "down", ... } }
{ "kind": "chat", "payload": { "text": "hello!", "color": "#fff", "channel": "world" } }
{ "kind": "ping" }

// Servidor → Cliente
{ "kind": "roster", "payload": [ /* todos os jogadores no mapa */ ] }
{ "kind": "player:move", "payload": { /* posição de outro jogador */ } }
{ "kind": "player:leave", "payload": { "id": "..." } }
{ "kind": "chat", "payload": { /* mensagem */ } }
{ "kind": "presence", "payload": { "count": 5 } }
{ "kind": "pong" }
{ "kind": "system", "payload": { "text": "Welcome!" } }
```

## 🏗 Para Produção (escalar)

O servidor usa estado em memória + arquivo JSON. Para escalar:
1. **PostgreSQL**: troque o `db` object por queries SQL
2. **Redis Pub/Sub**: para múltiplas instâncias do servidor sincronizarem
3. **Auth**: adicione JWT/tokens em `handleJoin`
4. **CDN**: sirva o cliente via Cloudflare/Netlify, servidor só WebSocket

## 📁 Estrutura

```
├── server/
│   ├── server.js          # Servidor (HTTP + WebSocket)
│   ├── package.json       # Deps do servidor (ws)
│   └── moria-db.json      # Estado persistido (criado automaticamente)
├── dist/                  # Cliente compilado (criado pelo build)
├── render.yaml            # Config Render.com
├── Dockerfile             # Config Fly.io/Railway
└── src/                   # Código fonte do cliente
```
