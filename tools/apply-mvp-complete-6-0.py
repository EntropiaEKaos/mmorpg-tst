from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if marker in text:
        return text
    raise SystemExit(f'marker not found: {marker}')


def ensure(text: str, needle: str, anchor: str, addition: str) -> str:
    if needle in text:
        return text
    if anchor not in text:
        raise SystemExit(f'anchor not found for {needle}')
    return text.replace(anchor, addition + anchor, 1)


# -------------------------------------------------------------------
# Official systems: login effects belong to auth, not 20fps snapshots.
# -------------------------------------------------------------------
p = Path('server/engine/OfficialSystems.mjs')
s = p.read_text()
s = s.replace('  snapshot(player, nearbyPlayers = []) {\n    this.onLogin(player);\n', '  snapshot(player, nearbyPlayers = []) {\n', 1)
s = s.replace('    this.recordWeaponHit(player);\n\n    const result =', '    const result =', 1)
p.write_text(s)

# -------------------------------------------------------------------
# Game engine integration.
# -------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()
s = replace_once(
    s,
    "import { adventureEngine, createAdventureState } from './AdventureEngine.mjs';\nimport { contentDB } from './ContentDB.mjs';",
    "import { adventureEngine, createAdventureState } from './AdventureEngine.mjs';\nimport { officialSystems } from './OfficialSystems.mjs';\nimport { contentDB } from './ContentDB.mjs';",
    "OfficialSystems.mjs",
)
s = replace_once(
    s,
    "      adventure: createAdventureState(),\n      stats:",
    "      adventure: createAdventureState(),\n      official: null,\n      stats:",
    "official: null",
)
s = replace_once(
    s,
    "      case 'adventure_claim': return this.handleAdventureClaim(player);\n      case 'quest_accept':",
    "      case 'adventure_claim': return this.handleAdventureClaim(player);\n      case 'official': return this.handleOfficial(player, payload);\n      case 'quest_accept':",
    "case 'official'",
)

old_move = """    const now = Date.now();
    const activeBuffs = this.getActiveBuffs(player, now);
    const haste = activeBuffs.find(buff => buff.type === 'haste');
    const hasteValue = haste ? boundedNumber(haste.value, 0, 50, 35) : 0;
    const moveCooldown = Math.max(50, Math.floor(100 * (1 - hasteValue / 100)));
    if (now - player.lastMove < moveCooldown) return false;
"""
new_move = """    const now = Date.now();
    const movementStats = this.computeDerivedStats(player);
    const moveBonus = boundedNumber(movementStats.moveSpeed, 0, 50, 0);
    const moveCooldown = Math.max(50, Math.floor(100 * (1 - moveBonus / 100)));
    if (now - player.lastMove < moveCooldown) return false;
"""
s = replace_once(s, old_move, new_move, 'movementStats')

s = replace_once(
    s,
    "      stats.totalDefense += Number(eq.defense) || 0;\n      stats.totalMagic += Number(eq.magic) || 0;",
    "      stats.totalDefense += Number(eq.defense) || 0;\n      stats.totalDefense += Number(eq.armor) || 0;\n      stats.totalMagic += Number(eq.magic) || 0;",
    "Number(eq.armor)",
)
s = replace_once(
    s,
    "      stats.damageReduction += Number(eq.damageReduction) || 0;\n    }",
    "      stats.damageReduction += Number(eq.damageReduction) || 0;\n      stats.moveSpeed += Number(eq.moveSpeed) || 0;\n    }",
    "Number(eq.moveSpeed)",
)
s = replace_once(
    s,
    "    stats.totalAttack = Math.max(0, Math.floor(stats.totalAttack));",
    "    officialSystems.applyDerivedBonuses(player, stats);\n    stats.totalAttack = Math.max(0, Math.floor(stats.totalAttack));",
    "officialSystems.applyDerivedBonuses",
)

s = replace_once(
    s,
    "    const monster = monsters.find(m => m.id === monsterId && !m.dead);\n    if (!monster) return false;",
    "    const monster = monsters.find(m => m.id === monsterId && !m.dead);\n    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;",
    "monster.dungeonOwnerId !== player.id",
)
s = replace_once(
    s,
    "    const baseAttack = derived.totalAttack + Math.floor(Math.random() * 8);",
    "    const masteryMultiplier = 1 + officialSystems.getMasteryBonus(player);\n    const baseAttack = Math.floor(derived.totalAttack * masteryMultiplier) + Math.floor(Math.random() * 8);",
    "masteryMultiplier",
)
s = replace_once(
    s,
    "    player.stats.damageDealt += dmg;\n    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd' });\n    if (monster.hp <= 0) this.killMonster(player, monster);\n    return true;",
    """    player.stats.damageDealt += dmg;
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
    return true;""",
    "officialSystems.recordWeaponHit(player)",
)

