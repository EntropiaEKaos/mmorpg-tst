import test from 'node:test';
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
