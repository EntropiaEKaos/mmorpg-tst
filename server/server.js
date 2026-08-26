// ===================================================================
//  ⚔  MOR'IA MMO — AUTHORITATIVE SERVER v3.2 AUTH HARDENED
//  Everything is controlled, saved, and governed HERE.
// ===================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { engine } from './engine/GameState.mjs';
import { playerDB } from './engine/PlayerDB.mjs';
import { contentDB } from './engine/ContentDB.mjs';
import { VOCATIONS } from './engine/Vocations.mjs';
import { WORLD } from './engine/World.mjs';
import { questEngine } from './engine/QuestEngine.mjs';
import { accountStore, sessionManager } from './engine/AuthService.mjs';
import { adminPanelHTML } from './adminPanel.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MAX_HTTP_BODY = 256 * 1024;
const MAX_WS_PAYLOAD = 64 * 1024;
const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);
const ACTIVE_NAMES = new Map();
const AUTH_RATE_LIMITS = new Map();
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));

// ContentDB is persistent; reconcile server-owned catalogs into the already-
// initialized authoritative runtime at server boot.
engine.syncContentItems(contentDB.get('items'));
engine.syncContentSpells(contentDB.get('spells'));
engine.syncContentMonsters(contentDB.get('monsters'));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function json(res, status, payload) {
  if (res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  const result = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    try { result[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim()); } catch {}
  }
  return result;
}

