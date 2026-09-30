import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERACTION_KINDS, normalizeInteractionProfile, validateInteractionProfile } from '../engine/InteractionAuthoring.mjs';

const db = { get(type) { return type === 'shops' ? [{ id: 'shop-1', npcId: 'merchant-1' }] : []; } };

test('interaction authoring exposes all ISO interaction kinds', () => {
  assert.deepEqual(INTERACTION_KINDS, ['talk', 'trade', 'inspect', 'hostile']);
});

test('merchant infers trade and validates linked shop', () => {
  const npc = { id: 'merchant-1', role: 'merchant' };
  assert.equal(normalizeInteractionProfile(npc).kind, 'trade');
  assert.equal(validateInteractionProfile(npc, db), null);
});

test('talk requires dialogue', () => {
  assert.match(validateInteractionProfile({ id: 'npc-1', interactionKind: 'talk' }, db), /requires dialogue/);
  assert.equal(validateInteractionProfile({ id: 'npc-1', interactionKind: 'talk', dialogue: 'Olá.' }, db), null);
});

test('inspect requires authored description', () => {
  assert.match(validateInteractionProfile({ id: 'relic-1', interactionKind: 'inspect' }, db), /requires a description/);
  assert.equal(validateInteractionProfile({ id: 'relic-1', interactionKind: 'inspect', description: 'Uma relíquia antiga.' }, db), null);
});

test('hostile validates targetability and hp when present', () => {
  assert.match(validateInteractionProfile({ id: 'wolf', interactionKind: 'hostile', hp: 0 }, db), /positive hp/);
  assert.equal(validateInteractionProfile({ id: 'wolf', interactionKind: 'hostile', hp: 40 }, db), null);
});
