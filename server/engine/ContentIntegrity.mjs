import { VOCATIONS } from './Vocations.mjs';
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