function tokenEqual(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function getAdminToken(req, requestUrl) {
  const auth = String(req.headers.authorization || '');
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const headerToken = req.headers['x-admin-token'];
  if (headerToken) return String(headerToken);
  const cookieToken = parseCookies(req).moria_admin;
  if (cookieToken) return cookieToken;
  return requestUrl.searchParams.get('token') || '';
}

function getBearerToken(req) {
  const auth = String(req.headers.authorization || '');
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

function isAdminAuthorized(req, requestUrl) {
  return Boolean(ADMIN_TOKEN) && tokenEqual(getAdminToken(req, requestUrl), ADMIN_TOKEN);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  try {
    const parsed = new URL(origin);
    const host = String(req.headers.host || '');
    const requestHostname = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
    const sameOrigin = host && parsed.host === host;
    const localDev = LOCAL_HOSTS.has(parsed.hostname) && LOCAL_HOSTS.has(requestHostname);
    if (sameOrigin || localDev) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    }
  } catch {}
}

function readJsonBody(req, res, callback) {
  let body = '';
  let size = 0;
  let ended = false;

  req.on('data', chunk => {
    if (ended) return;
    size += chunk.length;
    if (size > MAX_HTTP_BODY) {
      ended = true;
      json(res, 413, { error: 'Request body too large' });
      req.destroy();
      return;
    }
    body += chunk;
  });

  req.on('end', () => {
    if (ended) return;
    let data = {};
    if (body) {
      try {
        data = JSON.parse(body);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return json(res, 400, { error: 'Invalid JSON object' });
      } catch {
        return json(res, 400, { error: 'Invalid JSON' });
      }
    }
    Promise.resolve(callback(data)).catch(err => {
      console.error('Request handler failed:', err?.message || err);
      if (!res.writableEnded) json(res, 500, { error: 'Internal server error' });
    });
  });
}

function getRequestIp(req) {
  if (TRUST_PROXY) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket?.remoteAddress || 'unknown';
}

function consumeAuthRateLimit(req, res, bucket, limit, windowMs) {
  const now = Date.now();
  const key = `${bucket}:${getRequestIp(req)}`;
  let state = AUTH_RATE_LIMITS.get(key);
  if (!state || now >= state.resetAt) state = { count: 0, resetAt: now + windowMs };
  state.count++;
  AUTH_RATE_LIMITS.set(key, state);
  if (state.count <= limit) return true;
  res.setHeader('Retry-After', String(Math.max(1, Math.ceil((state.resetAt - now) / 1000))));
  json(res, 429, { error: 'Too many authentication attempts. Try again later.' });
  return false;
}

function requireSession(req, res, { touch = true } = {}) {
  const token = getBearerToken(req);
  const session = sessionManager.validate(token, { touch });
  if (!session) {
    json(res, 401, { error: 'Invalid or expired session' });
    return null;
  }
  return { token, session };
}

function buildAuthoritativeSave(p) {
  return {
    level: p.level,
    xp: p.xp,
    xpNext: p.xpNext,
    vocation: p.vocation,
    gold: p.gold,
    bankGold: p.bankGold,
    inventory: p.inventory,
    equipment: p.equipment,
    talents: p.talents || {},
    skills: p.skills || {},
    professions: p.professions || {},
    reputation: p.reputation || {},
    stats: p.stats || {},
    quests: questEngine.exportState(p.id),
    mapId: p.mapId,
    x: p.x,
    y: p.y,
    lastSeen: Date.now(),
  };
}

function restorePlayer(p, saved, expectedVocation) {
  if (typeof expectedVocation === 'string' && VOCATIONS[expectedVocation]) p.vocation = expectedVocation;
  if (!saved || typeof saved !== 'object') return;

  if (Number.isInteger(saved.level) && saved.level > 0) p.level = saved.level;
  if (Number.isFinite(saved.xp) && saved.xp >= 0) p.xp = saved.xp;
  if (Number.isFinite(saved.xpNext) && saved.xpNext > 0) p.xpNext = saved.xpNext;
  if (Number.isFinite(saved.gold) && saved.gold >= 0) p.gold = saved.gold;
  if (Number.isFinite(saved.bankGold) && saved.bankGold >= 0) p.bankGold = saved.bankGold;
  if (Array.isArray(saved.inventory)) p.inventory = saved.inventory;
  if (saved.equipment && typeof saved.equipment === 'object' && !Array.isArray(saved.equipment)) p.equipment = saved.equipment;
  if (saved.talents && typeof saved.talents === 'object' && !Array.isArray(saved.talents)) p.talents = saved.talents;
  if (saved.skills && typeof saved.skills === 'object' && !Array.isArray(saved.skills)) p.skills = saved.skills;
  if (saved.professions && typeof saved.professions === 'object' && !Array.isArray(saved.professions)) p.professions = saved.professions;
  if (saved.reputation && typeof saved.reputation === 'object' && !Array.isArray(saved.reputation)) p.reputation = saved.reputation;
  if (saved.stats && typeof saved.stats === 'object' && !Array.isArray(saved.stats)) p.stats = { ...p.stats, ...saved.stats };

  const mapData = typeof saved.mapId === 'string' ? WORLD.getMap(saved.mapId) : null;
  if (mapData) {
    p.mapId = saved.mapId;
    const validPosition = Number.isInteger(saved.x) && Number.isInteger(saved.y)
      && saved.x >= 0 && saved.x < mapData.width
      && saved.y >= 0 && saved.y < mapData.height
      && mapData.tiles?.[saved.y]?.[saved.x]?.walkable;
    if (validPosition) {
      p.x = saved.x;
      p.y = saved.y;
    } else {
      const safeSpawn = WORLD.findWalkableSpawn(mapData, mapData.spawnPoint);
      p.x = safeSpawn.x;
      p.y = safeSpawn.y;
    }
  }

  const voc = VOCATIONS[p.vocation] || VOCATIONS.knight;
  const levelsGained = Math.max(0, p.level - 1);
  p.maxHp = voc.baseHp + levelsGained * voc.hpPerLevel;
  p.maxMana = voc.baseMana + levelsGained * voc.manaPerLevel;
  p.attack = voc.baseAttack + levelsGained * voc.atkPerLevel;
  p.defense = voc.baseDefense + levelsGained * voc.defPerLevel;
  p.magic = voc.baseMagic + levelsGained * voc.magPerLevel;

  const talents = p.talents || {};
  p.maxHp += (Number(talents.vitality) || 0) * 10 + (Number(talents.transcendence) || 0) * 50;
  p.maxMana += (Number(talents.wisdom) || 0) * 8 + (Number(talents.transcendence) || 0) * 30;
  p.attack += (Number(talents.might) || 0) * 2 + (Number(talents.berserker) || 0) * 15;
  p.defense += (Number(talents.toughness) || 0) * 2;
  p.magic += (Number(talents.arcane_mastery) || 0) * 3 + (Number(talents.transcendence) || 0) * 8;
  p.hp = p.maxHp;
  p.mana = p.maxMana;
}

// ===================================================================
//  AUTH HTTP API — accounts are credentials, characters are owned data
// ===================================================================
function handleAuthAPI(req, res, pathname) {
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    if (!consumeAuthRateLimit(req, res, 'register', 5, 15 * 60 * 1000)) return;
    return readJsonBody(req, res, async data => {
      const result = await accountStore.register(data.username, data.password);
      if (!result.ok) return json(res, result.error.includes('already') ? 409 : 400, { error: result.error });
      const session = sessionManager.create(result.account.id, { revokeExisting: true });
      return json(res, 201, {
        account: result.account,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        recoveryCode: result.recoveryCode,
      });
    });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    if (!consumeAuthRateLimit(req, res, 'login', 10, 5 * 60 * 1000)) return;
    return readJsonBody(req, res, async data => {
      const result = await accountStore.authenticate(data.username, data.password);
      if (!result.ok) return json(res, 401, { error: result.error });
      const session = sessionManager.create(result.account.id, { revokeExisting: true });
      return json(res, 200, { account: result.account, sessionToken: session.token, expiresAt: session.expiresAt });
    });
  }

  if (pathname === '/api/auth/recover' && req.method === 'POST') {
    if (!consumeAuthRateLimit(req, res, 'recover', 5, 15 * 60 * 1000)) return;
    return readJsonBody(req, res, async data => {
      const result = await accountStore.recover(data.username, data.recoveryCode, data.newPassword);
      if (!result.ok) return json(res, 401, { error: result.error });
      sessionManager.revokeAccount(result.account.id);
      const session = sessionManager.create(result.account.id);
      return json(res, 200, {
        account: result.account,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        recoveryCode: result.recoveryCode,
      });
    });
  }

  if (pathname === '/api/auth/session' && req.method === 'GET') {
    const token = getBearerToken(req);
    const rotated = sessionManager.rotate(token);
    if (!rotated) return json(res, 401, { error: 'Invalid or expired session' });
    const account = accountStore.getPublicAccount(sessionManager.validate(rotated.token)?.accountId);
    if (!account) {
      sessionManager.revoke(rotated.token);
      return json(res, 401, { error: 'Account not found' });
    }
    return json(res, 200, { account, sessionToken: rotated.token, expiresAt: rotated.expiresAt });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getBearerToken(req);
    sessionManager.revoke(token);
    return json(res, 200, { ok: true });
  }

  if (pathname === '/api/auth/password' && req.method === 'POST') {
    const auth = requireSession(req, res);
    if (!auth) return;
    return readJsonBody(req, res, async data => {
      const result = await accountStore.changePassword(auth.session.accountId, data.currentPassword, data.newPassword);
      if (!result.ok) return json(res, 400, { error: result.error });
      sessionManager.revokeAccount(result.account.id);
      const nextSession = sessionManager.create(result.account.id);
      return json(res, 200, { account: result.account, sessionToken: nextSession.token, expiresAt: nextSession.expiresAt });
    });
  }

  if (pathname === '/api/characters' && req.method === 'GET') {
    const auth = requireSession(req, res);
    if (!auth) return;
    const account = accountStore.getPublicAccount(auth.session.accountId);
    return account ? json(res, 200, { account }) : json(res, 404, { error: 'Account not found' });
  }

  if (pathname === '/api/characters' && req.method === 'POST') {
    const auth = requireSession(req, res);
    if (!auth) return;
    return readJsonBody(req, res, data => {
      const vocation = typeof data.vocation === 'string' ? data.vocation.toLowerCase() : '';
      if (!VOCATIONS[vocation]) return json(res, 400, { error: 'Invalid vocation' });
      if (playerDB.existsCaseInsensitive(data.name)) {
        return json(res, 409, { error: 'Character name is reserved by legacy server data and requires admin migration' });
      }
      const result = accountStore.createCharacter(auth.session.accountId, data.name, vocation);
      if (!result.ok) return json(res, result.error.includes('already') ? 409 : 400, { error: result.error });
      return json(res, 201, { account: result.account, character: result.character });
    });
  }

  if (pathname.startsWith('/api/auth/') || pathname === '/api/characters') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  return false;
}

