from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, content):
    (ROOT / path).write_text(content, encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 anchor, found {count}')
    return text.replace(old, new, 1)

# -------------------------------------------------------------------
# Server GameState: wire authoritative class identity + reward events.
# -------------------------------------------------------------------
path = 'server/engine/GameState.mjs'
text = read(path)
text = replace_once(
    text,
    "import { contextualizeSpell, effectForRelation, multiplierForRelation } from './ContextualSkillEngine.mjs';\n",
    "import { contextualizeSpell, effectForRelation, multiplierForRelation } from './ContextualSkillEngine.mjs';\n"
    "import { applyClassDerivedStats, classBasicAttackRules, classSpellMultiplier, applyClassKillSustain } from './ClassIdentity.mjs';\n"
    "import { buildBossDefeatEvent, buildLootRewardEvent } from './RewardFeedback.mjs';\n",
    'GameState imports',
)
text = replace_once(
    text,
    "    if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;\n"
    "    if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;\n",
    "    // 9.3: class identity is data-driven and authoritative.\n"
    "    applyClassDerivedStats(player, stats);\n",
    'derived class passives',
)
old_attack = """  handleAttack(player, payload) {
    const now = Date.now();
    if (now - player.lastAttack < 700) return false;

    const monsterId = typeof payload.monsterId === 'string' ? payload.monsterId : player.targetId;
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const monster = monsters.find(m => m.id === monsterId && !m.dead);
    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;

    const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
    if (dist > 2) return false;
    player.targetId = monster.id;
    player.lastAttack = now;

    const derived = this.computeDerivedStats(player);
    const masteryMultiplier = 1 + officialSystems.getMasteryBonus(player);
    const baseAttack = Math.floor(derived.totalAttack * masteryMultiplier) + Math.floor(Math.random() * 8);
    const crit = Math.random() < (derived.critChance / 100);
    let dmg = Math.max(1, baseAttack - monster.defense);
    if (crit) dmg = Math.floor(dmg * 2);
    if (player.vocation === 'berserker' && player.hp < derived.totalMaxHp * 0.3) dmg = Math.floor(dmg * 1.5);

    monster.hp -= dmg;
    player.stats.damageDealt += dmg;
    const attackSkill = (player.vocation === 'paladin' || player.vocation === 'ranger') ? 'distance' : (player.equipment?.weapon ? 'sword' : 'fist');
    this.progressSkill(player, attackSkill, 1);
    officialSystems.recordWeaponHit(player);
    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd' });
"""
new_attack = """  handleAttack(player, payload) {
    const now = Date.now();
    const monsterId = typeof payload.monsterId === 'string' ? payload.monsterId : player.targetId;
    const monsters = this.monstersByMap.get(player.mapId) || [];
    const monster = monsters.find(m => m.id === monsterId && !m.dead);
    if (!monster || (monster.dungeonOwnerId && monster.dungeonOwnerId !== player.id)) return false;

    const derived = this.computeDerivedStats(player);
    const classRules = classBasicAttackRules(player, monster, derived);
    if (now - player.lastAttack < classRules.cooldownMs) return false;
    const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
    if (dist > classRules.range) return false;
    player.targetId = monster.id;
    player.lastAttack = now;

    const masteryMultiplier = 1 + officialSystems.getMasteryBonus(player);
    const baseAttack = Math.floor(derived.totalAttack * masteryMultiplier) + Math.floor(Math.random() * 8);
    const crit = Math.random() < (derived.critChance / 100);
    let dmg = Math.max(1, Math.floor(baseAttack * classRules.damageMultiplier) - monster.defense);
    if (crit) dmg = Math.floor(dmg * classRules.critMultiplier);

    monster.hp -= dmg;
    player.stats.damageDealt += dmg;
    const attackSkill = (player.vocation === 'paladin' || player.vocation === 'ranger') ? 'distance' : (player.equipment?.weapon ? 'sword' : 'fist');
    this.progressSkill(player, attackSkill, 1);
    officialSystems.recordWeaponHit(player);
    this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: dmg, pos: { x: monster.x, y: monster.y }, color: crit ? '#ff4444' : '#ffdddd', critical: crit, vocation: player.vocation });

    if (derived.lifesteal > 0 && dmg > 0) {
      const before = player.hp;
      const amount = Math.max(1, Math.floor(dmg * Math.min(50, derived.lifesteal) / 100));
      player.hp = Math.min(derived.totalMaxHp, player.hp + amount);
      const actual = Math.max(0, player.hp - before);
      if (actual > 0) {
        player.stats.healingDone += actual;
        this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: actual, text: 'Lifesteal', pos: { x: player.x, y: player.y }, color: '#c084fc', vocation: player.vocation });
      }
    }
"""
text = replace_once(text, old_attack, new_attack, 'basic attack identity')
text = replace_once(
    text,
    "    if (monster.type === 'boss') player.stats.bossesKilled = (player.stats.bossesKilled || 0) + 1;\n\n    const derived = this.computeDerivedStats(player);\n",
    "    if (monster.type === 'boss') player.stats.bossesKilled = (player.stats.bossesKilled || 0) + 1;\n"
    "    const bossRewardEvent = buildBossDefeatEvent(player, monster);\n"
    "    if (bossRewardEvent) this.emitEvent(player.mapId, bossRewardEvent);\n\n"
    "    const derived = this.computeDerivedStats(player);\n"
    "    const classSustain = applyClassKillSustain(player, monster, derived);\n"
    "    if (classSustain.hp > 0 || classSustain.mana > 0) {\n"
    "      const sustainParts = [classSustain.hp > 0 ? `+${classSustain.hp} HP` : '', classSustain.mana > 0 ? `+${classSustain.mana} MP` : ''].filter(Boolean);\n"
    "      this.emitEvent(player.mapId, { kind: 'class_sustain', targetId: player.id, text: `${classSustain.signature} · ${sustainParts.join(' · ')}`, color: classSustain.color, pos: { x: player.x, y: player.y }, vocation: player.vocation, hp: classSustain.hp, mana: classSustain.mana });\n"
    "    }\n",
    'boss and sustain rewards',
)
text = text.replace(
    "{ kind:update.ready ? 'task_ready' : 'task_progress', targetId:player.id, text:`${update.name}: ${update.current}/${update.needed}${update.ready ? ' · return to task master' : ''}`, color:update.ready ? '#f4e04d' : '#9bd4ff' }",
    "{ kind:update.ready ? 'task_ready' : 'task_progress', targetId:player.id, text:`${update.name}: ${update.current}/${update.needed}${update.ready ? ' · return to task master' : ''}`, color:update.ready ? '#f4e04d' : '#9bd4ff', pos:{ x:player.x, y:player.y }, vocation:player.vocation }",
)
text = text.replace(
    "{ kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y } }",
    "{ kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y }, vocation: player.vocation }",
)
text = text.replace(
    "{ kind: 'adventure_ready', targetId: player.id, text: '🏆 Hunt complete! Open Hunts (H) to claim your reward.', color: '#ffd87b', pos: { x: player.x, y: player.y } }",
    "{ kind: 'adventure_ready', targetId: player.id, text: '🏆 Hunt complete! Open Hunts (H) to claim your reward.', color: '#ffd87b', pos: { x: player.x, y: player.y }, vocation: player.vocation }",
)
text = replace_once(
    text,
    "    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId, contentDB.get('lootTables')), ...(officialKill.bonusLoot || [])];\n"
    "    if (loot.length > 0) {\n",
    "    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId, contentDB.get('lootTables')), ...(officialKill.bonusLoot || [])];\n"
    "    const lootRewardEvent = buildLootRewardEvent(player, loot, { x: monster.x, y: monster.y });\n"
    "    if (lootRewardEvent) this.emitEvent(player.mapId, lootRewardEvent);\n"
    "    if (loot.length > 0) {\n",
    'loot reward event',
)
text = text.replace(
    "{ kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y } }",
    "{ kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y }, vocation: player.vocation }",
)
text = text.replace(
    "this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });",
    "this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y }, vocation: player.vocation });",
)
text = replace_once(
    text,
    "      const multiplier = multiplierForRelation(spell, target.relation, clock);\n",
    "      const multiplier = multiplierForRelation(spell, target.relation, clock) * classSpellMultiplier(player, spell, effect);\n",
    'class spell multiplier',
)
text = text.replace(
    "color: '#2ecc71' });",
    "color: '#2ecc71', vocation: player.vocation });",
    1,
)
text = text.replace(
    "color: spell.color, pos: { x: receiver.x, y: receiver.y } });",
    "color: spell.color, pos: { x: receiver.x, y: receiver.y }, vocation: player.vocation });",
)
text = text.replace(
    "pos: { x: monster.x, y: monster.y }, color: spell.color });",
    "pos: { x: monster.x, y: monster.y }, color: spell.color, vocation: player.vocation });",
)
text = text.replace(
    "pos: { x: player.x, y: player.y }, color: '#c084fc' });",
    "pos: { x: player.x, y: player.y }, color: '#c084fc', vocation: player.vocation });",
)
write(path, text)

# Avoid double-applying the healer class multiplier: classSpellMultiplier owns it.
path = 'server/engine/ClassIdentity.mjs'
text = read(path)
text = replace_once(
    text,
    "  stats.healBonus += Math.max(0, ((Number(identity.healPowerMultiplier) || 1) - 1) * 100);\n",
    "  // Healing specialization is applied per cast by classSpellMultiplier.\n",
    'class heal multiplier ownership',
)
write(path, text)

# -------------------------------------------------------------------
# Client event consumption: visible celebrations in addition to particles.
# -------------------------------------------------------------------
path = 'src/game/ServerSync.ts'
text = read(path)
text = replace_once(
    text,
    "        case 'quest_complete':\n          if (event.text) addMessage('Quest', event.text, event.color || '#58d6a8', 'quest');\n          break;\n",
    "        case 'quest_complete':\n"
    "          if (event.text) { addMessage('Quest', event.text, event.color || '#58d6a8', 'quest'); addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#58d6a8', true); }\n"
    "          break;\n",
    'quest celebration',
)
text = replace_once(
    text,
    "        case 'adventure_ready':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'system');\n          break;\n        case 'adventure_claimed':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot');\n          break;\n",
    "        case 'adventure_ready':\n"
    "          if (event.text) { addMessage('Hunt', event.text, event.color || '#ffd87b', 'system'); addFloatingText('HUNT COMPLETE!', event.pos || { x: 0, y: 0 }, event.color || '#ffd87b', true); }\n"
    "          break;\n"
    "        case 'adventure_claimed':\n"
    "          if (event.text) { addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot'); addFloatingText('REWARD CLAIMED!', event.pos || { x: 0, y: 0 }, event.color || '#ffd87b', true); }\n"
    "          break;\n",
    'adventure celebration',
)
text = replace_once(
    text,
    "        case 'task_ready':\n        case 'task_update':\n          if (event.text) addMessage('Task', event.text, event.color || '#ffd87b', 'quest');\n          break;\n",
    "        case 'task_ready':\n"
    "          if (event.text) { addMessage('Task', event.text, event.color || '#ffd87b', 'quest'); addFloatingText('TASK COMPLETE!', event.pos || { x: 0, y: 0 }, event.color || '#ffd87b', true); }\n"
    "          break;\n"
    "        case 'task_update':\n"
    "          if (event.text) addMessage('Task', event.text, event.color || '#ffd87b', 'quest');\n"
    "          break;\n"
    "        case 'loot_reward':\n"
    "          if (event.text) { addMessage('Loot', event.text, event.color || '#f4e04d', 'loot'); if ((Number(event.rewardTier) || 0) >= 2) addFloatingText(`${String(event.rarity || 'rare').toUpperCase()} DROP!`, event.pos || { x: 0, y: 0 }, event.color || '#f4e04d', true); }\n"
    "          break;\n"
    "        case 'boss_defeated':\n"
    "          if (event.text) { addMessage('Victory', event.text, event.color || '#ffbf5f', 'system'); addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#ffbf5f', true); }\n"
    "          break;\n"
    "        case 'class_sustain':\n"
    "          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#c084fc', false);\n"
    "          break;\n",
    'task loot boss class rewards',
)
write(path, text)

print('Mor\'ia 9.3 integration applied')