s = replace_once(
    s,
    "    monster.dead = true;\n    monster.respawnAt = Date.now() + (monster.type === 'boss' ? 60000 : 15000);",
    "    monster.dead = true;\n    monster.respawnAt = monster.noRespawn ? Number.MAX_SAFE_INTEGER : Date.now() + (monster.type === 'boss' ? 60000 : 15000);",
    "monster.noRespawn",
)
s = replace_once(
    s,
    "    const derived = this.computeDerivedStats(player);\n    const adventureKill = adventureEngine.onMonsterKill(player, monster);\n    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100) * adventureKill.xpMultiplier);",
    """    const derived = this.computeDerivedStats(player);
    const adventureKill = adventureEngine.onMonsterKill(player, monster);
    const officialKill = officialSystems.onMonsterKill(player, monster);
    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100) * adventureKill.xpMultiplier * officialKill.xpMultiplier);""",
    "officialKill = officialSystems.onMonsterKill",
)

insert_official_kill = """
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

"""
s = ensure(s, "officialKill.worldEventProgress", "    const loot = rollLoot(monster, derived.goldBonus, this.contentItems);", insert_official_kill)
s = replace_once(
    s,
    "    const loot = rollLoot(monster, derived.goldBonus, this.contentItems);",
    "    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems), ...(officialKill.bonusLoot || [])];",
    "...(officialKill.bonusLoot || [])",
)

# Spells cannot damage another player's private dungeon encounter.
s = replace_once(
    s,
    "        if (m.dead) continue;\n        const dist = Math.hypot(m.x - player.x, m.y - player.y);",
    "        if (m.dead || (m.dungeonOwnerId && m.dungeonOwnerId !== player.id)) continue;\n        const dist = Math.hypot(m.x - player.x, m.y - player.y);",
    "m.dungeonOwnerId !== player.id)) continue",
)

# Add official-system and private-dungeon helpers before quest proximity code.
helper_marker = "  getQuestNpcRequirement(questId) {"
helpers = r'''  applyLevelUps(player) {
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

'''
if '  handleOfficial(player, payload) {' not in s:
    if helper_marker not in s:
        raise SystemExit('GameState helper anchor missing')
    s = s.replace(helper_marker, helpers + helper_marker, 1)

# Dungeon enemies are private to their owner and never respawn.
s = replace_once(
    s,
    "      if (m.dead) { if (now >= m.respawnAt) { m.dead = false; m.hp = m.maxHp; m.x = m.spawnX; m.y = m.spawnY; } continue; }",
    "      if (m.dead) { if (!m.noRespawn && now >= m.respawnAt) { m.dead = false; m.hp = m.maxHp; m.x = m.spawnX; m.y = m.spawnY; } continue; }",
    "!m.noRespawn && now >= m.respawnAt",
)
s = replace_once(
    s,
    "      for (const p of players) {\n        if (this.getActiveBuffs(p, now).some(buff => buff.type === 'invisible')) continue;",
    "      for (const p of players) {\n        if (m.dungeonOwnerId && p.id !== m.dungeonOwnerId) continue;\n        if (this.getActiveBuffs(p, now).some(buff => buff.type === 'invisible')) continue;",
    "m.dungeonOwnerId && p.id !== m.dungeonOwnerId",
)
s = replace_once(
    s,
    "          nearest.hp = derived.totalMaxHp; nearest.mana = derived.totalMaxMana;\n          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';\n          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1));",
    """          nearest.hp = derived.totalMaxHp; nearest.mana = derived.totalMaxMana;
          const deathLoss = officialSystems.getDeathLossMultiplier(nearest);
          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1 * deathLoss));
          if (nearest.official?.dungeon?.active) { officialSystems.failDungeon(nearest); this.clearOfficialDungeon(nearest); }
          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';""",
    "deathLoss = officialSystems.getDeathLossMultiplier",
)

s = replace_once(
    s,
    "    for (const p of this.players.values()) {\n      if (now - p.lastRegen > 2000) {",
    "    for (const p of this.players.values()) {\n      officialSystems.tickPlayer(p, now);\n      if (now - p.lastRegen > 2000) {",
    "officialSystems.tickPlayer(p, now)",
)

