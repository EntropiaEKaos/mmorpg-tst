// ===================================================================
//  ADMIN PANEL — Web UI served by the server itself
//  Create/edit/delete ALL game content from your browser.
//  http://localhost:3000/admin
// ===================================================================

import { contentDB } from './engine/ContentDB.mjs';

export function adminPanelHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚔ Mor'ia — Server Admin Panel</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0503; color:#f4e04d; font-family:system-ui,sans-serif; min-height:100vh; }
  .header { background:linear-gradient(180deg,#3a2a1a,#1a0f05); border-bottom:2px solid #8b6914; padding:1rem 2rem; display:flex; align-items:center; justify-content:space-between; }
  .header h1 { font-family:serif; font-size:1.8rem; letter-spacing:.1em; }
  .header a { color:#9bd4ff; text-decoration:none; font-size:.9rem; }
  .container { display:flex; min-height:calc(100vh - 70px); }
  .sidebar { width:200px; background:#1a0f05; border-right:1px solid #3a2a1a; padding:1rem; }
  .sidebar button { width:100%; text-align:left; padding:.6rem 1rem; margin-bottom:.3rem; background:none; border:none; color:#f4e04d80; cursor:pointer; border-radius:4px; font-size:.9rem; transition:.2s; }
  .sidebar button:hover,.sidebar button.active { background:#3a2a1a; color:#f4e04d; }
  .main { flex:1; padding:2rem; overflow-y:auto; }
  .card { background:#1a0f05; border:1px solid #3a2a1a; border-radius:8px; padding:1.5rem; margin-bottom:1rem; }
  .card h2 { color:#f4e04d; margin-bottom:1rem; font-size:1.2rem; }
  table { width:100%; border-collapse:collapse; margin-bottom:1rem; }
  th,td { padding:.5rem; text-align:left; border-bottom:1px solid #3a2a1a; font-size:.85rem; }
  th { color:#9bd4ff; text-transform:uppercase; font-size:.7rem; letter-spacing:.1em; }
  .btn { padding:.4rem 1rem; border:none; border-radius:4px; cursor:pointer; font-size:.85rem; }
  .btn-green { background:#2ecc71; color:#fff; } .btn-red { background:#e74c3c; color:#fff; }
  .btn-blue { background:#3498db; color:#fff; } .btn-amber { background:#f4e04d; color:#000; }
  input,select,textarea { background:#0a0503; border:1px solid #3a2a1a; color:#f4e04d; padding:.4rem; border-radius:4px; font-size:.85rem; width:100%; }
  .form-row { display:flex; gap:.5rem; margin-bottom:.5rem; flex-wrap:wrap; }
  .form-row > * { flex:1; min-width:100px; }
  label { font-size:.75rem; color:#f4e04d80; display:block; margin-bottom:.2rem; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
  .stat { background:#1a0f05; border:1px solid #3a2a1a; border-radius:8px; padding:1rem; text-align:center; }
  .stat .num { font-size:2rem; font-weight:bold; color:#2ecc71; }
  .stat .lbl { font-size:.8rem; color:#f4e04d80; }
  .catalog-note { margin:0 0 1rem; padding:.8rem 1rem; border:1px solid #e6a81755; border-radius:6px; background:#e6a81712; color:#f7dda0; font-size:.8rem; line-height:1.45; }
  .readonly-label { color:#f4e04d80; font-size:.75rem; font-weight:700; letter-spacing:.06em; }
</style>
</head>
<body>
<div class="header">
  <h1>⚔ MOR'IA — SERVER ADMIN</h1>
  <div>
    <span id="online-count" style="color:#2ecc71;font-weight:bold">0 online</span>
    &nbsp; <a href="/">← Back to Game</a>
  </div>
</div>
<div class="container">
  <div class="sidebar">
    <button class="active" onclick="showTab('dashboard', this)">📊 Dashboard</button>
    <button onclick="showTab('items', this)">⚔ Items</button>
    <button onclick="showTab('monsters', this)">👹 Monsters</button>
    <button onclick="showTab('npcs', this)">🧙 NPCs</button>
    <button onclick="showTab('spells', this)">🔮 Spells</button>
    <button onclick="showTab('quests', this)">📜 Quests</button>
    <button onclick="showTab('maps', this)">🗺 Maps</button>
    <button onclick="showTab('events', this)">🌍 Events</button>
    <hr style="border-color:#3a2a1a;margin:1rem 0">
    <button onclick="showTab('players', this)">👥 Players</button>
    <button onclick="showTab('broadcast', this)">📡 Broadcast</button>
  </div>
  <div class="main" id="content">Loading...</div>
</div>
<script>
  let currentTab = 'dashboard';
  let editing = null;
  let renderedItems = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function displayValue(value) {
    if (value && typeof value === 'object') {
      try { return JSON.stringify(value).slice(0, 80); } catch { return '[object]'; }
    }
    return String(value ?? '');
  }

  async function api(method, path, body) {
    const res = await fetch('/admin/api' + path, {
      method, headers: {'Content-Type':'application/json'},
      body: body ? JSON.stringify(body) : undefined
    });
    let payload = {};
    try { payload = await res.json(); } catch {}
    if (!res.ok) throw new Error(payload.error || 'Admin API failed (' + res.status + ')');
    return payload;
  }

  function showTab(tab, button) {
    currentTab = tab; editing = null;
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    if (button instanceof HTMLElement) button.classList.add('active');
    render();
  }

  function editRow(index) {
    const item = renderedItems[index];
    if (!item || typeof item.id !== 'string') return;
    editing = item.id;
    render();
  }

  function deleteRow(index) {
    const item = renderedItems[index];
    if (!item || typeof item.id !== 'string') return;
    del(item.id);
  }

  async function render() {
    const el = document.getElementById('content');
    try {
      const data = await api('GET', '/' + currentTab);
    
    if (currentTab === 'dashboard') {
      el.innerHTML = \`
        <div class="stats">
          <div class="stat"><div class="num">\${data.content.items||0}</div><div class="lbl">Items</div></div>
          <div class="stat"><div class="num">\${data.content.monsters||0}</div><div class="lbl">Monsters</div></div>
          <div class="stat"><div class="num">\${data.content.npcs||0}</div><div class="lbl">NPCs</div></div>
          <div class="stat"><div class="num">\${data.content.quests||0}</div><div class="lbl">Quests</div></div>
        </div>
        <div class="card"><h2>🌍 Server Status</h2>
          <p>Uptime: \${Math.floor(data.uptime)}s</p>
          <p>Ticks: \${data.tick}</p>
          <p>Version: \${data.version}</p>
        </div>
        <div class="card"><h2>⚡ Quick Actions</h2>
          <button class="btn btn-red" onclick="if(confirm('Kick all players?')) api('POST','/broadcast',{text:'Server restarting...'})">📢 Broadcast Alert</button>
        </div>\`;
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const fields = Array.isArray(data.fields) ? data.fields : [];
    const readOnly = data.readOnly === true;
    renderedItems = items;
    if (readOnly) editing = null;
    
    let html = '<div class="card"><h2>' + currentTab.toUpperCase() + ' (' + items.length + ')</h2>';
    if (data.runtimeNote) {
      html += '<div class="catalog-note"><strong>' + (readOnly ? 'READ-ONLY CATALOG' : 'AUTHORITATIVE RUNTIME') + '</strong><br>' + escapeHtml(data.runtimeNote) + '</div>';
    }
    
    // Edit/Create form
    if (!readOnly && editing !== null) {
      const item = editing === 'new'
        ? (currentTab === 'maps'
          ? { biome: 'plains', levelRequired: 1, seed: Date.now() % 2147483646, spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, portals: [] }
          : currentTab === 'monsters'
            ? { mapId: 'eldoria', count: 1, speed: 1200 }
            : currentTab === 'spells'
              ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }
              : {})
        : items.find(i => i.id === editing) || {};
      html += '<h3>' + (editing === 'new' ? '➕ Create' : '✏ Edit') + '</h3>';
      html += '<div class="form-row">';
      for (const f of fields) {
        html += '<div><label>' + escapeHtml(f) + '</label>';
        if (f === 'type' || f === 'buffType' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation' || f === 'mapId') {
          html += '<input value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '" list="' + f + '_list">';
          html += '<datalist id="' + f + '_list">' + (f==='type' && currentTab==='spells'?'<option>attack<option>heal<option>aoe<option>buff':'') + (f==='buffType'?'<option>shield<option>haste<option>invisible<option>frenzy':'') + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';
        } else if (f === 'portals') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
        } else if (f === 'description' || f === 'dialogue') {
          html += '<textarea id="fld_' + f + '" rows="2">' + escapeHtml(item[f] ?? '') + '</textarea>';
        } else {
          html += '<input type="' + (typeof item[f] === 'number' ? 'number' : 'text') + '" value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '">';
        }
        html += '</div>';
      }
      html += '</div>';
      html += '<div style="margin-top:.5rem"><button class="btn btn-green" onclick="saveItem()">💾 Save</button> ';
      html += '<button class="btn" onclick="editing=null;render()">✕ Cancel</button></div>';
      html += '<hr style="border-color:#3a2a1a;margin:1rem 0">';
    }

    // Items list
    if (!readOnly) html += '<button class="btn btn-amber" onclick="editing=\\'new\\';render()">➕ New ' + currentTab.replace(/s$/,'') + '</button>';
    html += '<table><thead><tr>';
    for (const f of fields.slice(0, 6)) html += '<th>' + escapeHtml(f) + '</th>';
    html += '<th>Actions</th></tr></thead><tbody>';
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      html += '<tr>';
      for (const f of fields.slice(0, 6)) {
        html += '<td>' + escapeHtml(displayValue(item?.[f])) + '</td>';
      }
      if (readOnly) html += '<td><span class="readonly-label">Catalog only</span></td></tr>';
      else {
        html += '<td><button class="btn btn-blue" onclick="editRow(' + index + ')">Edit</button> ';
        html += '<button class="btn btn-red" onclick="deleteRow(' + index + ')">🗑</button></td></tr>';
      }
    }
    html += '</tbody></table></div>';
    el.innerHTML = html;
    } catch (error) {
      renderedItems = [];
      el.textContent = error instanceof Error ? error.message : 'Failed to load admin data';
    }
  }

  async function saveItem() {
    const data = await api('GET','/' + currentTab);
    const fields = data.fields;
    const body = {};
    for (const f of fields) {
      const el = document.getElementById('fld_' + f);
      if (el) {
        let v = el.value;
        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);
        if (f === 'portals') {
          try { body[f] = JSON.parse(v || '[]'); } catch { alert('Portals must be valid JSON.'); return; }
          continue;
        }
        if (numericFields.has(f)) v = parseFloat(v) || 0;
        body[f] = v;
      }
    }
    if (editing !== 'new') body.id = editing;
    try {
      await api('POST', '/' + currentTab, body);
      editing = null;
      render();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Save failed');
    }
  }

  async function del(id) {
    if (!confirm('Delete this?')) return;
    try {
      await api('DELETE', '/' + currentTab + '/' + encodeURIComponent(id));
      editing = null;
      render();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed');
    }
  }

  // Auto-refresh online count
  setInterval(async () => {
    try {
      const s = await api('GET','/status');
      document.getElementById('online-count').textContent = (s.players||0) + ' online';
    } catch {}
  }, 3000);

  render();
</script>
</body>
</html>`;
}
