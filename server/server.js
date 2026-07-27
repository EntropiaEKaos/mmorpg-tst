// ===================================================================
//  ⚔  MOR'IA MMO — AUTHORITATIVE SERVER v3.0
//  Everything is controlled, saved, and governed HERE.
//  Admin panel at /admin creates all content.
// ===================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { engine } from './engine/GameState.mjs';
import { playerDB } from './engine/PlayerDB.mjs';
import { contentDB } from './engine/ContentDB.mjs';
import { VOCATIONS } from './engine/Vocations.mjs';
import { adminPanelHTML } from './adminPanel.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// ===================================================================
//  HTTP SERVER — Game client + Admin Panel + Content API
// ===================================================================
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.url;

  // ===== HEALTH CHECK =====
  if (url === '/health' || url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', players: engine.getOnlineCount(), tick: engine.getTickCount(), content: { items: contentDB.get('items').length, monsters: contentDB.get('monsters').length } }));
    return;
  }

  // ===== ADMIN PANEL =====
  if (url === '/admin') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(adminPanelHTML());
    return;
  }

  // ===== ADMIN API =====
  if (url.startsWith('/admin/api/')) {
    handleAdminAPI(req, res, url.replace('/admin/api', ''));
    return;
  }

  // ===== STATIC FILES (game client) =====
  let filePath = url === '/' ? '/index.html' : url;
  filePath = path.join(DIST_DIR, filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found. Run npm run build.');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

// ===================================================================
//  ADMIN API — Full CRUD for all content types
// ===================================================================
function handleAdminAPI(req, res, route) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const data = body ? JSON.parse(body) : {};
    const parts = route.split('/').filter(Boolean); // e.g. ['items'] or ['items','123']
    const type = parts[0]; // items, monsters, npcs, etc.
    const id = parts[1];

    res.writeHead(200, { 'Content-Type': 'application/json' });

    // GET /items, /monsters, /npcs, /spells, /quests, /maps, /events, /players
    if (req.method === 'GET') {
      if (type === 'dashboard') {
        const c = contentDB.data;
        res.end(JSON.stringify({ content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version }));
        return;
      }
      if (type === 'players') {
        const players = [];
        for (const [id, p] of engine.players) {
          players.push({ id: p.name, name: p.name, level: p.level, vocation: p.vocation, mapId: p.mapId, gold: p.gold, hp: p.hp });
        }
        res.end(JSON.stringify({ items: players, fields: ['name','level','vocation','mapId','gold','hp'] }));
        return;
      }
      if (type === 'broadcast') { res.end(JSON.stringify({ ok: true })); return; }
      const fieldsMap = {
        items: ['id','name','icon','slot','attack','defense','armor','hp','mana','magic','rarity','level','value','description'],
        monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax'],
        npcs: ['id','name','emoji','color','role','posX','posY','mapId','dialogue'],
        spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired'],
        quests: ['id','name','npcId','description','target','count','rewardGold','rewardXp','levelRequired'],
        maps: ['id','name','biome','description','levelRequired'],
        events: ['id','name','icon','description','type','target','count','rewardGold','rewardXp','duration'],
      };
      const items = contentDB.get(type);
      res.end(JSON.stringify({ items, fields: fieldsMap[type] || [] }));
      return;
    }

    // POST (create or update)
    if (req.method === 'POST') {
      if (type === 'broadcast') {
        const msg = { id: 'admin_' + Date.now(), sender: '📢 Admin', text: data.text, color: '#ff6a00', time: Date.now(), channel: 'world' };
        for (const [, entry] of wsClients) { try { entry.ws.send(JSON.stringify({ kind: 'chat', payload: msg, time: Date.now() })); } catch {} }
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      const existing = contentDB.get(type).find(i => i.id === data.id);
      if (existing) contentDB.update(type, data.id, data);
      else contentDB.add(type, data);
      // Notify all clients of content update
      broadcastContentUpdate();
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // DELETE
    if (req.method === 'DELETE' && id) {
      contentDB.remove(type, id);
      broadcastContentUpdate();
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.end(JSON.stringify({ error: 'Unknown route' }));
  });
}

// ===================================================================
//  WEBSOCKET — Client connections
// ===================================================================
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Map();

wss.on('connection', (ws) => {
  const clientId = `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  let authenticatedPlayer = null;
  wsClients.set(clientId, { ws, name: null });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.kind === 'auth') {
      const { name, vocation } = msg.payload;
      if (!name || name.length < 2) { ws.send(JSON.stringify({ kind: 'auth_error', payload: { text: 'Invalid name' } })); return; }
      const player = engine.playerConnect(clientId, name, vocation || 'knight', ws);
      const saved = playerDB.get(name);
      if (saved) {
        player.level = saved.level || 1; player.xp = saved.xp || 0;
        player.gold = saved.gold || 100; player.bankGold = saved.bankGold || 0;
        player.inventory = saved.inventory || player.inventory;
        player.equipment = saved.equipment || {};
        player.maxHp = 150 + (player.level - 1) * 15; player.hp = player.maxHp;
        player.maxMana = 50 + (player.level - 1) * 10; player.mana = player.maxMana;
      }
      authenticatedPlayer = name;
      wsClients.set(clientId, { ws, name });
      ws.send(JSON.stringify({ kind: 'auth_ok', payload: { id: clientId } }));
      // Send ALL server content to client
      ws.send(JSON.stringify({ kind: 'content_sync', payload: contentDB.getAllContent(), time: Date.now() }));
      console.log(`✦ ${name} connected [${engine.getOnlineCount()} online]`);
      return;
    }

    if (!authenticatedPlayer) return;

    if (msg.kind === 'intent') {
      engine.processIntent(clientId, msg.payload);
    }

    if (msg.kind === 'save') {
      const p = engine.getPlayer(clientId);
      if (p && msg.payload) {
        playerDB.set(authenticatedPlayer, { ...msg.payload, level: p.level, xp: p.xp, gold: p.gold, inventory: p.inventory, equipment: p.equipment });
        playerDB.save();
      }
    }

    if (msg.kind === 'load_request') {
      const saved = playerDB.get(authenticatedPlayer);
      ws.send(JSON.stringify({ kind: 'load_response', payload: saved, time: Date.now() }));
    }

    if (msg.kind === 'chat') {
      const { text, color, channel } = msg.payload;
      const chatMsg = { id: `chat_${Date.now()}`, sender: authenticatedPlayer, text: String(text).slice(0, 200), color: color || '#fff', time: Date.now(), channel: channel || 'world' };
      const data = JSON.stringify({ kind: 'chat', payload: chatMsg });
      for (const c of wss.clients) { if (c.readyState === WebSocket.OPEN) c.send(data); }
    }

    if (msg.kind === 'ping') ws.send(JSON.stringify({ kind: 'pong', time: Date.now() }));
  });

  ws.on('close', () => {
    wsClients.delete(clientId);
    if (authenticatedPlayer) {
      const p = engine.getPlayer(clientId);
      if (p) {
        playerDB.set(authenticatedPlayer, { level: p.level, xp: p.xp, vocation: p.vocation, gold: p.gold, bankGold: p.bankGold, inventory: p.inventory, equipment: p.equipment, lastSeen: Date.now() });
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

// Broadcast content updates to all clients when admin changes something
function broadcastContentUpdate() {
  const data = JSON.stringify({ kind: 'content_sync', payload: contentDB.getAllContent(), time: Date.now() });
  for (const [, entry] of wsClients) {
    if (entry.ws.readyState === WebSocket.OPEN) entry.ws.send(data);
  }
  console.log('📡 Content update broadcast to all clients');
}

// Graceful shutdown
process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); process.exit(0); });
process.on('SIGINT', () => { playerDB.save(); contentDB.save(); process.exit(0); });

// ===================================================================
//  START
// ===================================================================
server.listen(PORT, () => {
  console.log('');
  console.log('  ⚔  ╔══════════════════════════════════════════╗');
  console.log('     ║    MOR\'IA MMO — AUTHORITATIVE v3.0       ║');
  console.log('     ║     ALL CONTENT SERVER-OWNED              ║');
  console.log('  ⚔  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐  Game:       http://localhost:${PORT}`);
  console.log(`  🔧  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`  🔌  WebSocket:  ws://localhost:${PORT}/ws`);
  console.log(`  💚  Health:     http://localhost:${PORT}/health`);
  console.log('');
  console.log(`  📦  Content: ${contentDB.get('items').length} items, ${contentDB.get('monsters').length} monsters, ${contentDB.get('npcs').length} NPCs, ${contentDB.get('quests').length} quests`);
  console.log('');
});
