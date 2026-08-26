from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
"import { questEngine } from './QuestEngine.mjs';\n",
"import { questEngine } from './QuestEngine.mjs';\nimport { contentDB } from './ContentDB.mjs';\n",
'ContentDB quest proximity import')

s = replace_once(s,
"  handleQuestAccept(player, payload) {\n",
"  getQuestNpcRequirement(questId) {\n    const quest = contentDB.get('quests').find(entry => entry?.id === questId);\n    if (!quest || typeof quest.npcId !== 'string' || !quest.npcId.trim()) return null;\n    const npc = contentDB.get('npcs').find(entry => entry?.id === quest.npcId);\n    if (!npc) return null;\n    const x = Number(npc.posX);\n    const y = Number(npc.posY);\n    const mapId = typeof npc.mapId === 'string' && WORLD.getMap(npc.mapId) ? npc.mapId : null;\n    if (!mapId || !Number.isFinite(x) || !Number.isFinite(y)) return null;\n    return { name: typeof npc.name === 'string' && npc.name.trim() ? npc.name.trim() : npc.id, mapId, x: Math.floor(x), y: Math.floor(y) };\n  }\n\n  isNearQuestNpc(player, questId) {\n    const npc = this.getQuestNpcRequirement(questId);\n    if (!npc) return { ok: true, npc: null };\n    const near = player.mapId === npc.mapId\n      && Math.abs(player.x - npc.x) <= 2\n      && Math.abs(player.y - npc.y) <= 2;\n    return { ok: near, npc };\n  }\n\n  emitQuestNpcRequirement(player, npc, verb) {\n    this.emitEvent(player.mapId, {\n      kind: 'system', targetId: player.id,\n      text: `❌ Move near ${npc.name} to ${verb} this quest.`,\n      color: '#ff6060', pos: { x: player.x, y: player.y },\n    });\n  }\n\n  handleQuestAccept(player, payload) {\n",
'quest NPC proximity helpers')

s = replace_once(s,
"  handleQuestAccept(player, payload) {\n    if (typeof payload.questId !== 'string') return false;\n    const result = questEngine.acceptQuest(player.id, payload.questId);\n",
"  handleQuestAccept(player, payload) {\n    if (typeof payload.questId !== 'string') return false;\n    const proximity = this.isNearQuestNpc(player, payload.questId);\n    if (!proximity.ok) {\n      this.emitQuestNpcRequirement(player, proximity.npc, 'accept');\n      return false;\n    }\n    const result = questEngine.acceptQuest(player.id, payload.questId);\n",
'quest accept proximity gate')

s = replace_once(s,
"  handleQuestComplete(player, payload) {\n    if (typeof payload.questId !== 'string') return false;\n    const result = questEngine.completeQuest(player.id, payload.questId);\n",
"  handleQuestComplete(player, payload) {\n    if (typeof payload.questId !== 'string') return false;\n    const proximity = this.isNearQuestNpc(player, payload.questId);\n    if (!proximity.ok) {\n      this.emitQuestNpcRequirement(player, proximity.npc, 'complete');\n      return false;\n    }\n    const result = questEngine.completeQuest(player.id, payload.questId);\n",
'quest complete proximity gate')

p.write_text(s)

p = Path('server/test/hardening.test.mjs')
s = p.read_text()

# Existing level-up test must satisfy the new turn-in rule if the chosen quest has a real NPC.
s = replace_once(s,
"    player.xp = Math.max(0, player.xpNext - Number(quest.rewardXp));\n    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);\n",
"    const questNpc = contentDB.get('npcs').find(npc => npc.id === quest.npcId);\n    if (questNpc && WORLD.getMap(questNpc.mapId) && Number.isFinite(Number(questNpc.posX)) && Number.isFinite(Number(questNpc.posY))) {\n      player.mapId = questNpc.mapId;\n      player.x = Number(questNpc.posX);\n      player.y = Number(questNpc.posY);\n    }\n    player.xp = Math.max(0, player.xpNext - Number(quest.rewardXp));\n    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);\n",
'level-up quest test proximity')

marker = "\ntest('full potions are not consumed and quest XP can level the player'"
block = r'''

test('quest accept and completion require authoritative NPC proximity when linked', () => {
  const quest = contentDB.get('quests').find(entry => {
    const npc = contentDB.get('npcs').find(candidate => candidate.id === entry.npcId);
    return npc && WORLD.getMap(npc.mapId) && Number.isFinite(Number(npc.posX)) && Number.isFinite(Number(npc.posY));
  });
  assert.ok(quest);
  const npc = contentDB.get('npcs').find(entry => entry.id === quest.npcId);
  assert.ok(npc);

  const { id, player } = makePlayer();
  try {
    player.mapId = npc.mapId;
    player.x = Math.max(0, Number(npc.posX) + 8);
    player.y = Math.max(0, Number(npc.posY) + 8);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), false);
    assert.equal(questEngine.exportState(id).active.length, 0);

    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), true);

    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: quest.count }, startedAt: Date.now() }],
      completed: [],
    });
    const goldBefore = player.gold;
    player.x = Math.max(0, Number(npc.posX) + 8);
    player.y = Math.max(0, Number(npc.posY) + 8);
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), false);
    assert.equal(player.gold, goldBefore);
    assert.equal(questEngine.exportState(id).completed.includes(quest.id), false);

    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);
    assert.equal(questEngine.exportState(id).completed.includes(quest.id), true);
  } finally {
    cleanup(id);
  }
});
'''
if "quest accept and completion require authoritative NPC proximity when linked" not in s:
    if marker not in s:
        raise SystemExit('pattern not found: quest proximity test insertion')
    s = s.replace(marker, block + marker, 1)

p.write_text(s)
print('quest NPC proximity 4.2 applied')
