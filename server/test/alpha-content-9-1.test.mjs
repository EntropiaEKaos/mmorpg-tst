import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB } from '../engine/ContentDB.mjs';
import { ALPHA_CONTENT_COUNTS } from '../engine/AlphaContent.mjs';
import { CONTENT_STUDIO_SCHEMAS, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { canAccessMap, isGmCharacter } from '../engine/ContentAccess.mjs';
import { rollContentLootTable, buildEquipmentLootPool } from '../engine/Items.mjs';

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-alpha-'));
  return { db: new ContentDB(path.join(dir, 'content.json')), dir };
}

test('9.1 alpha seed ships launch-sized editable content', () => {
  const { db, dir } = tempDb();
  try {
    assert.ok(db.get('maps').length >= 11);
    assert.ok(db.get('items').length >= 70);
    assert.ok(db.get('monsters').length >= 70);
    assert.ok(db.get('npcs').length >= 35);
    assert.ok(db.get('quests').length >= 45);
    assert.ok(db.get('spells').length >= 30);
    assert.ok(db.get('events').length >= 10);
    assert.ok(db.get('shops').length >= 10);
    assert.ok(db.get('lootTables').length >= 10);
    assert.equal(db.data.version, 2);
    assert.equal(ALPHA_CONTENT_COUNTS.maps, 11);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('Studio exposes all alpha content catalogs and all equipment slots', () => {
  for (const type of ['items','monsters','npcs','spells','quests','maps','events','shops','lootTables','gmRoster']) assert.ok(CONTENT_STUDIO_SCHEMAS[type]);
  const slots = CONTENT_STUDIO_SCHEMAS.items.find(field => field.id === 'slot');
  assert.equal(slots.optionKey, 'slots');
  const source = fs.readFileSync(new URL('../engine/ContentStudio.mjs', import.meta.url), 'utf8');
  for (const slot of ['ring2','cloak','belt','gloves','relic']) assert.match(source, new RegExp(`['\"]${slot}['\"]`));
});

test('GM island access is server-owned by admin-editable roster', () => {
  const fake = { get: type => type === 'gmRoster' ? [{ id:'gm_will', name:'WillGM' }] : [] };
  const map = { id:'gm_sanctum', access:'gm', name:'Astra Sanctum' };
  assert.equal(isGmCharacter(fake, { name:'willgm' }), true);
  assert.equal(canAccessMap(fake, { name:'WillGM' }, map), true);
  assert.equal(canAccessMap(fake, { name:'RegularPlayer' }, map), false);
  assert.equal(canAccessMap(fake, { name:'RegularPlayer' }, { id:'eldoria', access:'public' }), true);
});

test('alpha map records are semantically complete', () => {
  const { db, dir } = tempDb();
  try {
    for (const map of db.get('maps')) assert.equal(validateStudioRecord('maps', map), null, map.id);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('content loot tables resolve server-side equipment and materials', () => {
  const { db, dir } = tempDb();
  try {
    const monster = db.get('monsters').find(entry => entry.lootTableId);
    assert.ok(monster);
    const table = db.get('lootTables').find(entry => entry.id === monster.lootTableId);
    const forced = { ...table, rolls:1, entries:table.entries.map(entry => ({ ...entry, chance:1 })) };
    const drops = rollContentLootTable(monster, db.get('items'), [forced], () => 0);
    assert.ok(drops.length >= 2);
    assert.ok(drops.some(drop => drop.type === 'equipment'));
    assert.ok(buildEquipmentLootPool(db.get('items')).some(item => item.slot === 'relic' || item.slot === 'cloak'));
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});