s = replace_once(
    s,
    "      ws: undefined,\n      attack: derived.totalAttack,",
    "      ws: undefined,\n      official: undefined,\n      attack: derived.totalAttack,",
    "official: undefined",
)
s = replace_once(
    s,
    "        nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, icon: voc?.icon, color: voc?.color });",
    "        nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, icon: voc?.icon, color: voc?.color, ...officialSystems.publicPvp(p) });",
    "...officialSystems.publicPvp(p)",
)
s = replace_once(
    s,
    "    const monsters = allMonsters.filter(m => !m.dead && Math.abs(m.x - player.x) < 15 && Math.abs(m.y - player.y) < 15)",
    "    const monsters = allMonsters.filter(m => !m.dead && (!m.dungeonOwnerId || m.dungeonOwnerId === playerId) && Math.abs(m.x - player.x) < 15 && Math.abs(m.y - player.y) < 15)",
    "(!m.dungeonOwnerId || m.dungeonOwnerId === playerId)",
)
s = replace_once(
    s,
    "    return { player: playerData, nearbyPlayers, monsters, groundItems, events };",
    "    const official = officialSystems.snapshot(player, this.getPlayersOnMap(player.mapId).filter(p => p.id !== playerId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) < 25));\n    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official };",
    "officialSystems.snapshot(player",
)
p.write_text(s)

# -------------------------------------------------------------------
# Server persistence, world-event content sync and clean shutdown.
# -------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()
s = replace_once(
    s,
    "import { adventureEngine } from './engine/AdventureEngine.mjs';",
    "import { adventureEngine } from './engine/AdventureEngine.mjs';\nimport { officialSystems } from './engine/OfficialSystems.mjs';",
    "OfficialSystems.mjs",
)
s = replace_once(s, "const READ_ONLY_ADMIN_TYPES = new Set(['maps', 'events']);", "const READ_ONLY_ADMIN_TYPES = new Set(['maps']);", "new Set(['maps'])")
s = replace_once(
    s,
    "engine.syncContentMonsters(contentDB.get('monsters'));",
    "engine.syncContentMonsters(contentDB.get('monsters'));\nofficialSystems.syncWorldEvents(contentDB.get('events'));",
    "officialSystems.syncWorldEvents",
)
s = replace_once(
    s,
    "    adventure: adventureEngine.exportState(p),\n    mapId:",
    "    adventure: adventureEngine.exportState(p),\n    official: officialSystems.exportPlayer(p),\n    mapId:",
    "official: officialSystems.exportPlayer",
)
s = replace_once(
    s,
    "function restorePlayer(p, saved, expectedVocation) {\n  if (typeof expectedVocation === 'string' && VOCATIONS[expectedVocation]) p.vocation = expectedVocation;\n  if (!saved || typeof saved !== 'object') return;",
    "function restorePlayer(p, saved, expectedVocation) {\n  if (typeof expectedVocation === 'string' && VOCATIONS[expectedVocation]) p.vocation = expectedVocation;\n  officialSystems.restorePlayer(p, saved?.official);\n  if (!saved || typeof saved !== 'object') return;",
    "officialSystems.restorePlayer(p, saved?.official)",
)
s = replace_once(
    s,
    "      events: ['id','name','icon','description','type','target','count','rewardGold','rewardXp','duration'],",
    "      events: ['id','name','icon','description','target','count','rewardGold','rewardXp','rewardCoins','mapId','durationMs'],",
    "'rewardCoins','mapId','durationMs'",
)
s = replace_once(
    s,
    "      : type === 'events'\n        ? 'Reference catalog only: online world-event runtime is not connected to ContentDB yet.'\n        : '';",
    "      : '';",
    "const runtimeNote = type === 'maps'",
)
# The marker above can be present after simplification; normalize exact current block if needed.
s = s.replace("    const runtimeNote = type === 'maps'\n      ? 'Reference catalog only: authoritative terrain, portals and map lifecycle are still defined by World.mjs.'\n      : '';", "    const runtimeNote = type === 'maps'\n      ? 'Reference catalog only: authoritative terrain, portals and map lifecycle are still defined by World.mjs.'\n      : '';", 1)
s = replace_once(
    s,
    "      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      broadcastContentUpdate();",
    "      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));\n      broadcastContentUpdate();",
    "if (type === 'events') officialSystems.syncWorldEvents",
)
# Repeat for DELETE if there are two identical blocks.
if s.count("if (type === 'events') officialSystems.syncWorldEvents") < 2:
    needle = "    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n    broadcastContentUpdate();"
    if needle in s:
        s = s.replace(needle, "    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n    if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));\n    broadcastContentUpdate();", 1)

