from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))

replace_once('server/engine/SocialSystems.mjs',
"const DEFAULT_DB_FILE = path.join(__dirname, '..', 'moria-social.json');",
"const DEFAULT_DB_FILE = process.env.MORIA_SOCIAL_DB || path.join(__dirname, '..', 'moria-social.json');")
replace_once('server/engine/SocialSystems.mjs',
"      fs.writeFileSync(temp, JSON.stringify(this.state, null, 2));",
"      fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), { mode: 0o600 });")
replace_once('server/engine/PlayerDB.mjs',
"const DB_FILE = path.join(__dirname, '..', 'moria-players.json');",
"const DB_FILE = process.env.MORIA_PLAYER_DB || path.join(__dirname, '..', 'moria-players.json');")
replace_once('server/engine/ContentDB.mjs',
"const DB_FILE = path.join(__dirname, '..', 'moria-content.json');",
"const DB_FILE = process.env.MORIA_CONTENT_DB || path.join(__dirname, '..', 'moria-content.json');")
replace_once('server/engine/OfficialSystems.mjs',
"const DEFAULT_DB_FILE = path.join(__dirname, '..', 'moria-official.json');",
"const DEFAULT_DB_FILE = process.env.MORIA_OFFICIAL_DB || path.join(__dirname, '..', 'moria-official.json');")

ignore = read('.gitignore')
anchor = "server/moria-official.json\nserver/moria-official.json.tmp\n"
addition = "server/moria-official.json\nserver/moria-official.json.tmp\nserver/moria-social.json\nserver/moria-social.json.tmp\nserver/moria-players.json.tmp\nserver/moria-content.json.tmp\nserver/moria-accounts.json.tmp\n"
if anchor not in ignore:
    raise SystemExit('.gitignore runtime DB anchor not found')
write('.gitignore', ignore.replace(anchor, addition, 1))

replace_once('server/server.js',
"  let messagesInWindow = 0;\n  let messageWindowStart = Date.now();",
"  let messagesInWindow = 0;\n  let messageWindowStart = Date.now();\n  let chatMessagesInWindow = 0;\n  let chatWindowStart = Date.now();\n  let socialActionsInWindow = 0;\n  let socialWindowStart = Date.now();")

replace_once('server/server.js',
"      const intent = msg.payload;\n      if (!intent || typeof intent !== 'object' || Array.isArray(intent) || typeof intent.type !== 'string') return;\n      engine.processIntent(clientId, intent);",
"      const intent = msg.payload;\n      if (!intent || typeof intent !== 'object' || Array.isArray(intent) || typeof intent.type !== 'string') return;\n      if (intent.type === 'social') {\n        if (now - socialWindowStart >= 10_000) { socialWindowStart = now; socialActionsInWindow = 0; }\n        if (++socialActionsInWindow > 30) return;\n      }\n      engine.processIntent(clientId, intent);")

replace_once('server/server.js',
"      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};\n      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : '';\n      if (!text) return;\n      const allowedChannels = new Set(['world', 'say', 'party', 'guild', 'trade']);",
"      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};\n      if (now - chatWindowStart >= 5000) { chatWindowStart = now; chatMessagesInWindow = 0; }\n      if (++chatMessagesInWindow > 15) return;\n      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : '';\n      if (!text) return;\n      const allowedChannels = new Set(['world', 'say', 'party', 'guild', 'trade']);")

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

function startServer(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-social-ws-'));
  const port = 42000 + Math.floor(Math.random() * 7000);
  const child = spawn(process.execPath, ['server.js'], {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      MORIA_ACCOUNT_DB: path.join(tempDir, 'accounts.json'),
      MORIA_PLAYER_DB: path.join(tempDir, 'players.json'),
      MORIA_CONTENT_DB: path.join(tempDir, 'content.json'),
      MORIA_OFFICIAL_DB: path.join(tempDir, 'official.json'),
      MORIA_SOCIAL_DB: path.join(tempDir, 'social.json'),
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
  return { port, ready };
}

async function post(port, pathname, body, token = '') {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

async function createCharacter(port, suffix, characterName) {
  const registered = await post(port, '/api/auth/register', { username: `social_${suffix}_${Date.now()}`, password: 'StrongSocialPassword123!' });
  assert.equal(registered.status, 201);
  const token = registered.payload.sessionToken;
  const character = await post(port, '/api/characters', { name: characterName, vocation: 'knight' }, token);
  assert.equal(character.status, 201);
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
  const waitFor = (predicate, timeoutMs = 4000) => {
    const existing = messages.find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: null };
      waiter.timer = setTimeout(() => { waiters.delete(waiter); reject(new Error(`Timed out waiting for ${characterName}`)); }, timeoutMs);
      waiters.add(waiter);
    });
  };
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  ws.send(JSON.stringify({ kind: 'auth', from: 'integration-test', time: Date.now(), payload: { sessionToken: token, characterName } }));
  const auth = await waitFor(message => message.kind === 'auth_ok');
  return {
    ws, messages, id: auth.payload.id, waitFor,
    send(kind, payload) { ws.send(JSON.stringify({ kind, from: 'integration-test', time: Date.now(), payload })); },
  };
}

