import type { Monster, NPC, Quest, Spell } from './types';
import { MAPS, MAP_HEIGHT, MAP_WIDTH } from './maps';
import type { CustomMonster, CustomNPC } from './content';

export function customNpcToRuntime(npc: CustomNPC): NPC {
  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper', 'taskmaster', 'stablemaster', 'outfitter', 'realtor'];
  const role: NPC['role'] = validRoles.includes(npc.role as NPC['role']) ? npc.role as NPC['role'] : 'guard';
  const options: NPC['dialogues'][number]['options'] = [{ text: 'Farewell.', action: 'bye' }];
  if (role === 'banker') options.unshift({ text: 'Bank & depot', action: 'bank' });
  if (role === 'trainer') options.unshift({ text: 'Train me', action: 'train' });
  if (role === 'innkeeper') {
    options.unshift({ text: 'Food & drinks', action: 'food' });
    options.unshift({ text: 'Rest (50 gold)', action: 'heal' });
  }
  if (['taskmaster','stablemaster','outfitter','realtor'].includes(role)) options.unshift({ text: 'Life & Style', action: 'life' });
  return {
    id: npc.id, name: npc.name, pos: { x: npc.posX, y: npc.posY },
    emoji: npc.emoji, color: npc.color, role,
    dialogues: [{ text: npc.dialogueText || 'Greetings, traveler!', options }],
  };
}

export function customMonsterToRuntime(monster: CustomMonster): Monster {
  const pos = { x: monster.posX, y: monster.posY };
  return {
    id: monster.id, name: monster.name, pos: { ...pos }, hp: monster.hp, maxHp: monster.hp,
    attack: monster.attack, defense: monster.defense, speed: monster.speed, xp: monster.xp,
    color: monster.color, emoji: monster.emoji, lastMove: 0, lastAttack: 0,
    respawnPos: { ...pos }, dead: false, respawnAt: 0, size: monster.size,
    level: monster.level, type: monster.type,
  };
}

export const customContentOnMap = <T extends { mapId?: string }>(content: T[], mapId: string) =>
  content.filter((entry) => (entry.mapId || 'eldoria') === mapId);

export function serverNpcToClient(raw: any, quests: Quest[]): { mapId: string; npc: NPC } | null {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) return null;
  const x = Math.floor(Number(raw.posX));
  const y = Math.floor(Number(raw.posY));
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;
  const mapId = typeof raw.mapId === 'string' && MAPS[raw.mapId] ? raw.mapId : 'eldoria';
  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper', 'taskmaster', 'stablemaster', 'outfitter', 'realtor'];
  const role: NPC['role'] = validRoles.includes(raw.role as NPC['role']) ? raw.role as NPC['role'] : 'guard';
  const options: NPC['dialogues'][number]['options'] = quests
    .filter((quest) => quest.npcId === raw.id)
    .map((quest) => ({ text: `📜 ${quest.name}`, action: 'quest' as const, questId: quest.id }));
  if (['taskmaster','stablemaster','outfitter','realtor'].includes(role)) options.unshift({ text: '🏠 Life & Style', action: 'life' });
  options.push({ text: 'Farewell.', action: 'bye' });
  return {
    mapId,
    npc: {
      id: raw.id.trim(),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : raw.id.trim(),
      pos: { x, y },
      emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji.slice(0, 8) : '🧙',
      color: typeof raw.color === 'string' && raw.color ? raw.color : '#9bd4ff',
      role,
      dialogues: [{
        text: typeof raw.dialogue === 'string' && raw.dialogue.trim() ? raw.dialogue.trim() : 'Greetings, traveler!',
        options,
      }],
    },
  };
}

const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe', 'buff'];
const SERVER_BUFF_TYPES: NonNullable<Spell['buffType']>[] = ['shield', 'haste', 'invisible', 'frenzy'];