s = replace_once(
    s,
    "      restorePlayer(player, savedPlayer, vocation);\n      questEngine.restorePlayer(clientId, savedPlayer?.quests);",
    "      restorePlayer(player, savedPlayer, vocation);\n      questEngine.restorePlayer(clientId, savedPlayer?.quests);\n      officialSystems.onLogin(player);",
    "officialSystems.onLogin(player)",
)
s = replace_once(
    s,
    "      if (vocData) snapshot.player.spells = vocData.spells;",
    "      if (vocData) snapshot.player.spells = engine.getSpellList(snapshot.player.vocation);",
    "engine.getSpellList(snapshot.player.vocation)",
)
s = replace_once(
    s,
    "process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); process.exit(0); });\nprocess.on('SIGINT', () => { playerDB.save(); contentDB.save(); process.exit(0); });",
    "process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); officialSystems.save(); process.exit(0); });\nprocess.on('SIGINT', () => { playerDB.save(); contentDB.save(); officialSystems.save(); process.exit(0); });",
    "officialSystems.save(); process.exit(0)",
)
p.write_text(s)

# -------------------------------------------------------------------
# Network intent + snapshot type.
# -------------------------------------------------------------------
p = Path('src/game/network.ts')
s = p.read_text()
s = replace_once(
    s,
    "        'adventure_start' | 'adventure_abandon' | 'adventure_claim';",
    "        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official';",
    "'adventure_claim' | 'official'",
)
s = replace_once(
    s,
    "  events: any[];\n}",
    "  events: any[];\n  official?: any;\n}",
    "official?: any",
)
p.write_text(s)

# -------------------------------------------------------------------
# ServerSync generic official intent and snapshot surface.
# -------------------------------------------------------------------
p = Path('src/game/ServerSync.ts')
s = p.read_text()
s = replace_once(
    s,
    "  events: any[];\n}",
    "  events: any[];\n  official: any;\n}",
    "official: any",
)
s = replace_once(
    s,
    "  sendAdventureClaim() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'adventure_claim', payload: {} });\n  }",
    """  sendAdventureClaim() {
    if (!this.isActive()) return;
    sendIntent({ type: 'adventure_claim', payload: {} });
  }

  sendOfficial(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'official', payload: { action, ...payload } });
  }""",
    "sendOfficial(action: string",
)
s = replace_once(
    s,
    "      events: snap.events || [],\n    };",
    "      events: snap.events || [],\n      official: snap.official || null,\n    };",
    "official: snap.official || null",
)
p.write_text(s)

# -------------------------------------------------------------------
# GameScreen: route online panels and local-only actions to official hub.
# -------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(
    s,
    "import AdventureBoard, { type AdventureSnapshot } from './AdventureBoard';",
    "import AdventureBoard, { type AdventureSnapshot } from './AdventureBoard';\nimport OfficialSystemsHub, { type OfficialTab } from './OfficialSystemsHub';",
    "OfficialSystemsHub",
)
s = replace_once(
    s,
    "  const [adventureState, setAdventureState] = useState<AdventureSnapshot | null>(null);\n  const lastAdventureSignatureRef = useRef('');",
    """  const [adventureState, setAdventureState] = useState<AdventureSnapshot | null>(null);
  const lastAdventureSignatureRef = useRef('');
  const [showOfficialHub, setShowOfficialHub] = useState(false);
  const [officialTab, setOfficialTab] = useState<OfficialTab>('progress');
  const [officialState, setOfficialState] = useState<any>(null);
  const lastOfficialSignatureRef = useRef('');
  const openOfficial = useCallback((tab: OfficialTab) => { setOfficialTab(tab); setShowOfficialHub(true); }, []);""",
    "showOfficialHub",
)
# Local-only starter data must not seed authoritative accounts.
s = replace_once(
    s,
    "  useEffect(() => {\n    seedAuctionHouse();",
    "  useEffect(() => {\n    if (onlineAccount) return;\n    seedAuctionHouse();",
    "if (onlineAccount) return;\n    seedAuctionHouse",
)
# Welcome text must describe real online economy.
s = s.replace("💎 Check the Coin Shop (top bar) for premium mounts, boosts, and cosmetics! Claim free coins to start.", "💎 Earn Mor'ia Coins from hunts, dungeons, events and achievements, then spend them in the official Coin Shop.")

