import test from 'node:test';
import assert from 'node:assert/strict';
import { objectiveKey, validateContentReferences, findBlockingContentReferences } from '../engine/ContentIntegrity.mjs';

function fakeDB(data) {
  return { get(type) { return data[type] || []; } };
}

test('objective keys normalize names and content IDs consistently', () => {
  assert.equal(objectiveKey('Dragon Lord'), 'dragon_lord');
  assert.equal(objectiveKey(' dragon_lord '), 'dragon_lord');
  assert.equal(objectiveKey('Rat'), 'rat');
});

test('content references reject orphan quests, invalid vocations and invalid maps', () => {
  const db = fakeDB({
    npcs: [{ id: 'trainer' }],
    quests: [{ id: 'quest_one' }],
  });
  assert.match(validateContentReferences(db, 'quests', { id: 'q2', npcId: 'missing', requires: [] }), /unknown NPC/);
  assert.match(validateContentReferences(db, 'quests', { id: 'q2', npcId: 'trainer', requires: ['missing'] }), /does not exist/);
  assert.match(validateContentReferences(db, 'spells', { id: 's1', vocation: 'not_a_class' }), /unknown vocation/);
  assert.match(validateContentReferences(db, 'npcs', { id: 'n1', mapId: 'missing_map' }), /unknown map/);
  assert.equal(validateContentReferences(db, 'quests', { id: 'q2', npcId: 'trainer', requires: ['quest_one'] }), null);
});

test('referenced NPCs, prerequisite quests and live monster overlays cannot be deleted', () => {
  const db = fakeDB({
    npcs: [{ id: 'trainer' }],
    quests: [
      { id: 'quest_one', npcId: 'trainer', target: 'admin_beast', requires: [] },
      { id: 'quest_two', npcId: 'trainer', target: 'rat', requires: ['quest_one'] },
    ],
    monsters: [{ id: 'admin_beast', name: 'Admin Beast', mapId: 'eldoria' }],
  });
  assert.deepEqual(findBlockingContentReferences(db, 'npcs', 'trainer').map(ref => ref.id).sort(), ['quest_one', 'quest_two']);
  assert.deepEqual(findBlockingContentReferences(db, 'quests', 'quest_one').map(ref => ref.id), ['quest_two']);
  assert.deepEqual(findBlockingContentReferences(db, 'monsters', 'admin_beast').map(ref => ref.id), ['quest_one']);
});
