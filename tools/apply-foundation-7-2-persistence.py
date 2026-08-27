from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))

# ---- Server persistence policy ----
replace_once('server/server.js',
"const TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));",
"const TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));\nconst AUTOSAVE_INTERVAL_MS = Math.max(1000, Math.min(300_000, Math.floor(Number(process.env.MORIA_AUTOSAVE_MS) || 15_000)));\nconst CRITICAL_SOCIAL_ACTIONS = new Set(['trade_confirm', 'guild_create']);\nconst PERSISTENCE_STATE = { lastAutosaveAt: 0, lastCriticalFlushAt: 0, lastSavedPlayers: 0 };")

replace_once('server/server.js',
"      content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length, maps: WORLD.getMapIds().length },",
"      content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length, maps: WORLD.getMapIds().length },\n      persistence: { autosaveMs: AUTOSAVE_INTERVAL_MS, ...PERSISTENCE_STATE },")

replace_once('server/server.js',
"const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_WS_PAYLOAD });\nconst wsClients = new Map();",
"const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_WS_PAYLOAD });\nconst wsClients = new Map();\n\nfunction persistOnlinePlayers(reason = 'autosave') {\n  let savedPlayers = 0;\n  for (const [clientId, entry] of wsClients) {\n    if (!entry?.name) continue;\n    const player = engine.getPlayer(clientId);\n    if (!player) continue;\n    playerDB.set(entry.name, buildAuthoritativeSave(player));\n    savedPlayers++;\n  }\n  if (savedPlayers > 0) playerDB.save();\n  PERSISTENCE_STATE.lastSavedPlayers = savedPlayers;\n  if (reason === 'critical') PERSISTENCE_STATE.lastCriticalFlushAt = Date.now();\n  else PERSISTENCE_STATE.lastAutosaveAt = Date.now();\n  return savedPlayers;\n}\n\nfunction shouldFlushCriticalIntent(intent) {\n  if (!intent || typeof intent !== 'object') return false;\n  if (intent.type === 'official') return true;\n  if (intent.type !== 'social') return false;\n  const action = intent.payload && typeof intent.payload === 'object' && !Array.isArray(intent.payload) ? intent.payload.action : '';\n  return CRITICAL_SOCIAL_ACTIONS.has(action);\n}\n\nfunction persistCriticalState() {\n  const count = persistOnlinePlayers('critical');\n  // Official and social stores already use atomic temp-file renames. Re-saving\n  // here closes the crash window after a successful cross-system mutation.\n  officialSystems.save();\n  socialSystems.save();\n  return count;\n}")

replace_once('server/server.js',
"      engine.processIntent(clientId, intent);\n      return;",
"      const handled = engine.processIntent(clientId, intent);\n      if (handled && shouldFlushCriticalIntent(intent)) persistCriticalState();\n      return;")

replace_once('server/server.js',
"setInterval(() => sessionManager.prune(), 10 * 60 * 1000);\nsetInterval(() => socialSystems.prune(), 60 * 1000);",
"setInterval(() => sessionManager.prune(), 10 * 60 * 1000);\nsetInterval(() => socialSystems.prune(), 60 * 1000);\nsetInterval(() => persistOnlinePlayers('autosave'), AUTOSAVE_INTERVAL_MS);")

replace_once('server/server.js',
"process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); officialSystems.save(); socialSystems.save(); process.exit(0); });\nprocess.on('SIGINT', () => { playerDB.save(); contentDB.save(); officialSystems.save(); socialSystems.save(); process.exit(0); });",
"function gracefulShutdown() {\n  persistOnlinePlayers('shutdown');\n  contentDB.save();\n  officialSystems.save();\n  socialSystems.save();\n  process.exit(0);\n}\nprocess.on('SIGTERM', gracefulShutdown);\nprocess.on('SIGINT', gracefulShutdown);")