# Keyboard Bestiary/Dungeon/PvP hub routing.
s = replace_once(
    s,
    "      if (e.key.toLowerCase() === 'b') setShowBestiary((s) => !s);",
    "      if (e.key.toLowerCase() === 'b') onlineAccount ? openOfficial('progress') : setShowBestiary((s) => !s);",
    "onlineAccount ? openOfficial('progress')",
)
s = replace_once(
    s,
    "      if (e.key.toLowerCase() === 'd') setShowDPS((s) => !s);",
    "      if (e.key.toLowerCase() === 'd') setShowDPS((s) => !s);\n      if (e.key.toLowerCase() === 'o' && onlineAccount) openOfficial('progress');",
    "e.key.toLowerCase() === 'o'",
)

# NPC online services now open authoritative tabs.
old_npc_online = """    if (serverSync.isActive()) {
      if (action === 'quest' && questId) serverSync.sendQuestAccept(questId);
      else if (action !== 'bye') addMessage('System', `${action} is not available in authoritative online mode yet.`, '#ff9090', 'system');
      setActiveDialog(null);
      return;
    }
"""
new_npc_online = """    if (serverSync.isActive()) {
      if (action === 'quest' && questId) serverSync.sendQuestAccept(questId);
      else if (action === 'bank' || action === 'depot') openOfficial('depot');
      else if (action === 'mail') openOfficial('mail');
      else if (action === 'books') openOfficial('library');
      else if (action === 'food' || action === 'heal' || action === 'train' || action === 'shop') openOfficial('services');
      setActiveDialog(null);
      return;
    }
"""
s = replace_once(s, old_npc_online, new_npc_online, "action === 'bank' || action === 'depot'")

# Existing local feature callbacks use the official intent when online.
s = replace_once(
    s,
    "    if (serverSync.isActive()) {\n      addMessage('System', 'Mystery rewards are disabled in authoritative online mode until server support is available.', '#ff9090', 'system');\n      return;\n    }",
    "    if (serverSync.isActive()) { openOfficial('library'); return; }",
    "if (serverSync.isActive()) { openOfficial('library'); return; }",
)
s = replace_once(
    s,
    "    if (serverSync.isActive()) {\n      addMessage('System', 'Dungeons are disabled in authoritative online mode until server support is available.', '#ff9090', 'system');\n      setShowDungeon(false);\n      return;\n    }",
    "    if (serverSync.isActive()) { serverSync.sendOfficial('dungeon_start', { waves: totalWaves }); setShowDungeon(false); return; }",
    "sendOfficial('dungeon_start'",
)
s = replace_once(
    s,
    "    if (serverSync.isActive()) { addMessage('System', 'Server-authoritative shops are not enabled yet.', '#ff9090', 'system'); return; }",
    "    if (serverSync.isActive()) { const itemId = shopItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); serverSync.sendOfficial('shop_buy', { itemId, quantity: 1 }); return; }",
    "sendOfficial('shop_buy'",
)
s = replace_once(
    s,
    "    if (serverSync.isActive()) { addMessage('System', 'Gem socketing is disabled online until it is server-authoritative.', '#ff9090', 'system'); return; }",
    "    if (serverSync.isActive()) { const targetGem = inventoryRef.current.find((i: any) => i.gemId === gemId || i.name === GEMS.find((g) => g.id === gemId)?.name); if (targetGem) serverSync.sendOfficial('socket_gem', { itemId, gemItemId: targetGem.id }); return; }",
    "sendOfficial('socket_gem'",
)
s = replace_once(
    s,
    "    if (serverSync.isActive()) { addMessage('System', 'Crafting is disabled online until it is server-authoritative.', '#ff9090', 'system'); return; }",
    "    if (serverSync.isActive()) { const onlineRecipe = RECIPES.find((r) => r.result.name === name || r.name === name); if (onlineRecipe) serverSync.sendOfficial('craft', { recipeId: onlineRecipe.id }); return; }",
    "sendOfficial('craft'",
)

# Snapshot official state sync.
s = replace_once(
    s,
    "          const { x, y, inventory: serverInventory, quests: serverQuestState, adventure: serverAdventure, skills: _serverSkills, stats: serverStats, ws: _ws, ...compatibleServerPlayer } = sp;",
    "          const { x, y, inventory: serverInventory, quests: serverQuestState, adventure: serverAdventure, skills: _serverSkills, stats: serverStats, ws: _ws, ...compatibleServerPlayer } = sp;\n          const serverOfficial = renderState.official;",
    "const serverOfficial = renderState.official",
)
s = replace_once(
    s,
    "          if (serverAdventure && typeof serverAdventure === 'object') {\n            const signature = JSON.stringify(serverAdventure);\n            if (signature !== lastAdventureSignatureRef.current) {\n              lastAdventureSignatureRef.current = signature;\n              setAdventureState(serverAdventure as AdventureSnapshot);\n            }\n          }",
    """          if (serverAdventure && typeof serverAdventure === 'object') {
            const signature = JSON.stringify(serverAdventure);
            if (signature !== lastAdventureSignatureRef.current) {
              lastAdventureSignatureRef.current = signature;
              setAdventureState(serverAdventure as AdventureSnapshot);
            }
          }
          if (serverOfficial && typeof serverOfficial === 'object') {
            const signature = JSON.stringify(serverOfficial);
            if (signature !== lastOfficialSignatureRef.current) {
              lastOfficialSignatureRef.current = signature;
              setOfficialState(serverOfficial);
            }
          }""",
    "lastOfficialSignatureRef.current",
)

