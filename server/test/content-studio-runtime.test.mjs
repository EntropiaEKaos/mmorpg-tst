import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_STUDIO_SCHEMAS, getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudioRuntime.mjs';

test('runtime studio keeps every mature legacy content type', () => {
  for (const type of ['items','monsters','npcs','spells','quests','maps','events','shops','lootTables','gmRoster','taskQuests','houses','housingDecor','outfits','mounts']) {
    assert.ok(CONTENT_STUDIO_SCHEMAS[type], `missing legacy schema ${type}`);
  }
});

test('runtime studio adds ISO authoring only to NPCs and monsters', () => {
  const db = { get: () => [] };
  for (const type of ['npcs','monsters']) {
    const schema = getContentStudioSchema(type, db);
    const fields = schema.schema.map(field => field.id);
    assert.ok(fields.includes('interactionKind'));
    assert.ok(fields.includes('interactionPrompt'));
    assert.ok(fields.includes('interactionProfile'));
    assert.deepEqual(schema.options.interactionKinds, ['talk','trade','inspect','hostile']);
  }
  const mapFields = getContentStudioSchema('maps', db).schema.map(field => field.id);
  assert.ok(!mapFields.includes('interactionKind'));
});

test('runtime validation composes legacy validation before ISO validation', () => {
  const db = { get: () => [] };
  assert.match(validateStudioRecord('npcs', { id:'bad npc', name:'NPC', interactionKind:'talk' }, db), /id must/);
  assert.match(validateStudioRecord('npcs', { id:'npc-1', name:'NPC', mapId:'eldoria', posX:10, posY:10, interactionKind:'talk' }, db), /requires dialogue/);
});
