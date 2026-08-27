// ===================================================================
//  MOR'IA SERVER — AUTHORITATIVE GAME ENGINE
//  The heart of the MMO. Processes intents, calculates combat,
//  manages world state. Clients NEVER modify state directly here.
// ===================================================================

import { WORLD } from './World.mjs';
import { VOCATIONS } from './Vocations.mjs';
import { rollLoot, getStarterInventory, buildEquipmentLootPool } from './Items.mjs';
import { questEngine } from './QuestEngine.mjs';
import { adventureEngine, createAdventureState } from './AdventureEngine.mjs';
import { officialSystems } from './OfficialSystems.mjs';
import { contentDB } from './ContentDB.mjs';


const TALENT_RULES = Object.freeze({
  vitality: { maxRank: 5, hp: 10 },
  wisdom: { maxRank: 5, mana: 8 },
  might: { maxRank: 5, attack: 2 },
  toughness: { maxRank: 5, defense: 2 },
  precision: { maxRank: 5, requires: 'might', critChance: 1 },
  arcane_mastery: { maxRank: 5, requires: 'wisdom', magic: 3 },
  resilience: { maxRank: 3, requires: 'toughness', damageReduction: 2 },
  bounty: { maxRank: 3, requires: 'vitality', goldBonus: 5 },
  savant: { maxRank: 3, requires: 'bounty', xpBonus: 10 },
  lethal: { maxRank: 2, requires: 'precision', critChance: 3 },
  archmage: { maxRank: 2, requires: 'arcane_mastery', healBonus: 20 },
  fortitude: { maxRank: 2, requires: 'resilience', damageReduction: 5 },
  berserker: { maxRank: 1, requires: 'lethal', attack: 15, critChance: 5 },
  transcendence: { maxRank: 1, requires: 'archmage', hp: 50, mana: 30, magic: 8 },
});

