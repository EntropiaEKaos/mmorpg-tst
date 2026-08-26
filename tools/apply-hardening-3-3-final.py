from pathlib import Path

# =====================================================================
# Server HTTP/session/save hardening
# =====================================================================
p = Path('server/server.js')
s = p.read_text()

if "import { questEngine } from './engine/QuestEngine.mjs';" not in s:
    s = s.replace("import { WORLD } from './engine/World.mjs';\n", "import { WORLD } from './engine/World.mjs';\nimport { questEngine } from './engine/QuestEngine.mjs';\n", 1)

if "const TRUST_PROXY" not in s:
    s = s.replace("const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);\n", "const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);\nconst TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));\n", 1)

old_ip = """function getRequestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}
"""
new_ip = """function getRequestIp(req) {
  if (TRUST_PROXY) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket?.remoteAddress || 'unknown';
}
"""
if old_ip not in s:
    raise SystemExit('getRequestIp marker missing')
s = s.replace(old_ip, new_ip, 1)

save_marker = """    stats: p.stats || {},
    mapId: p.mapId,
"""
if "quests: questEngine.exportState(p.id)" not in s:
    if save_marker not in s:
        raise SystemExit('save marker missing')
    s = s.replace(save_marker, """    stats: p.stats || {},
    quests: questEngine.exportState(p.id),
    mapId: p.mapId,
""", 1)

old_fallback = """    } else {
      p.x = 40;
      p.y = 40;
    }
  }
"""
new_fallback = """    } else {
      const safeSpawn = WORLD.findWalkableSpawn(mapData, mapData.spawnPoint);
      p.x = safeSpawn.x;
      p.y = safeSpawn.y;
    }
  }
"""
if old_fallback not in s:
    raise SystemExit('restore fallback marker missing')
s = s.replace(old_fallback, new_fallback, 1)

auth_old = """      const player = engine.playerConnect(clientId, name, vocation, ws);
      const saveKey = playerDB.findNameCaseInsensitive(name);
      restorePlayer(player, saveKey ? playerDB.get(saveKey) : null, vocation);
      authenticatedPlayer = name;
"""
auth_new = """      const player = engine.playerConnect(clientId, name, vocation, ws);
      const saveKey = playerDB.findNameCaseInsensitive(name);
      const savedPlayer = saveKey ? playerDB.get(saveKey) : null;
      restorePlayer(player, savedPlayer, vocation);
      questEngine.restorePlayer(clientId, savedPlayer?.quests);
      authenticatedPlayer = name;
"""
if auth_old not in s:
    raise SystemExit('WS restore marker missing')
s = s.replace(auth_old, auth_new, 1)
p.write_text(s)

# =====================================================================
# Server gameplay hardening and progression consistency
# =====================================================================
p = Path('server/engine/GameState.mjs')
s = p.read_text()

old_disconnect = "  playerDisconnect(id) { this.players.delete(id); }"
new_disconnect = "  playerDisconnect(id) { questEngine.clearPlayer(id); this.players.delete(id); }"
if old_disconnect not in s:
    raise SystemExit('playerDisconnect marker missing')
s = s.replace(old_disconnect, new_disconnect, 1)

old_item = """  handleUseItem(player, payload) {
    if (typeof payload.itemId !== 'string') return false;
    const item = player.inventory.find(i => i.id === payload.itemId);
    if (!item || item.type !== 'potion') return false;

    const derived = this.computeDerivedStats(player);
    if (item.name.includes('Health')) {
      player.hp = Math.min(derived.totalMaxHp, player.hp + 50);
      this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: 50, pos: { x: player.x, y: player.y }, color: '#2ecc71' });
    } else if (item.name.includes('Mana')) {
      player.mana = Math.min(derived.totalMaxMana, player.mana + 50);
    } else return false;

    item.quantity--;
    if (item.quantity <= 0) player.inventory = player.inventory.filter(i => i.id !== payload.itemId);
    return true;
  }
"""
new_item = """  handleUseItem(player, payload) {
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
"""
if old_item not in s:
    raise SystemExit('use-item marker missing')
s = s.replace(old_item, new_item, 1)

old_mount = "  handleMount(player) { player.mounted = !player.mounted; return true; }"
new_mount = """  handleMount(player) {
    if (!player.mounted && player.level < 5) return false;
    player.mounted = !player.mounted;
    return true;
  }"""
if old_mount not in s:
    raise SystemExit('mount marker missing')
