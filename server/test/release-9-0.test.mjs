import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { adminPanelHTML } from '../adminPanel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('9.0 Studio schema is declarative, dynamic and covers every writable catalog', () => {
  for (const type of ['items','monsters','npcs','spells','quests','maps','events']) {
    const result = getContentStudioSchema(type, contentDB);
    assert.ok(result.fields.length > 0, `${type} must expose fields`);
    assert.equal(result.fields.length, result.schema.length);
    assert.ok(result.runtimeNote.length > 0);
  }
  const maps = getContentStudioSchema('npcs', contentDB).options.maps;
  assert.ok(maps.includes('eldoria'));
});

test('9.0 semantic validation rejects malformed power and coordinates before persistence', () => {
  assert.match(validateStudioRecord('items', { id: 'bad_item', name: 'Bad', slot: 'weapon', rarity: 'legendary', level: 1, value: 1, critChance: 500 }), /critChance/);
  assert.match(validateStudioRecord('monsters', { id: 'bad_monster', name: 'Bad', hp: 10, attack: 1, defense: 1, xp: 1, level: 1, type: 'normal', posX: -1, posY: 4 }), /posX/);
  assert.match(validateStudioRecord('spells', { id: 'bad_spell', name: 'Bad', mana: 1, cooldown: 100, damage: 1, range: 1, type: 'attack', vocation: 'knight', levelRequired: 1 }), /cooldown/);
});

test('9.0 Studio HTML consumes server schema instead of hard-coded editor choices', () => {
  const html = adminPanelHTML();
  assert.match(html, /schemaByField/);
  assert.match(html, /meta\.kind === 'select'/);
  assert.match(html, /options\[meta\.optionKey\]/);
});

test('9.0 release tree contains no retired one-shot 6.x or 8.0 applicators', () => {
  for (const relative of [
    '.github/workflows/apply-content-expansion-8-0.yml',
    'tools/apply-content-expansion-8-0.py',
    'tools/apply-mvp-complete-6-0.py',
    'tools/apply-mvp-complete-6-1.py',
    'tools/fix-mvp-complete-6-0.py',
    'tools/fix-mvp-complete-6-1.py',
  ]) assert.equal(fs.existsSync(path.join(root, relative)), false, `${relative} must be retired`);
});

test('9.0 server write path performs semantic validation before reference validation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const semantic = source.indexOf('validateStudioRecord(type, candidate, contentDB)');
  const references = source.indexOf('validateContentReferences(contentDB, type, candidate)');
  assert.ok(semantic > 0 && references > semantic);
  assert.match(source, /AUTHORITATIVE SERVER v9\.0 RELEASE/);
});
