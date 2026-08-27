from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'server/engine/ContentDB.mjs'
STUDIO = ROOT / 'server/engine/ContentStudio.mjs'
SERVER = ROOT / 'server/server.js'
PANEL = ROOT / 'server/adminPanel.mjs'
TEST = ROOT / 'server/test/content-studio-8-6.test.mjs'
DOC = ROOT / 'docs/MORIA_8_6_CONTENT_STUDIO.md'

# -----------------------------------------------------------------------------
# 8.6 Content Studio domain: schemas, semantic validation and diagnostics.
# -----------------------------------------------------------------------------
STUDIO.write_text(r'''// ===================================================================
// MOR'IA 8.6 — AUTHORITATIVE CONTENT STUDIO DOMAIN
// Declarative schemas, semantic validation and non-mutating diagnostics.
// ===================================================================

import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT } from './World.mjs';
import { validateContentReferences } from './ContentIntegrity.mjs';

const ID_RE = /^[A-Za-z0-9_-]{2,100}$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const RARITIES = Object.freeze(['common', 'uncommon', 'rare', 'epic', 'legendary']);
const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet']);
const MONSTER_TYPES = Object.freeze(['normal', 'elite', 'boss']);
const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest']);
const SPELL_TYPES = Object.freeze(['attack', 'heal', 'aoe', 'buff']);
const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);

const field = (id, label = id, kind = 'text', extra = {}) => Object.freeze({ id, label, kind, ...extra });

export const CONTENT_STUDIO_SCHEMAS = Object.freeze({
  items: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('slot', 'Slot', 'select', { optionKey: 'slots' }),
    field('attack', 'Attack', 'number'), field('defense', 'Defense', 'number'), field('armor', 'Armor', 'number'),
    field('hp', 'HP', 'number'), field('mana', 'Mana', 'number'), field('magic', 'Magic', 'number'),
    field('critChance', 'Crit %', 'number'), field('lifesteal', 'Lifesteal %', 'number'), field('thorns', 'Thorns', 'number'),
    field('moveSpeed', 'Move speed %', 'number'), field('xpBonus', 'XP bonus %', 'number'), field('goldBonus', 'Gold bonus %', 'number'),
    field('damageReduction', 'Damage reduction %', 'number'), field('rarity', 'Rarity', 'select', { optionKey: 'rarities' }),
    field('level', 'Required level', 'number'), field('value', 'Value', 'number'), field('description', 'Description', 'textarea'),
  ]),
  monsters: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('emoji', 'Emoji'), field('hp', 'HP', 'number'),
    field('attack', 'Attack', 'number'), field('defense', 'Defense', 'number'), field('xp', 'XP', 'number'),
    field('level', 'Level', 'number'), field('type', 'Type', 'select', { optionKey: 'monsterTypes' }), field('color', 'Color'),
    field('size', 'Size', 'number'), field('goldMin', 'Gold min', 'number'), field('goldMax', 'Gold max', 'number'),
    field('mapId', 'Runtime map', 'select', { optionKey: 'maps', allowEmpty: True }), field('count', 'Spawn count', 'number'),
    field('posX', 'Spawn X', 'number'), field('posY', 'Spawn Y', 'number'), field('speed', 'Move delay', 'number'),
  ]),
  npcs: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('emoji', 'Emoji'), field('color', 'Color'),
    field('role', 'Role', 'select', { optionKey: 'npcRoles' }), field('posX', 'X', 'number'), field('posY', 'Y', 'number'),
    field('mapId', 'Map', 'select', { optionKey: 'maps' }), field('dialogue', 'Dialogue', 'textarea'),
  ]),
  spells: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('mana', 'Mana', 'number'),
    field('cooldown', 'Cooldown ms', 'number'), field('damage', 'Base power', 'number'), field('range', 'Range', 'number'),
    field('color', 'Color'), field('type', 'Type', 'select', { optionKey: 'spellTypes' }),
    field('vocation', 'Vocation', 'select', { optionKey: 'vocations' }), field('levelRequired', 'Required level', 'number'),
    field('buffType', 'Buff type', 'select', { optionKey: 'buffTypes', allowEmpty: True }),
    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('scalingCoeff', 'Scaling', 'number'),
  ]),
  quests: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('npcId', 'Quest NPC', 'select', { optionKey: 'npcs', allowEmpty: True }),
    field('description', 'Description', 'textarea'), field('target', 'Target'), field('count', 'Count', 'number'),
    field('rewardGold', 'Reward gold', 'number'), field('rewardXp', 'Reward XP', 'number'), field('levelRequired', 'Required level', 'number'),
    field('requires', 'Prerequisite quest IDs', 'json'),
  ]),
  maps: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('biome', 'Biome', 'select', { optionKey: 'biomes' }), field('description', 'Description', 'textarea'),
    field('levelRequired', 'Required level', 'number'), field('seed', 'Seed', 'number'), field('spawnX', 'Spawn X', 'number'), field('spawnY', 'Spawn Y', 'number'),
    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'), field('portals', 'Portals', 'json'),
  ]),
  events: Object.freeze([
    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),
    field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),
    field('rewardXp', 'Reward XP', 'number'), field('rewardCoins', 'Reward coins', 'number'),
    field('mapId', 'Map', 'select', { optionKey: 'maps', allowEmpty: True }), field('durationMs', 'Duration ms', 'number'),
  ]),
});

function numberIn(record, key, min, max, { required = false, integer = False } = {}) {
  const raw = record?.[key];
  if ((raw === undefined || raw === null || raw === '') && !required) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return `${key} must be a number`;
  if (integer && !Number.isInteger(value)) return `${key} must be an integer`;
  if (value < min || value > max) return `${key} must be from ${min} to ${max}`;
  return null;
}

function requiredText(record, key, max = 100) {
  const value = typeof record?.[key] === 'string' ? record[key].trim() : '';
  if (!value) return `${key} is required`;
  if (value.length > max) return `${key} cannot exceed ${max} characters`;
  return null;
}

function optionalColor(record) {
  if (record?.color === undefined || record?.color === null || record.color === '') return null;
  return COLOR_RE.test(String(record.color)) ? null : 'color must be a CSS hex color';
}

function playableCoord(record, key) {
  return numberIn(record, key, 1, MAP_WIDTH - 2, { integer: true });
}

export function validateStudioRecord(type, record) {
  if (!CONTENT_STUDIO_SCHEMAS[type]) return `Unsupported content type: ${type}`;
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Content record must be an object';
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!ID_RE.test(id)) return 'id must be 2-100 letters, numbers, dash or underscore';
  const nameError = requiredText(record, 'name', 100);
  if (nameError) return nameError;

  if (type === 'items') {
    if (!ITEM_SLOTS.includes(String(record.slot || ''))) return 'slot is not supported';
    if (!RARITIES.includes(String(record.rarity || ''))) return 'rarity is not supported';
    for (const key of ['attack','defense','armor','hp','mana','magic','thorns','value']) {
      const error = numberIn(record, key, 0, 1_000_000); if (error) return error;
    }
    for (const key of ['critChance','lifesteal','moveSpeed','xpBonus','goldBonus','damageReduction']) {
      const error = numberIn(record, key, 0, 100); if (error) return error;
    }
    return numberIn(record, 'level', 1, 100_000, { required: true, integer: true });
  }

  if (type === 'monsters') {
    if (!MONSTER_TYPES.includes(String(record.type || 'normal'))) return 'monster type is not supported';
    for (const [key, min, max, required, integer] of [
      ['hp',1,10_000_000,true,true], ['attack',0,1_000_000,true,true], ['defense',0,1_000_000,true,true],
      ['xp',0,100_000_000,true,true], ['level',1,100_000,true,true], ['size',0.25,4,false,false],
      ['goldMin',0,100_000_000,false,true], ['goldMax',0,100_000_000,false,true], ['count',1,25,false,true], ['speed',50,600_000,false,true],
    ]) { const error = numberIn(record, key, min, max, { required, integer }); if (error) return error; }
    if (Number(record.goldMax || 0) < Number(record.goldMin || 0)) return 'goldMax cannot be lower than goldMin';
    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
    return optionalColor(record);
  }

  if (type === 'npcs') {
    for (const key of ['posX','posY']) { const error = playableCoord(record, key); if (error) return error; }
    const role = String(record.role || '');
    if (role && !NPC_ROLES.includes(role)) return 'NPC role is not supported';
    return optionalColor(record);
  }

  if (type === 'spells') {
    const spellType = String(record.type || '');
    if (!SPELL_TYPES.includes(spellType)) return 'spell type is not supported';
    if (!VOCATIONS[String(record.vocation || '').toLowerCase()]) return 'vocation is not supported';
    for (const [key, min, max, required, integer] of [
      ['mana',0,100_000,true,true], ['cooldown',250,600_000,true,true], ['damage',0,10_000_000,true,true],
      ['range',0,20,true,false], ['levelRequired',1,100_000,true,true], ['buffDuration',1000,600_000,false,true],
      ['buffValue',0,100,false,false], ['scalingCoeff',0,20,false,false],
    ]) { const error = numberIn(record, key, min, max, { required, integer }); if (error) return error; }
    if (spellType === 'buff' && !BUFF_TYPES.includes(String(record.buffType || ''))) return 'buff spells require a supported buffType';
    return optionalColor(record);
  }

  if (type === 'quests') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['levelRequired',1,100_000]]) {
      const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error;
    }
    if (record.requires !== undefined && !Array.isArray(record.requires)) return 'requires must be a JSON array of quest IDs';
    return null;
  }

  if (type === 'maps') {
    const biome = String(record.biome || '').toLowerCase();
    if (!BIOMES.has(biome)) return 'biome is not supported';
    for (const key of ['spawnX','spawnY','townX','townY']) { const error = playableCoord(record, key); if (error) return error; }
    let error = numberIn(record, 'levelRequired', 1, 100_000, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'seed', 1, 2_147_483_646, { required: true, integer: true }); if (error) return error;
    error = numberIn(record, 'townRange', 0, 20, { required: true, integer: true }); if (error) return error;
    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';
    return null;
  }

  if (type === 'events') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [
      ['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['rewardCoins',0,1_000_000], ['durationMs',1_000,604_800_000],
    ]) { const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error; }
  }

  return null;
}

function mapOptions(contentDB) {
  const ids = new Set(Object.keys(MAP_CONFIG));
  for (const map of contentDB.get('maps')) if (typeof map?.id === 'string' && map.id.trim()) ids.add(map.id.trim());
  return [...ids].sort();
}

export function getContentStudioSchema(type, contentDB) {
  const schema = CONTENT_STUDIO_SCHEMAS[type] || [];
  const options = {
    rarities: [...RARITIES], slots: [...ITEM_SLOTS], monsterTypes: [...MONSTER_TYPES], npcRoles: [...NPC_ROLES],
    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], vocations: Object.keys(VOCATIONS).sort(),
    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB),
    npcs: contentDB.get('npcs').map(entry => entry.id).filter(Boolean).sort(),
    quests: contentDB.get('quests').map(entry => entry.id).filter(Boolean).sort(),
  };
  const runtimeNotes = {
    items: 'Published item stats feed the authoritative loot pool and procedural 8.4 itemization.',
    monsters: 'Monsters with mapId become authoritative live overlays after publish.',
    npcs: 'NPCs are synchronized to online clients and gate linked quests/services by server proximity.',
    spells: 'Published spells merge into vocation spell slots and execute server-side.',
    quests: 'Quest NPCs, prerequisites and kill targets are checked before publish.',
    maps: 'Map edits rebuild deterministic terrain and live portal travel. Built-in maps cannot be deleted.',
    events: 'World events rotate and reward participants from authoritative server state.',
  };
  return { schema, fields: schema.map(entry => entry.id), options, runtimeNote: runtimeNotes[type] || '' };
}

export function collectContentDiagnostics(contentDB) {
  const issues = [];
  const push = (severity, type, id, message) => { if (issues.length < 250) issues.push({ severity, type, id, message }); };
  for (const type of Object.keys(CONTENT_STUDIO_SCHEMAS)) {
    const records = contentDB.get(type);
    const seen = new Set();
    for (const record of records) {
      const id = typeof record?.id === 'string' ? record.id : '(missing)';
      if (seen.has(id)) push('error', type, id, 'Duplicate content id');
      seen.add(id);
      const semantic = validateStudioRecord(type, record);
      if (semantic) push('error', type, id, semantic);
      const reference = validateContentReferences(contentDB, type, record);
      if (reference) push('error', type, id, reference);
    }
  }
  const byType = {};
  for (const issue of issues) byType[issue.type] = (byType[issue.type] || 0) + 1;
  return { ok: issues.every(issue => issue.severity !== 'error'), total: issues.length, byType, issues };
}
'''.replace('True', 'true').replace('False', 'false'), encoding='utf-8')