s = s.replace(old_mount, new_mount, 1)

quest_reward_marker = """      player.gold += result.rewards.gold;
      player.xp += result.rewards.xp;
      player.stats.goldEarned += result.rewards.gold;
      if (result.rewards.item) player.inventory.push({ id: `quest_${Date.now()}`, ...result.rewards.item, type: 'misc', quantity: 1 });
"""
quest_reward_repl = """      player.gold += result.rewards.gold;
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
"""
if quest_reward_marker not in s:
    raise SystemExit('quest reward marker missing')
s = s.replace(quest_reward_marker, quest_reward_repl, 1)

old_death = """        if (nearest.hp <= 0) {
          nearest.hp = derived.totalMaxHp; nearest.mana = derived.totalMaxMana;
          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';
          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1));
          nearest.stats.deaths++;
          this.emitEvent(mapId, { kind: 'death', targetId: nearest.id, text: 'You died!', color: '#ff0000', pos: { x: 40, y: 40 } });
        }
"""
new_death = """        if (nearest.hp <= 0) {
          nearest.hp = derived.totalMaxHp; nearest.mana = derived.totalMaxMana;
          nearest.x = 40; nearest.y = 40; nearest.mapId = 'eldoria';
          nearest.xp = Math.max(0, nearest.xp - Math.floor(nearest.xpNext * 0.1));
          nearest.stats.deaths++;
          this.emitEvent(nearest.mapId, { kind: 'death', targetId: nearest.id, text: 'You died!', color: '#ff0000', pos: { x: nearest.x, y: nearest.y } });
        }
"""
if old_death not in s:
    raise SystemExit('death marker missing')
s = s.replace(old_death, new_death, 1)

old_chase = """        const dx = Math.sign(nearest.x - m.x), dy = Math.sign(nearest.y - m.y);
        const map = WORLD.getMap(mapId);
        if (Math.abs(nearest.x - m.x) > Math.abs(nearest.y - m.y)) {
          if (map?.tiles[m.y]?.[m.x + dx]?.walkable) m.x += dx;
        } else {
          if (map?.tiles[m.y + dy]?.[m.x]?.walkable) m.y += dy;
        }
"""
new_chase = """        const dx = Math.sign(nearest.x - m.x), dy = Math.sign(nearest.y - m.y);
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
"""
if old_chase not in s:
    raise SystemExit('monster chase marker missing')
s = s.replace(old_chase, new_chase, 1)

old_events_return = """    return { player: playerData, nearbyPlayers, monsters, groundItems, events: this.pendingEvents.get(player.mapId) || [] };
"""
new_events_return = """    const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup']);
    const events = (this.pendingEvents.get(player.mapId) || []).filter(event =>
      !privateKinds.has(event.kind) || event.targetId === playerId
    );
    return { player: playerData, nearbyPlayers, monsters, groundItems, events };
"""
if old_events_return not in s:
    raise SystemExit('snapshot events marker missing')
s = s.replace(old_events_return, new_events_return, 1)
p.write_text(s)

# =====================================================================
# Client: online accounts fail closed until authoritative session is live
# =====================================================================
p = Path('src/components/GameScreen.tsx')
s = p.read_text()

component_marker = """export default function GameScreen({ account, onLogout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
"""
if "const onlineAccount = Boolean(account.sessionToken" not in s:
    if component_marker not in s:
        raise SystemExit('component marker missing')
    s = s.replace(component_marker, component_marker + "  const onlineAccount = Boolean(account.sessionToken && !account.offline);\n", 1)

old_connect = """    // AUTO-CONNECT to server (works in dev AND production deployments)
    net.connectOnline().then((ok) => {
      if (ok) {
        setNetMode('online');
        addMessage('System', '🟢 CONNECTED to Mor\\'ia authoritative server! Anti-cheat active.', '#2ecc71', 'system');
        addToast('info', 'Online!', `Connected to ${net.isHosted() ? 'world server' : 'local server'}`, '🟢', '#2ecc71');
        // AUTHENTICATE — sends player identity to server for authoritative mode
        serverSync.authenticate(account.sessionToken || '', account.characterName);
      } else if (net.isHosted()) {
        setTimeout(() => net.connectOnline().then(ok2 => ok2 && setNetMode('online')), 3000);
      }
    });
"""
new_connect = """    // Only authenticated online accounts connect to the authoritative world.
    // Quick Play remains local and never opens an unauthenticated server session.
    if (onlineAccount && account.sessionToken) {
      // Store auth payload before connecting so reconnect/retry authenticates on open.
      serverSync.authenticate(account.sessionToken, account.characterName);
      net.connectOnline().then((ok) => {
        if (ok) {
          setNetMode('online');
          addMessage('System', '🟢 CONNECTED to Mor\\'ia authoritative server! Anti-cheat active.', '#2ecc71', 'system');
          addToast('info', 'Online!', `Connected to ${net.isHosted() ? 'world server' : 'local server'}`, '🟢', '#2ecc71');
        } else if (net.isHosted()) {
          setTimeout(() => net.connectOnline().then(ok2 => {
            if (ok2) setNetMode('online');
          }), 3000);
        }
      });
    }
"""
if old_connect not in s:
    raise SystemExit('auto-connect marker missing')
