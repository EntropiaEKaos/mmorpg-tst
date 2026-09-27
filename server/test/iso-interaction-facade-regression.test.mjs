import test from 'node:test';
import assert from 'node:assert/strict';
import { getContentStudioSchema as legacySchema } from '../engine/ContentStudio.mjs';
import { getContentStudioSchema as isoSchema, validateStudioRecord } from '../engine/ContentStudioIsoFacade.mjs';

const emptyDb = { get() { return []; } };

test('ISO facade preserves every legacy Studio field for every legacy domain', () => {
  const legacyTypes = ['items','monsters','npcs','spells','quests','maps','events','shops','lootTables','gmRoster','taskQuests','houses','housingDecor','outfits','mounts'];
  for (const type of legacyTypes) {
    const before = legacySchema(type, emptyDb);
    const after = isoSchema(type, emptyDb);
    assert.deepEqual(after.fields.slice(0, before.fields.length), before.fields, `${type} legacy fields changed`);
    for (const field of before.fields) assert.ok(after.fields.includes(field), `${type}.${field} was lost`);
  }
});

test('ISO facade adds interaction authoring only to NPCs and monsters', () => {
  for (const type of ['npcs','monsters']) {
    const studio = isoSchema(type, emptyDb);
    for (const field of ['interactionKind','interactionPrompt','interactionProfile']) assert.ok(studio.fields.includes(field));
    assert.deepEqual(studio.options.interactionKinds, ['talk','trade','inspect','hostile']);
  }
  assert.ok(!isoSchema('items', emptyDb).fields.includes('interactionKind'));
});

test('ISO facade runs legacy validation before interaction validation', () => {
  assert.match(validateStudioRecord('monsters', { id:'wolf', name:'Wolf', hp:0, attack:1, defense:1, xp:1, level:1, interactionKind:'hostile' }, emptyDb), /hp/i);
  assert.match(validateStudioRecord('npcs', { id:'npc', name:'NPC', posX:1, posY:1, mapId:'eldoria', interactionKind:'talk' }, emptyDb), /dialogue/i);
});
