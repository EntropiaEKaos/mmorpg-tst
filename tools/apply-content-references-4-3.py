from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Shared content integrity helpers.
# ---------------------------------------------------------------------
p = Path('server/engine/ContentIntegrity.mjs')
p.write_text(r'''import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG } from './World.mjs';

export function objectiveKey(value) {
  return String(value ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function hasMap(mapId) {
  return typeof mapId === 'string' && Object.hasOwn(MAP_CONFIG, mapId.trim());
}

export function validateContentReferences(contentDB, type, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Invalid content record';

  if (type === 'quests') {
    const npcId = typeof record.npcId === 'string' ? record.npcId.trim() : '';
    if (npcId && !contentDB.get('npcs').some(npc => npc.id === npcId)) {
      return `Quest references unknown NPC: ${npcId}`;
    }

    if (record.requires !== undefined) {
      if (!Array.isArray(record.requires)) return 'Quest prerequisites must be an array of quest IDs';
      const questId = typeof record.id === 'string' ? record.id : '';
      const seen = new Set();
      for (const raw of record.requires) {
        if (typeof raw !== 'string' || !raw.trim()) return 'Quest prerequisite IDs must be non-empty strings';
        const requiredId = raw.trim();
        if (requiredId === questId) return 'Quest cannot require itself';
        if (seen.has(requiredId)) return `Duplicate quest prerequisite: ${requiredId}`;
        seen.add(requiredId);
        if (!contentDB.get('quests').some(quest => quest.id === requiredId)) {
          return `Quest prerequisite does not exist: ${requiredId}`;
        }
      }
    }
  }

  if (type === 'spells') {
    const vocation = typeof record.vocation === 'string' ? record.vocation.trim().toLowerCase() : '';
    if (!vocation || !VOCATIONS[vocation]) return `Spell references unknown vocation: ${vocation || '(empty)'}`;
  }

  if (type === 'npcs') {
    const mapId = typeof record.mapId === 'string' ? record.mapId.trim() : '';
    if (!hasMap(mapId)) return `NPC references unknown map: ${mapId || '(empty)'}`;
  }

  if (type === 'monsters' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {
    const mapId = String(record.mapId).trim();
    if (!hasMap(mapId)) return `Monster references unknown map: ${mapId}`;
  }

  return null;
}

export function findBlockingContentReferences(contentDB, type, id) {
  const canonicalId = typeof id === 'string' ? id.trim() : '';
  if (!canonicalId) return [];
  const blockers = [];

  if (type === 'npcs') {
    for (const quest of contentDB.get('quests')) {
      if (quest.npcId === canonicalId) blockers.push({ type: 'quest', id: quest.id, field: 'npcId' });
    }
  }

  if (type === 'quests') {
    for (const quest of contentDB.get('quests')) {
      if (quest.id !== canonicalId && Array.isArray(quest.requires) && quest.requires.includes(canonicalId)) {
        blockers.push({ type: 'quest', id: quest.id, field: 'requires' });
      }
    }
  }

  if (type === 'monsters') {
    const monster = contentDB.get('monsters').find(entry => entry.id === canonicalId);
    // Baseline catalog templates without mapId do not own the static WORLD spawn,
    // so deleting one does not make its baseline monster disappear. Live Admin
    // overlays do own their runtime spawn and must not be removed under a quest.
    if (monster?.mapId) {
      const targetKeys = new Set([objectiveKey(monster.id), objectiveKey(monster.name)].filter(Boolean));
      for (const quest of contentDB.get('quests')) {
        if (targetKeys.has(objectiveKey(quest.target))) blockers.push({ type: 'quest', id: quest.id, field: 'target' });
      }
    }
  }

  return blockers;
}
''')