# -----------------------------------------------------------------------------
# ContentDB: durability rollback + detached public content snapshot.
# -----------------------------------------------------------------------------
db = DB.read_text(encoding='utf-8')
db = db.replace("fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2));", "fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), { mode: 0o600 });", 1)

old_add = r'''    const record = { ...item, id };
    this.data[key].push(record);
    this.save();
    return record;
'''
new_add = r'''    const record = { ...item, id };
    this.data[key].push(record);
    if (!this.save()) {
      this.data[key].pop();
      return null;
    }
    return record;
'''
if old_add not in db: raise SystemExit('ContentDB add block missing')
db = db.replace(old_add, new_add, 1)

old_update = r'''    if (idx < 0) return false;
    arr[idx] = { ...arr[idx], ...updates, id: canonicalId };
    this.save();
    return true;
'''
new_update = r'''    if (idx < 0) return false;
    const previous = arr[idx];
    arr[idx] = { ...arr[idx], ...updates, id: canonicalId };
    if (!this.save()) {
      arr[idx] = previous;
      return false;
    }
    return true;
'''
if old_update not in db: raise SystemExit('ContentDB update block missing')
db = db.replace(old_update, new_update, 1)

old_remove = r'''    const before = this.data[key].length;
    this.data[key] = this.data[key].filter(i => i.id !== canonicalId);
    if (this.data[key].length === before) return false;
    this.save();
    return true;
'''
new_remove = r'''    const previous = this.data[key];
    const next = previous.filter(i => i.id !== canonicalId);
    if (next.length === previous.length) return false;
    this.data[key] = next;
    if (!this.save()) {
      this.data[key] = previous;
      return false;
    }
    return true;
'''
if old_remove not in db: raise SystemExit('ContentDB remove block missing')
db = db.replace(old_remove, new_remove, 1)