function safePayload(payload) {
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

const CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe', 'buff']);
const CONTENT_BUFF_TYPES = new Set(['shield', 'haste', 'invisible', 'frenzy']);

function spellSlug(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

class GameEngine {
  constructor() {
    this.players = new Map();
    this.monstersByMap = new Map();
    this.groundItemsByMap = new Map();
    this.pendingEvents = new Map();
    this.contentItems = [];
    this.contentSpells = [];
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
    questEngine.registerPlayers(this.players);
    console.log(`🌍 World Init: ${WORLD.getMapIds().length} maps`);
  }

  // ===== PLAYER MANAGEMENT =====
  playerConnect(id, name, vocationKey, ws) {
    const voc = VOCATIONS[vocationKey] || VOCATIONS.knight;
    const player = {
      id, name, vocation: voc.id || vocationKey || 'knight',
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
      mounted: false, professions: {}, reputation: { town: 0 }, talents: {},
      adventure: createAdventureState(),
      official: null,
      stats: { monstersKilled: 0, damageDealt: 0, damageTaken: 0, healingDone: 0, goldEarned: 0, deaths: 0, levelUps: 0, spellsCast: 0, adventuresCompleted: 0 },
      ws, lastActivity: Date.now(),
    };
    this.players.set(id, player);
    return player;
  }

  playerDisconnect(id) { questEngine.clearPlayer(id); this.players.delete(id); }
  getPlayer(id) { return this.players.get(id); }
  getPlayersOnMap(mapId) {
    const result = [];
    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);
    return result;
  }

  syncContentItems(itemContent = []) {
    this.contentItems = Array.isArray(itemContent)
      ? itemContent.filter(item => item && typeof item === 'object').map(item => ({ ...item }))
      : [];
  }

  syncContentSpells(spellContent = []) {
    this.contentSpells = Array.isArray(spellContent)
      ? spellContent.filter(spell => spell && typeof spell === 'object').map(spell => ({ ...spell }))
      : [];
  }

  getSpellList(vocationId) {
    const vocation = VOCATIONS[vocationId];
    if (!vocation) return [];
    const merged = vocation.spells.map(spell => ({ ...spell }));

    for (const raw of this.contentSpells) {
      const rawVocation = typeof raw.vocation === 'string' ? raw.vocation.trim().toLowerCase() : '';
      if (rawVocation !== vocationId) continue;
      if (typeof raw.id !== 'string' || !raw.id.trim()) continue;
      if (typeof raw.name !== 'string' || !raw.name.trim()) continue;
      const type = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : '';
      if (!CONTENT_SPELL_TYPES.has(type)) continue;

      const id = raw.id.trim().slice(0, 100);
      const name = raw.name.trim().slice(0, 100);
      const matchIndex = merged.findIndex(spell => spellSlug(spell.name) === spellSlug(id) || spellSlug(spell.name) === spellSlug(name));
      const previous = matchIndex >= 0 ? merged[matchIndex] : null;
      const rawColor = typeof raw.color === 'string' ? raw.color : '';
      const next = {
        ...(previous || {}),
        contentSpellId: id,
        name,
        icon: typeof raw.icon === 'string' && raw.icon ? raw.icon.slice(0, 8) : (previous?.icon || '✨'),
        mana: Math.floor(boundedNumber(raw.mana, 0, 100_000, previous?.mana ?? 10)),
        cooldown: Math.floor(boundedNumber(raw.cooldown, 250, 600_000, previous?.cooldown ?? 1500)),
        damage: Math.floor(boundedNumber(raw.damage, 0, 10_000_000, previous?.damage ?? 0)),
        range: boundedNumber(raw.range, 0, 20, previous?.range ?? 1),
        color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : (previous?.color || '#9bd4ff'),
        type,
        levelRequired: Math.floor(boundedNumber(raw.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),
      };
      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);
      if (type === 'buff') {
        const requestedBuffType = typeof raw.buffType === 'string' ? raw.buffType.trim().toLowerCase() : '';
        next.buffType = CONTENT_BUFF_TYPES.has(requestedBuffType)
          ? requestedBuffType
          : (CONTENT_BUFF_TYPES.has(previous?.buffType) ? previous.buffType : 'shield');
        next.buffDuration = Math.floor(boundedNumber(raw.buffDuration, 1000, 60_000, previous?.buffDuration ?? 8000));
        next.buffValue = boundedNumber(raw.buffValue, 0, 100, previous?.buffValue ?? ({ shield: 25, haste: 35, invisible: 1, frenzy: 25 }[next.buffType]));
      }

      if (matchIndex >= 0) merged[matchIndex] = next;
      else if (merged.length < 8) merged.push(next);
    }
    return merged;
  }

  // Reconcile live monster overlays created in the server ContentDB.
  // Baseline WORLD spawns are preserved; only monsters carrying contentSourceId
  // are replaced when admin content changes. A mapId is intentionally required
  // so catalog-only templates cannot accidentally flood Eldoria.
  syncContentMonsters(monsterContent = []) {
    const catalog = Array.isArray(monsterContent) ? monsterContent : [];
    for (const mapId of WORLD.getMapIds()) {
      const map = WORLD.getMap(mapId);
      if (!map) continue;

      const baseline = (this.monstersByMap.get(mapId) || []).filter(monster => !monster.contentSourceId);
      const occupied = new Set(
        baseline.filter(monster => !monster.dead).map(monster => `${monster.x},${monster.y}`)
      );
      const overlays = [];
      const seenContentIds = new Set();

      for (const template of catalog) {
        if (!template || typeof template !== 'object' || template.mapId !== mapId) continue;
        if (typeof template.id !== 'string' || !template.id.trim()) continue;
        const sourceId = template.id.trim().slice(0, 100);
        if (seenContentIds.has(sourceId)) continue;
        seenContentIds.add(sourceId);

        const count = Math.floor(boundedNumber(template.count, 1, 25, 1));
        const explicitX = Number(template.posX);
        const explicitY = Number(template.posY);
        const hasExplicitSpawn = Number.isInteger(explicitX) && Number.isInteger(explicitY)
          && explicitX >= 0 && explicitX < map.width && explicitY >= 0 && explicitY < map.height
          && Boolean(map.tiles?.[explicitY]?.[explicitX]?.walkable);

        for (let index = 0; index < count; index++) {
          let pos = null;
          if (index === 0 && hasExplicitSpawn && !occupied.has(`${explicitX},${explicitY}`)) {
            pos = { x: explicitX, y: explicitY };
          }
          if (!pos) {
            for (let attempt = 0; attempt < 300; attempt++) {
              const candidate = WORLD.findWalkableSpawn(map);
              if (!occupied.has(`${candidate.x},${candidate.y}`)) { pos = candidate; break; }
            }
          }
          if (!pos) continue;
          occupied.add(`${pos.x},${pos.y}`);

          const hp = Math.floor(boundedNumber(template.hp, 1, 10_000_000, 20));
          const rawType = typeof template.type === 'string' ? template.type.toLowerCase() : 'normal';
          const type = ['normal', 'elite', 'boss'].includes(rawType) ? rawType : 'normal';
          const rawColor = typeof template.color === 'string' ? template.color : '';
          overlays.push({
            id: `content_${mapId}_${sourceId}_${index}`,
            contentSourceId: sourceId,
            name: typeof template.name === 'string' && template.name.trim() ? template.name.trim().slice(0, 80) : sourceId,
            emoji: typeof template.emoji === 'string' && template.emoji ? template.emoji.slice(0, 8) : '👹',
            x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,
            hp, maxHp: hp,
            attack: Math.floor(boundedNumber(template.attack, 0, 1_000_000, 4)),
            defense: Math.floor(boundedNumber(template.defense, 0, 1_000_000, 1)),
            xp: Math.floor(boundedNumber(template.xp, 0, 100_000_000, 10)),
            level: Math.floor(boundedNumber(template.level, 1, 100_000, 1)),
            color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#8b6f47',
            size: boundedNumber(template.size, 0.4, 4, 1),
            type,
            dead: false, respawnAt: 0, lastMove: 0, lastAttack: 0,
            speed: Math.floor(boundedNumber(template.speed, 200, 10_000, 1200)),
            goldMin: Math.floor(boundedNumber(template.goldMin, 0, 100_000_000, 0)),
            goldMax: Math.floor(boundedNumber(template.goldMax, 0, 100_000_000, 0)),
          });
        }
      }

      this.monstersByMap.set(mapId, [...baseline, ...overlays]);
    }
  }

  // ===== INTENT PROCESSING =====
  processIntent(playerId, intent) {
    const player = this.players.get(playerId);
    if (!player || !intent || typeof intent !== 'object' || typeof intent.type !== 'string') return false;

    const payload = safePayload(intent.payload);
    player.lastActivity = Date.now();

    switch (intent.type) {
      case 'move': return this.handleMove(player, payload);
      case 'attack': return this.handleAttack(player, payload);
      case 'cast': return this.handleCast(player, payload);
      case 'use_item': return this.handleUseItem(player, payload);
      case 'equip': return this.handleEquip(player, payload);
      case 'unequip': return this.handleUnequip(player, payload);
      case 'drop': return this.handleDrop(player, payload);
      case 'pickup': return this.handlePickup(player, payload);
      case 'mount': return this.handleMount(player);
      case 'talent': return this.handleTalent(player, payload);
      case 'talent_reset': return this.handleTalentReset(player);
      case 'adventure_start': return this.handleAdventureStart(player, payload);
      case 'adventure_abandon': return this.handleAdventureAbandon(player);
      case 'adventure_claim': return this.handleAdventureClaim(player);
      case 'official': return this.handleOfficial(player, payload);
      case 'quest_accept': return this.handleQuestAccept(player, payload);
      case 'quest_complete': return this.handleQuestComplete(player, payload);
      case 'travel': return this.handleTravel(player, payload);
      default: return false;
    }
  }

  handleMove(player, payload) {
    const { dx, dy } = payload;
    if (!Number.isInteger(dx) || !Number.isInteger(dy)) return false;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

    const now = Date.now();
    const movementStats = this.computeDerivedStats(player);
    const moveBonus = boundedNumber(movementStats.moveSpeed, 0, 50, 0);
    const moveCooldown = Math.max(50, Math.floor(100 * (1 - moveBonus / 100)));
    if (now - player.lastMove < moveCooldown) return false;

    const nx = player.x + dx, ny = player.y + dy;
    const map = WORLD.getMap(player.mapId);
    if (!map || nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return false;
    if (!map.tiles?.[ny]?.[nx]?.walkable) return false;

    const monsters = this.monstersByMap.get(player.mapId) || [];
    if (monsters.some(m => !m.dead && m.x === nx && m.y === ny)) return false;
    if (this.getPlayersOnMap(player.mapId).some(p => p.id !== player.id && p.x === nx && p.y === ny)) return false;

    player.lastMove = now;
    player.x = nx; player.y = ny;
    if (dx < 0) player.direction = 'left';
    else if (dx > 0) player.direction = 'right';
    else if (dy < 0) player.direction = 'up';
    else if (dy > 0) player.direction = 'down';

    // Portals are server-owned. Stepping onto one attempts travel automatically.
    const portal = map.portals?.find(p => p.pos.x === player.x && p.pos.y === player.y);
    if (portal) this.travelThroughPortal(player, portal);
    return true;
  }

  getActiveBuffs(player, now = Date.now()) {
    const buffs = Array.isArray(player.buffs) ? player.buffs : [];
    const active = buffs.filter(buff => buff && typeof buff === 'object' && Number(buff.expiresAt) > now);
    if (active.length !== buffs.length) player.buffs = active;
    return active;
  }

  // ===== DERIVED STATS (equipment + passive talents + active buffs) =====
  computeDerivedStats(player) {
    const stats = {
      totalAttack: player.attack || 0, totalDefense: player.defense || 0,
      totalMagic: player.magic || 0, totalMaxHp: player.maxHp || 100, totalMaxMana: player.maxMana || 50,
      critChance: 15, lifesteal: 0, thorns: 0, moveSpeed: 0,
      xpBonus: 0, goldBonus: 0, healBonus: 0, damageReduction: 0,
    };

    // Equipment is counted exactly once here.
    for (const eq of Object.values(player.equipment || {})) {
      if (!eq) continue;
      stats.totalAttack += Number(eq.attack) || 0;
      stats.totalDefense += Number(eq.defense) || 0;
      stats.totalDefense += Number(eq.armor) || 0;
      stats.totalMagic += Number(eq.magic) || 0;
      stats.totalMaxHp += Number(eq.hp) || 0;
      stats.totalMaxMana += Number(eq.mana) || 0;
      stats.critChance += Number(eq.critChance) || 0;
      stats.lifesteal += Number(eq.lifesteal) || 0;
      stats.thorns += Number(eq.thorns) || 0;
      stats.xpBonus += Number(eq.xpBonus) || 0;
      stats.goldBonus += Number(eq.goldBonus) || 0;
      stats.damageReduction += Number(eq.damageReduction) || 0;
      stats.moveSpeed += Number(eq.moveSpeed) || 0;
    }

    // Attribute-changing talents are applied to base stats at purchase time;
    // percentage/passive talents are derived here.
    for (const [talentId, rawRank] of Object.entries(player.talents || {})) {
      const rule = TALENT_RULES[talentId];
      if (!rule) continue;
      const rank = Math.max(0, Math.min(rule.maxRank, Number(rawRank) || 0));
      stats.critChance += (rule.critChance || 0) * rank;
      stats.damageReduction += (rule.damageReduction || 0) * rank;
      stats.goldBonus += (rule.goldBonus || 0) * rank;
      stats.xpBonus += (rule.xpBonus || 0) * rank;
      stats.healBonus += (rule.healBonus || 0) * rank;
    }

    if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;
    if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;

    for (const buff of this.getActiveBuffs(player)) {
      if (buff.type === 'shield') stats.damageReduction += boundedNumber(buff.value, 0, 80, 25);
      else if (buff.type === 'frenzy') stats.totalAttack *= 1 + boundedNumber(buff.value, 0, 100, 25) / 100;
      else if (buff.type === 'haste') stats.moveSpeed += boundedNumber(buff.value, 0, 100, 35);
    }
    officialSystems.applyDerivedBonuses(player, stats);
    stats.totalAttack = Math.max(0, Math.floor(stats.totalAttack));
    stats.critChance = Math.max(0, Math.min(100, stats.critChance));
    stats.damageReduction = Math.max(0, Math.min(80, stats.damageReduction));
    return stats;
  }

  handleAttack(player, payload) {
    const now = Date.now();
    if (now - player.lastAttack < 700) return false;

    const monsterId = typeof payload.monsterId === 'string' ? payload.monsterId : player.targetId;
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const monster = monsters.find(m => m.id === monsterId && !m.dead);
    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;

    const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
    if (dist > 2) return false;
    player.targetId = monster.id;
    player.lastAttack = now;

    const derived = this.computeDerivedStats(player);
    const masteryMultiplier = 1 + officialSystems.getMasteryBonus(player);
    const baseAttack = Math.floor(derived.totalAttack * masteryMultiplier) + Math.floor(Math.random() * 8);
    const crit = Math.random() < (derived.critChance / 100);
    let dmg = Math.max(1, baseAttack - monster.defense);
    if (crit) dmg = Math.floor(dmg * 2);
    if (player.vocation === 'berserker' && player.hp < derived.totalMaxHp * 0.3) dmg = Math.floor(dmg * 1.5);

    monster.hp -= dmg;
    player.stats.damageDealt += dmg;
    officialSystems.recordWeaponHit(player);
    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd' });

    if (monster.hp > 0) {
      const assist = officialSystems.getPetDamage(player, monster);
      if (assist) {
        monster.hp -= assist.damage;
        player.stats.damageDealt += assist.damage;
        this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: assist.damage, pos: { x: monster.x, y: monster.y }, color: assist.pet.color, text: `${assist.pet.icon} ${assist.damage}` });
      }
    }
    if (monster.hp <= 0) this.killMonster(player, monster);
    return true;
  }

  killMonster(player, monster) {
    monster.dead = true;
    monster.respawnAt = monster.noRespawn ? Number.MAX_SAFE_INTEGER : Date.now() + (monster.type === 'boss' ? 60000 : 15000);
    player.stats.monstersKilled++;

    const derived = this.computeDerivedStats(player);
    const adventureKill = adventureEngine.onMonsterKill(player, monster);
    const officialKill = officialSystems.onMonsterKill(player, monster);
    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100) * adventureKill.xpMultiplier * officialKill.xpMultiplier);
    player.xp += xpGain;
    this.emitEvent(player.mapId, { kind: 'xp', targetId: player.id, amount: xpGain, pos: { x: monster.x, y: monster.y }, color: '#f4e04d', text: `+${xpGain} XP` });

    const questResult = questEngine.onMonsterKill(player.id, monster);
    for (const prog of questResult.progressed) {
      this.emitEvent(player.mapId, { kind: 'quest_progress', targetId: player.id, text: `${prog.name}: ${prog.current}/${prog.needed}`, color: '#9bd4ff', pos: { x: player.x, y: player.y } });
    }
    for (const comp of questResult.completed) {
      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y } });
    }

    if (adventureKill.comboCount > 1) {
      this.emitEvent(player.mapId, { kind: 'adventure_combo', targetId: player.id, text: `${adventureKill.comboCount}x MOMENTUM · +${Math.round((adventureKill.comboMultiplier - 1) * 100)}% XP`, color: '#ffb84d', pos: { x: player.x, y: player.y } });
    }
    if (adventureKill.progress) {
      const p = adventureKill.progress;
      this.emitEvent(player.mapId, { kind: 'adventure_progress', targetId: player.id, text: `⚔ ${p.title}: ${p.current}/${p.needed}`, color: '#7dd3fc', pos: { x: player.x, y: player.y } });
    }
    if (adventureKill.becameReady) {
      this.emitEvent(player.mapId, { kind: 'adventure_ready', targetId: player.id, text: '🏆 Hunt complete! Open Hunts (H) to claim your reward.', color: '#ffd87b', pos: { x: player.x, y: player.y } });
    }


    if (officialKill.worldEventProgress) {
      const event = officialKill.worldEventProgress;
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🌍 ${event.name}: ${event.progress}/${event.needed}`, color: '#ff9b4d', pos: { x: player.x, y: player.y } });
    }
    for (const achievement of officialKill.achievements || []) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🏆 Achievement: ${achievement.icon} ${achievement.name} · +${achievement.coins} coins`, color: '#c084fc', pos: { x: player.x, y: player.y } });
    }
    if (officialKill.nextDungeonWave) {
      this.spawnOfficialDungeonWave(player);
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🌀 Dungeon wave ${officialKill.nextDungeonWave} begins!`, color: '#c084fc', pos: { x: player.x, y: player.y } });
    }
    if (officialKill.dungeonComplete) {
      this.clearOfficialDungeon(player);
      const reward = officialKill.dungeonComplete;
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🏆 Dungeon cleared: +${reward.gold}g +${reward.xp}XP +${reward.coins} coins`, color: '#ffd87b', pos: { x: player.x, y: player.y } });
    }

    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems), ...(officialKill.bonusLoot || [])];
    if (loot.length > 0) {
      const groundItems = this.groundItemsByMap.get(player.mapId) || [];
      groundItems.push({ id: `ground_${Date.now()}_${Math.random()}`, x: monster.x, y: monster.y, items: loot, expireAt: Date.now() + 120000 });
      this.groundItemsByMap.set(player.mapId, groundItems);
    }

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
    if (!voc || !Number.isInteger(payload.spellIndex)) return false;
    const spell = this.getSpellList(player.vocation)[payload.spellIndex];
    if (!spell) return false;
    if (player.level < (spell.levelRequired || 1)) return false;
    if (now - (player.cooldowns[spell.name] || 0) < spell.cooldown) return false;
    if (player.mana < spell.mana) return false;

    player.mana -= spell.mana;
    player.cooldowns[spell.name] = now;
    player.stats.spellsCast++;

    const derived = this.computeDerivedStats(player);
    this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });

    if (spell.type === 'buff') {
      const validBuffs = new Set(['shield', 'haste', 'invisible', 'frenzy']);
      const buffType = validBuffs.has(spell.buffType) ? spell.buffType : 'shield';
      const defaults = { shield: 25, haste: 35, invisible: 1, frenzy: 25 };
      const duration = Math.floor(boundedNumber(spell.buffDuration, 1000, 60000, 8000));
      const value = boundedNumber(spell.buffValue, 0, 100, defaults[buffType]);
      player.buffs = this.getActiveBuffs(player, now).filter(buff => buff.type !== buffType);
      player.buffs.push({
        id: `${buffType}_${now}`, type: buffType, name: spell.name, value,
        startTime: now, expiresAt: now + duration,
      });
      this.emitEvent(player.mapId, { kind: 'buff', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });
    } else if (spell.type === 'heal' && spell.damage > 0) {
      const baseHeal = spell.damage + Math.floor(derived.totalMagic * 0.5);
      const healAmt = Math.floor(baseHeal * (1 + derived.healBonus / 100));
      const before = player.hp;
      player.hp = Math.min(derived.totalMaxHp, player.hp + healAmt);
      player.stats.healingDone += Math.max(0, player.hp - before);
      this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: healAmt, pos: { x: player.x, y: player.y }, color: '#2ecc71' });
    } else {
      const monsters = this.monstersByMap.get(player.mapId) || [];
      for (const m of monsters) {
        if (m.dead || (m.dungeonOwnerId && m.dungeonOwnerId !== player.id)) continue;
        const dist = Math.hypot(m.x - player.x, m.y - player.y);
        if (dist <= spell.range) {
          const baseDmg = spell.damage + Math.floor(derived.totalMagic * (spell.scalingCoeff || 1) * 0.5);
          const dmg = Math.max(1, baseDmg - m.defense);
          m.hp -= dmg;
          player.stats.damageDealt += dmg;
          this.emitEvent(player.mapId, { kind: 'damage', targetId: m.id, amount: dmg, pos: { x: m.x, y: m.y }, color: spell.color });
          if (m.hp <= 0) this.killMonster(player, m);
          if (spell.type === 'attack') break;
        }
      }
    }
    return true;
  }

  handleUseItem(player, payload) {
    if (typeof payload.itemId !== 'string') return false;
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item || item.type !== 'potion' || !Number.isFinite(item.quantity) || item.quantity <= 0) return false;

    const derived = this.computeDerivedStats(player);
    if (item.name.includes('Health')) {
      if (player.hp >= derived.totalMaxHp) return false;
      const before = player.hp;
      const amount = item.name.includes('Greater') ? 200 : 50;
      player.hp = Math.min(derived.totalMaxHp, player.hp + amount);
      this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: player.hp - before, pos: { x: player.x, y: player.y }, color: '#2ecc71' });
    } else if (item.name.includes('Mana')) {
      if (player.mana >= derived.totalMaxMana) return false;
      player.mana = Math.min(derived.totalMaxMana, player.mana + 50);
    } else return false;

    item.quantity--;
    if (item.quantity <= 0) player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    return true;
  }

  handleEquip(player, payload) {
    if (typeof payload.itemId !== 'string') return false;
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item || !item.equipment) return false;
    if ((item.equipment.level || 1) > player.level) return false;

    const slot = item.equipment.slot;
    if (typeof slot !== 'string' || !slot) return false;
    const current = player.equipment[slot];
    if (current) {
      player.inventory.push({
        id: `eq_${Date.now()}_${Math.random()}`,
        name: current.name,
        icon: current.icon,
        type: 'equipment',
        quantity: 1,
        value: current.value || 0,
        equipment: { ...current },
      });
    }

    player.equipment[slot] = { ...item.equipment };
    player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    return true;
  }

  handleUnequip(player, payload) {
    const slot = typeof payload.slot === 'string' ? payload.slot : '';
    const equipment = slot ? player.equipment?.[slot] : null;
    if (!equipment) return false;
    player.inventory.push({
      id: `unequip_${Date.now()}_${Math.random()}`,
      name: equipment.name,
      icon: equipment.icon,
      type: 'equipment',
      quantity: 1,
      value: equipment.value || 0,
      equipment: { ...equipment },
    });
    delete player.equipment[slot];
    return true;
  }

  handleDrop(player, payload) {
    if (typeof payload.itemId !== 'string') return false;
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item) return false;
    const groundItems = this.groundItemsByMap.get(player.mapId) || [];
    groundItems.push({
      id: `ground_${Date.now()}_${Math.random()}`,
      x: player.x,
      y: player.y,
      items: [{ ...item }],
      expireAt: Date.now() + 120000,
    });
    player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    this.groundItemsByMap.set(player.mapId, groundItems);
    return true;
  }

  handlePickup(player, payload) {
    if (typeof payload.groundId !== 'string') return false;
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

  handleMount(player) {
    if (!player.mounted && player.level < 5) return false;
    player.mounted = !player.mounted;
    return true;
  }

  handleTalent(player, payload) {
    const talentId = payload.talentId;
    const rule = typeof talentId === 'string' ? TALENT_RULES[talentId] : null;
    if (!rule) return false;

    if (!player.talents || typeof player.talents !== 'object') player.talents = {};
    const current = Number(player.talents[talentId]) || 0;
    if (current >= rule.maxRank) return false;
    if (rule.requires && (Number(player.talents[rule.requires]) || 0) < 1) return false;

    const spent = Object.entries(player.talents).reduce((sum, [id, rank]) => {
      const known = TALENT_RULES[id];
      return known ? sum + Math.max(0, Math.min(known.maxRank, Number(rank) || 0)) : sum;
    }, 0);
    if (spent >= player.level) return false;

    player.talents[talentId] = current + 1;
    if (rule.hp) { player.maxHp += rule.hp; player.hp += rule.hp; }
    if (rule.mana) { player.maxMana += rule.mana; player.mana += rule.mana; }
    if (rule.attack) player.attack += rule.attack;
    if (rule.defense) player.defense += rule.defense;
    if (rule.magic) player.magic += rule.magic;
    return true;
  }

  handleTalentReset(player) {
    if (player.gold < 500) return false;
    const voc = VOCATIONS[player.vocation];
    if (!voc) return false;

    player.gold -= 500;
    player.talents = {};
    const levelsGained = Math.max(0, player.level - 1);
    player.maxHp = voc.baseHp + levelsGained * voc.hpPerLevel;
    player.maxMana = voc.baseMana + levelsGained * voc.manaPerLevel;
    player.attack = voc.baseAttack + levelsGained * voc.atkPerLevel;
    player.defense = voc.baseDefense + levelsGained * voc.defPerLevel;
    player.magic = voc.baseMagic + levelsGained * voc.magPerLevel;
    player.hp = Math.min(player.hp, player.maxHp);
    player.mana = Math.min(player.mana, player.maxMana);
    return true;
  }

  travelThroughPortal(player, portal) {
    if (!portal || typeof portal.targetMap !== 'string') return false;
    const targetMap = WORLD.getMap(portal.targetMap);
    const spawn = portal.targetSpawn;
    if (!targetMap || !spawn || !targetMap.tiles?.[spawn.y]?.[spawn.x]?.walkable) return false;
    if (targetMap.levelRequired && player.level < targetMap.levelRequired) {
      this.emitEvent(player.mapId, {
        kind: 'system', targetId: player.id,
        text: `🔒 ${targetMap.name} requires level ${targetMap.levelRequired}`,
        color: '#ff6060', pos: { x: player.x, y: player.y },
      });
      return false;
    }
    player.mapId = portal.targetMap;
    player.x = spawn.x;
    player.y = spawn.y;
    player.targetId = null;
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: `🌍 Entered ${targetMap.name}`,
      color: '#9bd4ff', pos: { x: player.x, y: player.y },
    });
    return true;
  }

  handleTravel(player, payload) {
    const targetMap = typeof payload.targetMap === 'string' ? payload.targetMap : '';
    const currentMap = WORLD.getMap(player.mapId);
    if (!currentMap || !WORLD.getMap(targetMap)) return false;
    const portal = currentMap.portals?.find(p =>
      p.targetMap === targetMap && p.pos.x === player.x && p.pos.y === player.y
    );
    if (!portal) return false;
    return this.travelThroughPortal(player, portal);
  }

  handleAdventureStart(player, payload) {
    const result = adventureEngine.start(player, payload.contractId);
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: result.ok ? `⚔ Hunt started: ${result.contract.title}` : `❌ ${result.error}`,
      color: result.ok ? '#7dd3fc' : '#ff6060', pos: { x: player.x, y: player.y },
    });
    return result.ok;
  }

  handleAdventureAbandon(player) {
    const result = adventureEngine.abandon(player);
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: result.ok ? 'Hunt abandoned.' : `❌ ${result.error}`,
      color: result.ok ? '#cbd5e1' : '#ff6060', pos: { x: player.x, y: player.y },
    });
    return result.ok;
  }

  handleAdventureClaim(player) {
    const result = adventureEngine.claim(player);
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.error}`, color: '#ff6060', pos: { x: player.x, y: player.y } });
      return false;
    }

    player.gold += result.gold;
    player.xp += result.xp;
    player.stats.goldEarned += result.gold;
    player.stats.adventuresCompleted = Math.max(0, Number(player.stats.adventuresCompleted) || 0) + 1;

    let cacheItem = null;
    if (result.cache) {
      const pool = buildEquipmentLootPool(this.contentItems)
        .filter(item => (Number(item.level) || 1) <= player.level + 3)
        .sort((a, b) => Math.abs((Number(a.level) || 1) - player.level) - Math.abs((Number(b.level) || 1) - player.level))
        .slice(0, 6);
      if (pool.length > 0) {
        const reward = pool[Math.floor(Math.random() * pool.length)];
        cacheItem = reward.name;
        player.inventory.push({
          id: `hunt_cache_${Date.now()}_${Math.random()}`,
          name: reward.name, icon: reward.icon, quantity: 1, value: reward.value || 0,
          type: 'equipment', rarity: reward.rarity, description: reward.description,
          equipment: { ...reward, sockets: 0, socketedGems: [] },
        });
      }
    }

    const voc = VOCATIONS[player.vocation];
    while (voc && player.xp >= player.xpNext) {
      player.xp -= player.xpNext;
      player.level++;
      player.xpNext = Math.floor(player.xpNext * 1.4);
      player.maxHp += voc.hpPerLevel; player.hp = player.maxHp;
      player.maxMana += voc.manaPerLevel; player.mana = player.maxMana;
      player.attack += voc.atkPerLevel; player.defense += voc.defPerLevel; player.magic += voc.magPerLevel;
      player.stats.levelUps++;
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y } });
    }

    const cacheText = cacheItem ? ` · 🎁 Cache: ${cacheItem}` : result.cache ? ' · 🎁 Equipment cache earned' : '';
    this.emitEvent(player.mapId, {
      kind: 'adventure_claimed', targetId: player.id,
      text: `🏆 ${result.contract.title}: +${result.gold}g +${result.xp} XP · Streak ${result.streak}${cacheText}`,
      color: '#ffd87b', pos: { x: player.x, y: player.y },
    });
    return true;
  }

  applyLevelUps(player) {
    const voc = VOCATIONS[player.vocation];
    while (voc && player.xp >= player.xpNext) {
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

  clearOfficialDungeon(player) {
    for (const [mapId, monsters] of this.monstersByMap) {
      this.monstersByMap.set(mapId, monsters.filter(monster => monster.dungeonOwnerId !== player.id));
    }
  }

  spawnOfficialDungeonWave(player) {
    const state = player.official?.dungeon;
    if (!state?.active || !state.runId) return false;
    const map = WORLD.getMap(player.mapId);
    if (!map) return false;
    this.clearOfficialDungeon(player);
    const wave = officialSystems.getDungeonWave(state.wave, player.level);
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const occupied = new Set(monsters.filter(m => !m.dead).map(m => `${m.x},${m.y}`));
    occupied.add(`${player.x},${player.y}`);
    const spawned = [];
    for (let index = 0; index < wave.count; index++) {
      let pos = null;
      for (let attempt = 0; attempt < 120; attempt++) {
        const x = player.x + (Math.floor(Math.random() * 11) - 5);
        const y = player.y + (Math.floor(Math.random() * 11) - 5);
        if (map.tiles?.[y]?.[x]?.walkable && !occupied.has(`${x},${y}`)) { pos = { x, y }; break; }
      }
      if (!pos) pos = WORLD.findWalkableSpawn(map);
      occupied.add(`${pos.x},${pos.y}`);
      spawned.push({
        id: `${state.runId}_${state.wave}_${index}`, dungeonOwnerId: player.id, dungeonRunId: state.runId, noRespawn: true,
        name: wave.name, emoji: wave.emoji, color: wave.color, x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,
        hp: wave.hp, maxHp: wave.hp, attack: wave.attack, defense: wave.defense, xp: wave.xp,
        level: Math.max(1, player.level + state.wave - 1), size: wave.boss ? 1.6 : 1, type: wave.boss ? 'boss' : state.wave >= 7 ? 'elite' : 'normal',
        dead: false, respawnAt: 0, lastMove: 0, lastAttack: 0, speed: 900,
      });
    }
    this.monstersByMap.set(player.mapId, [...monsters, ...spawned]);
    return true;
  }

  handleOfficial(player, payload) {
    const action = typeof payload.action === 'string' ? payload.action : '';
    const result = officialSystems.handle(player, payload, {
      world: WORLD,
      contentItems: this.contentItems,
      getPlayer: id => this.players.get(id),
      startDungeon: () => this.spawnOfficialDungeonWave(player),
      clearDungeon: () => this.clearOfficialDungeon(player),
    });
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.error || 'Official action rejected.'}`, color: '#ff6060', pos: { x: player.x, y: player.y } });
      return false;
    }
    this.applyLevelUps(player);
    const labels = {
      pet_buy: '🐾 Companion acquired', pet_toggle: '🐾 Companion updated', depot_put: '🗄 Item stored', depot_take: '🗄 Item withdrawn',
      bank_deposit: '🏦 Deposit complete', bank_withdraw: '🏦 Withdrawal complete', rest: '💚 Rested and restored', train: '📚 Training complete',
      food_buy: '🍲 Food buff active', shop_buy: '🛒 Purchase complete', craft: '⚒ Craft complete', socket_gem: '💎 Gem socketed',
      daily_claim: '🎁 Daily reward claimed', gather: '⛏ Resource gathered', book_read: '📚 Book marked read', mystery_answer: '✦ Mystery answer accepted',
      coin_buy: '💎 Coin purchase complete', auction_list: '🏛 Auction listed', auction_buy: '🏛 Auction purchase complete', auction_cancel: '🏛 Auction cancelled',
      mail_send: '📮 Mail sent', mail_read: '📮 Mail read', mail_claim: '📮 Attachment claimed', mail_delete: '📮 Mail deleted',
      world_event_claim: '🌍 World event reward claimed', pvp_toggle: '⚔ PvP status updated', pvp_attack: '⚔ PvP attack',
      dungeon_start: '🌀 Dungeon started', dungeon_abandon: '🌀 Dungeon abandoned',
    };
    let text = labels[action] || '✓ Official action complete';
    if (action === 'daily_claim' && result.detail) text += ` · +${result.detail.gold}g +${result.detail.xp}XP +${result.detail.coins} coins`;
    if (action === 'gather' && result.detail) text += ` · +${result.detail.quantity} ${result.detail.name}`;
    if (action === 'mystery_answer' && result.detail?.completed) text += ' · mystery completed!';
    if (action === 'pvp_attack' && result.detail) {
      text += ` · ${result.detail.damage} damage · skull ${result.detail.skull}`;
      const target = this.players.get(payload.targetId);
      if (target) this.emitEvent(target.mapId, { kind: 'system', targetId: target.id, text: `${player.name} hit you for ${result.detail.damage}${result.detail.killed ? ' · DEFEATED' : ''}`, color: '#ff6060', pos: { x: target.x, y: target.y } });
    }
    this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text, color: '#7dd3fc', pos: { x: player.x, y: player.y } });
    return true;
  }

  getQuestNpcRequirement(questId) {
    const quest = contentDB.get('quests').find(entry => entry?.id === questId);
    if (!quest || typeof quest.npcId !== 'string' || !quest.npcId.trim()) return null;
    const npc = contentDB.get('npcs').find(entry => entry?.id === quest.npcId);
    if (!npc) return null;
    const x = Number(npc.posX);
    const y = Number(npc.posY);
    const mapId = typeof npc.mapId === 'string' && WORLD.getMap(npc.mapId) ? npc.mapId : null;
    if (!mapId || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { name: typeof npc.name === 'string' && npc.name.trim() ? npc.name.trim() : npc.id, mapId, x: Math.floor(x), y: Math.floor(y) };
  }

  isNearQuestNpc(player, questId) {
    const npc = this.getQuestNpcRequirement(questId);
    if (!npc) return { ok: true, npc: null };
    const near = player.mapId === npc.mapId
      && Math.abs(player.x - npc.x) <= 2
      && Math.abs(player.y - npc.y) <= 2;
    return { ok: near, npc };
  }

  emitQuestNpcRequirement(player, npc, verb) {
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: `❌ Move near ${npc.name} to ${verb} this quest.`,
      color: '#ff6060', pos: { x: player.x, y: player.y },
    });
  }

  handleQuestAccept(player, payload) {
    if (typeof payload.questId !== 'string') return false;
    const proximity = this.isNearQuestNpc(player, payload.questId);
    if (!proximity.ok) {
      this.emitQuestNpcRequirement(player, proximity.npc, 'accept');
      return false;
    }
    const result = questEngine.acceptQuest(player.id, payload.questId);
    if (result.success) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `📜 Quest accepted: ${result.quest.name}`, color: '#9bd4ff' });
    } else {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.reason}`, color: '#ff6060' });
    }
    return result.success;
  }

  handleQuestComplete(player, payload) {
    if (typeof payload.questId !== 'string') return false;
    const proximity = this.isNearQuestNpc(player, payload.questId);
    if (!proximity.ok) {
      this.emitQuestNpcRequirement(player, proximity.npc, 'complete');
      return false;
    }
    const result = questEngine.completeQuest(player.id, payload.questId);
    if (result.success) {
      player.gold += result.rewards.gold;
      player.xp += result.rewards.xp;
      player.stats.goldEarned += result.rewards.gold;
      if (result.rewards.item) player.inventory.push({ id: `quest_${Date.now()}`, ...result.rewards.item, type: 'misc', quantity: 1 });
      const voc = VOCATIONS[player.vocation];
      while (voc && player.xp >= player.xpNext) {
        player.xp -= player.xpNext;
        player.level++;
        player.xpNext = Math.floor(player.xpNext * 1.4);
        player.maxHp += voc.hpPerLevel;
        player.maxMana += voc.manaPerLevel;
        player.attack += voc.atkPerLevel;
        player.defense += voc.defPerLevel;
        player.magic += voc.magPerLevel;
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        player.stats.levelUps++;
        this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y } });
      }
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
      if (m.dead) { if (!m.noRespawn && now >= m.respawnAt) { m.dead = false; m.hp = m.maxHp; m.x = m.spawnX; m.y = m.spawnY; } continue; }
      if (players.length === 0) continue;

      let nearest = null, minDist = 8;
      for (const p of players) {
        if (m.dungeonOwnerId && p.id !== m.dungeonOwnerId) continue;
        if (this.getActiveBuffs(p, now).some(buff => buff.type === 'invisible')) continue;
        const d = Math.abs(p.x - m.x) + Math.abs(p.y - m.y);
        if (d < minDist) { minDist = d; nearest = p; }
      }

      if (nearest && minDist <= 1 && now - m.lastAttack > 1200) {
        m.lastAttack = now;
        const derived = this.computeDerivedStats(nearest);
        let dmg = Math.max(1, m.attack + Math.floor(Math.random() * 4) - derived.totalDefense);
        dmg = Math.max(1, Math.floor(dmg * (1 - derived.damageReduction / 100)));
        nearest.hp -= dmg; nearest.stats.damageTaken += dmg;
        this.emitEvent(mapId, { kind: 'damage', targetId: nearest.id, amount: dmg, pos: { x: nearest.x, y: nearest.y }, color: '#ff6060' });
        if (nearest.hp <= 0) {
          nearest.hp = derived.totalMaxHp; nearest.mana = derived.totalMaxMana;
          const deathLoss = officialSystems.getDeathLossMultiplier(nearest);
          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1 * deathLoss));
          if (nearest.official?.dungeon?.active) { officialSystems.failDungeon(nearest); this.clearOfficialDungeon(nearest); }
          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';
          nearest.stats.deaths++;
          this.emitEvent(nearest.mapId, { kind: 'death', targetId: nearest.id, text: 'You died!', color: '#ff0000', pos: { x: nearest.x, y: nearest.y } });
        }
      } else if (nearest && minDist > 1 && minDist < 8 && now - m.lastMove > m.speed) {
        m.lastMove = now;
        const dx = Math.sign(nearest.x - m.x), dy = Math.sign(nearest.y - m.y);
        const map = WORLD.getMap(mapId);
        const canOccupy = (x, y) => Boolean(
          map?.tiles?.[y]?.[x]?.walkable &&
          !players.some(p => p.x === x && p.y === y) &&
          !monsters.some(other => other.id !== m.id && !other.dead && other.x === x && other.y === y)
        );
        if (Math.abs(nearest.x - m.x) > Math.abs(nearest.y - m.y)) {
          if (canOccupy(m.x + dx, m.y)) m.x += dx;
        } else {
          if (canOccupy(m.x, m.y + dy)) m.y += dy;
        }
      }
    }
  }

  tick() {
    const now = Date.now();
    this.tickCount++;
    for (const p of this.players.values()) {
      officialSystems.tickPlayer(p, now);
      if (now - p.lastRegen > 2000) {
        const derived = this.computeDerivedStats(p);
        if (p.hp < derived.totalMaxHp) p.hp = Math.min(derived.totalMaxHp, p.hp + 2);
        if (p.mana < derived.totalMaxMana) p.mana = Math.min(derived.totalMaxMana, p.mana + 3);
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

    const derived = this.computeDerivedStats(player);
    const playerData = {
      ...player,
      ws: undefined,
      official: undefined,
      attack: derived.totalAttack,
      defense: derived.totalDefense,
      magic: derived.totalMagic,
      maxHp: derived.totalMaxHp,
      maxMana: derived.totalMaxMana,
      critChance: derived.critChance,
      lifesteal: derived.lifesteal,
      thorns: derived.thorns,
      xpBonus: derived.xpBonus,
      goldBonus: derived.goldBonus,
      healBonus: derived.healBonus,
      damageReduction: derived.damageReduction,
      moveSpeed: derived.moveSpeed,
      quests: questEngine.serialize(playerId),
      adventure: adventureEngine.serialize(player),
    };

    const nearbyPlayers = [];
    for (const p of this.players.values()) {
      if (p.id !== playerId && p.mapId === player.mapId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25) {
        const voc = VOCATIONS[p.vocation];
        const pDerived = this.computeDerivedStats(p);
        nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, icon: voc?.icon, color: voc?.color, ...officialSystems.publicPvp(p) });
      }
    }

    const allMonsters = this.monstersByMap.get(player.mapId) || [];
    const monsters = allMonsters.filter(m => !m.dead && (!m.dungeonOwnerId || m.dungeonOwnerId === playerId) && Math.abs(m.x - player.x) < 15 && Math.abs(m.y - player.y) < 15)
      .map(m => ({ id: m.id, name: m.name, emoji: m.emoji, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type, color: m.color, size: m.size }));

    const allGround = this.groundItemsByMap.get(player.mapId) || [];
    const groundItems = allGround.filter(g => Math.abs(g.x - player.x) < 15 && Math.abs(g.y - player.y) < 15).map(g => ({ id: g.id, x: g.x, y: g.y, items: g.items }));

    const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup', 'adventure_combo', 'adventure_progress', 'adventure_ready', 'adventure_claimed']);
    const events = (this.pendingEvents.get(player.mapId) || []).filter(event =>
      !privateKinds.has(event.kind) || event.targetId === playerId
    );
    const official = officialSystems.snapshot(player, this.getPlayersOnMap(player.mapId).filter(p => p.id !== playerId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25));
    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official };
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