// ===================================================================
//  HTTP SERVER — Game client + Admin Panel + Content API
// ===================================================================
const server = http.createServer((req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let requestUrl;
  try { requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`); }
  catch { return json(res, 400, { error: 'Invalid URL' }); }
  const pathname = requestUrl.pathname;

  if (pathname === '/health' || pathname === '/status') {
    return json(res, 200, {
      status: 'online',
      players: engine.getOnlineCount(),
      tick: engine.getTickCount(),
      auth: 'accounts-v1',
      content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length },
    });
  }

  if (pathname.startsWith('/api/auth/') || pathname === '/api/characters') {
    handleAuthAPI(req, res, pathname);
    return;
  }

  if (pathname === '/admin') {
    if (!ADMIN_TOKEN) return json(res, 503, { error: 'Admin disabled: configure ADMIN_TOKEN on the server' });
    const supplied = getAdminToken(req, requestUrl);
    if (!tokenEqual(supplied, ADMIN_TOKEN)) {
      res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Unauthorized. Open /admin?token=YOUR_ADMIN_TOKEN once to establish the admin session.');
      return;
    }
    if (requestUrl.searchParams.has('token')) {
      const secure = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ? '; Secure' : '';
      res.writeHead(302, {
        'Location': '/admin',
        'Set-Cookie': `moria_admin=${encodeURIComponent(ADMIN_TOKEN)}; HttpOnly; SameSite=Strict; Path=/admin${secure}`,
        'Cache-Control': 'no-store',
      });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(adminPanelHTML());
    return;
  }

  if (pathname.startsWith('/admin/api/')) {
    if (!isAdminAuthorized(req, requestUrl)) return json(res, 401, { error: 'Unauthorized' });
    handleAdminAPI(req, res, pathname.replace('/admin/api', ''));
    return;
  }

  let relativePath;
  try {
    relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return json(res, 400, { error: 'Invalid path encoding' });
  }
  const filePath = path.resolve(DIST_DIR, relativePath);
  if (filePath !== DIST_DIR && !filePath.startsWith(DIST_DIR + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found. Run npm run build.');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

// ===================================================================
//  ADMIN API — Full CRUD for all content types
// ===================================================================
function handleAdminAPI(req, res, route) {
  const parts = route.split('/').filter(Boolean);
  const type = parts[0];
  const id = parts[1];

  if (req.method === 'GET') {
    if (type === 'dashboard') {
      const c = contentDB.data;
      return json(res, 200, { content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version });
    }
    if (type === 'players') {
      const players = [];
      for (const [, p] of engine.players) players.push({ id: p.name, name: p.name, level: p.level, vocation: p.vocation, mapId: p.mapId, gold: p.gold, hp: p.hp });
      return json(res, 200, { items: players, fields: ['name','level','vocation','mapId','gold','hp'] });
    }
    if (type === 'broadcast') return json(res, 200, { ok: true });
    if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });

    const fieldsMap = {
      items: ['id','name','icon','slot','attack','defense','armor','hp','mana','magic','rarity','level','value','description'],
      monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax','mapId','count','posX','posY','speed'],
      npcs: ['id','name','emoji','color','role','posX','posY','mapId','dialogue'],
      spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired','buffType','buffDuration','buffValue','scalingCoeff'],
      quests: ['id','name','npcId','description','target','count','rewardGold','rewardXp','levelRequired'],
      maps: ['id','name','biome','description','levelRequired'],
      events: ['id','name','icon','description','type','target','count','rewardGold','rewardXp','duration'],
    };
    return json(res, 200, { items: contentDB.get(type), fields: fieldsMap[type] || [] });
  }

  if (req.method === 'POST') {
    return readJsonBody(req, res, data => {
      if (type === 'broadcast') {
        const text = typeof data.text === 'string' ? data.text.trim().slice(0, 500) : '';
        if (!text) return json(res, 400, { error: 'Broadcast text is required' });
        const msg = { id: 'admin_' + Date.now(), sender: '📢 Admin', text, color: '#ff6a00', time: Date.now(), channel: 'world' };
        for (const [, entry] of wsClients) { try { entry.ws.send(JSON.stringify({ kind: 'chat', payload: msg, time: Date.now() })); } catch {} }
        return json(res, 200, { ok: true });
      }

      if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });
      if (typeof data.id !== 'string' || !data.id.trim() || data.id.length > 100) return json(res, 400, { error: 'Valid id is required' });

      const existing = contentDB.get(type).find(i => i.id === data.id);
      if (existing) contentDB.update(type, data.id, data);
      else contentDB.add(type, data);
      if (type === 'items') engine.syncContentItems(contentDB.get('items'));
      if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));
      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));
      broadcastContentUpdate();
      return json(res, 200, { ok: true });
    });
  }

  if (req.method === 'DELETE' && id) {
    if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });
    contentDB.remove(type, id);
    if (type === 'items') engine.syncContentItems(contentDB.get('items'));
    if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));
    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));
    broadcastContentUpdate();
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

// ===================================================================
//  WEBSOCKET — Client connections
// ===================================================================
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_WS_PAYLOAD });
const wsClients = new Map();

wss.on('connection', ws => {
  const clientId = `srv_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  let authenticatedPlayer = null;
  let authenticatedKey = null;
  let authenticatedAccountId = null;
  let authenticatedSessionKey = null;
  let messagesInWindow = 0;
  let messageWindowStart = Date.now();
  wsClients.set(clientId, { ws, name: null, accountId: null, sessionKey: null });

  ws.on('message', raw => {
    const now = Date.now();
    if (now - messageWindowStart >= 1000) { messageWindowStart = now; messagesInWindow = 0; }
    if (++messagesInWindow > 80) { ws.close(1008, 'Rate limit exceeded'); return; }

    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.kind !== 'string') return;

    if (msg.kind === 'auth') {
      if (authenticatedPlayer) return;
      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};
      const session = sessionManager.validate(payload.sessionToken);
      if (!session) {
        ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Invalid or expired session' } }));
        return;
      }

      const owned = accountStore.findCharacter(payload.characterName);
      if (!owned || owned.accountId !== session.accountId) {
        ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Character does not belong to this account' } }));
        return;
      }

      const name = owned.character.name;
      const vocation = owned.character.vocation;
      if (!VOCATIONS[vocation]) {
        ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Character has invalid vocation' } }));
        return;
      }

      const nameKey = name.toLocaleLowerCase('en-US');
      if (ACTIVE_NAMES.has(nameKey)) {
        ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Character is already online' } }));
        return;
      }

      const player = engine.playerConnect(clientId, name, vocation, ws);
      const saveKey = playerDB.findNameCaseInsensitive(name);
      const savedPlayer = saveKey ? playerDB.get(saveKey) : null;
      restorePlayer(player, savedPlayer, vocation);
      questEngine.restorePlayer(clientId, savedPlayer?.quests);
      authenticatedPlayer = name;
      authenticatedKey = nameKey;
      authenticatedAccountId = session.accountId;
      authenticatedSessionKey = session.key;
      ACTIVE_NAMES.set(nameKey, clientId);
      wsClients.set(clientId, { ws, name, accountId: session.accountId, sessionKey: session.key });
      ws.send(JSON.stringify({ kind: 'auth_ok', payload: { id: clientId, accountId: session.accountId, characterName: name } }));
      ws.send(JSON.stringify({ kind: 'content_sync', payload: contentDB.getAllContent(), time: Date.now() }));
      console.log(`✦ ${name} authenticated [${engine.getOnlineCount()} online]`);
      return;
    }

    if (!authenticatedPlayer || !authenticatedSessionKey) return;
    if (!sessionManager.validateKey(authenticatedSessionKey)) {
      ws.close(4001, 'Session expired');
      return;
    }

    if (msg.kind === 'intent') {
      const intent = msg.payload;
      if (!intent || typeof intent !== 'object' || Array.isArray(intent) || typeof intent.type !== 'string') return;
      engine.processIntent(clientId, intent);
      return;
    }

    if (msg.kind === 'save') {
      const p = engine.getPlayer(clientId);
      if (p) {
        playerDB.set(authenticatedPlayer, buildAuthoritativeSave(p));
        playerDB.save();
      }
      return;
    }

    if (msg.kind === 'load_request') {
      const saved = playerDB.get(authenticatedPlayer);
      ws.send(JSON.stringify({ kind: 'load_response', payload: saved, time: Date.now() }));
      return;
    }

    if (msg.kind === 'chat') {
      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};
      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : '';
      if (!text) return;
      const allowedChannels = new Set(['world', 'say', 'party', 'guild', 'trade', 'system']);
      const channel = allowedChannels.has(payload.channel) ? payload.channel : 'world';
      const color = typeof payload.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(payload.color) ? payload.color : '#fff';
      const chatMsg = { id: `chat_${Date.now()}_${clientId}`, sender: authenticatedPlayer, text, color, time: Date.now(), channel };
      const data = JSON.stringify({ kind: 'chat', payload: chatMsg });
      for (const c of wss.clients) if (c.readyState === WebSocket.OPEN) c.send(data);
      return;
    }

    if (msg.kind === 'ping') ws.send(JSON.stringify({ kind: 'pong', time: Date.now() }));
  });

  ws.on('close', () => {
    wsClients.delete(clientId);
    if (authenticatedKey && ACTIVE_NAMES.get(authenticatedKey) === clientId) ACTIVE_NAMES.delete(authenticatedKey);
    if (authenticatedPlayer) {
      const p = engine.getPlayer(clientId);
      if (p) {
        playerDB.set(authenticatedPlayer, buildAuthoritativeSave(p));
        playerDB.save();
      }
      engine.playerDisconnect(clientId);
      console.log(`✦ ${authenticatedPlayer} left [${engine.getOnlineCount()} online]`);
    }
    authenticatedAccountId = null;
    authenticatedSessionKey = null;
  });
});

