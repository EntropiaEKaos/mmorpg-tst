from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

def read(path):
    return (root / path).read_text(encoding='utf-8')

def write(path, text):
    (root / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label}: anchor missing')
    return text.replace(old, new, 1)

# -------------------------------------------------------------------
# Server GameState: world clock + server-owned contextual targeting.
# -------------------------------------------------------------------
path = 'server/engine/GameState.mjs'
s = read(path)
s = replace_once(
    s,
    "import { housingSystem } from './HousingSystem.mjs';",
    "import { housingSystem } from './HousingSystem.mjs';\nimport { createWorldClockSnapshot } from './WorldClock.mjs';\nimport { contextualizeSpell, effectForRelation, multiplierForRelation } from './ContextualSkillEngine.mjs';",
    'GameState imports',
)
s = replace_once(
    s,
    "const merged = vocation.spells.map(spell => ({ ...spell }));",
    "const merged = vocation.spells.map(spell => contextualizeSpell({ ...spell }));",
    'base spell contextualization',
)
s = replace_once(
    s,
    "      if (matchIndex >= 0) merged[matchIndex] = next;\n      else if (merged.length < 8) merged.push(next);",
    "      for (const key of ['targetMode','allyEffect','enemyEffect','allyMultiplier','enemyMultiplier','selfMultiplier','dayMultiplier','nightMultiplier','drainPercent']) {\n        if (raw[key] !== undefined) next[key] = raw[key];\n      }\n      const contextualNext = contextualizeSpell(next);\n      if (matchIndex >= 0) merged[matchIndex] = contextualNext;\n      else if (merged.length < 8) merged.push(contextualNext);",
    'content spell contextualization',
)

