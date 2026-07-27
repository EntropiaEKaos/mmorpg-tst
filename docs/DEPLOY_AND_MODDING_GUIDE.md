# 🌍 MOR'IA — GUIA DEFINITIVO DE DEPLOY & CRIAÇÃO DE CONTEÚDO

Este guia detalha como colocar **Mor'ia** online para jogadores de todo o mundo e como gerenciar, criar e editar todos os elementos do jogo (Itens, Monstros, Quests, Feitiços, Mapas e Eventos Mundiais).

---

## 🚀 PARTE 1: COLOCANDO O JOGO ONLINE (VERCEL + SERVIDOR MMO)

Para a melhor performance global e custo zero (Free Tier), recomendamos a arquitetura **Híbrida**:
- **Cliente Web (Interface & Gráficos):** Hospedado na **Vercel** (CDN Global Instantânea).
- **Servidor MMO Autoritativo (WebSocket + Game Engine):** Hospedado no **Render.com**, **Railway** ou **Fly.io**.

### 1️⃣ Hospedando o Cliente na Vercel (Grátis)
O arquivo `vercel.json` na raiz do projeto já está pré-configurado.
1. Faça push do código para seu repositório no **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**.
3. Importe o repositório do **Mor'ia**.
4. A Vercel detectará automaticamente o Vite:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy**.
6. Seu jogo estará no ar em poucos segundos em um link como `https://moria-mmo.vercel.app`.

---

