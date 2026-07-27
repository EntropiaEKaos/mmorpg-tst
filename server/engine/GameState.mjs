// ===================================================================
//  MOR'IA SERVER — AUTHORITATIVE GAME ENGINE
//  The heart of the MMO. Processes intents, calculates combat, 
//  manages world state. Clients NEVER modify state directly here.
// ===================================================================

import { WORLD } from './World.mjs';
import { VOCATIONS } from './Vocations.mjs';
import { rollLoot, getStarterInventory } from './Items.mjs';
import { questEngine } from './QuestEngine.mjs';

class GameEngine {
  constructor() {
    this.players = new Map();
    this.monstersByMap = new Map();
    this.groundItemsByMap = new Map();
    this.pendingEvents = new Map();
    this.tickCount = 0;
    this.TICK_RATE = 50;
    this.init();
  }

  init() {
    WORLD.init();
    for (const mapId of WORLD.getMapIds()) {
      this.monstersByMap.set(mapId, WORLD.spawnMonsters(mapId));
      this.groundItemsByMap.set(mapId, []);
      this.pendingEvents.set(mapId, []);
    }
    // Register player map with quest engine
    questEngine.registerPlayers(this.players);
    console.log(`🌍 World Init: ${WORLD.getMapIds().length} maps`);
  }

  // ===== PLAYER MANAGEMENT =====
  playerConnect(id, name, vocationKey, ws) {
    const voc = VOCATIONS[vocationKey] || VOCATIONS.knight;
    const player = {
      id, name, vocation: voc.id || vocation.name.toLowerCase(),
      level: 1, xp: 0, xpNext: 100,
      hp: voc.baseHp, maxHp: voc.baseHp, mana: voc.baseMana, maxMana: voc.baseMana,
      attack: voc.baseAttack, defense: voc.baseDefense, magic: voc.baseMagic,
      gold: 100, bankGold: 0,
      x: 40, y: 40, direction: 'down', mapId: 'eldoria',
      targetId: null, 
      inventory: getStarterInventory(), 
      equipment: {},
      buffs: [], skills: { sword: 10, magic: 10, shielding: 10 },
      lastAttack: 0, lastMove: 0, lastRegen: 0, cooldowns: {},
      mounted: false, professions: {}, reputation: { town: 0 },
      stats: { monstersKilled: 0, damageDealt: 0, damageTaken: 0, healingDone: 0, goldEarned: 0, deaths: 0, levelUps: 0, spellsCast: 0 },
      ws, lastActivity: Date.now(),
    };
    this.players.set(id, player);
    return player;
  }