cast_pattern = re.compile(r"  handleCast\(player, payload\) \{.*?\n  \}\n\n  handleUseItem", re.S)
cast_replacement = r'''  handleCast(player, payload) {
    const now = Date.now();
    const voc = VOCATIONS[player.vocation];
    if (!voc || !Number.isInteger(payload.spellIndex)) return false;
    const spell = contextualizeSpell(this.getSpellList(player.vocation)[payload.spellIndex]);
    if (!spell) return false;
    if (player.level < (spell.levelRequired || 1)) return false;
    if (now - (player.cooldowns[spell.name] || 0) < spell.cooldown) return false;
    if (player.mana < spell.mana) return false;

    const monsters = this.monstersByMap.get(player.mapId) || [];
    const requestedTargetId = typeof payload.targetId === 'string' && payload.targetId ? payload.targetId : player.targetId;
    const explicitPlayer = requestedTargetId ? this.players.get(requestedTargetId) : null;
    const explicitMonster = requestedTargetId ? monsters.find(m => m.id === requestedTargetId && !m.dead) : null;
    const maxRange = Math.max(0, Number(spell.range) || 0);
    const inRange = entity => entity?.id === player.id || Math.hypot(entity.x - player.x, entity.y - player.y) <= maxRange;
    const validMonster = monster => Boolean(monster && !monster.dead && (!monster.dungeonOwnerId || monster.dungeonOwnerId === player.id) && inRange(monster));
    const targets = [];

    if (spell.targetMode === 'self') {
      targets.push({ relation: 'self', entity: player, kind: 'player' });
    } else if (spell.targetMode === 'area') {
      for (const candidate of this.players.values()) {
        if (candidate.mapId === player.mapId && inRange(candidate)) {
          targets.push({ relation: candidate.id === player.id ? 'self' : 'ally', entity: candidate, kind: 'player' });
        }
      }
      for (const monster of monsters) {
        if (validMonster(monster)) targets.push({ relation: 'enemy', entity: monster, kind: 'monster' });
      }
    } else if (explicitPlayer && explicitPlayer.mapId === player.mapId && inRange(explicitPlayer)) {
      targets.push({ relation: explicitPlayer.id === player.id ? 'self' : 'ally', entity: explicitPlayer, kind: 'player' });
    } else if (validMonster(explicitMonster)) {
      targets.push({ relation: 'enemy', entity: explicitMonster, kind: 'monster' });
    } else if (spell.type === 'heal' || spell.type === 'buff') {
      targets.push({ relation: 'self', entity: player, kind: 'player' });
    } else {
      const nearest = monsters
        .filter(validMonster)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      if (nearest) targets.push({ relation: 'enemy', entity: nearest, kind: 'monster' });
    }

    const actionableTargets = targets.filter(target => effectForRelation(spell, target.relation) !== 'none');
    if (actionableTargets.length === 0) return false;

    player.mana -= spell.mana;
    player.cooldowns[spell.name] = now;
    player.stats.spellsCast++;
    this.progressSkill(player, 'magic', 1);
    if (requestedTargetId) player.targetId = requestedTargetId;

    const casterDerived = this.computeDerivedStats(player);
    const clock = createWorldClockSnapshot(now);
    const basePower = Math.max(0, Number(spell.damage) || 0) + Math.floor(casterDerived.totalMagic * (Number(spell.scalingCoeff) || 1) * 0.5);
    this.emitEvent(player.mapId, { kind: 'spell', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });

    for (const target of actionableTargets) {
      const effect = effectForRelation(spell, target.relation);
      const multiplier = multiplierForRelation(spell, target.relation, clock);
      if (multiplier <= 0) continue;

      if (target.kind === 'player' && effect === 'heal') {
        const receiver = target.entity;
        const receiverDerived = this.computeDerivedStats(receiver);
        const healAmount = Math.max(1, Math.floor(basePower * (1 + casterDerived.healBonus / 100) * multiplier));
        const before = receiver.hp;
        receiver.hp = Math.min(receiverDerived.totalMaxHp, receiver.hp + healAmount);
        const actual = Math.max(0, receiver.hp - before);
        player.stats.healingDone += actual;
        this.emitEvent(player.mapId, { kind: 'heal', targetId: receiver.id, amount: actual, text: `${spell.name} x${multiplier.toFixed(2)}`, pos: { x: receiver.x, y: receiver.y }, color: '#2ecc71' });
        continue;
      }

      if (target.kind === 'player' && effect === 'buff') {
        const receiver = target.entity;
        const validBuffs = new Set(['shield', 'haste', 'invisible', 'frenzy']);
        const buffType = validBuffs.has(spell.buffType) ? spell.buffType : 'shield';
        const defaults = { shield: 25, haste: 35, invisible: 1, frenzy: 25 };
        const duration = Math.floor(boundedNumber(spell.buffDuration, 1000, 60000, 8000));
        const rawValue = boundedNumber(spell.buffValue, 0, 100, defaults[buffType]);
        const value = boundedNumber(rawValue * multiplier, 0, 100, rawValue);
        receiver.buffs = this.getActiveBuffs(receiver, now).filter(buff => buff.type !== buffType);
        receiver.buffs.push({ id: `${buffType}_${now}_${player.id}`, type: buffType, name: spell.name, value, startTime: now, expiresAt: now + duration });
        this.emitEvent(player.mapId, { kind: 'buff', targetId: receiver.id, text: `${spell.name} x${multiplier.toFixed(2)}`, color: spell.color, pos: { x: receiver.x, y: receiver.y } });
        continue;
      }

      if (target.kind === 'monster' && (effect === 'damage' || effect === 'drain')) {
        const monster = target.entity;
        const rawDamage = Math.floor(basePower * multiplier);
        const damage = Math.max(1, rawDamage - Math.max(0, Number(monster.defense) || 0));
        monster.hp -= damage;
        player.stats.damageDealt += damage;
        this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: damage, text: `${spell.name} x${multiplier.toFixed(2)}`, pos: { x: monster.x, y: monster.y }, color: spell.color });
        if (effect === 'drain' && spell.drainPercent > 0) {
          const derivedNow = this.computeDerivedStats(player);
          const drained = Math.max(1, Math.floor(damage * spell.drainPercent / 100));
          const before = player.hp;
          player.hp = Math.min(derivedNow.totalMaxHp, player.hp + drained);
          const actual = Math.max(0, player.hp - before);
          player.stats.healingDone += actual;
          this.emitEvent(player.mapId, { kind: 'heal', targetId: player.id, amount: actual, text: `${spell.name} drain`, pos: { x: player.x, y: player.y }, color: '#c084fc' });
        }
        if (monster.hp <= 0) this.killMonster(player, monster);
      }
    }
    return true;
  }

  handleUseItem'''
s, count = cast_pattern.subn(cast_replacement, s, count=1)
if count != 1:
    raise SystemExit(f'handleCast replacement count={count}')

s = replace_once(
    s,
    "    const social = socialSystems.snapshot(player, this.players);\n    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official, social };",
    "    const social = socialSystems.snapshot(player, this.players);\n    const worldClock = createWorldClockSnapshot();\n    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official, social, worldClock };",
    'world clock snapshot',
)
write(path, s)

