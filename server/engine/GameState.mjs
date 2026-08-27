// ===================================================================
//  MOR'IA SERVER — AUTHORITATIVE GAME ENGINE
//  The heart of the MMO. Processes intents, calculates combat,
//  manages world state. Clients NEVER modify state directly here.
// ===================================================================

import { WORLD } from './World.mjs';
import { VOCATIONS } from './Vocations.mjs';
import { rollLoot, getStarterInventory, buildEquipmentLootPool } from './Items.mjs';
import { sumAffixStats } from './Itemization.mjs';
import { questEngine } from './QuestEngine.mjs';
import { adventureEngine, createAdventureState } from './AdventureEngine.mjs';
import { officialSystems } from './OfficialSystems.mjs';
import { socialSystems } from './SocialSystems.mjs';
import { contentDB } from './ContentDB.mjs';
import { accountStore } from './AuthService.mjs';
import { canAccessMap, explainMapAccess } from './ContentAccess.mjs';
import { tibiaTaskEngine } from './TibiaTaskEngine.mjs';
import { appearanceSystem } from './AppearanceSystem.mjs';
import { mountSystem } from './MountSystem.mjs';
import { housingSystem } from './HousingSystem.mjs';
import { createWorldClockSnapshot } from './WorldClock.mjs';
import { contextualizeSpell, effectForRelation, multiplierForRelation } from './ContextualSkillEngine.mjs';
import { applyClassDerivedStats, classBasicAttackRules, classSpellMultiplier, applyClassKillSustain } from './ClassIdentity.mjs';
import { buildBossDefeatEvent, buildLootRewardEvent } from './RewardFeedback.mjs';
import { buildBossIntroEvent, buildRegionDiscoveryEvent, buildAchievementUnlockEvent, buildCosmeticUnlockEvent, buildRewardChestEvent } from './CinematicRewards.mjs';


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

