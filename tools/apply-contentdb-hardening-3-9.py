from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('server/engine/ContentDB.mjs')
s = p.read_text()

s = replace_once(s,
'''const DB_FILE = path.join(__dirname, '..', 'moria-content.json');\n\nclass ContentDB {\n  constructor() {\n    this.data = {\n      version: 1,\n      items: [],\n      monsters: [],\n      npcs: [],\n      quests: [],\n      spells: [],\n      maps: [],\n      worldEvents: [],\n      shops: [],\n      lootTables: [],\n    };\n    this.load();\n    // Seed defaults if empty\n    if (this.data.items.length === 0) this.seedDefaults();\n  }\n\n  load() {\n    try {\n      if (fs.existsSync(DB_FILE)) {\n        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));\n        console.log(`📦 Content DB: ${this.data.items.length} items, ${this.data.monsters.length} monsters, ${this.data.npcs.length} NPCs, ${this.data.quests.length} quests`);\n      }\n    } catch (e) { console.warn('⚠ Content DB load failed:', e.message); }\n  }\n\n  save() {\n    try {\n      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));\n    } catch (e) { console.warn('⚠ Content DB save failed:', e.message); }\n  }\n''',
'''const DB_FILE = path.join(__dirname, '..', 'moria-content.json');\nconst COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables']);\nconst TYPE_ALIASES = Object.freeze({ events: 'worldEvents' });\n\nfunction emptyContentData() {\n  return {\n    version: 1,\n    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],\n    worldEvents: [], shops: [], lootTables: [],\n  };\n}\n\nfunction canonicalContentType(type) {\n  const key = TYPE_ALIASES[type] || type;\n  return COLLECTION_KEYS.includes(key) ? key : null;\n}\n\nfunction normalizeCollection(value, { requireId = true } = {}) {\n  if (!Array.isArray(value)) return [];\n  const records = [];\n  for (const entry of value) {\n    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;\n    if (requireId && (typeof entry.id !== 'string' || !entry.id.trim())) continue;\n    const copy = { ...entry };\n    if (typeof copy.id === 'string') copy.id = copy.id.trim().slice(0, 100);\n    records.push(copy);\n  }\n  return records;\n}\n\nfunction dedupeById(records) {\n  const byId = new Map();\n  for (const record of records) {\n    if (typeof record.id !== 'string' || !record.id) continue;\n    byId.set(record.id, record);\n  }\n  return Array.from(byId.values());\n}\n\nexport function normalizeContentData(raw) {\n  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Content database must be an object');\n  const recognized = Number.isFinite(Number(raw.version))\n    || COLLECTION_KEYS.some(key => Array.isArray(raw[key]))\n    || Array.isArray(raw.events);\n  if (!recognized) throw new Error('Content database has no recognized schema fields');\n\n  const normalized = emptyContentData();\n  const version = Number(raw.version);\n  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;\n  for (const key of COLLECTION_KEYS) {\n    if (key === 'worldEvents') continue;\n    normalized[key] = normalizeCollection(raw[key], { requireId: key !== 'shops' && key !== 'lootTables' });\n  }\n  normalized.worldEvents = dedupeById([\n    ...normalizeCollection(raw.worldEvents),\n    ...normalizeCollection(raw.events),\n  ]);\n  return normalized;\n}\n\nexport class ContentDB {\n  constructor(dbFile = DB_FILE) {\n    this.dbFile = dbFile;\n    this.data = emptyContentData();\n    // Only seed a brand-new or unrecoverably corrupt database. A valid empty\n    // collection is intentional admin state and must stay empty after restart.\n    if (!this.load()) this.seedDefaults();\n  }\n\n  load() {\n    const tempFile = `${this.dbFile}.tmp`;\n    const candidates = [this.dbFile, tempFile];\n    for (const candidate of candidates) {\n      if (!fs.existsSync(candidate)) continue;\n      try {\n        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));\n        this.data = normalizeContentData(parsed);\n        if (candidate === tempFile) {\n          fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });\n          fs.renameSync(tempFile, this.dbFile);\n          console.warn('⚠ Content DB recovered from atomic temp file');\n        } else if (fs.existsSync(tempFile)) {\n          fs.rmSync(tempFile, { force: true });\n        }\n        console.log(`📦 Content DB: ${this.data.items.length} items, ${this.data.monsters.length} monsters, ${this.data.npcs.length} NPCs, ${this.data.quests.length} quests`);\n        return true;\n      } catch (e) {\n        console.warn(`⚠ Content DB load failed (${path.basename(candidate)}):`, e.message);\n        if (candidate === this.dbFile) {\n          try { fs.renameSync(this.dbFile, `${this.dbFile}.corrupt-${Date.now()}`); } catch {}\n        } else {\n          try { fs.rmSync(tempFile, { force: true }); } catch {}\n        }\n      }\n    }\n    return false;\n  }\n\n  save() {\n    const tempFile = `${this.dbFile}.tmp`;\n    try {\n      fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });\n      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2));\n      fs.renameSync(tempFile, this.dbFile);\n      return true;\n    } catch (e) {\n      try { fs.rmSync(tempFile, { force: true }); } catch {}\n      console.warn('⚠ Content DB save failed:', e.message);\n      return false;\n    }\n  }\n''', 'ContentDB schema, recovery and atomic persistence')