# -------------------------------------------------------------------
# Content Studio: contextual fields are editable and semantically bounded.
# -------------------------------------------------------------------
path = 'server/engine/ContentStudio.mjs'
s = read(path)
s = replace_once(
    s,
    "const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);",
    "const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);\nconst SPELL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);\nconst ALLY_EFFECTS = Object.freeze(['none', 'heal', 'buff']);\nconst ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);",
    'studio contextual constants',
)
s = replace_once(
    s,
    "    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('scalingCoeff', 'Scaling', 'number'),",
    "    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('scalingCoeff', 'Scaling', 'number'),\n    field('targetMode', 'Target mode', 'select', { optionKey: 'spellTargetModes' }),\n    field('allyEffect', 'Ally effect', 'select', { optionKey: 'allyEffects' }), field('enemyEffect', 'Enemy effect', 'select', { optionKey: 'enemyEffects' }),\n    field('allyMultiplier', 'Ally multiplier', 'number'), field('enemyMultiplier', 'Enemy multiplier', 'number'), field('selfMultiplier', 'Self multiplier', 'number'),\n    field('dayMultiplier', 'Day multiplier', 'number'), field('nightMultiplier', 'Night multiplier', 'number'), field('drainPercent', 'Drain %', 'number'),",
    'studio spell fields',
)
s = replace_once(
    s,
    "    if (spellType === 'buff' && !BUFF_TYPES.includes(String(record.buffType || ''))) return 'buff spells require a supported buffType';\n    return optionalColor(record);",
    "    if (spellType === 'buff' && !BUFF_TYPES.includes(String(record.buffType || ''))) return 'buff spells require a supported buffType';\n    if (record.targetMode !== undefined && record.targetMode !== '' && !SPELL_TARGET_MODES.includes(String(record.targetMode))) return 'targetMode is not supported';\n    if (record.allyEffect !== undefined && record.allyEffect !== '' && !ALLY_EFFECTS.includes(String(record.allyEffect))) return 'allyEffect is not supported';\n    if (record.enemyEffect !== undefined && record.enemyEffect !== '' && !ENEMY_EFFECTS.includes(String(record.enemyEffect))) return 'enemyEffect is not supported';\n    for (const key of ['allyMultiplier','enemyMultiplier','selfMultiplier']) { const error = numberIn(record, key, 0, 5); if (error) return error; }\n    for (const key of ['dayMultiplier','nightMultiplier']) { const error = numberIn(record, key, 0.25, 3); if (error) return error; }\n    { const error = numberIn(record, 'drainPercent', 0, 100); if (error) return error; }\n    return optionalColor(record);",
    'studio contextual validation',
)
s = replace_once(
    s,
    "    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], vocations: Object.keys(VOCATIONS).sort(),",
    "    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], spellTargetModes: [...SPELL_TARGET_MODES], allyEffects: [...ALLY_EFFECTS], enemyEffects: [...ENEMY_EFFECTS], vocations: Object.keys(VOCATIONS).sort(),",
    'studio contextual options',
)
write(path, s)

# -------------------------------------------------------------------
# Client contracts: clock snapshot + target-aware casts + spell metadata.
# -------------------------------------------------------------------
path = 'src/game/network.ts'
s = read(path)
s = replace_once(s, "  social?: any;\n}", "  social?: any;\n  worldClock?: any;\n}", 'network clock contract')
write(path, s)

path = 'src/game/ServerSync.ts'
s = read(path)
s = replace_once(s, "  social: any;\n}", "  social: any;\n  worldClock?: any;\n}", 'ServerSync clock contract')
s = replace_once(
    s,
    "  sendCast(spellIndex: number) {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'cast', payload: { spellIndex } });\n  }",
    "  sendCast(spellIndex: number, targetId?: string) {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'cast', payload: { spellIndex, ...(targetId ? { targetId } : {}) } });\n  }",
    'target-aware sendCast',
)
write(path, s)

path = 'src/game/types.ts'
s = read(path)
s = replace_once(
    s,
    "  costPercent?: number;        // % of max mana as cost (alt to flat mana)\n}",
    "  costPercent?: number;        // % of max mana as cost (alt to flat mana)\n  // Mor'ia 9.2 contextual skill contract (server authoritative online)\n  targetMode?: 'smart' | 'self' | 'target' | 'area';\n  allyEffect?: 'none' | 'heal' | 'buff';\n  enemyEffect?: 'none' | 'damage' | 'drain';\n  allyMultiplier?: number;\n  enemyMultiplier?: number;\n  selfMultiplier?: number;\n  dayMultiplier?: number;\n  nightMultiplier?: number;\n  drainPercent?: number;\n}",
    'Spell contextual fields',
)
write(path, s)