  playerDisconnect(id) { this.players.delete(id); }
  getPlayer(id) { return this.players.get(id); }
  getPlayersOnMap(mapId) {
    const result = [];
    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);
    return result;
  }

  // ===== INTENT PROCESSING =====
  processIntent(playerId, intent) {
    const player = this.players.get(playerId);
    if (!player) return false;
    player.lastActivity = Date.now();
    switch (intent.type) {
      case 'move': return this.handleMove(player, intent.payload);
      case 'attack': return this.handleAttack(player, intent.payload);
      case 'cast': return this.handleCast(player, intent.payload);
      case 'use_item': return this.handleUseItem(player, intent.payload);
      case 'equip': return this.handleEquip(player, intent.payload);
      case 'pickup': return this.handlePickup(player, intent.payload);
      case 'mount': return this.handleMount(player);
      case 'talent': return this.handleTalent(player, intent.payload);
      case 'quest_accept': return this.handleQuestAccept(player, intent.payload);
      case 'quest_complete': return this.handleQuestComplete(player, intent.payload);
      case 'travel': return this.handleTravel(player, intent.payload);
      default: return false;
    }
  }

  handleMove(player, payload) {
    const now = Date.now();
    if (now - player.lastMove < 100) return false; // anti-speed-hack
    player.lastMove = now;

    const { dx, dy } = payload;
    const nx = player.x + dx, ny = player.y + dy;
    const map = WORLD.getMap(player.mapId);
    if (!map || nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return false;
    if (!map.tiles[ny][nx].walkable) return false;

    const monsters = this.monstersByMap.get(player.mapId) || [];
    if (monsters.some(m => !m.dead && m.x === nx && m.y === ny)) return false;
    if (this.getPlayersOnMap(player.mapId).some(p => p.id !== player.id && p.x === nx && p.y === ny)) return false;

    player.x = nx; player.y = ny;
    if (dx < 0) player.direction = 'left';
    else if (dx > 0) player.direction = 'right';
    else if (dy < 0) player.direction = 'up';
    else if (dy > 0) player.direction = 'down';

    return true;
  }

  // ===== DERIVED STATS (equipment + talents) =====
  computeDerivedStats(player) {
    const stats = {
      totalAttack: player.attack || 0, totalDefense: player.defense || 0,
      totalMagic: player.magic || 0, totalMaxHp: player.maxHp || 100, totalMaxMana: player.maxMana || 50,
      critChance: 15, lifesteal: 0, thorns: 0, moveSpeed: 0, xpBonus: 0, goldBonus: 0, damageReduction: 0,
    };
    // Equipment bonuses
    for (const eq of Object.values(player.equipment || {})) {
      if (!eq) continue;
      stats.totalAttack += eq.attack || 0;
      stats.totalDefense += eq.defense || 0;
      stats.totalMagic += eq.magic || 0;
      stats.totalMaxHp += eq.hp || 0;
      stats.totalMaxMana += eq.mana || 0;
      stats.critChance += eq.critChance || 0;
      stats.lifesteal += eq.lifesteal || 0;
      stats.thorns += eq.thorns || 0;
      stats.xpBonus += eq.xpBonus || 0;
      stats.goldBonus += eq.goldBonus || 0;
      stats.damageReduction += eq.damageReduction || 0;
    }
    // Talent bonuses
    const talents = player.talents || {};
    if (talents.might) stats.totalAttack += talents.might * 2;
    if (talents.toughness) stats.totalDefense += talents.toughness * 2;
    if (talents.vitality) stats.totalMaxHp += talents.vitality * 10;
    if (talents.wisdom) stats.totalMaxMana += talents.wisdom * 8;
    if (talents.precision) stats.critChance += talents.precision;
    if (talents.arcane_mastery) stats.totalMagic += talents.arcane_mastery * 3;
    if (talents.resilience) stats.damageReduction += talents.resilience * 2;
    // Vocation passives
    if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;
    if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;
    return stats;
  }

  handleAttack(player, payload) {
    const now = Date.now();
    if (now - player.lastAttack < 700) return false;
    player.lastAttack = now;

    const monsterId = payload.monsterId || player.targetId;
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const monster = monsters.find(m => m.id === monsterId && !m.dead);
    if (!monster) return false;

    const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
    if (dist > 2) return false;

    // SERVER CALCULATES DAMAGE using DERIVED STATS (equipment + talents)
    const derived = this.computeDerivedStats(player);
    const baseAttack = derived.totalAttack + Math.floor(Math.random() * 8);
    const crit = Math.random() < (derived.critChance / 100);
    let dmg = Math.max(1, baseAttack - monster.defense);
    if (crit) dmg = Math.floor(dmg * 2);
    // Berserker passive
    if (player.vocation === 'berserker' && player.hp < player.maxHp * 0.3) dmg = Math.floor(dmg * 1.5);

    monster.hp -= dmg;
    player.stats.damageDealt += dmg;
    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd' });

    if (monster.hp <= 0) this.killMonster(player, monster);
    return true;
  }

  killMonster(player, monster) {
    monster.dead = true;
    monster.respawnAt = Date.now() + (monster.type === 'boss' ? 60000 : 15000);
    player.stats.monstersKilled++;

    const derived = this.computeDerivedStats(player);
    // Apply XP bonuses (talents + gear + stamina)
    const xpMult = 1 + (derived.xpBonus / 100);
    const xpGain = Math.floor(monster.xp * xpMult);
    player.xp += xpGain;
    this.emitEvent(player.mapId, { kind: 'xp', targetId: player.id, amount: xpGain, pos: { x: monster.x, y: monster.y }, color: '#f4e04d', text: `+${xpGain} XP` });

    // ===== QUEST PROGRESSION =====
    const questResult = questEngine.onMonsterKill(player.id, monster.name);
    for (const prog of questResult.progressed) {
      this.emitEvent(player.mapId, { kind: 'quest_progress', targetId: player.id, text: `${prog.name}: ${prog.current}/${prog.needed}`, color: '#9bd4ff', pos: { x: player.x, y: player.y } });
    }
    for (const comp of questResult.completed) {
      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y } });
    }

    const loot = rollLoot(monster, derived.goldBonus);
    if (loot.length > 0) {
      const groundItems = this.groundItemsByMap.get(player.mapId) || [];
      groundItems.push({ id: `ground_${Date.now()}_${Math.random()}`, x: monster.x, y: monster.y, items: loot, expireAt: Date.now() + 120000 });
      this.groundItemsByMap.set(player.mapId, groundItems);
    }

    // SERVER LEVEL UP
    const voc = VOCATIONS[player.vocation];
    while (player.xp >= player.xpNext && voc) {
      player.xp -= player.xpNext;
      player.level++;
      player.xpNext = Math.floor(player.xpNext * 1.4);
      player.maxHp += voc.hpPerLevel; player.hp = player.maxHp;
      player.maxMana += voc.manaPerLevel; player.mana = player.maxMana;
      player.attack += voc.atkPerLevel; player.defense += voc.defPerLevel; player.magic += voc.magPerLevel;
      player.stats.levelUps++;
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y } });
    }
  }

  handleCast(player, payload) {
    const now = Date.now();
    const voc = VOCATIONS[player.vocation];
    if (!voc) return false;
    const spell = voc.spells[payload.spellIndex];
    if (!spell) return false;

    // SERVER VALIDATES: mana, cooldown, level
    if (player.level < (spell.levelRequired || 1)) return false;
    if (now - (player.cooldowns[spell.name] || 0) < spell.cooldown) return false;
    if (player.mana < spell.mana) return false;

    player.mana -= spell.mana;
    player.cooldowns[spell.name] = now;
    player.stats.spellsCast++;

    this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });

    if (spell.type === 'heal' && spell.damage > 0) {
      const healAmt = spell.damage + Math.floor(player.magic * 0.5);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: healAmt, pos: { x: player.x, y: player.y }, color: '#2ecc71' });
    } else {
      const monsters = this.monstersByMap.get(player.mapId) || [];
      for (const m of monsters) {
        if (m.dead) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= spell.range) {
          const baseDmg = spell.damage + Math.floor(player.magic * (spell.scalingCoeff || 1) * 0.5);
          const dmg = Math.max(1, baseDmg - m.defense);
          m.hp -= dmg;
          player.stats.damageDealt += dmg;
          this.emitEvent(player.mapId, { kind: 'damage', targetId: m.id, amount: dmg, pos: { x: m.x, y: m.y }, color: spell.color });
          if (m.hp <= 0) this.killMonster(player, m);
          if (spell.type === 'attack') break; // single target
        }
      }
    }
    return true;
  }

  handleUseItem(player, payload) {
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item || item.type !== 'potion') return false;
    
    if (item.name.includes('Health')) {
      player.hp = Math.min(player.maxHp, player.hp + 50);
      this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: 50, pos: { x: player.x, y: player.y }, color: '#2ecc71' });
    } else if (item.name.includes('Mana')) {
      player.mana = Math.min(player.maxMana, player.mana + 50);
    } else return false;

    item.quantity--;
    if (item.quantity <= 0) player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    return true;
  }

  handleEquip(player, payload) {
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item || !item.equipment) return false;
    if ((item.equipment.level || 1) > player.level) return false;

    const slot = item.equipment.slot;
    const current = player.equipment[slot];
    if (current) {
      player.inventory.push({ id: `eq_${Date.now()}`, ...current, type: 'equipment', quantity: 1 });
      // Re-calc stats down
      player.attack -= current.attack || 0; player.defense -= current.defense || 0;
    }
    player.equipment[slot] = item.equipment;
    player.attack += item.equipment.attack || 0;
    player.defense += item.equipment.defense || 0;
    player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    return true;
  }

  handlePickup(player, payload) {
    const groundItems = this.groundItemsByMap.get(player.mapId) || [];
    const ground = groundItems.find(g => g.id === payload.groundId);
    if (!ground || Math.hypot(ground.x - player.x, ground.y - player.y) > 2) return false;

    for (const item of ground.items) {
      if (item.isGold) { player.gold += item.quantity; player.stats.goldEarned += item.quantity; }
      else player.inventory.push({ ...item, id: `inv_${Date.now()}_${Math.random()}` });
    }
    this.groundItemsByMap.set(player.mapId, groundItems.filter(g => g.id !== payload.groundId));
    return true;
  }

  handleMount(player) { player.mounted = !player.mounted; return true; }

  handleTalent(player, payload) {
    const { talentId } = payload;
    if (!player.talents) player.talents = {};
    const current = player.talents[talentId] || 0;
    const maxRank = talentId === 'berserker' || talentId === 'transcendence' ? 1 : 5;
    if (current >= maxRank) return false;
    // Check available points (1 per level, minus spent)
    const spent = Object.values(player.talents).reduce((s, v) => s + v, 0);
    if (spent >= player.level) return false;
    player.talents[talentId] = current + 1;
    // Apply immediate effects
    if (talentId === 'vitality') { player.maxHp += 10; player.hp += 10; }
    if (talentId === 'wisdom') { player.maxMana += 8; player.mana += 8; }
    if (talentId === 'might') player.attack += 2;
    if (talentId === 'toughness') player.defense += 2;
    if (talentId === 'arcane_mastery') player.magic += 3;
    return true;
  }

  handleTravel(player, payload) {
    player.mapId = payload.targetMap || 'eldoria';
    player.x = payload.spawnX || 40; player.y = payload.spawnY || 40;
    return true;
  }

  handleQuestAccept(player, payload) {
    const result = questEngine.acceptQuest(player.id, payload.questId);
    if (result.success) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `📜 Quest accepted: ${result.quest.name}`, color: '#9bd4ff' });
    } else {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.reason}`, color: '#ff6060' });
    }
    return result.success;
  }

  handleQuestComplete(player, payload) {
    const result = questEngine.completeQuest(player.id, payload.questId);
    if (result.success) {
      player.gold += result.rewards.gold;
      player.xp += result.rewards.xp;
      player.stats.goldEarned += result.rewards.gold;
      if (result.rewards.item) player.inventory.push({ id: `quest_${Date.now()}`, ...result.rewards.item, type: 'misc', quantity: 1 });
      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${result.quest.name}: +${result.rewards.gold}g, +${result.rewards.xp}XP`, color: '#2ecc71' });
    } else {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.reason}`, color: '#ff6060' });
    }
    return result.success;
  }

  // ===== SIMULATION =====
  updateMonsters(mapId, now) {
    const monsters = this.monstersByMap.get(mapId) || [];
    const players = this.getPlayersOnMap(mapId);
    for (const m of monsters) {
      if (m.dead) { if (now >= m.respawnAt) { m.dead = false; m.hp = m.maxHp; m.x = m.spawnX; m.y = m.spawnY; } continue; }
      if (players.length === 0) continue;

      let nearest = null, minDist = 8;
      for (const p of players) { const d = Math.abs(p.x - m.x) + Math.abs(p.y - m.y); if (d < minDist) { minDist = d; nearest = p; } }
      
      if (nearest && minDist <= 1 && now - m.lastAttack > 1200) {
        m.lastAttack = now;
        const dmg = Math.max(1, m.attack + Math.floor(Math.random() * 4) - nearest.defense);
        nearest.hp -= dmg; nearest.stats.damageTaken += dmg;
        this.emitEvent(mapId, { kind: 'damage', targetId: nearest.id, amount: dmg, pos: { x: nearest.x, y: nearest.y }, color: '#ff6060' });
        if (nearest.hp <= 0) {
          nearest.hp = nearest.maxHp; nearest.mana = nearest.maxMana;
          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';
          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1));
          nearest.stats.deaths++;
          this.emitEvent(mapId, { kind: 'death', targetId: nearest.id, text: 'You died!', color: '#ff0000', pos: { x: 40, y: 40 } });
        }
      } else if (nearest && minDist > 1 && minDist < 8 && now - m.lastMove > m.speed) {
        m.lastMove = now;
        const dx = Math.sign(nearest.x - m.x), dy = Math.sign(nearest.y - m.y);
        const map = WORLD.getMap(mapId);
        if (Math.abs(nearest.x - m.x) > Math.abs(nearest.y - m.y)) {
          if (map?.tiles[m.y]?.[m.x + dx]?.walkable) m.x += dx;
        } else {
          if (map?.tiles[m.y + dy]?.[m.x]?.walkable) m.y += dy;
        }
      }
    }
  }

  tick() {
    const now = Date.now();
    this.tickCount++;
    for (const p of this.players.values()) {
      if (now - p.lastRegen > 2000) {
        if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 2);
        if (p.mana < p.maxMana) p.mana = Math.min(p.maxMana, p.mana + 3);
        p.lastRegen = now;
      }
    }
    for (const mapId of this.monstersByMap.keys()) {
      this.updateMonsters(mapId, now);
      const items = this.groundItemsByMap.get(mapId) || [];
      if (items.some(i => now > i.expireAt)) this.groundItemsByMap.set(mapId, items.filter(i => now <= i.expireAt));
    }
  }

  // ===== SNAPSHOTS =====
  getSnapshot(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    // Inject derived stats so client renders bars correctly
    const derived = this.computeDerivedStats(player);
    const playerData = {
      ...player,
      ws: undefined,
      maxHp: derived.totalMaxHp,
      maxMana: derived.totalMaxMana,
      critChance: derived.critChance,
      lifesteal: derived.lifesteal,
      thorns: derived.thorns,
      xpBonus: derived.xpBonus,
      goldBonus: derived.goldBonus,
      damageReduction: derived.damageReduction,
      moveSpeed: derived.moveSpeed,
      quests: questEngine.serialize(playerId),
    };

    const nearbyPlayers = [];
    for (const p of this.players.values()) {
      if (p.id !== playerId && p.mapId === player.mapId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25) {
        const voc = VOCATIONS[p.vocation];
        nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: p.maxHp, mounted: p.mounted, icon: voc?.icon, color: voc?.color });
      }
    }

    const allMonsters = this.monstersByMap.get(player.mapId) || [];
    const monsters = allMonsters.filter(m => !m.dead && Math.abs(m.x - player.x) < 15 && Math.abs(m.y - player.y) < 15)
      .map(m => ({ id: m.id, name: m.name, emoji: m.emoji, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type, color: m.color, size: m.size }));

    const allGround = this.groundItemsByMap.get(player.mapId) || [];
    const groundItems = allGround.filter(g => Math.abs(g.x - player.x) < 15 && Math.abs(g.y - player.y) < 15).map(g => ({ id: g.id, x: g.x, y: g.y, items: g.items }));

    return { player: playerData, nearbyPlayers, monsters, groundItems, events: this.pendingEvents.get(player.mapId) || [] };
  }

  consumeEvents(mapId) { this.pendingEvents.set(mapId, []); }
  emitEvent(mapId, event) {
    const events = this.pendingEvents.get(mapId) || [];
    events.push(event);
    if (events.length > 100) events.shift();
    this.pendingEvents.set(mapId, events);
  }
  getOnlineCount() { return this.players.size; }
  getTickCount() { return this.tickCount; }
}

export const engine = new GameEngine();