export function spellContentSlug(value: unknown): string {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function finiteSpellNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

export function mergeServerSpells(vocationId: string, baseSpells: Spell[], content: unknown): Spell[] {
  const merged = baseSpells.map((spell) => ({ ...spell }));
  if (!Array.isArray(content)) return merged;

  for (const raw of content) {
    if (!raw || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const rawVocation = typeof record.vocation === 'string' ? record.vocation.trim().toLowerCase() : '';
    if (rawVocation !== vocationId) continue;
    if (typeof record.id !== 'string' || !record.id.trim()) continue;
    if (typeof record.name !== 'string' || !record.name.trim()) continue;
    const type = typeof record.type === 'string' && SERVER_SPELL_TYPES.includes(record.type as Spell['type'])
      ? record.type as Spell['type']
      : null;
    if (!type) continue;

    const contentId = record.id.trim().slice(0, 100);
    const name = record.name.trim().slice(0, 100);
    const matchIndex = merged.findIndex((spell) =>
      spellContentSlug(spell.name) === spellContentSlug(contentId) || spellContentSlug(spell.name) === spellContentSlug(name)
    );
    const previous = matchIndex >= 0 ? merged[matchIndex] : undefined;
    const rawColor = typeof record.color === 'string' ? record.color : '';
    const next: Spell = {
      ...(previous || {} as Spell),
      id: previous?.id || `server_${contentId}`,
      name,
      icon: typeof record.icon === 'string' && record.icon ? record.icon.slice(0, 8) : (previous?.icon || '✨'),
      mana: Math.floor(finiteSpellNumber(record.mana, 0, 100_000, previous?.mana ?? 10)),
      cooldown: Math.floor(finiteSpellNumber(record.cooldown, 250, 600_000, previous?.cooldown ?? 1500)),
      damage: Math.floor(finiteSpellNumber(record.damage, 0, 10_000_000, previous?.damage ?? 0)),
      range: finiteSpellNumber(record.range, 0, 20, previous?.range ?? 1),
      lastCast: previous?.lastCast ?? 0,
      color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : (previous?.color || '#9bd4ff'),
      type,
      levelRequired: Math.floor(finiteSpellNumber(record.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),
    };
    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);
    const targetModes: NonNullable<Spell['targetMode']>[] = ['smart','self','target','area'];
    const allyEffects: NonNullable<Spell['allyEffect']>[] = ['none','heal','buff'];
    const enemyEffects: NonNullable<Spell['enemyEffect']>[] = ['none','damage','drain'];
    if (typeof record.targetMode === 'string' && targetModes.includes(record.targetMode as NonNullable<Spell['targetMode']>)) next.targetMode = record.targetMode as NonNullable<Spell['targetMode']>;
    if (typeof record.allyEffect === 'string' && allyEffects.includes(record.allyEffect as NonNullable<Spell['allyEffect']>)) next.allyEffect = record.allyEffect as NonNullable<Spell['allyEffect']>;
    if (typeof record.enemyEffect === 'string' && enemyEffects.includes(record.enemyEffect as NonNullable<Spell['enemyEffect']>)) next.enemyEffect = record.enemyEffect as NonNullable<Spell['enemyEffect']>;
    if (record.allyMultiplier !== undefined) next.allyMultiplier = finiteSpellNumber(record.allyMultiplier, 0, 5, previous?.allyMultiplier ?? 1);
    if (record.enemyMultiplier !== undefined) next.enemyMultiplier = finiteSpellNumber(record.enemyMultiplier, 0, 5, previous?.enemyMultiplier ?? 1);
    if (record.selfMultiplier !== undefined) next.selfMultiplier = finiteSpellNumber(record.selfMultiplier, 0, 5, previous?.selfMultiplier ?? 1);
    if (record.dayMultiplier !== undefined) next.dayMultiplier = finiteSpellNumber(record.dayMultiplier, 0.25, 3, previous?.dayMultiplier ?? 1);
    if (record.nightMultiplier !== undefined) next.nightMultiplier = finiteSpellNumber(record.nightMultiplier, 0.25, 3, previous?.nightMultiplier ?? 1);
    if (record.drainPercent !== undefined) next.drainPercent = finiteSpellNumber(record.drainPercent, 0, 100, previous?.drainPercent ?? 0);
    if (type === 'buff') {
      const requestedBuffType = typeof record.buffType === 'string'
        ? record.buffType.trim().toLowerCase() as NonNullable<Spell['buffType']>
        : undefined;
      next.buffType = requestedBuffType && SERVER_BUFF_TYPES.includes(requestedBuffType)
        ? requestedBuffType
        : (previous?.buffType && SERVER_BUFF_TYPES.includes(previous.buffType) ? previous.buffType : 'shield');
      next.buffDuration = Math.floor(finiteSpellNumber(record.buffDuration, 1000, 60_000, previous?.buffDuration ?? 8000));
      const defaultBuffValue = next.buffType === 'haste' ? 35 : next.buffType === 'invisible' ? 1 : 25;
      next.buffValue = finiteSpellNumber(record.buffValue, 0, 100, previous?.buffValue ?? defaultBuffValue);
    }
    if (matchIndex >= 0) merged[matchIndex] = next;
    else if (merged.length < 8) merged.push(next);
  }
  return merged;
}

export function serverQuestToClient(raw: any): Quest | null {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) return null;
  const target = typeof raw.target === 'string' && raw.target.trim() ? raw.target.trim() : 'objective';
  const count = Math.max(1, Math.floor(Number(raw.count) || 1));
  return {
    id: raw.id.trim(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : raw.id.trim(),
    description: typeof raw.description === 'string' ? raw.description : '',
    npcId: typeof raw.npcId === 'string' ? raw.npcId : '',
    objectives: [{ type: 'kill', target, targetName: target, count, current: 0 }],
    rewards: {
      xp: Math.max(0, Math.floor(Number(raw.rewardXp) || 0)),
      gold: Math.max(0, Math.floor(Number(raw.rewardGold) || 0)),
    },
    requires: Array.isArray(raw.requires) ? raw.requires.filter((id: unknown): id is string => typeof id === 'string') : [],
    levelRequired: Math.max(1, Math.floor(Number(raw.levelRequired) || 1)),
  };
}