path = 'src/game/serverContentAdapters.ts'
s = read(path)
s = replace_once(
    s,
    "    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);",
    "    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    const targetModes: NonNullable<Spell['targetMode']>[] = ['smart','self','target','area'];\n    const allyEffects: NonNullable<Spell['allyEffect']>[] = ['none','heal','buff'];\n    const enemyEffects: NonNullable<Spell['enemyEffect']>[] = ['none','damage','drain'];\n    if (typeof record.targetMode === 'string' && targetModes.includes(record.targetMode as NonNullable<Spell['targetMode']>)) next.targetMode = record.targetMode as NonNullable<Spell['targetMode']>;\n    if (typeof record.allyEffect === 'string' && allyEffects.includes(record.allyEffect as NonNullable<Spell['allyEffect']>)) next.allyEffect = record.allyEffect as NonNullable<Spell['allyEffect']>;\n    if (typeof record.enemyEffect === 'string' && enemyEffects.includes(record.enemyEffect as NonNullable<Spell['enemyEffect']>)) next.enemyEffect = record.enemyEffect as NonNullable<Spell['enemyEffect']>;\n    if (record.allyMultiplier !== undefined) next.allyMultiplier = finiteSpellNumber(record.allyMultiplier, 0, 5, previous?.allyMultiplier ?? 1);\n    if (record.enemyMultiplier !== undefined) next.enemyMultiplier = finiteSpellNumber(record.enemyMultiplier, 0, 5, previous?.enemyMultiplier ?? 1);\n    if (record.selfMultiplier !== undefined) next.selfMultiplier = finiteSpellNumber(record.selfMultiplier, 0, 5, previous?.selfMultiplier ?? 1);\n    if (record.dayMultiplier !== undefined) next.dayMultiplier = finiteSpellNumber(record.dayMultiplier, 0.25, 3, previous?.dayMultiplier ?? 1);\n    if (record.nightMultiplier !== undefined) next.nightMultiplier = finiteSpellNumber(record.nightMultiplier, 0.25, 3, previous?.nightMultiplier ?? 1);\n    if (record.drainPercent !== undefined) next.drainPercent = finiteSpellNumber(record.drainPercent, 0, 100, previous?.drainPercent ?? 0);",
    'client spell content mapping',
)
write(path, s)

# -------------------------------------------------------------------
# GameScreen: use authoritative clock online; click players as skill targets.
# -------------------------------------------------------------------
path = 'src/components/GameScreen.tsx'
s = read(path)
s = replace_once(
    s,
    "import ActiveQuestTracker from './ActiveQuestTracker';",
    "import ActiveQuestTracker from './ActiveQuestTracker';\nimport WorldClockBadge from './WorldClockBadge';\nimport { legacyOverrideDarkness, localWorldClock, sanitizeWorldClock, type WorldClockSnapshot } from '../game/dayNight';",
    'GameScreen clock imports',
)
s = replace_once(
    s,
    "  const dayTimeOverrideRef = useRef(dayTimeOverride);",
    "  const dayTimeOverrideRef = useRef(dayTimeOverride);\n  const worldClockRef = useRef<WorldClockSnapshot>(localWorldClock());",
    'GameScreen clock ref',
)
s = s.replace(
    "    // Day/night cycle (1 cycle = 3 minutes)\n    dayTimeRef.current = (now / 1000) % 180;",
    "    // Day/night is server-owned online; offline mode uses the same 24-minute projection.\n    if (!serverSync.isActive()) worldClockRef.current = localWorldClock(now);\n    dayTimeRef.current = worldClockRef.current.minuteOfDay / 8;",
    1,
)
s = replace_once(
    s,
    "          const serverSocial = renderState.social;",
    "          const serverSocial = renderState.social;\n          worldClockRef.current = sanitizeWorldClock(renderState.worldClock, now);",
    'online world clock projection',
)
s = replace_once(
    s,
    "      serverSync.sendCast(idx);",
    "      serverSync.sendCast(idx, playerRef.current.targetId || undefined);",
    'target-aware client cast',
)
s = replace_once(
    s,
    "      const otherPlayer = serverPlayersRef.current.find((candidate: any) => candidate.x === tile.x && candidate.y === tile.y);\n      if (otherPlayer && officialState?.state?.pvp?.enabled) { serverSync.sendOfficial('pvp_attack', { targetId: otherPlayer.id }); return; }",
    "      const otherPlayer = serverPlayersRef.current.find((candidate: any) => candidate.x === tile.x && candidate.y === tile.y);\n      if (otherPlayer) {\n        p.targetId = otherPlayer.id;\n        setPlayer({ ...p });\n        if (officialState?.state?.pvp?.enabled) serverSync.sendOfficial('pvp_attack', { targetId: otherPlayer.id });\n        return;\n      }",
    'player skill targeting',
)
# Replace legacy night alpha calculation block while preserving admin override.
night_pattern = re.compile(r"      // Day/night overlay.*?ctx\.restore\(\);", re.S)
night_match = night_pattern.search(s)
if night_match:
    old = night_match.group(0)
    if 'nightAlpha' in old:
        new = "      // Authoritative day/night overlay. Admin override remains offline/debug presentation only.\n      const worldClock = worldClockRef.current;\n      const nightAlpha = legacyOverrideDarkness(dayTimeOverrideRef.current, worldClock.darkness);\n      if (nightAlpha > 0) {\n        ctx.save();\n        ctx.fillStyle = `rgba(10,10,40,${nightAlpha})`;\n        ctx.fillRect(0, 0, canvas.width, canvas.height);\n        ctx.restore();\n      }"
        s = s[:night_match.start()] + new + s[night_match.end():]