test('websocket party chat stays private and client cannot spoof system channel or chat color', async t => {
  const { port, ready } = startServer(t);
  await ready;
  const stamp = Date.now().toString(36);
  const names = { a: `Astra${stamp}`, b: `Borin${stamp}`, c: `Cyra${stamp}` };
  const tokenA = await createCharacter(port, 'a', names.a);
  const tokenB = await createCharacter(port, 'b', names.b);
  const tokenC = await createCharacter(port, 'c', names.c);
  const a = await connectClient(port, tokenA, names.a);
  const b = await connectClient(port, tokenB, names.b);
  const c = await connectClient(port, tokenC, names.c);
  t.after(() => { for (const client of [a, b, c]) try { client.ws.close(); } catch {} });

  const aSnapshot = await a.waitFor(message => message.kind === 'snapshot' && message.payload?.nearbyPlayers?.some(player => player.name === names.b));
  const bId = aSnapshot.payload.nearbyPlayers.find(player => player.name === names.b).id;
  a.send('intent', { type: 'social', payload: { action: 'party_invite', targetId: bId }, timestamp: Date.now() });
  await b.waitFor(message => message.kind === 'snapshot' && message.payload?.social?.partyInvite?.fromName === names.a);
  b.send('intent', { type: 'social', payload: { action: 'party_accept' }, timestamp: Date.now() });
  await a.waitFor(message => message.kind === 'snapshot' && message.payload?.social?.party?.members?.length === 2);
  await b.waitFor(message => message.kind === 'snapshot' && message.payload?.social?.party?.members?.length === 2);

  const privateText = `party-private-${stamp}`;
  const cStart = c.messages.length;
  a.send('chat', { text: privateText, channel: 'party', color: '#ff00ff' });
  const partyA = await a.waitFor(message => message.kind === 'chat' && message.payload?.text === privateText);
  const partyB = await b.waitFor(message => message.kind === 'chat' && message.payload?.text === privateText);
  assert.equal(partyA.payload.channel, 'party');
  assert.equal(partyB.payload.channel, 'party');
  assert.notEqual(partyB.payload.color.toLowerCase(), '#ff00ff');
  await sleep(300);
  assert.equal(c.messages.slice(cStart).some(message => message.kind === 'chat' && message.payload?.text === privateText), false);

  const worldText = `world-visible-${stamp}`;
  a.send('chat', { text: worldText, channel: 'world', color: '#ff00ff' });
  const worldC = await c.waitFor(message => message.kind === 'chat' && message.payload?.text === worldText);
  assert.equal(worldC.payload.channel, 'world');
  assert.notEqual(worldC.payload.color.toLowerCase(), '#ff00ff');

  const spoofText = `system-spoof-${stamp}`;
  a.send('chat', { text: spoofText, channel: 'system', color: '#ff00ff' });
  const spoofC = await c.waitFor(message => message.kind === 'chat' && message.payload?.text === spoofText);
  assert.equal(spoofC.payload.channel, 'world');
});
'''
write('server/test/social-ws.test.mjs', TEST)

social_tests = read('server/test/social-systems.test.mjs')
extra = r'''

test('disconnect cancels active trade and session party while persistent guild membership survives', () => {
  const { systems, dir, players, a, b } = setup();
  try {
    assert.equal(systems.createGuild(a, 'Persistent Wardens').ok, true);
    assert.equal(systems.inviteParty(a, b, players).ok, true);
    assert.equal(systems.acceptParty(b).ok, true);
    assert.equal(systems.requestTrade(a, b).ok, true);
    assert.equal(systems.acceptTrade(b, players).ok, true);
    systems.onDisconnect(a);
    assert.equal(systems.getParty(a), null);
    assert.equal(systems.tradeByPlayer.size, 0);
    assert.equal(systems.getGuildByMember(a.name)?.name, 'Persistent Wardens');
  } finally { cleanup(dir); }
});
'''
if 'disconnect cancels active trade and session party' not in social_tests:
    write('server/test/social-systems.test.mjs', social_tests + extra)

print('Foundation 7.1 social post-gate hardening applied')
