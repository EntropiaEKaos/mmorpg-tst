import test from 'node:test';
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