s = s.replace(old_connect, new_connect, 1)

manual_marker = """  const doConnectServer = async () => {
    setNetStatus('Connecting...');
"""
manual_repl = """  const doConnectServer = async () => {
    if (!onlineAccount || !account.sessionToken) {
      setNetStatus('🔒 Sign in to an online account first.');
      return;
    }
    setNetStatus('Connecting...');
"""
if manual_marker not in s:
    raise SystemExit('manual connect marker missing')
s = s.replace(manual_marker, manual_repl, 1)

# Fail closed while an online account is waiting for auth/snapshot.
for marker in [
    "  const toggleMount = () => {\n",
    "  const usePotion = (type: 'hp' | 'mp' | 'hpg') => {\n",
    "  const castSpell = (idx: number) => {\n",
    "  const travelToMap = (targetMapId: string, spawn: { x: number; y: number }) => {\n",
    "  const pickupGroundItem = (ground: GroundItem) => {\n",
    "  const handleMysteryComplete = (gold: number, xp: number, itemName?: string, itemIcon?: string) => {\n",
    "  const enterDungeon = (totalWaves: number) => {\n",
    "  const attackTarget = (m: Monster) => {\n",
    "  const handleCanvasClick = () => {\n",
    "  const handleNPCAction = (action: string, npc: NPC, questId?: string) => {\n",
    "  const buyItem = (shopItem: { name: string; icon: string; type: Item['type']; price: number; description?: string; equipment?: Equipment }) => {\n",
    "  const dropItemOnGround = (item: Item) => {\n",
    "  const socketGem = (itemId: string, gemId: string) => {\n",
    "  const craftItem = (name: string, icon: string, value: number, description?: string) => {\n",
    "  const equipItem = (item: Item) => {\n",
    "  const unequipItem = (slot: keyof Player['equipment']) => {\n",
]:
    if marker not in s:
        raise SystemExit('authority pending marker missing: ' + marker.strip())
    guard = marker + "    if (onlineAccount && !serverSync.isActive()) return;\n"
    if guard not in s:
        s = s.replace(marker, guard, 1)

s = s.replace("""      } else {
      // LOCAL MODE (single-player or BroadcastChannel): original simulation
""", """      } else if (!onlineAccount) {
      // LOCAL MODE (single-player or BroadcastChannel): original simulation
""", 1)
s = s.replace("""      if (!serverSync.isActive()) {
      // Auto-loot adjacent corpses (within 1 tile) for fluidity
""", """      if (!onlineAccount) {
      // Auto-loot adjacent corpses (within 1 tile) for fluidity
""", 1)
p.write_text(s)

# =====================================================================
# Tests
# =====================================================================
p = Path('server/test/auth-http.test.mjs')
s = p.read_text()
old_post = """async function post(port, pathname, payload) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
"""
new_post = """async function post(port, pathname, payload, extraHeaders = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(payload),
  });
"""
if old_post not in s:
    raise SystemExit('auth-http post marker missing')
s = s.replace(old_post, new_post, 1)
rate_tail = """  const throttled = await post(port, '/api/auth/login', { username, password: 'wrong-password-final' });
  assert.equal(throttled.status, 429);
  assert.ok(Number(throttled.retryAfter) >= 1);
});
"""
rate_repl = """  const throttled = await post(port, '/api/auth/login', { username, password: 'wrong-password-final' });
  assert.equal(throttled.status, 429);
  assert.ok(Number(throttled.retryAfter) >= 1);

  // Direct deployments must not trust a client-spoofed forwarding header.
  const spoofed = await post(port, '/api/auth/login', { username, password: 'wrong-password-spoof' }, { 'X-Forwarded-For': '203.0.113.99' });
  assert.equal(spoofed.status, 429);
});
"""
if rate_tail not in s:
    raise SystemExit('rate-limit test marker missing')