// ===================================================================
//  GAME LOOP — 20fps tick + snapshot broadcast
// ===================================================================
setInterval(() => engine.tick(), engine.TICK_RATE);
setInterval(() => sessionManager.prune(), 10 * 60 * 1000);

setInterval(() => {
  const mapsDelivered = new Set();
  for (const [clientId, entry] of wsClients) {
    if (entry.ws.readyState !== WebSocket.OPEN) continue;
    if (entry.sessionKey && !sessionManager.validateKey(entry.sessionKey, { touch: false })) {
      entry.ws.close(4001, 'Session expired');
      continue;
    }
    const snapshot = engine.getSnapshot(clientId);
    if (snapshot) {
      const vocData = VOCATIONS[snapshot.player.vocation];
      if (vocData) snapshot.player.spells = vocData.spells;
      entry.ws.send(JSON.stringify({ kind: 'snapshot', payload: snapshot, time: Date.now() }));
      mapsDelivered.add(snapshot.player.mapId);
    }
  }
  for (const mapId of mapsDelivered) engine.consumeEvents(mapId);
}, 50);

function broadcastContentUpdate() {
  const data = JSON.stringify({ kind: 'content_sync', payload: contentDB.getAllContent(), time: Date.now() });
  for (const [, entry] of wsClients) if (entry.ws.readyState === WebSocket.OPEN) entry.ws.send(data);
  console.log('📡 Content update broadcast to all clients');
}

process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); process.exit(0); });
process.on('SIGINT', () => { playerDB.save(); contentDB.save(); process.exit(0); });

server.listen(PORT, () => {
  console.log('');
  console.log('  ⚔  ╔══════════════════════════════════════════╗');
  console.log("     ║    MOR'IA MMO — AUTHORITATIVE v3.2       ║");
  console.log('     ║     ACCOUNT + SESSION AUTHORITY          ║');
  console.log('  ⚔  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐  Game:       http://localhost:${PORT}`);
  console.log(`  🔧  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`  🔌  WebSocket:  ws://localhost:${PORT}/ws`);
  console.log(`  💚  Health:     http://localhost:${PORT}/health`);
  if (!ADMIN_TOKEN) console.warn('  ⚠️   ADMIN_TOKEN is not configured; /admin is disabled.');
  console.log('');
  console.log(`  📦  Content: ${contentDB.get('items').length} items, ${contentDB.get('monsters').length} monsters, ${contentDB.get('npcs').length} NPCs, ${contentDB.get('quests').length} quests`);
  console.log('');
});