db = db.replace("  getAllContent() {\n    return this.data;\n  }", "  getAllContent() {\n    return JSON.parse(JSON.stringify(this.data));\n  }", 1)
DB.write_text(db, encoding='utf-8')

# -----------------------------------------------------------------------------
# Server Admin API: schema, diagnostics, export, preflight, central runtime sync.
# -----------------------------------------------------------------------------
server = SERVER.read_text(encoding='utf-8')
import_anchor = "import { validateContentReferences, findBlockingContentReferences } from './engine/ContentIntegrity.mjs';"
if import_anchor not in server: raise SystemExit('server ContentIntegrity import missing')
server = server.replace(import_anchor, import_anchor + "\nimport { getContentStudioSchema, validateStudioRecord, collectContentDiagnostics } from './engine/ContentStudio.mjs';", 1)

admin_anchor = r'''// ===================================================================
//  ADMIN API — Full CRUD for all content types
// ===================================================================
function handleAdminAPI(req, res, route) {
'''
admin_replacement = r'''// ===================================================================
//  ADMIN API — Authoritative Content Studio
// ===================================================================
function syncContentRuntime(type) {
  if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }
  else if (type === 'items') engine.syncContentItems(contentDB.get('items'));
  else if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));
  else if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));
  else if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));
}

function handleAdminAPI(req, res, route) {
'''
if admin_anchor not in server: raise SystemExit('admin API anchor missing')
server = server.replace(admin_anchor, admin_replacement, 1)