# Click nearby online players for server-owned PvP.
s = replace_once(
    s,
    "      const npc = npcsRef.current.find((candidate) => candidate.pos.x === tile.x && candidate.pos.y === tile.y);\n      if (npc && Math.abs(npc.pos.x - p.pos.x) <= 2 && Math.abs(npc.pos.y - p.pos.y) <= 2) {\n        setActiveDialog(npc);\n        return;\n      }\n      p.targetId = undefined;",
    """      const npc = npcsRef.current.find((candidate) => candidate.pos.x === tile.x && candidate.pos.y === tile.y);
      if (npc && Math.abs(npc.pos.x - p.pos.x) <= 2 && Math.abs(npc.pos.y - p.pos.y) <= 2) {
        setActiveDialog(npc);
        return;
      }
      const otherPlayer = serverPlayersRef.current.find((candidate: any) => candidate.x === tile.x && candidate.y === tile.y);
      if (otherPlayer && officialState?.state?.pvp?.enabled) { serverSync.sendOfficial('pvp_attack', { targetId: otherPlayer.id }); return; }
      p.targetId = undefined;""",
    "sendOfficial('pvp_attack'",
)

# Draw an online companion next to the player; combat itself remains server-owned.
old_pet_draw = """    // Draw active pet
    if (petStateRef.current) {
      const pet = petStateRef.current;
      const petData = PETS.find((pd) => pd.id === pet.petId);
      if (petData) {
        const petX = (pet.pos.x - cam.x) * TILE_SIZE;
        const petY = (pet.pos.y - cam.y) * TILE_SIZE;
        if (petX > -TILE_SIZE && petX < canvas.width && petY > -TILE_SIZE && petY < canvas.height) {
          drawMonster(ctx, petX, petY, TILE_SIZE, {
            name: petData.name, hp: pet.hp, maxHp: pet.maxHp,
            color: petData.color, emoji: petData.icon, msSize: 0.7,
          }, now);
        }
      }
    }
"""
new_pet_draw = """    // Draw active pet (server-owned online, local state in Quick Play).
    if (serverSync.isActive() && officialState?.state?.pets?.active) {
      const petData = officialState?.catalogs?.pets?.find((pet: any) => pet.id === officialState.state.pets.active);
      if (petData) {
        const petX = (p.pos.x + 1 - cam.x) * TILE_SIZE;
        const petY = (p.pos.y - cam.y) * TILE_SIZE;
        drawMonster(ctx, petX, petY, TILE_SIZE, { name: petData.name, hp: 1, maxHp: 1, color: petData.color, emoji: petData.icon, msSize: 0.7 }, now);
      }
    } else if (petStateRef.current) {
      const pet = petStateRef.current;
      const petData = PETS.find((pd) => pd.id === pet.petId);
      if (petData) {
        const petX = (pet.pos.x - cam.x) * TILE_SIZE;
        const petY = (pet.pos.y - cam.y) * TILE_SIZE;
        if (petX > -TILE_SIZE && petX < canvas.width && petY > -TILE_SIZE && petY < canvas.height) {
          drawMonster(ctx, petX, petY, TILE_SIZE, {
            name: petData.name, hp: pet.hp, maxHp: pet.maxHp,
            color: petData.color, emoji: petData.icon, msSize: 0.7,
          }, now);
        }
      }
    }
"""
s = replace_once(s, old_pet_draw, new_pet_draw, "server-owned online, local state in Quick Play")

