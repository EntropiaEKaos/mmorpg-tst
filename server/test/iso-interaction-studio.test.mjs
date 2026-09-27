import test from 'node:test';
import assert from 'node:assert/strict';
import { extendStudioSchemaWithIsoInteractions, isoInteractionOptions, validateIsoStudioInteraction } from '../engine/IsoInteractionStudio.mjs';

test('NPC and monster Studio schemas expose ISO interaction controls', () => {
  const base = [{ id: 'id' }, { id: 'name' }];
  for (const type of ['npcs', 'monsters']) {
    const fields = extendStudioSchemaWithIsoInteractions(type, base).map((field) => field.id);
    assert.ok(fields.includes('interactionKind'));
    assert.ok(fields.includes('interactionPrompt'));
    assert.ok(fields.includes('interactionProfile'));
  }
  assert.deepEqual(isoInteractionOptions().interactionKinds, ['talk', 'trade', 'inspect', 'hostile']);
});

test('Studio rejects invalid ISO interaction records', () => {
  assert.match(validateIsoStudioInteraction('npcs', { id:'npc', name:'NPC', interactionKind:'talk' }), /requires dialogue/);
  assert.match(validateIsoStudioInteraction('monsters', { id:'wolf', name:'Wolf', hp:0, interactionKind:'hostile' }), /positive hp/);
  assert.match(validateIsoStudioInteraction('monsters', { id:'statue', name:'Statue', interactionKind:'inspect', interactionProfile:{ inspect:{} } }), /requires a description/);
});

test('Studio accepts valid trade linkage', () => {
  const db = { get: (type) => type === 'shops' ? [{ id:'shop-1', npcId:'merchant-1' }] : [] };
  assert.equal(validateIsoStudioInteraction('npcs', { id:'merchant-1', name:'Merchant', role:'merchant', interactionKind:'trade' }, db), null);
});
