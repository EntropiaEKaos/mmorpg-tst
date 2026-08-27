from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, content):
    (ROOT / path).write_text(content, encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 anchor, found {count}')
    return text.replace(old, new, 1)

# -------------------------------------------------------------------
# Persistent official region discovery.
# -------------------------------------------------------------------
path = 'server/engine/OfficialStateSchema.mjs'
text = read(path)
text = replace_once(text,
    "  achievements: ACHIEVEMENTS.length,\n  books: OFFICIAL_BOOKS.length,\n",
    "  achievements: ACHIEVEMENTS.length,\n  regions: 100,\n  books: OFFICIAL_BOOKS.length,\n",
    'state region limit')
text = replace_once(text,
    "    bestiary: {}, achievements: [],\n    daily: { lastDay: '', streak: 0 },\n",
    "    bestiary: {}, achievements: [], regionsDiscovered: ['eldoria'],\n    daily: { lastDay: '', streak: 0 },\n",
    'fresh regions')
text = replace_once(text,
    "  base.achievements = Array.isArray(saved.achievements)\n    ? unique(saved.achievements.filter(id => ACHIEVEMENTS.some(achievement => achievement.id === id))).slice(0, OFFICIAL_STATE_LIMITS.achievements)\n    : [];\n  base.daily = {\n",
    "  base.achievements = Array.isArray(saved.achievements)\n    ? unique(saved.achievements.filter(id => ACHIEVEMENTS.some(achievement => achievement.id === id))).slice(0, OFFICIAL_STATE_LIMITS.achievements)\n    : [];\n  base.regionsDiscovered = Array.isArray(saved.regionsDiscovered)\n    ? unique(saved.regionsDiscovered.map(value => text(value, 100)).filter(Boolean)).slice(0, OFFICIAL_STATE_LIMITS.regions)\n    : ['eldoria'];\n  if (!base.regionsDiscovered.includes('eldoria')) base.regionsDiscovered.unshift('eldoria');\n  base.regionsDiscovered = base.regionsDiscovered.slice(0, OFFICIAL_STATE_LIMITS.regions);\n  base.daily = {\n",
    'normalize regions')
text = replace_once(text,
    "    achievements: s.achievements,\n    daily: s.daily,\n",
    "    achievements: s.achievements,\n    regionsDiscovered: s.regionsDiscovered,\n    daily: s.daily,\n",
    'export regions')
write(path, text)

path = 'server/engine/OfficialProgressionDomain.mjs'
text = read(path)
text = replace_once(text,
    "  tickStamina(host, player, now = Date.now()) {\n",
    "  discoverRegion(host, player, rawMapId) {\n    const s = state(host, player);\n    const mapId = typeof rawMapId === 'string' ? rawMapId.trim().slice(0, 100) : '';\n    if (!mapId) return false;\n    if (!Array.isArray(s.regionsDiscovered)) s.regionsDiscovered = ['eldoria'];\n    if (s.regionsDiscovered.includes(mapId)) return false;\n    if (s.regionsDiscovered.length >= 100) return false;\n    s.regionsDiscovered.push(mapId);\n    return true;\n  }\n\n  tickStamina(host, player, now = Date.now()) {\n",
    'progression discover region')
write(path, text)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
text = replace_once(text,
    "  refreshAchievements(player) {\n    return officialProgressionDomain.refreshAchievements(this, player);\n  }\n\n  ensureWorldEvent(now = Date.now()) {\n",
    "  refreshAchievements(player) {\n    return officialProgressionDomain.refreshAchievements(this, player);\n  }\n\n  discoverRegion(player, mapId) {\n    return officialProgressionDomain.discoverRegion(this, player, mapId);\n  }\n\n  ensureWorldEvent(now = Date.now()) {\n",
    'systems discover region')
write(path, text)

# -------------------------------------------------------------------
# GameState authoritative event wiring.
# -------------------------------------------------------------------
path = 'server/engine/GameState.mjs'
text = read(path)
text = replace_once(text,
    "import { buildBossDefeatEvent, buildLootRewardEvent } from './RewardFeedback.mjs';\n",
    "import { buildBossDefeatEvent, buildLootRewardEvent } from './RewardFeedback.mjs';\nimport { buildBossIntroEvent, buildRegionDiscoveryEvent, buildAchievementUnlockEvent, buildCosmeticUnlockEvent, buildRewardChestEvent } from './CinematicRewards.mjs';\n",
    'cinematic imports')

text = replace_once(text,
    "  handleAttack(player, payload) {\n",
    "  emitBossIntroIfNeeded(player, monster) {\n    if (!monster || monster.type !== 'boss' || monster.dead) return false;\n    if (!Array.isArray(player._bossIntroIds)) player._bossIntroIds = [];\n    if (player._bossIntroIds.includes(monster.id)) return false;\n    player._bossIntroIds = [...player._bossIntroIds, monster.id].slice(-50);\n    const event = buildBossIntroEvent(player, monster);\n    if (event) this.emitEvent(player.mapId, event);\n    return Boolean(event);\n  }\n\n  emitAchievementUnlocks(player, achievements = []) {\n    for (const achievement of achievements) {\n      const event = buildAchievementUnlockEvent(player, achievement);\n      if (event) this.emitEvent(player.mapId, event);\n    }\n  }\n\n  handleAttack(player, payload) {\n",
    'cinematic helpers')
text = replace_once(text,
    "    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;\n\n    const derived = this.computeDerivedStats(player);\n",
    "    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;\n    this.emitBossIntroIfNeeded(player, monster);\n\n    const derived = this.computeDerivedStats(player);\n",
    'boss intro on attack')
text = replace_once(text,
    "    else if (dy > 0) player.direction = 'down';\n\n    // Portals are server-owned. Stepping onto one attempts travel automatically.\n",
    "    else if (dy > 0) player.direction = 'down';\n\n    const nearbyBoss = monsters.find(monster => !monster.dead && monster.type === 'boss' && Math.hypot(monster.x - player.x, monster.y - player.y) <= 7);\n    if (nearbyBoss) this.emitBossIntroIfNeeded(player, nearbyBoss);\n\n    // Portals are server-owned. Stepping onto one attempts travel automatically.\n",
    'boss intro on approach')
text = replace_once(text,
    "    player.targetId = null;\n    this.emitEvent(player.mapId, {\n      kind: 'system', targetId: player.id,\n      text: `🌍 Entered ${targetMap.name}`,\n",
    "    player.targetId = null;\n    if (officialSystems.discoverRegion(player, targetMap.id || portal.targetMap)) {\n      const discovery = buildRegionDiscoveryEvent(player, { ...targetMap, id: targetMap.id || portal.targetMap });\n      if (discovery) this.emitEvent(player.mapId, discovery);\n    }\n    this.emitEvent(player.mapId, {\n      kind: 'system', targetId: player.id,\n      text: `🌍 Entered ${targetMap.name}`,\n",
    'region discovery on travel')
text = replace_once(text,
    "    this.emitEvent(player.mapId, { kind:'mount_update', targetId:player.id, text: result.mounted === false ? 'Dismounted.' : result.mount ? `${result.mount.name} ready.` : 'Mount updated.', color:result.mount?.color || '#d9bd7a' });\n    return true;\n",
    "    this.emitEvent(player.mapId, { kind:'mount_update', targetId:player.id, text: result.mounted === false ? 'Dismounted.' : result.mount ? `${result.mount.name} ready.` : 'Mount updated.', color:result.mount?.color || '#d9bd7a' });\n    if (action === 'buy' && result.mount) {\n      const unlock = buildCosmeticUnlockEvent(player, { type:'mount', id:result.mount.id, name:result.mount.name, icon:result.mount.icon, color:result.mount.color });\n      if (unlock) this.emitEvent(player.mapId, unlock);\n    }\n    return true;\n",
    'mount unlock')
text = replace_once(text,
    "    this.emitEvent(player.mapId, { kind:'appearance_update', targetId:player.id, text:'Outfit updated.', color:'#d49bc8' });\n    return true;\n",
    "    this.emitEvent(player.mapId, { kind:'appearance_update', targetId:player.id, text:'Outfit updated.', color:'#d49bc8' });\n    if (action === 'buy' || action === 'buy_addon') {\n      const snapshot = appearanceSystem.snapshot(player, contentDB);\n      const outfit = snapshot.catalog.find(entry => entry.id === result.outfitId);\n      const addonName = action === 'buy_addon' ? (result.addon === 1 ? outfit?.addon1Name : outfit?.addon2Name) : '';\n      const unlock = buildCosmeticUnlockEvent(player, {\n        type: action === 'buy_addon' ? 'addon' : 'outfit', id: action === 'buy_addon' ? `${result.outfitId}_addon_${result.addon}` : result.outfitId,\n        name: action === 'buy_addon' ? `${outfit?.name || result.outfitId} · ${addonName || `Addon ${result.addon}`}` : (outfit?.name || result.outfitId),\n        icon: outfit?.icon || '🧥', color:'#d49bc8',\n      });\n      if (unlock) this.emitEvent(player.mapId, unlock);\n    }\n    return true;\n",
    'appearance unlock')
text = replace_once(text,
    "    for (const achievement of officialKill.achievements || []) {\n      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `🏆 Achievement: ${achievement.icon} ${achievement.name} · +${achievement.coins} coins`, color: '#c084fc', pos: { x: player.x, y: player.y } });\n    }\n",
    "    this.emitAchievementUnlocks(player, officialKill.achievements || []);\n",
    'dedicated achievement events')
text = replace_once(text,
    "    const voc = VOCATIONS[player.vocation];\n    while (player.xp >= player.xpNext && voc) {\n",
    "    const voc = VOCATIONS[player.vocation];\n    while (player.xp >= player.xpNext && voc) {\n",
    'kill level loop anchor')
# Add post-level achievement refresh only to the first killMonster loop via its exact tail.
text = replace_once(text,
    "      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });\n    }\n  }\n\n  handleCast(player, payload) {\n",
    "      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation });\n    }\n    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));\n  }\n\n  handleCast(player, payload) {\n",
    'kill post-level achievements')
text = replace_once(text,
    "    let cacheItem = null;\n    if (result.cache) {\n",
    "    let cacheItem = null;\n    let cacheReward = null;\n    if (result.cache) {\n",
    'cache reward state')
text = replace_once(text,
    "        const reward = pool[Math.floor(Math.random() * pool.length)];\n        cacheItem = reward.name;\n        player.inventory.push({\n",
    "        const reward = pool[Math.floor(Math.random() * pool.length)];\n        cacheItem = reward.name;\n        cacheReward = reward;\n        player.inventory.push({\n",
    'cache reward capture')
text = replace_once(text,
    "    const cacheText = cacheItem ? ` · 🎁 Cache: ${cacheItem}` : result.cache ? ' · 🎁 Equipment cache earned' : '';\n    this.emitEvent(player.mapId, {\n",
    "    if (cacheReward) {\n      const chest = buildRewardChestEvent(player, cacheReward);\n      if (chest) this.emitEvent(player.mapId, chest);\n    }\n    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));\n    const cacheText = cacheItem ? ` · 🎁 Cache: ${cacheItem}` : result.cache ? ' · 🎁 Equipment cache earned' : '';\n    this.emitEvent(player.mapId, {\n",
    'cache cinematic')
text = replace_once(text,
    "    this.monstersByMap.set(player.mapId, [...monsters, ...spawned]);\n    return true;\n",
    "    this.monstersByMap.set(player.mapId, [...monsters, ...spawned]);\n    if (wave.boss && spawned[0]) this.emitBossIntroIfNeeded(player, spawned[0]);\n    return true;\n",
    'dungeon boss intro')
text = replace_once(text,
    "    this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text, color: '#7dd3fc', pos: { x: player.x, y: player.y } });\n    return true;\n  }\n\n  handleSocial(player, payload) {\n",
    "    this.emitAchievementUnlocks(player, officialSystems.refreshAchievements(player));\n    this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text, color: '#7dd3fc', pos: { x: player.x, y: player.y } });\n    return true;\n  }\n\n  handleSocial(player, payload) {\n",
    'official action achievements')
write(path, text)

# -------------------------------------------------------------------
# ServerSync message surfaces for cinematic events.
# -------------------------------------------------------------------
path = 'src/game/ServerSync.ts'
text = read(path)
text = replace_once(text,
    "        case 'boss_defeated':\n          if (event.text) { addMessage('Victory', event.text, event.color || '#ffbf5f', 'system'); addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#ffbf5f', true); }\n          break;\n        case 'class_sustain':\n",
    "        case 'boss_defeated':\n          if (event.text) { addMessage('Victory', event.text, event.color || '#ffbf5f', 'system'); addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#ffbf5f', true); }\n          break;\n        case 'boss_intro':\n          if (event.subtitle || event.text) addMessage('Boss', event.subtitle || event.text, event.color || '#ffbf5f', 'battle');\n          break;\n        case 'region_discovered':\n          if (event.text) addMessage('Exploration', event.text, event.color || '#7dd3fc', 'system');\n          break;\n        case 'achievement_unlocked':\n          if (event.text) addMessage('Achievement', event.text, event.color || '#c084fc', 'system');\n          break;\n        case 'cosmetic_unlocked':\n          if (event.text) addMessage('Unlock', event.text, event.color || '#d49bc8', 'system');\n          break;\n        case 'reward_chest_opened':\n          if (event.text) addMessage('Treasure', event.text, event.color || '#ffb347', 'loot');\n          break;\n        case 'class_sustain':\n",
    'sync cinematic cases')
write(path, text)

# -------------------------------------------------------------------
# Extract ground loot rendering from the near-limit GameScreen.
# -------------------------------------------------------------------
path = 'src/components/GameScreen.tsx'
text = read(path)
text = replace_once(text,
    "import { createCorpse, createLootBag, rollLoot, CORPSE_LIFETIME, type GroundItem, type LootItem } from '../game/loot';\n",
    "import { createCorpse, createLootBag, rollLoot, type GroundItem, type LootItem } from '../game/loot';\nimport { drawGroundLootPresentation } from '../game/groundLootPresentation';\n",
    'ground presentation import')
start = text.index('    // Ground loot (corpses / loot bags)\n')
end = text.index('    // Monsters — use server data in authoritative mode, local data otherwise\n', start)
replacement = "    // Ground loot is extracted from the orchestrator and supports authoritative rarity beams.\n    drawGroundLootPresentation(ctx, serverSync.isActive() ? serverGroundRef.current : groundItemsRef.current, cam, TILE_SIZE, now);\n\n"
text = text[:start] + replacement + text[end:]
write(path, text)

print('Mor\'ia 9.4 cinematic integration applied')