parts_anchor = r'''  const type = parts[0];
  const id = parts[1];

  if (req.method === 'GET') {
'''
parts_replacement = r'''  const type = parts[0];
  const id = parts[1];

  if (req.method === 'GET' && type === 'diagnostics') return json(res, 200, collectContentDiagnostics(contentDB));
  if (req.method === 'GET' && type === 'export') {
    return json(res, 200, { generatedAt: new Date().toISOString(), diagnostics: collectContentDiagnostics(contentDB), content: contentDB.getAllContent() });
  }
  if (req.method === 'POST' && type === 'validate' && id) {
    if (!ALLOWED_ADMIN_TYPES.has(id)) return json(res, 404, { error: 'Unknown content type' });
    return readJsonBody(req, res, data => {
      const canonicalId = typeof data.id === 'string' ? data.id.trim() : '';
      const existing = canonicalId ? contentDB.get(id).find(item => item.id === canonicalId) : null;
      const candidate = existing ? { ...existing, ...data, id: canonicalId } : { ...data, id: canonicalId };
      const semanticError = validateStudioRecord(id, candidate);
      if (semanticError) return json(res, 409, { ok: false, error: semanticError });
      const referenceError = validateContentReferences(contentDB, id, candidate);
      if (referenceError) return json(res, 409, { ok: false, error: referenceError });
      return json(res, 200, { ok: true, candidate });
    });
  }

  if (req.method === 'GET') {
'''
if parts_anchor not in server: raise SystemExit('admin parts anchor missing')
server = server.replace(parts_anchor, parts_replacement, 1)

# dashboard adds diagnostics
old_dash = "return json(res, 200, { content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version });"
new_dash = "return json(res, 200, { content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version, diagnostics: collectContentDiagnostics(contentDB) });"
if old_dash not in server: raise SystemExit('dashboard response missing')
server = server.replace(old_dash, new_dash, 1)

fields_start = server.find("    const fieldsMap = {")
fields_end_marker = "    const items = type === 'maps' ? WORLD.getDefinitions() : contentDB.get(type);\n    return json(res, 200, { items, fields: fieldsMap[type] || [], readOnly, runtimeNote });"
fields_end = server.find(fields_end_marker, fields_start)
if fields_start < 0 or fields_end < 0: raise SystemExit('fieldsMap block missing')
fields_end += len(fields_end_marker)
new_get = r'''    const readOnly = READ_ONLY_ADMIN_TYPES.has(type);
    const studio = getContentStudioSchema(type, contentDB);
    const items = type === 'maps' ? WORLD.getDefinitions() : contentDB.get(type);
    return json(res, 200, { items, fields: studio.fields, schema: studio.schema, options: studio.options, readOnly, runtimeNote: studio.runtimeNote });'''
server = server[:fields_start] + new_get + server[fields_end:]

post_validate_anchor = r'''      const existing = contentDB.get(type).find(i => i.id === data.id);
      const candidate = existing ? { ...existing, ...data, id: data.id } : { ...data, id: data.id };
      const referenceError = validateContentReferences(contentDB, type, candidate);
'''
post_validate_replacement = r'''      data.id = data.id.trim();
      const existing = contentDB.get(type).find(i => i.id === data.id);
      const candidate = existing ? { ...existing, ...data, id: data.id } : { ...data, id: data.id };
      const semanticError = validateStudioRecord(type, candidate);
      if (semanticError) return json(res, 409, { error: semanticError });
      const referenceError = validateContentReferences(contentDB, type, candidate);
'''
if post_validate_anchor not in server: raise SystemExit('POST validation anchor missing')
server = server.replace(post_validate_anchor, post_validate_replacement, 1)

