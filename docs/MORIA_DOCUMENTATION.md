# 🎮 MOR'IA - Realm of Shadows

## Visão Geral
MMORPG completo rodando 100% no navegador. Combina mecânicas clássicas do Tibia (skills por uso, vocations, blessings, AOL) com features do WoW (talents, auto-attack, cast bar, raid warnings, dungeons, pets, gems).

---

## ✨ NOVIDADES DA VERSÃO 2.0 (Mor'ia)

### 🐾 Companion/Pet System
- **6 pets** para comprar e summonar
- Pets lutam ao seu lado automaticamente (seguem você e atacam seu target)
- Wolf Pup → Wild Boar → Shadow Panther → Bear → Phoenix → Baby Dragon
- Cada pet tem stats próprios e habilidade especial
- Renderizado no canvas, faz dano real

### 🌀 Dungeon Portal
- Sistema de **waves** (3, 5, 7 ou 10 waves)
- 10 waves de dificuldade crescente (Rat → Dragon → Dungeon Warden boss)
- Recompensas altas (gold + XP por wave)
- Morre = falha (sem recompensa)
- Salva melhor wave conquistada

### 💎 Gem Socketing
- Itens dropados podem ter **0-3 sockets**
- **12 gemas** em 4 tiers (Chipped → Flawless → Legendary)
- Gemas dão: ATK, DEF, MAG, HP, Mana, Crit, Lifesteal, Speed
- Socket via aba "💎 SOCKET" no inventário
- Drops de elites (25%) e bosses (70%)

### 🎁 Set Bonuses (7 sets)
Equipar peças combinando ativa bônus poderosos:
- 🐉 **Dragon Slayer** (2-3 peças): +dano, +lifesteal
- 👑 **Royal Regalia** (Excalibur + Crown): +XP, +gold
- 🔮 **Archmage's Vestments** (2-4 peças): +magic, +XP, +crit
- 💨 **Windwalker's Garb** (2-4): +speed, +crit
- 🛡 **Bulwark of the Gods** (2-4): +reduction, +thorns, +HP
- 🩸 **Bloodfang Collection** (2-3): +lifesteal, +crit
- 💰 **Treasure Hunter** (2-3): +gold, +XP

### 📊 Stats Secundários Funcionais
Todos os atributos agora afetam o combate:
- 🎯 **Crit Chance** — chance de dano dobrado
- 🩸 **Lifesteal** — rouba % do dano como HP
- 🌵 **Thorns** — reflete dano ao atacante
- 💨 **Move Speed** — velocidade
- ⭐ **XP Bonus** — % mais XP
- 🪙 **Gold Bonus** — % mais gold
- 🛡 **Damage Reduction** — % menos dano

### 📐 13 Slots de Equipamento
weapon, armor, helmet, legs, boots, shield, ring (L), ring (R), amulet, cloak, belt, gloves, relic

---

## ⚔ 14 Classes

Knight, Paladin, Sorcerer, Druid, Warlock, Rogue, Priest, Death Knight, **Monk, Ranger, Necromancer, Berserker, Shaman, Templar** (6 novas!)

Cada classe com 4 spells únicos (56 spells total) e passiva própria.

---

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| WASD/Setas | Mover |
| 1-4 | Spells |
| I | Inventário (Itens/Crafting/Socket) |
| C | Personagem (13 slots + stats + sets) |
| Q | Quest Log + Achievements |
| T | Talent Tree |
| B | Bestiário |
| D | DPS Meter |
| R | Auto-Attack |
| E | Falar NPC |
| P/M | HP/MP Potion |
| Space | Mount |
| Ctrl+Shift+A | Admin Panel |

---

## 🛠 Arquitetura

```
src/
├── App.tsx                  # Entry: Mor'ia logo, login/game
├── game/
│   ├── types.ts             # Tipos + computeDerivedStats
│   ├── classes.ts           # 14 vocations
│   ├── world.ts             # Mapa 80x80, monstros, NPCs
│   ├── render.ts            # Canvas (tiles, player, monstros, pets)
│   ├── equipment.ts         # Itens com atributos secundários
│   ├── itemSets.ts          # 7 sets + gemas
│   ├── dungeons.ts          # Dungeon waves + pets
│   ├── systems.ts           # Blessings, profissões, rep, stamina, food
│   ├── quests.ts            # Quests
│   ├── achievements.ts      # Achievements
│   ├── crafting.ts          # Crafting
│   └── playerFactory.ts     # Player init
├── components/
│   ├── GameScreen.tsx       # Game loop + toda lógica
│   ├── HUD.tsx              # Sidebar com derived stats
│   ├── CharacterPanel.tsx   # Paper doll 13 slots + sets
│   ├── Inventory.tsx        # Itens/Crafting/Socket
│   ├── DungeonPortal.tsx    # Dungeon UI
│   ├── PetShop.tsx          # Companion shop
│   ├── TalentTree.tsx       # 14 talents
│   ├── Bestiary.tsx         # Enciclopédia
│   ├── DPSMeter.tsx         # Medidor de dano
│   ├── AdminPanel.tsx       # Cheats
│   ├── GameEditor.tsx       # Editor de itens/spells/classes
│   └── ...
```

---

## 🔐 Persistência
- `tibia_accounts` — contas (mantido por compatibilidade)
- `tibia_current` — último login
- `tibia_talents_{name}` — talents
- `tibia_bestiary_{name}` — bestiário
- `tibia_blessings_{name}` — blessings
- `tibia_professions_{name}` — profissões
- `tibia_reputation_{name}` — reputação
- `tibia_stamina_{name}` — stamina
- `tibia_daily_{name}` — daily reward
- `tibia_foodbuffs_{name}` — food buffs
- `tibia_pets_{name}` — pets possuídos
- `tibia_activepet_{name}` — pet ativo
- `tibia_dungeon_high_{name}` — melhor wave

Auto-save a cada 5 segundos.
