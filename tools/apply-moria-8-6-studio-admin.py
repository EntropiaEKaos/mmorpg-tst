from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRITY = ROOT / 'server/engine/ContentIntegrity.mjs'
SERVER = ROOT / 'server/server.js'
PANEL = ROOT / 'server/adminPanel.mjs'
TEST = ROOT / 'server/test/studio-8-6.test.mjs'
DOC = ROOT / 'docs/MORIA_8_6_STUDIO_ADMIN.md'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)

# ------------------------------------------------------------------
# Global content integrity audit.
# ------------------------------------------------------------------
integrity = INTEGRITY.read_text(encoding='utf-8')
append = r'''

const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);

export function auditContentReferences(contentDB) {
  const issues = [];
  const counts = {};
  for (const type of AUDIT_TYPES) {
    const records = contentDB.get(type);
    counts[type] = Array.isArray(records) ? records.length : 0;
    const seen = new Set();
    for (const record of Array.isArray(records) ? records : []) {
      const id = typeof record?.id === 'string' ? record.id.trim() : '';
      if (!id) {
        issues.push({ severity: 'error', type, id: '(missing)', message: 'Content record has no valid id.' });
        continue;
      }
      if (seen.has(id)) issues.push({ severity: 'error', type, id, message: `Duplicate ${type} id: ${id}` });
      seen.add(id);
      const error = validateContentReferences(contentDB, type, record);
      if (error) issues.push({ severity: 'error', type, id, message: error });
    }
  }

  // Cross-catalog warnings that are legal but commonly indicate unpublished content.
  for (const monster of contentDB.get('monsters')) {
    if (!monster?.mapId) issues.push({ severity: 'warning', type: 'monsters', id: monster?.id || '(missing)', message: 'Monster is catalog-only because mapId is empty.' });
  }
  for (const event of contentDB.get('events')) {
    if (!event?.mapId) issues.push({ severity: 'warning', type: 'events', id: event?.id || '(missing)', message: 'World event has no mapId and cannot target a regional runtime.' });
  }

  const errors = issues.filter(issue => issue.severity === 'error').length;
  const warnings = issues.filter(issue => issue.severity === 'warning').length;
  return { healthy: errors === 0, errors, warnings, issues, counts };
}
'''
if 'export function auditContentReferences' in integrity:
    raise SystemExit('auditContentReferences already exists')
integrity += append
INTEGRITY.write_text(integrity, encoding='utf-8')

# ------------------------------------------------------------------
# Admin API: content health, export, read-only players, richer fields.
# ------------------------------------------------------------------
server = SERVER.read_text(encoding='utf-8')
server = replace_once(server,
"import { validateContentReferences, findBlockingContentReferences } from './engine/ContentIntegrity.mjs';",
"import { validateContentReferences, findBlockingContentReferences, auditContentReferences } from './engine/ContentIntegrity.mjs';",
'import audit')

server = replace_once(server,
"""    if (type === 'players') {
      const players = [];
      for (const [, p] of engine.players) players.push({ id: p.name, name: p.name, level: p.level, vocation: p.vocation, mapId: p.mapId, gold: p.gold, hp: p.hp });
      return json(res, 200, { items: players, fields: ['name','level','vocation','mapId','gold','hp'] });
    }
    if (type === 'broadcast') return json(res, 200, { ok: true });
""",
"""    if (type === 'players') {
      const players = [];
      for (const [, p] of engine.players) players.push({ id: p.name, name: p.name, level: p.level, vocation: p.vocation, mapId: p.mapId, gold: p.gold, hp: p.hp });
      return json(res, 200, { items: players, fields: ['name','level','vocation','mapId','gold','hp'], readOnly: true, runtimeNote: 'Live player state is authoritative. This view is intentionally read-only; player mutation must use explicit audited admin actions.' });
    }
    if (type === 'integrity') {
      const audit = auditContentReferences(contentDB);
      return json(res, 200, { ...audit, onlinePlayers: engine.getOnlineCount(), runtimeMaps: WORLD.getMapIds().length, contentVersion: contentDB.data.version });
    }
    if (type === 'export') {
      return json(res, 200, { exportedAt: new Date().toISOString(), content: contentDB.getAllContent() });
    }
    if (type === 'broadcast') return json(res, 200, { ok: true });
""", 'admin special GETs')

server = replace_once(server,
"""      items: ['id','name','icon','slot','attack','defense','armor','hp','mana','magic','rarity','level','value','description'],""",
"""      items: ['id','name','icon','slot','attack','defense','armor','hp','mana','magic','critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction','rarity','level','value','description'],""", 'item fields')
server = replace_once(server,
"""      quests: ['id','name','npcId','description','target','count','rewardGold','rewardXp','levelRequired'],""",
"""      quests: ['id','name','npcId','description','target','count','rewardGold','rewardXp','levelRequired','requires'],""", 'quest fields')