else:
    raise SystemExit('day/night overlay block missing')
# Put compact clock badge near existing overlays.
anchor = "          {/* Active Quest Tracker is extracted to keep GameScreen an orchestrator. */}"
if anchor in s:
    s = s.replace(anchor, "          <WorldClockBadge clock={worldClockRef.current} />\n\n" + anchor, 1)
else:
    raise SystemExit('WorldClockBadge insertion anchor missing')
write(path, s)

# -------------------------------------------------------------------
# Richer dawn/dusk presentation without changing authority.
# -------------------------------------------------------------------
path = 'src/game/worldAtmosphere.ts'
s = read(path)
# Existing function already consumes nightAlpha. Add warm transition tint inferred from alpha.
needle = "  if (profile.vignette > 0) {"
if needle in s:
    s = s.replace(needle, "  if (nightAlpha > 0.04 && nightAlpha < 0.5) {\n    ctx.save();\n    const transition = Math.max(0, 1 - Math.abs(nightAlpha - 0.275) / 0.275);\n    ctx.fillStyle = `rgba(222, 128, 72, ${0.055 * transition})`;\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    ctx.restore();\n  }\n\n" + needle, 1)
else:
    raise SystemExit('worldAtmosphere vignette anchor missing')
write(path, s)

# -------------------------------------------------------------------
# Tooltip: expose contextual behavior and day/night modifiers.
# -------------------------------------------------------------------
path = 'src/components/Tooltip.tsx'
s = read(path)
s = replace_once(
    s,
    "    piercePercent?: number;\n  };",
    "    piercePercent?: number;\n    targetMode?: string; allyEffect?: string; enemyEffect?: string;\n    allyMultiplier?: number; enemyMultiplier?: number; selfMultiplier?: number;\n    dayMultiplier?: number; nightMultiplier?: number; drainPercent?: number;\n  };",
    'tooltip contextual type',
)
s = replace_once(
    s,
    "        {(spell.variance ?? 0) > 0 && (\n          <div className=\"flex justify-between\"><span className=\"text-amber-200/70\">Variance:</span><span className=\"text-amber-100\">±{((spell.variance ?? 0) * 100).toFixed(0)}%</span></div>\n        )}",
    "        {(spell.variance ?? 0) > 0 && (\n          <div className=\"flex justify-between\"><span className=\"text-amber-200/70\">Variance:</span><span className=\"text-amber-100\">±{((spell.variance ?? 0) * 100).toFixed(0)}%</span></div>\n        )}\n        {(spell.allyEffect || spell.enemyEffect) && (\n          <div className=\"mt-1 border-t border-cyan-400/20 pt-1 space-y-0.5\">\n            <div className=\"font-bold text-cyan-200\">Contextual skill</div>\n            {spell.allyEffect && spell.allyEffect !== 'none' && <div>🤝 Ally: {spell.allyEffect} ×{(spell.allyMultiplier ?? 1).toFixed(2)}</div>}\n            {spell.enemyEffect && spell.enemyEffect !== 'none' && <div>⚔ Enemy: {spell.enemyEffect} ×{(spell.enemyMultiplier ?? 1).toFixed(2)}</div>}\n            {((spell.dayMultiplier ?? 1) !== 1 || (spell.nightMultiplier ?? 1) !== 1) && <div>☀ ×{(spell.dayMultiplier ?? 1).toFixed(2)} · 🌙 ×{(spell.nightMultiplier ?? 1).toFixed(2)}</div>}\n            {(spell.drainPercent ?? 0) > 0 && <div>🩸 Drain: {spell.drainPercent}%</div>}\n          </div>\n        )}",
    'tooltip contextual display',
)
write(path, s)

print('Mor\'ia 9.2 authoritative day/night and contextual skills applied')