# ---- Integration tests proving crash durability ----
TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_DIR = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function startServer(t, autosaveMs = 1000) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-persistence-'));
  const files = {
    accounts: path.join(tempDir, 'accounts.json'), players: path.join(tempDir, 'players.json'),
    content: path.join(tempDir, 'content.json'), official: path.join(tempDir, 'official.json'), social: path.join(tempDir, 'social.json'),
  };
  const port = 43000 + Math.floor(Math.random() * 6000);
  const child = spawn(process.execPath, ['server.js'], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(port), MORIA_AUTOSAVE_MS: String(autosaveMs),
      MORIA_ACCOUNT_DB: files.accounts, MORIA_PLAYER_DB: files.players, MORIA_CONTENT_DB: files.content,
      MORIA_OFFICIAL_DB: files.official, MORIA_SOCIAL_DB: files.social,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => {
    try { child.kill('SIGKILL'); } catch {}
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  const ready = new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`Server did not start. Output:\n${output}`)), 6000);
    const check = () => {
      if (output.includes(`localhost:${port}`)) { clearTimeout(deadline); resolve(); return; }
      if (child.exitCode !== null) { clearTimeout(deadline); reject(new Error(`Server exited (${child.exitCode}). Output:\n${output}`)); return; }
      setTimeout(check, 25);
    };
    check();
  });
  return { port, ready, files, child };
}

async function post(port, pathname, body, token = '') {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

async function createCharacter(port, suffix, name) {
  const registered = await post(port, '/api/auth/register', { username: `persist_${suffix}_${Date.now()}`, password: 'StrongPersistencePassword123!' });
  assert.equal(registered.status, 201);
  const token = registered.payload.sessionToken;
  const created = await post(port, '/api/characters', { name, vocation: 'knight' }, token);
  assert.equal(created.status, 201);
  return token;
}

async function connectClient(port, token, characterName) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const messages = [];
  const waiters = new Set();
  ws.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    messages.push(message);
    for (const waiter of [...waiters]) {
      if (!waiter.predicate(message)) continue;
      clearTimeout(waiter.timer); waiters.delete(waiter); waiter.resolve(message);
    }
  });
  const waitFor = (predicate, timeoutMs = 5000) => {
    const existing = [...messages].reverse().find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: null };
      waiter.timer = setTimeout(() => { waiters.delete(waiter); reject(new Error(`Timed out waiting for ${characterName}`)); }, timeoutMs);
      waiters.add(waiter);
    });
  };
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  ws.send(JSON.stringify({ kind: 'auth', from: 'persistence-test', time: Date.now(), payload: { sessionToken: token, characterName } }));
  const auth = await waitFor(message => message.kind === 'auth_ok');
  const initial = await waitFor(message => message.kind === 'snapshot' && message.payload?.player?.name === characterName);
  return {
    ws, id: auth.payload.id, messages, initial,
    waitFor,
    send(kind, payload) { ws.send(JSON.stringify({ kind, from: 'persistence-test', time: Date.now(), payload })); },
  };
}

function readPlayers(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

async function waitForPersisted(file, predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = readPlayers(file);
    if (predicate(data)) return data;
    await sleep(50);
  }
  throw new Error('Timed out waiting for persisted player state');
}

test('autosave persists authoritative live movement without client save or disconnect', async t => {
  const { port, ready, files } = startServer(t, 1000);
  await ready;
  const stamp = Date.now().toString(36);
  const name = `Saver${stamp}`;
  const token = await createCharacter(port, 'move', name);
  const client = await connectClient(port, token, name);
  t.after(() => { try { client.ws.close(); } catch {} });
  const beforeX = client.initial.payload.player.x;
  const beforeY = client.initial.payload.player.y;
  client.send('intent', { type: 'move', payload: { dx: 1, dy: 0 }, timestamp: Date.now() });
  const moved = await client.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.x === beforeX + 1 && message.payload?.player?.y === beforeY);
  assert.equal(moved.payload.player.x, beforeX + 1);
  const persisted = await waitForPersisted(files.players, data => data[name]?.x === beforeX + 1 && data[name]?.y === beforeY, 4000);
  assert.equal(persisted[name].x, beforeX + 1);
});