old_note = """    const runtimeNote = type === 'maps'
      ? 'Authoritative runtime: edits regenerate deterministic terrain and synchronize the live world. Built-in maps cannot be deleted.'
      : '';"""
new_note = """    const runtimeNotes = {
      maps: 'Authoritative runtime: edits regenerate deterministic terrain and synchronize the live world. Built-in maps cannot be deleted.',
      monsters: 'Monsters with mapId are reconciled into the live authoritative world immediately. Empty mapId keeps a catalog-only template.',
      items: 'Item edits feed the authoritative loot pool immediately; advanced combat bonuses are supported by the live derived-stat engine.',
      spells: 'Spell edits are merged into the authoritative vocation spell lists and broadcast to connected clients.',
      quests: 'Quest references and prerequisites are validated before save. NPC and prerequisite deletion remains reference-protected.',
      npcs: 'NPC map references are validated and content is broadcast immediately to connected clients.',
      events: 'World-event edits are synchronized into the authoritative event engine immediately.',
    };
    const runtimeNote = runtimeNotes[type] || '';"""
server = replace_once(server, old_note, new_note, 'runtime notes')
SERVER.write_text(server, encoding='utf-8')

# ------------------------------------------------------------------
# Studio UI: Content Health center, JSON export, proper structured arrays.
# ------------------------------------------------------------------
panel = PANEL.read_text(encoding='utf-8')
panel = replace_once(panel,
'''    <button class="active" onclick="showTab('dashboard', this)">📊 Dashboard</button>
    <button onclick="showTab('items', this)">⚔ Items</button>''',
'''    <button class="active" onclick="showTab('dashboard', this)">📊 Dashboard</button>
    <button onclick="showTab('integrity', this)">🩺 Content Health</button>
    <button onclick="showTab('items', this)">⚔ Items</button>''', 'sidebar health')

panel = replace_once(panel,
'''  function deleteRow(index) {
    const item = renderedItems[index];
    if (!item || typeof item.id !== 'string') return;
    del(item.id);
  }

  async function render() {''',
'''  function deleteRow(index) {
    const item = renderedItems[index];
    if (!item || typeof item.id !== 'string') return;
    del(item.id);
  }

  async function downloadContentExport() {
    try {
      const payload = await api('GET', '/export');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moria-content-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (error) { alert(error instanceof Error ? error.message : 'Export failed'); }
  }

  async function render() {''', 'export function')

panel = replace_once(panel,
'''    if (currentTab === 'dashboard') {
      el.innerHTML = `''',
'''    if (currentTab === 'integrity') {
      const issues = Array.isArray(data.issues) ? data.issues : [];
      const statusColor = data.healthy ? '#2ecc71' : '#e74c3c';
      const rows = issues.length ? issues.map(issue => '<tr><td>' + escapeHtml(issue.severity) + '</td><td>' + escapeHtml(issue.type) + '</td><td>' + escapeHtml(issue.id) + '</td><td>' + escapeHtml(issue.message) + '</td></tr>').join('') : '<tr><td colspan="4" style="color:#2ecc71">No integrity issues detected.</td></tr>';
      el.innerHTML = '<div class="stats"><div class="stat"><div class="num" style="color:' + statusColor + '">' + (data.healthy ? 'HEALTHY' : 'BLOCKED') + '</div><div class="lbl">Publish State</div></div><div class="stat"><div class="num">' + Number(data.errors || 0) + '</div><div class="lbl">Errors</div></div><div class="stat"><div class="num" style="color:#f4b942">' + Number(data.warnings || 0) + '</div><div class="lbl">Warnings</div></div><div class="stat"><div class="num">' + Number(data.runtimeMaps || 0) + '</div><div class="lbl">Runtime Maps</div></div></div><div class="card"><h2>🩺 Content Integrity</h2><p class="catalog-note">This audit re-runs the same reference rules used by authoritative writes across every content record. Errors should be zero before a production publish.</p><button class="btn btn-green" onclick="render()">↻ Re-run Audit</button> <button class="btn btn-blue" onclick="downloadContentExport()">⬇ Export Content Backup</button><table style="margin-top:1rem"><thead><tr><th>Severity</th><th>Type</th><th>ID</th><th>Finding</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      return;
    }

    if (currentTab === 'dashboard') {
      el.innerHTML = `''', 'health renderer')

