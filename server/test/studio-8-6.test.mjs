import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditContentReferences } from '../engine/ContentIntegrity.mjs';
import { getContentStudioSchema } from '../engine/ContentStudio.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
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

test('8.6 server keeps live players read-only and Studio exposes advanced authoring through the declarative schema', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(source, /readOnly: true, runtimeNote: 'Live player state is authoritative/);
  assert.match(source, /type === 'integrity'/);
  assert.match(source, /type === 'export'/);

  const itemFields = new Set(getContentStudioSchema('items', contentDB).fields);
  for (const field of ['critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction']) {
    assert.equal(itemFields.has(field), true, `${field} must remain authorable`);
  }
  const questFields = new Set(getContentStudioSchema('quests', contentDB).fields);
  assert.equal(questFields.has('levelRequired'), true);
  assert.equal(questFields.has('requires'), true);
});
