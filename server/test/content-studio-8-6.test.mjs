import test from 'node:test';
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