sync_lines = "      if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }\n      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));"
if server.count(sync_lines) != 2: raise SystemExit(f'expected 2 runtime sync blocks, got {server.count(sync_lines)}')
server = server.replace(sync_lines, "      syncContentRuntime(type);", 2)
SERVER.write_text(server, encoding='utf-8')

# -----------------------------------------------------------------------------
# Admin panel -> Content Studio UX while retaining hardened inline-index patterns.
# -----------------------------------------------------------------------------
panel = PANEL.read_text(encoding='utf-8')
panel = panel.replace("<title>⚔ Mor'ia — Server Admin Panel</title>", "<title>⚒ Mor'ia — Content Studio</title>", 1)
panel = panel.replace("⚔ MOR'IA — SERVER ADMIN", "⚒ MOR'IA — CONTENT STUDIO", 1)
panel = panel.replace("    <button class=\"active\" onclick=\"showTab('dashboard', this)\">📊 Dashboard</button>", "    <button class=\"active\" onclick=\"showTab('dashboard', this)\">📊 Dashboard</button>\n    <button onclick=\"showTab('diagnostics', this)\">🩺 Diagnostics</button>", 1)

style_anchor = "  .readonly-label { color:#f4e04d80; font-size:.75rem; font-weight:700; letter-spacing:.06em; }"
panel = panel.replace(style_anchor, style_anchor + "\n  .toolbar { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem; }\n  .toolbar input { max-width:320px; }\n  .notice { margin:.6rem 0; padding:.65rem .8rem; border-radius:6px; font-size:.8rem; }\n  .notice-ok { border:1px solid #2ecc7166; background:#2ecc7112; color:#a8f0c5; }\n  .notice-error { border:1px solid #e74c3c66; background:#e74c3c12; color:#ffc1b8; }\n  .diag-error { color:#ff8b80; } .diag-warning { color:#ffd87b; }", 1)

state_anchor = "  let currentTab = 'dashboard';\n  let editing = null;\n  let renderedItems = [];"
panel = panel.replace(state_anchor, state_anchor + "\n  let currentSchema = [];\n  let currentOptions = {};\n  let searchTerm = '';\n  let saving = false;", 1)

# Add helper functions after displayValue.
display_anchor = r'''  function displayValue(value) {
    if (value && typeof value === 'object') {
      try { return JSON.stringify(value).slice(0, 80); } catch { return '[object]'; }
    }
    return String(value ?? '');
  }
'''
helper_insert = display_anchor + r'''

  function optionList(key) {
    const values = Array.isArray(currentOptions?.[key]) ? currentOptions[key] : [];
    return values.map(value => '<option value="' + escapeHtml(value) + '"></option>').join('');
  }

  function cloneRow(index) {
    const item = renderedItems[index];
    if (!item || typeof item !== 'object') return;
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = String(copy.id || 'content') + '_copy';
    copy.name = String(copy.name || copy.id || 'Copy') + ' Copy';
    editing = 'new';
    window.__moriaDraft = copy;
    render();
  }

  function setNotice(message, ok = true) {
    const host = document.getElementById('studio-notice');
    if (!host) return;
    host.className = 'notice ' + (ok ? 'notice-ok' : 'notice-error');
    host.textContent = message;
    host.hidden = !message;
  }

  async function exportContent() {
    try {
      const payload = await api('GET', '/export');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'moria-content-export.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (error) { alert(error instanceof Error ? error.message : 'Export failed'); }
  }
'''
if display_anchor not in panel: raise SystemExit('displayValue helper missing')
panel = panel.replace(display_anchor, helper_insert, 1)

# showTab clears draft and search only when changing sections.
panel = panel.replace("    currentTab = tab; editing = null;", "    currentTab = tab; editing = null; window.__moriaDraft = null; searchTerm = '';", 1)