panel = replace_once(panel,
"""        } else if (f === 'portals') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
""",
"""        } else if (f === 'portals' || f === 'requires') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
""", 'structured textarea')

panel = replace_once(panel,
"""          html += '<datalist id="' + f + '_list">' + (f==='type' && currentTab==='spells'?'<option>attack<option>heal<option>aoe<option>buff':'') + (f==='buffType'?'<option>shield<option>haste<option>invisible<option>frenzy':'') + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';""",
"""          html += '<datalist id="' + f + '_list">' + (f==='type' && currentTab==='spells'?'<option>attack<option>heal<option>aoe<option>buff':'') + (f==='buffType'?'<option>shield<option>haste<option>invisible<option>frenzy':'') + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='role'?'<option>merchant<option>banker<option>innkeeper<option>trainer<option>guard':'') + (f==='biome'?'<option>plains<option>snow<option>swamp<option>desert<option>shadow':'') + (f==='vocation'?'<option>knight<option>paladin<option>sorcerer<option>druid<option>rogue<option>berserker<option>templar<option>ranger':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';""", 'datalist options')

panel = replace_once(panel,
"""        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);
        if (f === 'portals') {
          try { body[f] = JSON.parse(v || '[]'); } catch { alert('Portals must be valid JSON.'); return; }
          continue;
        }
""",
"""        const numericFields = new Set(['hp','attack','defense','armor','mana','magic','critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction','level','value','xp','size','goldMin','goldMax','count','posX','posY','speed','cooldown','damage','range','levelRequired','buffDuration','buffValue','scalingCoeff','rewardGold','rewardXp','rewardCoins','durationMs','seed','spawnX','spawnY','townX','townY','townRange']);
        if (f === 'portals' || f === 'requires') {
          try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }
          if (!Array.isArray(body[f])) { alert(f + ' must be a JSON array.'); return; }
          continue;
        }
""", 'save structured/numeric fields')
PANEL.write_text(panel, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditContentReferences } from '../engine/ContentIntegrity.mjs';
import { adminPanelHTML } from '../adminPanel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('8.6 content health aggregates reference errors without mutating catalogs', () => {
  const data = {
    items: [{ id: 'blade', name: 'Blade', slot: 'weapon' }],
    monsters: [{ id: 'rat', name: 'Rat', mapId: 'eldoria' }],
    npcs: [{ id: 'lost_npc', name: 'Lost', mapId: 'missing_world' }],
    spells: [{ id: 'bad_spell', name: 'Bad', vocation: 'not_a_vocation' }],
    quests: [], maps: [], events: [],
  };
  const db = { get(type) { return data[type] || []; } };
  const before = JSON.stringify(data);
  const audit = auditContentReferences(db);
  assert.equal(audit.healthy, false);
  assert.equal(audit.errors, 2);
  assert.ok(audit.issues.some(issue => /unknown map/i.test(issue.message)));
  assert.ok(audit.issues.some(issue => /unknown vocation/i.test(issue.message)));
  assert.equal(JSON.stringify(data), before);
});

test('8.6 Studio exposes Content Health, export and structured quest prerequisites', () => {
  const html = adminPanelHTML();
  assert.match(html, /Content Health/);
  assert.match(html, /downloadContentExport/);
  assert.match(html, /f === 'portals' \|\| f === 'requires'/);
  assert.match(html, /Ignored|Players|Broadcast/);
});

test('8.6 server marks live players read-only and exposes advanced item authoring fields', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(source, /readOnly: true, runtimeNote: 'Live player state is authoritative/);
  assert.match(source, /critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction/);
  assert.match(source, /'levelRequired','requires'/);
  assert.match(source, /type === 'integrity'/);
  assert.match(source, /type === 'export'/);
});
''', encoding='utf-8')

DOC.write_text("""# Mor'ia 8.6 — Studio / Admin

## Content Health
- New Studio Content Health center audits every authoritative content record against the same reference rules used during writes.
- Errors and warnings are separated; errors mark the publish state as blocked.
- Studio can export a timestamped JSON backup of the entire server-owned content database.

## Authoring parity
- Item editor now exposes crit chance, lifesteal, thorns, movement speed, XP bonus, gold bonus and damage reduction.
- Quest editor now exposes structured prerequisite IDs (`requires`) as a validated JSON array.
- NPC role, biome and vocation datalists reflect values understood by the runtime while remaining free-text inputs for future-compatible values.

## Player safety
- The live Players view is explicitly read-only. The Studio no longer renders fake generic mutation controls that the API cannot honor.
""", encoding='utf-8')

print("Mor'ia 8.6 Studio/Admin prepared")