s = s.replace(rate_tail, rate_repl, 1)
p.write_text(s)

p = Path('server/test/hardening.test.mjs')
s = p.read_text()
if "import { questEngine } from '../engine/QuestEngine.mjs';" not in s:
    s = s.replace("import { WORLD } from '../engine/World.mjs';\n", "import { WORLD } from '../engine/World.mjs';\nimport { questEngine } from '../engine/QuestEngine.mjs';\nimport { contentDB } from '../engine/ContentDB.mjs';\n", 1)

old_shared = """test('map events remain available to every snapshot until explicitly consumed', () => {
  const a = makePlayer(); const b = makePlayer();
  try {
    engine.emitEvent('eldoria', { kind: 'system', targetId: 'shared', text: 'shared-event' });
    assert.equal(engine.getSnapshot(a.id).events.some(e => e.text === 'shared-event'), true);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'shared-event'), true);
    engine.consumeEvents('eldoria');
    assert.equal(engine.getSnapshot(a.id).events.length, 0);
    assert.equal(engine.getSnapshot(b.id).events.length, 0);
  } finally { cleanup(a.id); cleanup(b.id); }
});
"""
new_shared = """test('map events remain available to every snapshot until explicitly consumed', () => {
  const a = makePlayer(); const b = makePlayer();
  try {
    engine.emitEvent('eldoria', { kind: 'damage', targetId: 'monster_shared', text: 'shared-event' });
    assert.equal(engine.getSnapshot(a.id).events.some(e => e.text === 'shared-event'), true);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'shared-event'), true);
    engine.consumeEvents('eldoria');
    assert.equal(engine.getSnapshot(a.id).events.length, 0);
    assert.equal(engine.getSnapshot(b.id).events.length, 0);
  } finally { cleanup(a.id); cleanup(b.id); }
});
"""
if old_shared not in s:
    raise SystemExit('shared-event test marker missing')
s = s.replace(old_shared, new_shared, 1)

if "private player events are filtered from other players" not in s:
    s += """

test('private player events are filtered from other players', () => {
  const a = makePlayer(); const b = makePlayer();
  try {
    engine.emitEvent('eldoria', { kind: 'system', targetId: a.id, text: 'private-a' });
    engine.emitEvent('eldoria', { kind: 'damage', targetId: 'monster_public', text: 'public-hit' });
    assert.equal(engine.getSnapshot(a.id).events.some(e => e.text === 'private-a'), true);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'private-a'), false);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'public-hit'), true);
  } finally { engine.consumeEvents('eldoria'); cleanup(a.id); cleanup(b.id); }
});

test('quest state round-trips through authoritative persistence shape', () => {
  const { id } = makePlayer();
  try {
    const quest = contentDB.get('quests')[0];
    assert.ok(quest);
    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: 1 }, startedAt: 12345 }],
      completed: [],
    });
    const state = questEngine.exportState(id);
    assert.equal(state.active.length, 1);
    assert.equal(state.active[0].questId, quest.id);
    assert.equal(state.active[0].progress[quest.target], Math.min(1, quest.count));
  } finally { cleanup(id); }
});

test('full potions are not consumed and quest XP can level the player', () => {
  const { id, player } = makePlayer();
  try {
    const potion = player.inventory.find(i => i.type === 'potion' && i.name.includes('Health'));
    assert.ok(potion);
    const before = potion.quantity;
    player.hp = player.maxHp;
    assert.equal(engine.processIntent(id, { type: 'use_item', payload: { itemId: potion.id } }), false);
    assert.equal(potion.quantity, before);

    const quest = contentDB.get('quests').find(q => Number(q.rewardXp) > 0);
    assert.ok(quest);
    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: quest.count }, startedAt: Date.now() }],
      completed: [],
    });
    player.xp = Math.max(0, player.xpNext - Number(quest.rewardXp));
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);
    assert.ok(player.level >= 2);
  } finally { cleanup(id); }
});

test('mounting is server-gated by progression', () => {
  const { id, player } = makePlayer();
  try {
    player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), false);
    assert.equal(player.mounted, false);
    player.level = 5;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), true);
    assert.equal(player.mounted, true);
  } finally { cleanup(id); }
});
"""
p.write_text(s)