function freshSkills() {
  return {
    fist: { level: 10, progress: 0 }, sword: { level: 10, progress: 0 },
    axe: { level: 10, progress: 0 }, club: { level: 10, progress: 0 },
    distance: { level: 10, progress: 0 }, shielding: { level: 10, progress: 0 },
    magic: { level: 10, progress: 0 }, fishing: { level: 10, progress: 0 },
  };
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
    WORLD.syncContentMaps(contentDB.get('maps'));
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
      buffs: [], skills: freshSkills(),
      lastAttack: 0, lastMove: 0, lastRegen: 0, cooldowns: {},
      mounted: false, mountId: undefined, mountState: null, appearanceState: null, taskState: null, professions: {}, reputation: { town: 0 }, talents: {},
      adventure: createAdventureState(),
      official: null,
      stats: { monstersKilled: 0, bossesKilled: 0, damageDealt: 0, damageTaken: 0, healingDone: 0, goldEarned: 0, distanceWalked: 0, deaths: 0, levelUps: 0, spellsCast: 0, adventuresCompleted: 0 },
      sessionStartedAt: Date.now(), sessionDamageBase: 0,
      ws, lastActivity: Date.now(),
    };
    appearanceSystem.initializePlayer(player, contentDB);
    mountSystem.initializePlayer(player, contentDB);
    tibiaTaskEngine.initializePlayer(player, contentDB);
    housingSystem.maintainPlayer(player, contentDB);
    this.players.set(id, player);
    return player;
  }

  playerDisconnect(id) { const player = this.players.get(id); if (player) socialSystems.onDisconnect(player); questEngine.clearPlayer(id); this.players.delete(id); }
  getPlayer(id) { return this.players.get(id); }
  getPlayersOnMap(mapId) {
    const result = [];
    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);
    return result;
  }

  isNearContentNpc(player, idOrRole, range = 2) {
    const wanted = typeof idOrRole === 'string' ? idOrRole.trim() : '';
    if (!wanted) return false;
    return contentDB.get('npcs').some(npc => npc && npc.mapId === player.mapId
      && (npc.id === wanted || npc.role === wanted)
      && Number.isFinite(Number(npc.posX)) && Number.isFinite(Number(npc.posY))
      && Math.abs(Number(npc.posX) - player.x) + Math.abs(Number(npc.posY) - player.y) <= range);
  }

  enforcePlayerMapAccess(player) {
    const map = WORLD.getMap(player?.mapId);
    if (player && map && canAccessMap(contentDB, player, map)) return true;
    const fallback = WORLD.getMap('eldoria');
    if (!player || !fallback) return false;
    player.mapId = 'eldoria';
    const pos = WORLD.findWalkableSpawn(fallback, fallback.spawnPoint);
    player.x = pos.x; player.y = pos.y; player.targetId = null;
    return false;
  }

  enforceAllMapAccess() {
    for (const player of this.players.values()) this.enforcePlayerMapAccess(player);
  }

  syncContentMaps(mapContent = []) {
    const previousIds = new Set(WORLD.getMapIds());
    WORLD.syncContentMaps(mapContent);
    const nextIds = new Set(WORLD.getMapIds());

    for (const mapId of nextIds) {
      if (!this.monstersByMap.has(mapId)) this.monstersByMap.set(mapId, WORLD.spawnMonsters(mapId));
      if (!this.groundItemsByMap.has(mapId)) this.groundItemsByMap.set(mapId, []);
      if (!this.pendingEvents.has(mapId)) this.pendingEvents.set(mapId, []);
      const map = WORLD.getMap(mapId);
      const monsters = this.monstersByMap.get(mapId) || [];
      for (const monster of monsters) {
        if (!map?.tiles?.[monster.y]?.[monster.x]?.walkable) {
          const pos = WORLD.findWalkableSpawn(map, map?.spawnPoint);
          monster.x = pos.x; monster.y = pos.y; monster.spawnX = pos.x; monster.spawnY = pos.y;
        }
      }
    }

    for (const player of this.players.values()) {
      let map = WORLD.getMap(player.mapId);
      if (!map || !canAccessMap(contentDB, player, map)) { player.mapId = 'eldoria'; map = WORLD.getMap('eldoria'); player.targetId = null; }
      if (!map?.tiles?.[player.y]?.[player.x]?.walkable) {
        const pos = WORLD.findWalkableSpawn(map, map?.spawnPoint);
        player.x = pos.x; player.y = pos.y; player.targetId = null;
      }
    }

    for (const mapId of previousIds) {
      if (nextIds.has(mapId)) continue;
      this.monstersByMap.delete(mapId); this.groundItemsByMap.delete(mapId); this.pendingEvents.delete(mapId);
    }
    return WORLD.getMapIds();
  }

  progressSkill(player, skillId, amount = 1) {
    if (!player.skills || typeof player.skills !== 'object') player.skills = freshSkills();
    const raw = player.skills[skillId];
    const skill = raw && typeof raw === 'object'
      ? raw
      : { level: Math.max(1, Math.floor(Number(raw) || 10)), progress: 0 };
    skill.level = Math.max(1, Math.floor(Number(skill.level) || 10));
    skill.progress = Math.max(0, Math.floor(Number(skill.progress) || 0)) + Math.max(1, Math.floor(Number(amount) || 1));
    const needed = Math.max(10, skill.level * 10);
    if (skill.progress >= needed) {
      skill.progress -= needed;
      skill.level++;
    }
    player.skills[skillId] = skill;
    return skill;
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
    const merged = vocation.spells.map(spell => contextualizeSpell({ ...spell }));

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

      for (const key of ['targetMode','allyEffect','enemyEffect','allyMultiplier','enemyMultiplier','selfMultiplier','dayMultiplier','nightMultiplier','drainPercent']) {
        if (raw[key] !== undefined) next[key] = raw[key];
      }
      const contextualNext = contextualizeSpell(next);
      if (matchIndex >= 0) merged[matchIndex] = contextualNext;
      else if (merged.length < 8) merged.push(contextualNext);
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
            lootTableId: typeof template.lootTableId === 'string' ? template.lootTableId.trim().slice(0,100) : '',
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
      case 'mount': return this.handleMount(player, payload);
      case 'appearance': return this.handleAppearance(player, payload);
      case 'task': return this.handleTask(player, payload);
      case 'housing': return this.handleHousing(player, payload);
      case 'talent': return this.handleTalent(player, payload);
      case 'talent_reset': return this.handleTalentReset(player);
      case 'adventure_start': return this.handleAdventureStart(player, payload);
      case 'adventure_abandon': return this.handleAdventureAbandon(player);
      case 'adventure_claim': return this.handleAdventureClaim(player);
      case 'official': return this.handleOfficial(player, payload);
      case 'social': return this.handleSocial(player, payload);
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
    const moveBonus = boundedNumber(movementStats.moveSpeed + mountSystem.speedBonus(player, contentDB), 0, 70, 0);
    const moveCooldown = Math.max(35, Math.floor(100 * (1 - moveBonus / 100)));
    if (now - player.lastMove < moveCooldown) return false;

    const nx = player.x + dx, ny = player.y + dy;
    const map = WORLD.getMap(player.mapId);
    if (!map || nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return false;
    if (!map.tiles?.[ny]?.[nx]?.walkable) return false;
    if (!housingSystem.canStep(player, player.mapId, nx, ny, contentDB)) return false;

    const monsters = this.monstersByMap.get(player.mapId) || [];
    if (monsters.some(m => !m.dead && m.x === nx && m.y === ny)) return false;
    if (this.getPlayersOnMap(player.mapId).some(p => p.id !== player.id && p.x === nx && p.y === ny)) return false;

    player.lastMove = now;
    player.x = nx; player.y = ny;
    player.stats.distanceWalked = (player.stats.distanceWalked || 0) + 1;
    if (dx < 0) player.direction = 'left';
    else if (dx > 0) player.direction = 'right';
    else if (dy < 0) player.direction = 'up';
    else if (dy > 0) player.direction = 'down';

    const nearbyBoss = monsters.find(monster => !monster.dead && monster.type === 'boss' && Math.hypot(monster.x - player.x, monster.y - player.y) <= 7);
    if (nearbyBoss) this.emitBossIntroIfNeeded(player, nearbyBoss);

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
      totalAttack: player.attack || 0, totalDefense: player.defense || 0, totalArmor: 0,
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
      stats.totalArmor += Number(eq.armor) || 0;
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
      const affix = sumAffixStats(eq);
      stats.totalAttack += Number(affix.attack) || 0;
      stats.totalDefense += Number(affix.defense) || 0;
      stats.totalDefense += Number(affix.armor) || 0;
      stats.totalArmor += Number(affix.armor) || 0;
      stats.totalMagic += Number(affix.magic) || 0;
      stats.totalMaxHp += Number(affix.hp) || 0;
      stats.totalMaxMana += Number(affix.mana) || 0;
      stats.critChance += Number(affix.critChance) || 0;
      stats.lifesteal += Number(affix.lifesteal) || 0;
      stats.moveSpeed += Number(affix.moveSpeed) || 0;
      stats.xpBonus += Number(affix.xpBonus) || 0;
      stats.goldBonus += Number(affix.goldBonus) || 0;
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

    // 9.3: class identity is data-driven and authoritative.
    applyClassDerivedStats(player, stats);

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

  emitBossIntroIfNeeded(player, monster) {
    if (!monster || monster.type !== 'boss' || monster.dead) return false;
    if (!Array.isArray(player._bossIntroIds)) player._bossIntroIds = [];
    if (player._bossIntroIds.includes(monster.id)) return false;
    player._bossIntroIds = [...player._bossIntroIds, monster.id].slice(-50);
    const event = buildBossIntroEvent(player, monster);
    if (event) this.emitEvent(player.mapId, event);
    return Boolean(event);
  }

  emitAchievementUnlocks(player, achievements = []) {
    for (const achievement of achievements) {
      const event = buildAchievementUnlockEvent(player, achievement);
      if (event) this.emitEvent(player.mapId, event);
    }
  }

  handleAttack(player, payload) {
    const now = Date.now();
    const monsterId = typeof payload.monsterId === 'string' ? payload.monsterId : player.targetId;
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const monster = monsters.find(m => m.id === monsterId && !m.dead);
    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;
    this.emitBossIntroIfNeeded(player, monster);

    const derived = this.computeDerivedStats(player);
    const classRules = classBasicAttackRules(player, monster, derived);
    if (now - player.lastAttack < classRules.cooldownMs) return false;
    const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
    if (dist > classRules.range) return false;
    player.targetId = monster.id;
    player.lastAttack = now;

    const masteryMultiplier = 1 + officialSystems.getMasteryBonus(player);
    const baseAttack = Math.floor(derived.totalAttack * masteryMultiplier) + Math.floor(Math.random() * 8);
    const crit = Math.random() < (derived.critChance / 100);
    let dmg = Math.max(1, Math.floor(baseAttack * classRules.damageMultiplier) - monster.defense);
    if (crit) dmg = Math.floor(dmg * classRules.critMultiplier);

    monster.hp -= dmg;
    player.stats.damageDealt += dmg;
    const attackSkill = (player.vocation === 'paladin' || player.vocation === 'ranger') ? 'distance' : (player.equipment?.weapon ? 'sword' : 'fist');
    this.progressSkill(player, attackSkill, 1);
    officialSystems.recordWeaponHit(player);
    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd', critical: crit, vocation: player.vocation });

    if (derived.lifesteal > 0 && dmg > 0) {
      const before = player.hp;
      const amount = Math.max(1, Math.floor(dmg * Math.min(50, derived.lifesteal) / 100));
      player.hp = Math.min(derived.totalMaxHp, player.hp + amount);
      const actual = Math.max(0, player.hp - before);
      if (actual > 0) {
        player.stats.healingDone += actual;
        this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: actual, text: 'Lifesteal', pos: { x: player.x, y: player.y }, color: '#c084fc', vocation: player.vocation });
      }
    }

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
    if (monster.type === 'boss') player.stats.bossesKilled = (player.stats.bossesKilled || 0) + 1;
    const bossRewardEvent = buildBossDefeatEvent(player, monster);
    if (bossRewardEvent) this.emitEvent(player.mapId, bossRewardEvent);

    const derived = this.computeDerivedStats(player);
    const classSustain = applyClassKillSustain(player, monster, derived);
    if (classSustain.hp > 0 || classSustain.mana > 0) {
      const sustainParts = [classSustain.hp > 0 ? `+${classSustain.hp} HP` : '', classSustain.mana > 0 ? `+${classSustain.mana} MP` : ''].filter(Boolean);
      this.emitEvent(player.mapId, { kind: 'class_sustain', targetId: player.id, text: `${classSustain.signature} · ${sustainParts.join(' · ')}`, color: classSustain.color, pos: { x: player.x, y: player.y }, vocation: player.vocation, hp: classSustain.hp, mana: classSustain.mana });
    }
    const adventureKill = adventureEngine.onMonsterKill(player, monster);
    const taskUpdates = tibiaTaskEngine.onMonsterKill(player, monster, contentDB);
    for (const update of taskUpdates) {
      this.emitEvent(player.mapId, { kind:update.ready ? 'task_ready' : 'task_progress', targetId:player.id, text:`${update.name}: ${update.current}/${update.needed}${update.ready ? ' · return to task master' : ''}`, color:update.ready ? '#f4e04d' : '#9bd4ff', pos:{ x:player.x, y:player.y }, vocation:player.vocation });
    }
    const officialKill = officialSystems.onMonsterKill(player, monster);
    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100) * adventureKill.xpMultiplier * officialKill.xpMultiplier);
    player.xp += xpGain;
    this.emitEvent(player.mapId, { kind: 'xp', targetId: player.id, amount: xpGain, pos: { x: monster.x, y: monster.y }, color: '#f4e04d', text: `+${xpGain} XP` });

    const questResult = questEngine.onMonsterKill(player.id, monster);
    for (const prog of questResult.progressed) {
      this.emitEvent(player.mapId, { kind: 'quest_progress', targetId: player.id, text: `${prog.name}: ${prog.current}/${prog.needed}`, color: '#9bd4ff', pos: { x: player.x, y: player.y } });
    }
    for (const comp of questResult.completed) {
      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y }, vocation: player.vocation });
    }

    if (adventureKill.comboCount > 1) {
      this.emitEvent(player.mapId, { kind: 'adventure_combo', targetId: player.id, text: `${adventureKill.comboCount}x MOMENTUM · +${Math.round((adventureKill.comboMultiplier - 1) * 100)}% XP`, color: '#ffb84d', pos: { x: player.x, y: player.y } });
    }
    if (adventureKill.progress) {
      const p = adventureKill.progress;
      this.emitEvent(player.mapId, { kind: 'adventure_progress', targetId: player.id, text: `⚔ ${p.title}: ${p.current}/${p.needed}`, color: '#7dd3fc', pos: { x: player.x, y: player.y } });
    }
    if (adventureKill.becameReady) {
      this.emitEvent(player.mapId, { kind: 'adventure_ready', targetId: player.id, text: '🏆 Hunt complete! Open Hunts (H) to claim your reward.', color: '#ffd87b', pos: { x: player.x, y: player.y }, vocation: player.vocation });
    }


    if (officialKill.worldEventProgress) {
      const event = officialKill.worldEventProgress;
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🌍 ${event.name}: ${event.progress}/${event.needed}`, color: '#ff9b4d', pos: { x: player.x, y: player.y } });
    }
    this.emitAchievementUnlocks(player, officialKill.achievements || []);
    if (officialKill.nextDungeonWave) {
      this.spawnOfficialDungeonWave(player);
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🌀 Dungeon wave ${officialKill.nextDungeonWave} begins!`, color: '#c084fc', pos: { x: player.x, y: player.y } });
    }
    if (officialKill.dungeonComplete) {
      this.clearOfficialDungeon(player);
      const reward = officialKill.dungeonComplete;
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🏆 Dungeon cleared: +${reward.gold}g +${reward.xp}XP +${reward.coins} coins`, color: '#ffd87b', pos: { x: player.x, y: player.y } });
    }

    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId, contentDB.get('lootTables')), ...(officialKill.bonusLoot || [])];
    const lootRewardEvent = buildLootRewardEvent(player, loot, { x: monster.x, y: monster.y });
    if (lootRewardEvent) this.emitEvent(player.mapId, lootRewardEvent);
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
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });
    }
    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));
  }

  handleCast(player, payload) {
    const now = Date.now();
    const voc = VOCATIONS[player.vocation];
    if (!voc || !Number.isInteger(payload.spellIndex)) return false;
    const spell = contextualizeSpell(this.getSpellList(player.vocation)[payload.spellIndex]);
    if (!spell) return false;
    if (player.level < (spell.levelRequired || 1)) return false;
    if (now - (player.cooldowns[spell.name] || 0) < spell.cooldown) return false;
    if (player.mana < spell.mana) return false;

    const monsters = this.monstersByMap.get(player.mapId) || [];
    const requestedTargetId = typeof payload.targetId === 'string' && payload.targetId ? payload.targetId : player.targetId;
    const explicitPlayer = requestedTargetId ? this.players.get(requestedTargetId) : null;
    const explicitMonster = requestedTargetId ? monsters.find(m => m.id === requestedTargetId && !m.dead) : null;
    const maxRange = Math.max(0, Number(spell.range) || 0);
    const inRange = entity => entity?.id === player.id || Math.hypot(entity.x - player.x, entity.y - player.y) <= maxRange;
    const validMonster = monster => Boolean(monster && !monster.dead && (!monster.dungeonOwnerId || monster.dungeonOwnerId === player.id) && inRange(monster));
    const targets = [];

    if (spell.targetMode === 'self') {
      targets.push({ relation: 'self', entity: player, kind: 'player' });
    } else if (spell.targetMode === 'area') {
      for (const candidate of this.players.values()) {
        if (candidate.mapId === player.mapId && inRange(candidate)) {
          targets.push({ relation: candidate.id === player.id ? 'self' : 'ally', entity: candidate, kind: 'player' });
        }
      }
      for (const monster of monsters) {
        if (validMonster(monster)) targets.push({ relation: 'enemy', entity: monster, kind: 'monster' });
      }
    } else if (explicitPlayer && explicitPlayer.mapId === player.mapId && inRange(explicitPlayer)) {
      targets.push({ relation: explicitPlayer.id === player.id ? 'self' : 'ally', entity: explicitPlayer, kind: 'player' });
    } else if (validMonster(explicitMonster)) {
      targets.push({ relation: 'enemy', entity: explicitMonster, kind: 'monster' });
    } else if (spell.type === 'heal' || spell.type === 'buff') {
      targets.push({ relation: 'self', entity: player, kind: 'player' });
    } else {
      const nearest = monsters
        .filter(validMonster)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      if (nearest) targets.push({ relation: 'enemy', entity: nearest, kind: 'monster' });
    }

    const actionableTargets = targets.filter(target => effectForRelation(spell, target.relation) !== 'none');
    if (actionableTargets.length === 0) return false;

    player.mana -= spell.mana;
    player.cooldowns[spell.name] = now;
    player.stats.spellsCast++;
    this.progressSkill(player, 'magic', 1);
    if (requestedTargetId) player.targetId = requestedTargetId;

    const casterDerived = this.computeDerivedStats(player);
    const clock = createWorldClockSnapshot(now);
    const basePower = Math.max(0, Number(spell.damage) || 0) + Math.floor(casterDerived.totalMagic * (Number(spell.scalingCoeff) || 1) * 0.5);
    this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y }, vocation: player.vocation });

    for (const target of actionableTargets) {
      const effect = effectForRelation(spell, target.relation);
      const multiplier = multiplierForRelation(spell, target.relation, clock) * classSpellMultiplier(player, spell, effect);
      if (multiplier <= 0) continue;

      if (target.kind === 'player' && effect === 'heal') {
        const receiver = target.entity;
        const receiverDerived = this.computeDerivedStats(receiver);
        const healAmount = Math.max(1, Math.floor(basePower * (1 + casterDerived.healBonus / 100) * multiplier));
        const before = receiver.hp;
        receiver.hp = Math.min(receiverDerived.totalMaxHp, receiver.hp + healAmount);
        const actual = Math.max(0, receiver.hp - before);
        player.stats.healingDone += actual;
        this.emitEvent(player.mapId, { kind: 'heal', targetId: receiver.id, amount: actual, text: `${spell.name} x${multiplier.toFixed(2)}`, pos: { x: receiver.x, y: receiver.y }, color: '#2ecc71', vocation: player.vocation });
        continue;
      }

      if (target.kind === 'player' && effect === 'buff') {
        const receiver = target.entity;
        const validBuffs = new Set(['shield', 'haste', 'invisible', 'frenzy']);
        const buffType = validBuffs.has(spell.buffType) ? spell.buffType : 'shield';
        const defaults = { shield: 25, haste: 35, invisible: 1, frenzy: 25 };
        const duration = Math.floor(boundedNumber(spell.buffDuration, 1000, 60000, 8000));
        const rawValue = boundedNumber(spell.buffValue, 0, 100, defaults[buffType]);
        const value = boundedNumber(rawValue * multiplier, 0, 100, rawValue);
        receiver.buffs = this.getActiveBuffs(receiver, now).filter(buff => buff.type !== buffType);
        receiver.buffs.push({ id: `${buffType}_${now}_${player.id}`, type: buffType, name: spell.name, value, startTime: now, expiresAt: now + duration });
        this.emitEvent(player.mapId, { kind: 'buff', targetId: receiver.id, text: `${spell.name} x${multiplier.toFixed(2)}`, color: spell.color, pos: { x: receiver.x, y: receiver.y }, vocation: player.vocation });
        continue;
      }

      if (target.kind === 'monster' && (effect === 'damage' || effect === 'drain')) {
        const monster = target.entity;
        const rawDamage = Math.floor(basePower * multiplier);
        const damage = Math.max(1, rawDamage - Math.max(0, Number(monster.defense) || 0));
        monster.hp -= damage;
        player.stats.damageDealt += damage;
        this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: damage, text: `${spell.name} x${multiplier.toFixed(2)}`, pos: { x: monster.x, y: monster.y }, color: spell.color, vocation: player.vocation });
        if (effect === 'drain' && spell.drainPercent > 0) {
          const derivedNow = this.computeDerivedStats(player);
          const drained = Math.max(1, Math.floor(damage * spell.drainPercent / 100));
          const before = player.hp;
          player.hp = Math.min(derivedNow.totalMaxHp, player.hp + drained);
          const actual = Math.max(0, player.hp - before);
          player.stats.healingDone += actual;
          this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: actual, text: `${spell.name} drain`, pos: { x: player.x, y: player.y }, color: '#c084fc', vocation: player.vocation });
        }
        if (monster.hp <= 0) this.killMonster(player, monster);
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

  handleMount(player, payload = {}) {
    const action = typeof payload.action === 'string' ? payload.action : 'toggle';
    if (action === 'buy' && !this.isNearContentNpc(player, 'stablemaster')) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:'Visit a stablemaster to buy mounts.', color:'#d9bd7a' });
      return false;
    }
    const result = mountSystem.handle(player, { ...payload, action }, contentDB);
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Mount action rejected.', color:'#ff9090' });
      return false;
    }
    this.emitEvent(player.mapId, { kind:'mount_update', targetId:player.id, text: result.mounted === false ? 'Dismounted.' : result.mount ? `${result.mount.name} ready.` : 'Mount updated.', color:result.mount?.color || '#d9bd7a' });
    if (action === 'buy' && result.mount) {
      const unlock = buildCosmeticUnlockEvent(player, { type:'mount', id:result.mount.id, name:result.mount.name, icon:result.mount.icon, color:result.mount.color });
      if (unlock) this.emitEvent(player.mapId, unlock);
    }
    return true;
  }

  handleAppearance(player, payload) {
    const action = typeof payload.action === 'string' ? payload.action : '';
    if ((action === 'buy' || action === 'buy_addon') && !this.isNearContentNpc(player, 'outfitter')) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:'Visit an outfitter to unlock outfits and addons.', color:'#d49bc8' });
      return false;
    }
    const result = appearanceSystem.handle(player, payload, contentDB);
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Appearance action rejected.', color:'#ff9090' }); return false; }
    this.emitEvent(player.mapId, { kind:'appearance_update', targetId:player.id, text:'Outfit updated.', color:'#d49bc8' });
    if (action === 'buy' || action === 'buy_addon') {
      const snapshot = appearanceSystem.snapshot(player, contentDB);
      const outfit = snapshot.catalog.find(entry => entry.id === result.outfitId);
      const addonName = action === 'buy_addon' ? (result.addon === 1 ? outfit?.addon1Name : outfit?.addon2Name) : '';
      const unlock = buildCosmeticUnlockEvent(player, {
        type: action === 'buy_addon' ? 'addon' : 'outfit', id: action === 'buy_addon' ? `${result.outfitId}_addon_${result.addon}` : result.outfitId,
        name: action === 'buy_addon' ? `${outfit?.name || result.outfitId} · ${addonName || `Addon ${result.addon}`}` : (outfit?.name || result.outfitId),
        icon: outfit?.icon || '🧥', color:'#d49bc8',
      });
      if (unlock) this.emitEvent(player.mapId, unlock);
    }
    return true;
  }

  handleTask(player, payload) {
    const result = tibiaTaskEngine.handle(player, payload, contentDB, npcId => this.isNearContentNpc(player, npcId));
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Task action rejected.', color:'#ff9090' }); return false; }
    if (result.reward) {
      player.gold += result.reward.gold;
      player.xp += result.reward.xp;
      const voc = VOCATIONS[player.vocation];
      while (player.xp >= player.xpNext && voc) {
        player.xp -= player.xpNext; player.level++; player.xpNext = Math.floor(player.xpNext * 1.4);
        player.maxHp += voc.hpPerLevel; player.hp = player.maxHp; player.maxMana += voc.manaPerLevel; player.mana = player.maxMana;
        player.attack += voc.atkPerLevel; player.defense += voc.defPerLevel; player.magic += voc.magPerLevel; player.stats.levelUps++;
        this.emitEvent(player.mapId, { kind:'levelup', targetId:player.id, text:`LEVEL ${player.level}!`, color:'#f4e04d', pos:{x:player.x,y:player.y} });
      }
    }
    const text = result.action === 'claim' ? `${result.task.name} complete · +${result.reward.points} task points` : result.action === 'accept' ? `Task accepted: ${result.task.name}` : 'Task abandoned.';
    this.emitEvent(player.mapId, { kind:'task_update', targetId:player.id, text, color:'#d9bd7a' });
    return true;
  }

  handleHousing(player, payload) {
    const result = housingSystem.handle(player, payload, contentDB);
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Housing action rejected.', color:'#ff9090' }); return false; }
    this.emitEvent(player.mapId, { kind:'housing_update', targetId:player.id, text:'Housing updated.', color:'#d9bd7a' });
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
    if (!canAccessMap(contentDB, player, targetMap)) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:`🔒 ${explainMapAccess(contentDB, player, targetMap)}`, color:'#ff6060', pos:{x:player.x,y:player.y} });
      return false;
    }
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
    if (officialSystems.discoverRegion(player, targetMap.id || portal.targetMap)) {
      const discovery = buildRegionDiscoveryEvent(player, { ...targetMap, id: targetMap.id || portal.targetMap });
      if (discovery) this.emitEvent(player.mapId, discovery);
    }
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
    let cacheReward = null;
    if (result.cache) {
      const pool = buildEquipmentLootPool(this.contentItems)
        .filter(item => (Number(item.level) || 1) <= player.level + 3)
        .sort((a, b) => Math.abs((Number(a.level) || 1) - player.level) - Math.abs((Number(b.level) || 1) - player.level))
        .slice(0, 6);
      if (pool.length > 0) {
        const reward = pool[Math.floor(Math.random() * pool.length)];
        cacheItem = reward.name;
        cacheReward = reward;
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
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });
    }

    if (cacheReward) {
      const chest = buildRewardChestEvent(player, cacheReward);
      if (chest) this.emitEvent(player.mapId, chest);
    }
    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));
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
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });
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
    if (wave.boss && spawned[0]) this.emitBossIntroIfNeeded(player, spawned[0]);
    return true;
  }

  handleOfficial(player, payload) {
    const action = typeof payload.action === 'string' ? payload.action : '';
    const result = officialSystems.handle(player, payload, {
      world: WORLD,
      contentItems: this.contentItems,
      contentNpcs: contentDB.get('npcs'),
      contentShops: contentDB.get('shops'),
      getPlayer: id => this.players.get(id),
      getDerivedStats: target => this.computeDerivedStats(target),
      characterExists: name => Boolean(accountStore.findCharacter(name)),
      findOnlinePlayer: sellerKey => Array.from(this.players.values()).find(candidate => candidate.name.toLocaleLowerCase('en-US') === sellerKey) || null,
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
    if (action === 'gather' && result.detail) {
      text += ` · +${result.detail.quantity} ${result.detail.name}`;
      if (result.detail.profession === 'fishing') this.progressSkill(player, 'fishing', result.detail.quantity);
      const questProgress = questEngine.progressQuest(player.id, result.detail.name, result.detail.quantity, [result.detail.profession]);
      for (const prog of questProgress) {
        this.emitEvent(player.mapId, { kind: 'quest_progress', targetId: player.id, text: `${prog.name}: ${prog.current}/${prog.needed}`, color: '#9bd4ff', pos: { x: player.x, y: player.y } });
      }
      for (const comp of questEngine.checkCompletion(player.id)) {
        this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y }, vocation: player.vocation });
      }
    }
    if (action === 'mystery_answer' && result.detail?.completed) text += ' · mystery completed!';
    if (action === 'pvp_attack' && result.detail) {
      text += ` · ${result.detail.damage} damage · skull ${result.detail.skull}`;
      const target = this.players.get(payload.targetId);
      if (target) this.emitEvent(target.mapId, { kind: 'system', targetId: target.id, text: `${player.name} hit you for ${result.detail.damage}${result.detail.killed ? ' · DEFEATED' : ''}`, color: '#ff6060', pos: { x: target.x, y: target.y } });
    }
    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));
    this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text, color: '#7dd3fc', pos: { x: player.x, y: player.y } });
    return true;
  }

  handleSocial(player, payload) {
    const result = socialSystems.handle(player, payload, { players: this.players });
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.error || 'Social action rejected.'}`, color: '#ff6060', pos: { x: player.x, y: player.y } });
      return false;
    }
    for (const notice of result.notices || []) {
      const target = this.players.get(notice.playerId);
      if (target) this.emitEvent(target.mapId, { kind: 'system', targetId: target.id, text: notice.text, color: '#7dd3fc', pos: { x: target.x, y: target.y } });
    }
    if (result.message && !(result.notices || []).some(notice => notice.playerId === player.id && notice.text === result.message)) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: result.message, color: '#7dd3fc', pos: { x: player.x, y: player.y } });
    }
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
      officialSystems.awardReputation(player, Math.max(25, Math.floor((Number(result.quest.levelRequired) || 1) * 10)));
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
        this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });
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
        this.progressSkill(nearest, 'shielding', 1);
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
      armor: derived.totalArmor,
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
      tasks: tibiaTaskEngine.snapshot(player, contentDB),
      appearance: appearanceSystem.snapshot(player, contentDB),
      mounts: mountSystem.snapshot(player, contentDB),
      housing: housingSystem.snapshot(player, contentDB),
      sessionStartedAt: undefined,
      sessionDamageBase: undefined,
    };

    const nearbyPlayers = [];
    for (const p of this.players.values()) {
      if (p.id !== playerId && p.mapId === player.mapId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25) {
        const voc = VOCATIONS[p.vocation];
        const pDerived = this.computeDerivedStats(p);
        nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, mountId: p.mountId, mount: mountSystem.publicMount(p, contentDB), appearance: appearanceSystem.publicAppearance(p, contentDB), icon: voc?.icon, color: voc?.color, ...officialSystems.publicPvp(p) });
      }
    }

    const allMonsters = this.monstersByMap.get(player.mapId) || [];
    const monsters = allMonsters.filter(m => !m.dead && (!m.dungeonOwnerId || m.dungeonOwnerId === playerId) && Math.abs(m.x - player.x) < 15 && Math.abs(m.y - player.y) < 15)
      .map(m => ({ id: m.id, name: m.name, emoji: m.emoji, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type, color: m.color, size: m.size }));

    const allGround = this.groundItemsByMap.get(player.mapId) || [];
    const groundItems = allGround.filter(g => Math.abs(g.x - player.x) < 15 && Math.abs(g.y - player.y) < 15).map(g => ({ id: g.id, x: g.x, y: g.y, items: g.items }));

    const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup', 'adventure_combo', 'adventure_progress', 'adventure_ready', 'adventure_claimed', 'task_update', 'task_progress', 'task_ready', 'housing_update', 'appearance_update', 'mount_update']);
    const events = (this.pendingEvents.get(player.mapId) || []).filter(event =>
      !privateKinds.has(event.kind) || event.targetId === playerId
    );
    const official = officialSystems.snapshot(player, this.getPlayersOnMap(player.mapId).filter(p => p.id !== playerId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25));
    const sessionSeconds = Math.max(1, (Date.now() - (Number(player.sessionStartedAt) || Date.now())) / 1000);
    const sessionDamage = Math.max(0, (Number(player.stats?.damageDealt) || 0) - (Number(player.sessionDamageBase) || 0));
    official.state.combat = { sessionDamage, sessionSeconds: Math.floor(sessionSeconds), dps: Math.round((sessionDamage / sessionSeconds) * 10) / 10 };
    const social = socialSystems.snapshot(player, this.players);
    const worldClock = createWorldClockSnapshot();
    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official, social, worldClock };
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