# Quick actions: every legacy local-only panel routes to official server hub online.
replacements = {
"    bestiary: { icon: '📖', label: 'Bestiary', hotkey: 'B', onClick: () => setShowBestiary((v) => !v) },": "    bestiary: { icon: '📖', label: 'Bestiary', hotkey: 'B', onClick: () => onlineAccount ? openOfficial('progress') : setShowBestiary((v) => !v) },",
"    dungeon: { icon: '🌀', label: 'Dungeon', hotkey: '', onClick: () => setShowDungeon(true) },": "    dungeon: { icon: '🌀', label: 'Dungeon', hotkey: '', onClick: () => onlineAccount ? openOfficial('dungeon') : setShowDungeon(true) },",
"    pet: { icon: '🐾', label: 'Pet', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Companions are local-only until server support lands.', '#ff9090', 'system') : setShowPetShop(true) },": "    pet: { icon: '🐾', label: 'Pet', hotkey: '', onClick: () => onlineAccount ? openOfficial('pets') : setShowPetShop(true) },",
"    mystery: { icon: '✦', label: 'Mystery', hotkey: '', onClick: () => setShowMysteryBook(true) },": "    mystery: { icon: '✦', label: 'Mystery', hotkey: '', onClick: () => onlineAccount ? openOfficial('library') : setShowMysteryBook(true) },",
"    depot: { icon: '🗄', label: 'Depot', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Depot is local-only until server support lands.', '#ff9090', 'system') : setShowDepot(true) },": "    depot: { icon: '🗄', label: 'Depot', hotkey: '', onClick: () => onlineAccount ? openOfficial('depot') : setShowDepot(true) },",
"    books: { icon: '📚', label: 'Books', hotkey: '', onClick: () => setShowBooks(true) },": "    books: { icon: '📚', label: 'Books', hotkey: '', onClick: () => onlineAccount ? openOfficial('library') : setShowBooks(true) },",
"    auction: { icon: '🏛', label: 'AH', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Auction House is local-only until server support lands.', '#ff9090', 'system') : setShowAuction(true) },": "    auction: { icon: '🏛', label: 'AH', hotkey: '', onClick: () => onlineAccount ? openOfficial('auction') : setShowAuction(true) },",
"    coins: { icon: '💎', label: 'Coins', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Coin Shop is local-only until server support lands.', '#ff9090', 'system') : setShowCoinShop(true) },": "    coins: { icon: '💎', label: 'Coins', hotkey: '', onClick: () => onlineAccount ? openOfficial('coins') : setShowCoinShop(true) },",
"    world: { icon: '🌍', label: 'World', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Browser world events are disabled in authoritative mode.', '#ff9090', 'system') : setShowWorldEvents(true) },": "    world: { icon: '🌍', label: 'World', hotkey: '', onClick: () => onlineAccount ? openOfficial('world') : setShowWorldEvents(true) },",
"    mail: { icon: '📮', label: 'Mail', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Mail is local-only until server support lands.', '#ff9090', 'system') : setShowMail(true) },": "    mail: { icon: '📮', label: 'Mail', hotkey: '', onClick: () => onlineAccount ? openOfficial('mail') : setShowMail(true) },",
}
for old, new in replacements.items():
    if old in s:
        s = s.replace(old, new, 1)
    elif new not in s:
        raise SystemExit(f'quick action marker missing: {old[:60]}')

# One always-visible world hub entry for online accounts.
s = replace_once(
    s,
    "          <TopButton icon=\"⚙\" label=\"UI\" hotkey=\"\" onClick={() => setShowUIEditor(true)} />",
    "          {onlineAccount && <TopButton icon=\"🌐\" label=\"Hub\" hotkey=\"O\" onClick={() => openOfficial('progress')} />}\n          <TopButton icon=\"⚙\" label=\"UI\" hotkey=\"\" onClick={() => setShowUIEditor(true)} />",
    "label=\"Hub\" hotkey=\"O\"",
)

# Active quest tracker must use dynamic server quest catalog.
s = s.replace("const quest = QUESTS.find((q) => q.id === aq.questId);", "const quest = questCatalog.find((q) => q.id === aq.questId);", 1)

# Add official hub overlay before AdventureBoard.
s = replace_once(
    s,
    "          {showAdventure && (\n            <AdventureBoard",
    """          {showOfficialHub && serverSync.isActive() && officialState && (
            <OfficialSystemsHub
              player={player}
              inventory={inventory}
              official={officialState}
              nearbyPlayers={serverPlayersRef.current}
              initialTab={officialTab}
              onAction={(action, payload) => serverSync.sendOfficial(action, payload)}
              onClose={() => setShowOfficialHub(false)}
            />
          )}

          {showAdventure && (
            <AdventureBoard""",
    "<OfficialSystemsHub",
)