# dashboard branch enhancements and diagnostics branch.
dash_end = "        </div>\`;\n      return;\n    }\n\n    const items = Array.isArray(data.items) ? data.items : [];"
dash_new = """        <div class=\"card\"><h2>🩺 Content Health</h2><p>Issues: <strong class=\"${data.diagnostics?.total ? 'diag-error' : ''}\">${data.diagnostics?.total || 0}</strong></p><div style=\"margin-top:.7rem\"><button class=\"btn btn-blue\" onclick=\"showTab('diagnostics', document.querySelector('[onclick*=diagnostics]'))\">Open diagnostics</button> <button class=\"btn btn-green\" onclick=\"exportContent()\">⬇ Export Content</button></div></div>\`;
      return;
    }

    if (currentTab === 'diagnostics') {
      const issues = Array.isArray(data.issues) ? data.issues : [];
      el.innerHTML = '<div class=\"card\"><h2>🩺 CONTENT DIAGNOSTICS (' + issues.length + ')</h2>' +
        (issues.length ? '<table><thead><tr><th>Severity</th><th>Type</th><th>ID</th><th>Problem</th></tr></thead><tbody>' + issues.map(issue => '<tr><td class=\"diag-' + escapeHtml(issue.severity) + '\">' + escapeHtml(issue.severity) + '</td><td>' + escapeHtml(issue.type) + '</td><td>' + escapeHtml(issue.id) + '</td><td>' + escapeHtml(issue.message) + '</td></tr>').join('') + '</tbody></table>' : '<div class=\"notice notice-ok\">All published content passed semantic and reference diagnostics.</div>') + '</div>';
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];"""
if dash_end not in panel: raise SystemExit('dashboard ending marker missing')
panel = panel.replace(dash_end, dash_new, 1)

# capture schema/options and filtered item list
items_anchor = "    const fields = Array.isArray(data.fields) ? data.fields : [];\n    const readOnly = data.readOnly === true;\n    renderedItems = items;"
items_replacement = "    const fields = Array.isArray(data.fields) ? data.fields : [];\n    currentSchema = Array.isArray(data.schema) ? data.schema : fields.map(id => ({ id, label: id, kind: 'text' }));\n    currentOptions = data.options && typeof data.options === 'object' ? data.options : {};\n    const readOnly = data.readOnly === true;\n    const filteredItems = searchTerm ? items.filter(item => JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())) : items;\n    renderedItems = filteredItems;"
if items_anchor not in panel: raise SystemExit('items state anchor missing')
panel = panel.replace(items_anchor, items_replacement, 1)

# new draft handling
item_create_old = """      const item = editing === 'new'
        ? (currentTab === 'maps'
          ? { biome: 'plains', levelRequired: 1, seed: Date.now() % 2147483646, spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, portals: [] }
          : currentTab === 'monsters'
            ? { mapId: 'eldoria', count: 1, speed: 1200 }
            : currentTab === 'spells'
              ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }
              : {})
        : items.find(i => i.id === editing) || {};
"""
item_create_new = """      const defaults = currentTab === 'maps'
        ? { biome: 'plains', levelRequired: 1, seed: Date.now() % 2147483646, spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, portals: [] }
        : currentTab === 'monsters' ? { type: 'normal', mapId: '', count: 1, speed: 1200, hp: 20, attack: 4, defense: 1, xp: 10, level: 1 }
        : currentTab === 'spells' ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }
        : currentTab === 'items' ? { slot: 'weapon', rarity: 'common', level: 1, value: 0 }
        : currentTab === 'quests' ? { count: 1, rewardGold: 0, rewardXp: 0, levelRequired: 1, requires: [] }
        : currentTab === 'events' ? { count: 1, rewardGold: 0, rewardXp: 0, rewardCoins: 0, durationMs: 900000 }
        : {};
      const item = editing === 'new' ? (window.__moriaDraft || defaults) : items.find(i => i.id === editing) || {};
"""
if item_create_old not in panel: raise SystemExit('new item defaults block missing')
panel = panel.replace(item_create_old, item_create_new, 1)

# schema aware form loop. Replace exact current loop body area.
loop_start = panel.find("      for (const f of fields) {")
loop_end_marker = "        html += '</div>';\n      }"
loop_end = panel.find(loop_end_marker, loop_start)
if loop_start < 0 or loop_end < 0: raise SystemExit('form loop missing')
loop_end += len(loop_end_marker)
new_loop = r'''      for (const descriptor of currentSchema) {
        const f = descriptor.id;
        html += '<div><label>' + escapeHtml(descriptor.label || f) + '</label>';
        if (descriptor.kind === 'select') {
          const listId = 'opt_' + f;
          html += '<input value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '" list="' + listId + '">';
          html += '<datalist id="' + listId + '">' + optionList(descriptor.optionKey) + '</datalist>';
        } else if (descriptor.kind === 'json') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
        } else if (descriptor.kind === 'textarea') {
          html += '<textarea id="fld_' + f + '" rows="3">' + escapeHtml(item[f] ?? '') + '</textarea>';
        } else {
          html += '<input type="' + (descriptor.kind === 'number' ? 'number' : 'text') + '" value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '">';
        }
        html += '</div>';
      }'''
panel = panel[:loop_start] + new_loop + panel[loop_end:]

# toolbar + filtered items count, preserve exact old new-button prefix for existing tests.
new_button_anchor = "    // Items list\n    if (!readOnly) html += '<button class=\"btn btn-amber\" onclick=\"editing=\\\\\'new\\\\\';render()\">➕ New ' + currentTab.replace(/s$/,'') + '</button>';"
if new_button_anchor not in panel:
    # Current source includes escaped single quotes differently; find simpler exact segment.
    marker = "    // Items list\n    if (!readOnly) html += '<button class=\"btn btn-amber\""
    if marker not in panel: raise SystemExit('new item button marker missing')