### 2️⃣ Hospedando o Servidor MMO 24/7 no Render.com (Grátis)
O servidor Node.js gerencia combate autoritativo, anti-cheat, posições e sincronização em tempo real.
1. No [render.com](https://render.com), clique em **"New → Web Service"**.
2. Conecte o mesmo repositório do GitHub.
3. Configure o serviço:
   - **Name:** `moria-server`
   - **Runtime:** `Node`
   - **Build Command:** `cd server && npm install && cd .. && npm install && npm run build`
   - **Start Command:** `node server/server.js`
   - **Plan:** `Free`
4. Clique em **Create Web Service**.
5. Quando o deploy terminar, você terá uma URL como `https://moria-server.onrender.com`.
   - O WebSocket estará disponível em `wss://moria-server.onrender.com/ws`.

---

### 3️⃣ Conectando a Vercel ao seu Servidor Render
1. Abra seu jogo na Vercel (`https://moria-mmo.vercel.app`).
2. Clique no botão de conexão no topo da tela (`⚫ 1 online` ou **🔌 Connect**).
3. No modal que abrir, cole a URL WebSocket do seu servidor:
   ```
   wss://moria-server.onrender.com/ws
   ```
4. Clique em **Connect**.
5. Você verá a mensagem `🟢 CONNECTED to Mor'ia authoritative server! Anti-cheat active.` no chat do jogo!

> **Dica Pro:** Para testar localmente na sua máquina sem internet, basta rodar `cd server && npm install && npm start` e abrir `http://localhost:3000`.

---

## 🛠️ PARTE 2: COMO GERENCIAR, CRIAR E EDITAR CONTEÚDO

O **Mor'ia** foi construído para ser **Data-Driven** (movido a dados). Você não precisa recompilar o jogo inteiro para adicionar novos itens ou monstros — tudo pode ser adicionado em tempo real!

Existem **três maneiras** de gerenciar e criar conteúdo:

---

### METODO 1: Painel Admin Web (Recomendado para Admins)
Quando o servidor está rodando, ele disponibiliza um painel administrativo no endereço:
- **Local:** `http://localhost:3000/admin`
- **Produção:** `https://seu-servidor.onrender.com/admin`

#### O que você pode criar/editar lá:
1. **⚔ Itens (`items`):**
   - Crie armas, armaduras, capacetes, relíquias, etc.
   - Defina os atributos primários (`attack`, `defense`, `armor`, `hp`, `mana`, `magic`).
   - Defina atributos secundários (`critChance`, `lifesteal`, `thorns`, `moveSpeed`, `xpBonus`, `goldBonus`, `damageReduction`).
   - Defina slots de gemas (`sockets`).
2. **👹 Monstros (`monsters`):**
   - Crie monstros comuns, Elites (borda roxa) e Bosses (borda dourada).
   - Defina `hp`, `attack`, `defense`, `xp`, `level`, `color`, `size` e quantidade de ouro (`goldMin`, `goldMax`).
3. **🧙 NPCs (`npcs`):**
   - Adicione NPCs de loja (`merchant`), banco (`banker`), estalagem (`innkeeper`), missões (`quest`) ou guarda (`guard`).
   - Defina posição de spawn (`posX`, `posY`, `mapId`) e texto de diálogo.
4. **📜 Quests (`quests`):**
   - Defina missões de caça com objetivo (`target`), quantidade (`count`), nível mínimo (`levelRequired`) e recompensas (`rewardGold`, `rewardXp`).
5. **🌍 Eventos Mundiais (`events`):**
   - Crie invasões de boss e pragas globais (`invasion`, `worldboss`).
   - Todos os jogadores conectados são notificados na tela com *Raid Warning*!

> **Sincronização Instantânea:** Quando você clica em **Save** no painel `/admin`, o servidor envia um pacote `content_sync` via WebSocket para **todos os jogadores conectados** e o conteúdo é adicionado ao jogo ao vivo!

---

### METODO 2: Editor In-Game (`Ctrl+Shift+A`)
Dentro do próprio cliente de jogo, se você pressionar **Ctrl + Shift + A**, abrirá o painel administrativo ingame.

#### Abas Disponíveis:
- **🔧 Open Game Editor:**
  - **⚔ Items:** Crie itens personalizados com todos os 18 atributos visuais e clique em **"📦 Give to Player"** para testar instantaneamente em seu personagem.
  - **🔮 Spells:** Visualize e crie novas magias customizadas com ícones e efeitos visuais.
  - **🗺 Maps:** Crie novos mapas procedurais escolhendo o bioma (`plains`, `snow`, `swamp`, `desert`, `shadow`) e pontos de spawn.
- **✦ Mystery Quest Creator:**
  - Crie enigmas no estilo clássico do Tibia com **pistas (clues)**, **charadas (riddles)**, **respostas (answers)** e **dicas (hints)**.
- **💀 Skull / PvP:**
  - Altere sua caveira (Lawful 🟢, Suspect ⚪, Aggressor 🟡, Outlaw 🟠, Murderer 🔴, Wanted ⚫) ou ative/desative o PvP.
- **📊 DPS Meter / Clima / Tempo:**
  - Mude o clima (Sol ☀, Chuva 🌧, Neve ❄, Tempestade ⛈) e o horário do dia em tempo real.

---

### METODO 3: Edição Direta no Código Fonte (Para Desenvolvedores)
Se você quiser adicionar conteúdo fixo no repositório oficial do jogo, edite os arquivos abaixo:

| Arquivo | O que edita |
| :--- | :--- |
| `server/engine/Vocations.mjs` | As **14 classes** (Knight, Paladin, Sorcerer, Druid, Warlock, Rogue, Priest, Death Knight, Monk, Ranger, Necromancer, Berserker, Shaman, Templar) e todos os **56 feitiços** oficiais. |
| `server/engine/Items.mjs` | Tabela autoritativa de **loots de monstros**, inventário inicial e itens do servidor. |
| `server/engine/ContentDB.mjs` | Conteúdo padrão (`items`, `monsters`, `npcs`, `quests`, `maps`, `worldEvents`) pré-carregado no servidor. |
| `src/game/equipment.ts` | Tabela de itens com raridades visuais, descrições e atributos secundários. |
| `src/game/itemSets.ts` | Os **7 Set Bonuses** (Dragon Slayer, Royal Regalia, Archmage, etc.) e as **12 Gemas** para socketing. |
| `src/game/dungeons.ts` | As **10 ondas (waves)** de Dungeon e os **6 Companions/Pets** compráveis. |
| `src/game/maps.ts` | Regras procedurais de geração de cada bioma e portais de conexão entre os 5 mapas oficiais. |

---

## ❓ DÚVIDAS FREQUENTES (FAQ)

#### 1. "O que acontece quando os jogadores perdem a conexão?"
O servidor possui um sistema de **Heartbeat** (ping/pong a cada 20 segundos). Se a conexão cair, o cliente tenta reconectar automaticamente a cada 3 segundos. Se ficar inativo por 45 segundos, o servidor salva o personagem no arquivo `moria-players.json` e encerra a sessão sem perda de dados.

#### 2. "Como funcionam os drops no chão?"
Quando você mata um monstro no jogo, o servidor gera um item do tipo **Corpo (Corpse)** com os loots dentro. Você pode caminhar para um tile adjacente ou clicar no corpo para que os itens sejam recolhidos automaticamente para a sua mochila (`Backpack`).

#### 3. "Como funcionam as Bênçãos (Blessings) na morte?"
Se o jogador morrer:
- Sem bênçãos ou AOL: perde 10% da experiência da barra e 5% do ouro.
- Com **Twist of Fate**: a perda de XP é reduzida pela metade (5%).
- Com **Spark of the Phoenix** ou **Amulet of Loss (AOL)**: os itens equipados e a mochila são protegidos contra perda.