s = replace_once(s,
'''  // ===== CRUD for all content types =====\n  get(type) { return this.data[type] || []; }\n  \n  add(type, item) {\n    if (!this.data[type]) this.data[type] = [];\n    item.id = item.id || `${type}_${Date.now()}`;\n    this.data[type].push(item);\n    this.save();\n    return item;\n  }\n\n  update(type, id, updates) {\n    const arr = this.data[type];\n    if (!arr) return false;\n    const idx = arr.findIndex(i => i.id === id);\n    if (idx < 0) return false;\n    arr[idx] = { ...arr[idx], ...updates, id };\n    this.save();\n    return true;\n  }\n\n  remove(type, id) {\n    if (!this.data[type]) return false;\n    this.data[type] = this.data[type].filter(i => i.id !== id);\n    this.save();\n    return true;\n  }\n''',
'''  // ===== CRUD for all content types =====\n  get(type) {\n    const key = canonicalContentType(type);\n    return key ? this.data[key] : [];\n  }\n  \n  add(type, item) {\n    const key = canonicalContentType(type);\n    if (!key || !item || typeof item !== 'object' || Array.isArray(item)) return null;\n    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 100) : `${key}_${Date.now()}`;\n    const record = { ...item, id };\n    this.data[key].push(record);\n    this.save();\n    return record;\n  }\n\n  update(type, id, updates) {\n    const key = canonicalContentType(type);\n    if (!key || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) return false;\n    const canonicalId = id.trim().slice(0, 100);\n    const arr = this.data[key];\n    const idx = arr.findIndex(i => i.id === canonicalId);\n    if (idx < 0) return false;\n    arr[idx] = { ...arr[idx], ...updates, id: canonicalId };\n    this.save();\n    return true;\n  }\n\n  remove(type, id) {\n    const key = canonicalContentType(type);\n    if (!key || typeof id !== 'string') return false;\n    const canonicalId = id.trim().slice(0, 100);\n    const before = this.data[key].length;\n    this.data[key] = this.data[key].filter(i => i.id !== canonicalId);\n    if (this.data[key].length === before) return false;\n    this.save();\n    return true;\n  }\n''', 'canonical ContentDB CRUD')

p.write_text(s)

# ---------------------------------------------------------------------
# Dedicated persistence/migration regression tests.
# ---------------------------------------------------------------------
p = Path('server/test/content-db.test.mjs')
p.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB, normalizeContentData } from '../engine/ContentDB.mjs';

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-content-test-'));
  try { return fn(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('ContentDB normalizes schema and migrates legacy events into worldEvents', () => {
  const normalized = normalizeContentData({
    version: 1,
    items: [{ id: ' sword ', name: 'Sword' }, null, 'bad'],
    events: [{ id: 'event_old', name: 'Legacy Event' }],
    worldEvents: [{ id: 'event_old', name: 'Old Copy' }, { id: 'event_live', name: 'Live Event' }],
    monsters: 'not-an-array',
  });
  assert.equal(normalized.items.length, 1);
  assert.equal(normalized.items[0].id, 'sword');
  assert.deepEqual(normalized.monsters, []);
  assert.equal(normalized.worldEvents.length, 2);
  assert.equal(normalized.worldEvents.find(event => event.id === 'event_old').name, 'Legacy Event');
  assert.equal(Object.hasOwn(normalized, 'events'), false);
});

test('ContentDB keeps a valid intentionally-empty database empty and aliases events', () => withTempDir(dir => {
  const file = path.join(dir, 'content.json');
  fs.writeFileSync(file, JSON.stringify({
    version: 1, items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],
    worldEvents: [], shops: [], lootTables: [],
  }));
  const db = new ContentDB(file);
  assert.equal(db.get('items').length, 0);
  assert.equal(db.get('events').length, 0);
  db.add('events', { id: 'event_admin', name: 'Admin Event' });
  assert.equal(db.get('worldEvents').length, 1);
  assert.equal(db.get('events')[0].id, 'event_admin');
  const persisted = JSON.parse(fs.readFileSync(file, 'utf-8'));
  assert.equal(Array.isArray(persisted.worldEvents), true);
  assert.equal(Object.hasOwn(persisted, 'events'), false);
}));

test('ContentDB recovers from corrupt JSON and saves atomically', () => withTempDir(dir => {
  const file = path.join(dir, 'content.json');
  fs.writeFileSync(file, '{broken-json');
  const db = new ContentDB(file);
  assert.ok(db.get('items').length > 0);
  assert.equal(fs.existsSync(`${file}.tmp`), false);
  const backups = fs.readdirSync(dir).filter(name => name.startsWith('content.json.corrupt-'));
  assert.equal(backups.length, 1);
  const persisted = normalizeContentData(JSON.parse(fs.readFileSync(file, 'utf-8')));
  assert.ok(persisted.items.length > 0);
}));
''')

print('ContentDB hardening 3.9 applied')