else:
    marker = new_button_anchor
# Insert toolbar after // Items list without altering tested new-button line.
panel = panel.replace("    // Items list\n", "    // Items list\n    html += '<div class=\"toolbar\"><input id=\"studio-search\" value=\"' + escapeHtml(searchTerm) + '\" placeholder=\"Search this catalog...\" oninput=\"searchTerm=this.value;render()\"><button class=\"btn btn-green\" onclick=\"exportContent()\">⬇ Export</button></div><div id=\"studio-notice\" hidden></div>';\n", 1)

# table loop uses filteredItems through renderedItems; current loop references items.
panel = panel.replace("    for (let index = 0; index < items.length; index++) {\n      const item = items[index];", "    for (let index = 0; index < renderedItems.length; index++) {\n      const item = renderedItems[index];", 1)
panel = panel.replace("        html += '<td><button class=\"btn btn-blue\" onclick=\"editRow(' + index + ')\">Edit</button> ';\n        html += '<button class=\"btn btn-red\" onclick=\"deleteRow(' + index + ')\">🗑</button></td></tr>';", "        html += '<td><button class=\"btn btn-blue\" onclick=\"editRow(' + index + ')\">Edit</button> ';\n        html += '<button class=\"btn btn-amber\" onclick=\"cloneRow(' + index + ')\">Clone</button> ';\n        html += '<button class=\"btn btn-red\" onclick=\"deleteRow(' + index + ')\">🗑</button></td></tr>';", 1)

# saveItem: use schema kinds, JSON arrays, preflight, saving guard.
save_start = panel.find("  async function saveItem() {")
save_end = panel.find("\n  async function del(id) {", save_start)
if save_start < 0 or save_end < 0: raise SystemExit('saveItem function missing')
new_save = r'''  async function saveItem() {
    if (saving) return;
    const data = await api('GET','/' + currentTab);
    currentSchema = Array.isArray(data.schema) ? data.schema : [];
    const body = {};
    for (const descriptor of currentSchema) {
      const f = descriptor.id;
      const el = document.getElementById('fld_' + f);
      if (!el) continue;
      let v = el.value;
      if (descriptor.kind === 'json') {
        try { body[f] = JSON.parse(v || '[]'); } catch { alert(f + ' must be valid JSON.'); return; }
      } else if (descriptor.kind === 'number') {
        body[f] = v === '' ? undefined : Number(v);
      } else body[f] = v;
    }
    if (editing !== 'new') body.id = editing;
    saving = true;
    try {
      await api('POST', '/validate/' + currentTab, body);
      await api('POST', '/' + currentTab, body);
      editing = null; window.__moriaDraft = null;
      await render();
      setNotice('Published successfully. Runtime sync completed.', true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed';
      alert(message);
      setNotice(message, false);
    } finally { saving = false; }
  }
'''
panel = panel[:save_start] + new_save + panel[save_end:]
PANEL.write_text(panel, encoding='utf-8')

# -----------------------------------------------------------------------------
# Regression tests for durability, Studio domain and UI preflight.
# -----------------------------------------------------------------------------
TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord, collectContentDiagnostics } from '../engine/ContentStudio.mjs';
import { adminPanelHTML } from '../adminPanel.mjs';

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-studio-86-'));
  const file = path.join(dir, 'content.json');
  fs.writeFileSync(file, JSON.stringify({ version: 1, items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [], worldEvents: [], shops: [], lootTables: [] }));
  return { dir, db: new ContentDB(file) };
}

