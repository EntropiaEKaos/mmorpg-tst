// ===================================================================
//  ⚔  MOR'IA MMO — AUTHORITATIVE SERVER v3.1 HARDENED
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

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function json(res, status, payload) {
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

function isAdminAuthorized(req, requestUrl) {
  return Boolean(ADMIN_TOKEN) && tokenEqual(getAdminToken(req, requestUrl), ADMIN_TOKEN);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  try {
    const parsed = new URL(origin);
    const host = req.headers.host;
    if (host && parsed.host === host) {
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
    if (!body) { callback({}); return; }
    try {
      const data = JSON.parse(body);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return json(res, 400, { error: 'Invalid JSON object' });
      callback(data);
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
    }
  });
}

function normalizeName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 24) return null;
  if (!/^[\p{L}\p{N} _'-]+$/u.test(name)) return null;
  return name;
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
    mapId: p.mapId,
    x: p.x,
    y: p.y,
    lastSeen: Date.now(),
  };
}

function restorePlayer(p, saved) {
  if (!saved || typeof saved !== 'object') return;

  // A saved character owns its vocation. Re-authenticating with the same name
  // cannot be used to swap class while keeping progression/equipment.
  if (typeof saved.vocation === 'string' && VOCATIONS[saved.vocation]) p.vocation = saved.vocation;
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
      p.x = 40;
      p.y = 40;
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
    return json(res, 200, { status: 'online', players: engine.getOnlineCount(), tick: engine.getTickCount(), content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length } });
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
      monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax'],
      npcs: ['id','name','emoji','color','role','posX','posY','mapId','dialogue'],
      spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired'],
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
      broadcastContentUpdate();
      return json(res, 200, { ok: true });
    });
  }

  if (req.method === 'DELETE' && id) {
    if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });
    contentDB.remove(type, id);
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

wss.on('connection', (ws) => {
  const clientId = `srv_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  let authenticatedPlayer = null;
  let authenticatedKey = null;
  let messagesInWindow = 0;
  let messageWindowStart = Date.now();
  wsClients.set(clientId, { ws, name: null });

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
      const name = normalizeName(payload.name);
      const vocation = typeof payload.vocation === 'string' && VOCATIONS[payload.vocation] ? payload.vocation : 'knight';
      if (!name) { ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Invalid name' } })); return; }

      const nameKey = name.toLocaleLowerCase('en-US');
      if (ACTIVE_NAMES.has(nameKey)) {
        ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Character is already online' } }));
        return;
      }

      const player = engine.playerConnect(clientId, name, vocation, ws);
      restorePlayer(player, playerDB.get(name));
      authenticatedPlayer = name;
      authenticatedKey = nameKey;
      ACTIVE_NAMES.set(nameKey, clientId);
      wsClients.set(clientId, { ws, name });
      ws.send(JSON.stringify({ kind: 'auth_ok', payload: { id: clientId } }));
      ws.send(JSON.stringify({ kind: 'content_sync', payload: contentDB.getAllContent(), time: Date.now() }));
      console.log(`✦ ${name} connected [${engine.getOnlineCount()} online]`);
      return;
    }

    if (!authenticatedPlayer) return;

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
  });
});

// ===================================================================
//  GAME LOOP — 20fps tick + snapshot broadcast
// ===================================================================
setInterval(() => engine.tick(), engine.TICK_RATE);

setInterval(() => {
  const sentMaps = new Set();
  for (const [clientId, entry] of wsClients) {
    if (entry.ws.readyState !== WebSocket.OPEN) continue;
    const snapshot = engine.getSnapshot(clientId);
    if (snapshot) {
      const vocData = VOCATIONS[snapshot.player.vocation];
      if (vocData) snapshot.player.spells = vocData.spells;
      entry.ws.send(JSON.stringify({ kind: 'snapshot', payload: snapshot, time: Date.now() }));
      const mapId = snapshot.player.mapId;
      if (!sentMaps.has(mapId)) { engine.consumeEvents(mapId); sentMaps.add(mapId); }
    }
  }
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
  console.log("     ║    MOR'IA MMO — AUTHORITATIVE v3.1       ║");
  console.log('     ║     HARDENED SERVER-AUTHORITY            ║');
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