# Online PvP badge/status comes from server snapshot, offline remains local.
old_pvp = """          {(() => {
            const skull = getSkullState(player.name);
            const info = SKULLS[skull.type];
            return (
              <div className="absolute top-14 right-2 flex flex-col items-end gap-1 z-10 pointer-events-auto">
                <button
                  onClick={() => { const en = togglePvp(player.name); setPvpEnabled(en); addMessage('System', `PvP ${en ? 'ENABLED ⚔' : 'disabled'}.`, en ? '#ff6060' : '#9bd4ff', 'system'); }}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${pvpEnabled ? 'bg-red-900/50 text-red-300 border-red-600' : 'bg-black/50 text-gray-400 border-gray-700'}`}>
                  ⚔ PvP {pvpEnabled ? 'ON' : 'OFF'}
                </button>
                {skull.type !== 'none' && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded border" style={{ background: info.color + '30', borderColor: info.color }}>
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: info.color }}>{info.name}</span>
                  </div>
                )}
              </div>
            );
          })()}
"""
new_pvp = """          {(() => {
            const onlinePvp = serverSync.isActive() ? officialState?.state?.pvp : null;
            const skullType = (onlinePvp?.skull || getSkullState(player.name).type) as keyof typeof SKULLS;
            const info = SKULLS[skullType] || SKULLS.none;
            const enabled = onlinePvp ? Boolean(onlinePvp.enabled) : pvpEnabled;
            return (
              <div className="absolute top-14 right-2 flex flex-col items-end gap-1 z-10 pointer-events-auto">
                <button
                  onClick={() => { if (serverSync.isActive()) serverSync.sendOfficial('pvp_toggle'); else { const en = togglePvp(player.name); setPvpEnabled(en); addMessage('System', `PvP ${en ? 'ENABLED ⚔' : 'disabled'}.`, en ? '#ff6060' : '#9bd4ff', 'system'); } }}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${enabled ? 'bg-red-900/50 text-red-300 border-red-600' : 'bg-black/50 text-gray-400 border-gray-700'}`}>
                  ⚔ PvP {enabled ? 'ON' : 'OFF'}
                </button>
                {skullType !== 'none' && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded border" style={{ background: info.color + '30', borderColor: info.color }}>
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: info.color }}>{info.name}</span>
                  </div>
                )}
              </div>
            );
          })()}
"""
s = replace_once(s, old_pvp, new_pvp, "serverSync.sendOfficial('pvp_toggle')")
p.write_text(s)

# -------------------------------------------------------------------
# Runtime files should never be committed.
# -------------------------------------------------------------------
p = Path('.gitignore')
s = p.read_text()
if 'server/moria-official.json' not in s:
    s = s.replace('server/moria-accounts.json\n', 'server/moria-accounts.json\nserver/moria-official.json\nserver/moria-official.json.tmp\n', 1)
p.write_text(s)

# -------------------------------------------------------------------
# CI must validate this product branch directly after applicator cleanup.
# -------------------------------------------------------------------
p = Path('.github/workflows/ci.yml')
s = p.read_text()
s = s.replace('    branches: [hardening-3.1, mvp-adventure-5.0]', '    branches: [hardening-3.1, mvp-adventure-5.0, mvp-complete-6.0]')
s = s.replace('    branches: [hardening-3.1]', '    branches: [hardening-3.1, mvp-complete-6.0]')
p.write_text(s)

# -------------------------------------------------------------------
# Documentation snapshot.
# -------------------------------------------------------------------
Path('docs/MVP_COMPLETE_6_0.md').write_text('''# MOR\'IA MVP Complete 6.0\n\nThis release promotes previously browser-only features into the authoritative online runtime.\n\n## Official online systems\n\n- Dungeons with private server-owned waves and rewards\n- Pets/companions with server-owned purchases and combat assist\n- Depot and banking\n- Mail with server-owned gold attachments\n- Auction House with escrow and seller credit\n- Mor\'ia Coins earned and spent server-side\n- Rotating World Events driven by ContentDB/default templates\n- NPC services: shop, food, rest and capped training\n- Crafting\n- Gem socketing and equipment set bonuses\n- Bestiary and achievements\n- Daily rewards and stamina\n- Gathering and professions\n- Books and server-validated Mystery quests\n- Weapon mastery\n- Opt-in PvP with authoritative damage and skull escalation\n\nThe legacy browser implementations remain available in Quick Play/offline mode, but authenticated online characters use only server-owned state and economy for these systems.\n\nMaps remain intentionally static in `World.mjs`; the Admin Maps tab is still a reference catalog until a real terrain/portal editor is implemented.\n''')

print('MVP Complete 6.0 integration applied')