test('8.6 ContentDB rolls back add update and remove when durable save fails', () => {
  const { dir, db } = tempDb();
  try {
    db.save = () => false;
    assert.equal(db.add('items', { id: 'safe_sword', name: 'Safe Sword' }), null);
    assert.equal(db.get('items').length, 0);

    db.save = ContentDB.prototype.save.bind(db);
    assert.ok(db.add('items', { id: 'safe_sword', name: 'Safe Sword' }));
    db.save = () => false;
    assert.equal(db.update('items', 'safe_sword', { name: 'Unsaved Rename' }), false);
    assert.equal(db.get('items')[0].name, 'Safe Sword');
    assert.equal(db.remove('items', 'safe_sword'), false);
    assert.equal(db.get('items')[0].id, 'safe_sword');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.6 getAllContent returns a detached snapshot', () => {
  const { dir, db } = tempDb();
  try {
    db.add('items', { id: 'detached_item', name: 'Original' });
    const snapshot = db.getAllContent();
    snapshot.items[0].name = 'Mutated outside DB';
    assert.equal(db.get('items')[0].name, 'Original');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.6 Studio schema exposes advanced item stats quest prerequisites and dynamic custom maps', () => {
  const { dir, db } = tempDb();
  try {
    db.add('maps', { id: 'custom_realm', name: 'Custom Realm', biome: 'plains', levelRequired: 1, seed: 123, spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, portals: [] });
    const items = getContentStudioSchema('items', db);
    const quests = getContentStudioSchema('quests', db);
    assert.ok(items.fields.includes('critChance'));
    assert.ok(items.fields.includes('lifesteal'));
    assert.ok(items.fields.includes('damageReduction'));
    assert.ok(quests.fields.includes('requires'));
    assert.ok(quests.options.maps.includes('custom_realm'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.6 semantic validator rejects malformed content before publication', () => {
  assert.match(validateStudioRecord('items', { id: 'bad id', name: 'Bad', slot: 'weapon', rarity: 'common', level: 1 }), /id/i);
  assert.match(validateStudioRecord('items', { id: 'item_ok', name: 'Bad', slot: 'laser', rarity: 'common', level: 1 }), /slot/i);
  assert.match(validateStudioRecord('monsters', { id: 'mob_ok', name: 'Mob', hp: 0, attack: 1, defense: 1, xp: 1, level: 1, type: 'normal' }), /hp/i);
  assert.match(validateStudioRecord('spells', { id: 'spell_ok', name: 'Spell', mana: 1, cooldown: 100, damage: 1, range: 1, type: 'attack', vocation: 'knight', levelRequired: 1 }), /cooldown/i);
  assert.match(validateStudioRecord('quests', { id: 'quest_ok', name: 'Quest', target: '', count: 1, rewardGold: 0, rewardXp: 0, levelRequired: 1, requires: [] }), /target/i);
});

test('8.6 diagnostics find broken references and invalid records without mutating content', () => {
  const { dir, db } = tempDb();
  try {
    db.data.quests.push({ id: 'broken_quest', name: 'Broken Quest', npcId: 'missing_npc', target: 'rat', count: 1, rewardGold: 0, rewardXp: 0, levelRequired: 1, requires: [] });
    const before = JSON.stringify(db.data);
    const diagnostics = collectContentDiagnostics(db);
    assert.equal(diagnostics.ok, false);
    assert.ok(diagnostics.issues.some(issue => /unknown NPC/i.test(issue.message)));
    assert.equal(JSON.stringify(db.data), before);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.6 admin panel exposes preflight diagnostics clone search export and safe indexed handlers', () => {
  const html = adminPanelHTML();
  assert.match(html, /CONTENT STUDIO/);
  assert.match(html, /\/validate\//);
  assert.match(html, /diagnostics/);
  assert.match(html, /function cloneRow\(index\)/);
  assert.match(html, /function exportContent\(\)/);
  assert.match(html, /studio-search/);
  assert.match(html, /optionList\(descriptor\.optionKey\)/);
  assert.doesNotMatch(html, /onclick="cloneRow\([^' + index]/);
});

test('8.6 server API is wired to Studio preflight diagnostics and centralized runtime sync', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.js'), 'utf8');
  assert.match(source, /getContentStudioSchema/);
  assert.match(source, /collectContentDiagnostics/);
  assert.match(source, /type === 'validate'/);
  assert.match(source, /function syncContentRuntime\(type\)/);
  assert.match(source, /semanticError = validateStudioRecord/);
});
''', encoding='utf-8')

DOC.write_text(r'''# Mor'ia 8.6 — Authoritative Content Studio

Mor'ia 8.6 upgrades the server Admin panel into a production-oriented Content Studio while preserving the server-authoritative runtime boundary.

## Durable publishing

`ContentDB.add`, `update` and `remove` now roll back their in-memory mutations when the atomic file save fails. The Admin API therefore cannot report a successful publish and synchronize live runtime state unless content was durably stored first. Public content-sync payloads are detached snapshots rather than direct references to the database object.

## Preflight and diagnostics

The new `ContentStudio` domain owns declarative field schemas, dynamic options, semantic validation and whole-catalog diagnostics. The Studio performs a non-mutating `/admin/api/validate/:type` preflight before publishing. Diagnostics also apply the existing cross-reference integrity rules so missing NPCs, quest prerequisites, maps and portals are surfaced before production content changes.

## Schema-driven authoring

The editor receives schema and options from the server. This adds advanced item stats introduced by 8.4, quest prerequisite JSON, custom maps in map selectors, vocation/biome/role enums, and type-aware numeric/JSON editors without duplicating game-policy catalogs in browser code.

## Studio workflow

- Search each catalog.
- Clone an existing record using index-safe handlers.
- Preflight before publish.
- Inspect server-wide diagnostics.
- Export a detached JSON content snapshot with its diagnostics.
- Publish only after durable persistence and then synchronize the authoritative runtime.

The existing ADMIN_TOKEN authorization remains mandatory for both `/admin` and `/admin/api/*`.
''', encoding='utf-8')

print("Mor'ia 8.6 authoritative Content Studio migration prepared")