test('completed direct trade is durably flushed before autosave or disconnect', async t => {
  const { port, ready, files } = startServer(t, 300000);
  await ready;
  const stamp = Date.now().toString(36);
  const nameA = `TraderA${stamp}`; const nameB = `TraderB${stamp}`;
  const tokenA = await createCharacter(port, 'a', nameA);
  const tokenB = await createCharacter(port, 'b', nameB);
  const a = await connectClient(port, tokenA, nameA);
  const b = await connectClient(port, tokenB, nameB);
  t.after(() => { for (const client of [a, b]) try { client.ws.close(); } catch {} });

  const near = await a.waitFor(message => message.kind === 'snapshot' && message.payload?.nearbyPlayers?.some(player => player.name === nameB));
  const targetId = near.payload.nearbyPlayers.find(player => player.name === nameB).id;
  const sourceItem = a.initial.payload.player.inventory[0];
  assert.ok(sourceItem?.id);

  a.send('intent', { type: 'social', payload: { action: 'trade_request', targetId }, timestamp: Date.now() });
  await b.waitFor(message => message.kind === 'snapshot' && message.payload?.social?.tradeInvite?.fromName === nameA);
  b.send('intent', { type: 'social', payload: { action: 'trade_accept' }, timestamp: Date.now() });
  await a.waitFor(message => message.kind === 'snapshot' && message.payload?.social?.trade);
  a.send('intent', { type: 'social', payload: { action: 'trade_offer', gold: 25, itemIds: [sourceItem.id] }, timestamp: Date.now() });
  b.send('intent', { type: 'social', payload: { action: 'trade_offer', gold: 0, itemIds: [] }, timestamp: Date.now() });
  await sleep(120);
  a.send('intent', { type: 'social', payload: { action: 'trade_confirm' }, timestamp: Date.now() });
  await sleep(120);
  b.send('intent', { type: 'social', payload: { action: 'trade_confirm' }, timestamp: Date.now() });

  await b.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.inventory?.some(item => item.name === sourceItem.name && item.id !== sourceItem.id));
  const persisted = await waitForPersisted(files.players, data =>
    data[nameA] && data[nameB]
    && !data[nameA].inventory.some(item => item.id === sourceItem.id)
    && data[nameB].inventory.some(item => item.name === sourceItem.name), 2000);
  assert.equal(persisted[nameA].gold, 75);
  assert.equal(persisted[nameB].gold, 125);
});
'''
write('server/test/persistence-durability.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.2 — Persistence Durability

Foundation 7.2 closes a durability gap between authoritative in-memory gameplay and JSON persistence.

## Durable player state

- The server now performs authoritative autosaves for every authenticated online character; the client is not responsible for keeping the canonical save current.
- `MORIA_AUTOSAVE_MS` configures the interval, clamped to 1–300 seconds; the default is 15 seconds.
- Graceful SIGTERM/SIGINT first materializes every online player into PlayerDB before flushing content, official and social stores.
- `/health` exposes autosave interval, last autosave/critical flush timestamps and the number of players written by the last flush.

## Critical economic flushes

Successful `official` intents are immediately followed by a durable online-player flush. This covers auction, mail, depot, bank, shop, coin, PvP and other server-owned mutations, including changes to another online character such as auction seller credit or PvP damage.

Successful direct-trade confirmation and guild creation also trigger immediate critical persistence. A completed two-player trade therefore writes both canonical player records in one PlayerDB save before control returns to normal gameplay.

Official and social databases retain atomic temp-file rename persistence and are re-flushed after critical player writes, sharply reducing the crash window across the MVP JSON stores.

## Verification

The integration suite starts real server processes with isolated DB files and proves:

1. movement is autosaved while the WebSocket remains connected and without any client `save` message;
2. a completed direct trade is present in both PlayerDB records before the long autosave interval or disconnect can occur.
'''
write('docs/FOUNDATION_7_2_PERSISTENCE.md', DOC)

print('Foundation 7.2 persistence durability patch applied')