# ---------------------------------------------------------------------
# Quest objective matching: accept IDs, names, spaces/underscores and content IDs.
# ---------------------------------------------------------------------
p = Path('server/engine/QuestEngine.mjs')
s = p.read_text()
s = replace_once(s,
"import { contentDB } from './ContentDB.mjs';\n",
"import { contentDB } from './ContentDB.mjs';\nimport { objectiveKey } from './ContentIntegrity.mjs';\n",
'quest objective key import')
s = replace_once(s,
"  progressQuest(playerId, targetType, amount = 1) {\n    const active = this.activeQuests.get(playerId) || [];\n    const progressed = [];\n    for (const q of active) {\n      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);\n      if (!quest) continue;\n      if (quest.target === targetType) {\n        q.progress[targetType] = Math.max(0, (q.progress[targetType] || 0) + amount);\n        const needed = quest.count;\n        const current = q.progress[targetType];\n        progressed.push({ questId: q.questId, name: quest.name, current, needed });\n      }\n    }\n    return progressed;\n  }\n",
"  progressQuest(playerId, targetType, amount = 1, aliases = []) {\n    const active = this.activeQuests.get(playerId) || [];\n    const progressed = [];\n    const targetKeys = new Set([targetType, ...(Array.isArray(aliases) ? aliases : [])].map(objectiveKey).filter(Boolean));\n    for (const q of active) {\n      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);\n      if (!quest) continue;\n      if (targetKeys.has(objectiveKey(quest.target))) {\n        const progressKey = quest.target;\n        q.progress[progressKey] = Math.max(0, (q.progress[progressKey] || 0) + amount);\n        const needed = quest.count;\n        const current = q.progress[progressKey];\n        progressed.push({ questId: q.questId, name: quest.name, current, needed });\n      }\n    }\n    return progressed;\n  }\n",
'canonical quest progress matching')
s = replace_once(s,
"  onMonsterKill(playerId, monsterName) {\n    const progressed = this.progressQuest(playerId, monsterName);\n    const completed = this.checkCompletion(playerId);\n    return { progressed, completed };\n  }\n",
"  onMonsterKill(playerId, monster) {\n    const monsterName = monster && typeof monster === 'object' ? monster.name : monster;\n    const aliases = monster && typeof monster === 'object'\n      ? [monster.contentSourceId, monster.templateId].filter(value => typeof value === 'string' && value)\n      : [];\n    const progressed = this.progressQuest(playerId, monsterName, 1, aliases);\n    const completed = this.checkCompletion(playerId);\n    return { progressed, completed };\n  }\n",
'authoritative monster objective aliases')
p.write_text(s)

p = Path('server/engine/GameState.mjs')
s = p.read_text()
s = replace_once(s,
"    const questResult = questEngine.onMonsterKill(player.id, monster.name);\n",
"    const questResult = questEngine.onMonsterKill(player.id, monster);\n",
'pass authoritative monster identity to quest engine')
p.write_text(s)

# ---------------------------------------------------------------------
# Admin API: validate references before writes and protect referenced deletes.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()
s = replace_once(s,
"import { questEngine } from './engine/QuestEngine.mjs';\n",
"import { questEngine } from './engine/QuestEngine.mjs';\nimport { validateContentReferences, findBlockingContentReferences } from './engine/ContentIntegrity.mjs';\n",
'content integrity import')
s = replace_once(s,
"      const existing = contentDB.get(type).find(i => i.id === data.id);\n      if (existing) contentDB.update(type, data.id, data);\n      else contentDB.add(type, data);\n",
"      const existing = contentDB.get(type).find(i => i.id === data.id);\n      const candidate = existing ? { ...existing, ...data, id: data.id } : { ...data, id: data.id };\n      const referenceError = validateContentReferences(contentDB, type, candidate);\n      if (referenceError) return json(res, 409, { error: referenceError });\n      const changed = existing ? contentDB.update(type, data.id, data) : contentDB.add(type, data);\n      if (!changed) return json(res, 409, { error: 'Content write was rejected' });\n",
'admin reference validation before write')
s = replace_once(s,
"    contentDB.remove(type, id);\n    if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n",
"    const blockers = findBlockingContentReferences(contentDB, type, id);\n    if (blockers.length > 0) {\n      return json(res, 409, { error: 'Content is still referenced and cannot be deleted', references: blockers });\n    }\n    if (!contentDB.remove(type, id)) return json(res, 404, { error: 'Content not found' });\n    if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n",
'admin referenced delete protection')
p.write_text(s)

# ---------------------------------------------------------------------
# Pure regression coverage for references.
# ---------------------------------------------------------------------
p = Path('server/test/content-integrity.test.mjs')
p.write_text(r'''import test from 'node:test';
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
''')

# Runtime regression: killing an actual Rat must progress quest target `rat`.
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
block = r'''

test('authoritative monster kills progress canonical quest targets', () => {
  const quest = contentDB.get('quests').find(entry => entry.id === 'quest_rats');
  const npc = contentDB.get('npcs').find(entry => entry.id === quest?.npcId);
  assert.ok(quest);
  assert.ok(npc);
  const { id, player } = makePlayer();
  const monsters = engine.monstersByMap.get('eldoria');
  const rat = monsters.find(monster => monster.name === 'Rat' && !monster.dead);
  assert.ok(rat);
  const originalRat = { hp: rat.hp, dead: rat.dead, respawnAt: rat.respawnAt };
  try {
    player.mapId = npc.mapId;
    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), true);

    player.x = Math.max(1, rat.x - 1);
    player.y = rat.y;
    player.attack = 9999;
    player.lastAttack = 0;
    rat.hp = 1;
    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: rat.id } }), true);
    const state = questEngine.exportState(id);
    const active = state.active.find(entry => entry.questId === quest.id);
    assert.ok(active);
    assert.equal(active.progress[quest.target], 1);
  } finally {
    rat.hp = originalRat.hp;
    rat.dead = originalRat.dead;
    rat.respawnAt = originalRat.respawnAt;
    cleanup(id);
  }
});
'''
if "authoritative monster kills progress canonical quest targets" not in s:
    s += block
p.write_text(s)

print('content references and quest objectives 4.3 applied')
