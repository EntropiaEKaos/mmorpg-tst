// ===================================================================
//  QUEST ENGINE — Server-authoritative quest management
//  Validates objectives, tracks progress, distributes rewards.
//  Clients CANNOT fake quest completion.
// ===================================================================

import { contentDB } from './ContentDB.mjs';

class QuestEngine {
  constructor() {
    this.activeQuests = new Map();
    this.completedQuests = new Map();
  }

  getPlayerQuests(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed = Array.from(this.completedQuests.get(playerId) || new Set());
    return { active, completed };
  }

  acceptQuest(playerId, questId) {
    const quest = contentDB.get('quests').find(q => q.id === questId);
    if (!quest) return { success: false, reason: 'Quest not found' };

    const player = this.getPlayer(playerId);
    if (!player) return { success: false, reason: 'Player not found' };
    if (player.level < quest.levelRequired) {
      return { success: false, reason: `Requires level ${quest.levelRequired}` };
    }

    const completed = this.completedQuests.get(playerId) || new Set();
    for (const reqId of quest.requires || []) {
      if (!completed.has(reqId)) return { success: false, reason: 'Prerequisites not met' };
    }

    const active = this.activeQuests.get(playerId) || [];
    if (active.some(q => q.questId === questId)) return { success: false, reason: 'Already active' };
    if (completed.has(questId)) return { success: false, reason: 'Already completed' };

    active.push({ questId, progress: { [quest.target]: 0 }, startedAt: Date.now() });
    this.activeQuests.set(playerId, active);
    return { success: true, quest };
  }

  progressQuest(playerId, targetType, amount = 1) {
    const active = this.activeQuests.get(playerId) || [];
    const progressed = [];
    for (const q of active) {
      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);
      if (!quest) continue;
      if (quest.target === targetType) {
        q.progress[targetType] = Math.max(0, (q.progress[targetType] || 0) + amount);
        const needed = quest.count;
        const current = q.progress[targetType];
        progressed.push({ questId: q.questId, name: quest.name, current, needed });
      }
    }
    return progressed;
  }

  checkCompletion(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed = [];
    for (const q of active) {
      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);
      if (!quest) continue;
      const current = q.progress[quest.target] || 0;
      if (current >= quest.count) completed.push({ ...q, quest });
    }
    return completed;
  }

  completeQuest(playerId, questId) {
    const active = this.activeQuests.get(playerId) || [];
    const qIndex = active.findIndex(q => q.questId === questId);
    if (qIndex < 0) return { success: false, reason: 'Quest not active' };

    const q = active[qIndex];
    const quest = contentDB.get('quests').find(qd => qd.id === questId);
    if (!quest) return { success: false, reason: 'Quest not found' };

    const current = q.progress[quest.target] || 0;
    if (current < quest.count) return { success: false, reason: 'Not complete yet' };

    active.splice(qIndex, 1);
    this.activeQuests.set(playerId, active);

    if (!this.completedQuests.has(playerId)) this.completedQuests.set(playerId, new Set());
    this.completedQuests.get(playerId).add(questId);

    return {
      success: true,
      quest,
      rewards: {
        gold: Number(quest.rewardGold) || 0,
        xp: Number(quest.rewardXp) || 0,
        item: quest.rewardItem,
      },
    };
  }

  getPlayer(playerId) {
    return globalThis.__players?.get(playerId) || null;
  }

  registerPlayers(playerMap) {
    globalThis.__players = playerMap;
  }

  onMonsterKill(playerId, monsterName) {
    const progressed = this.progressQuest(playerId, monsterName);
    const completed = this.checkCompletion(playerId);
    return { progressed, completed };
  }

  // Compact persistence shape. Content metadata is intentionally not copied into
  // the player database; it is resolved from the authoritative content DB on load.
  exportState(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed = Array.from(this.completedQuests.get(playerId) || new Set());
    return {
      active: active.map(q => ({
        questId: q.questId,
        progress: { ...(q.progress || {}) },
        startedAt: Number.isFinite(q.startedAt) ? q.startedAt : Date.now(),
      })),
      completed,
    };
  }

  restorePlayer(playerId, saved) {
    const allQuests = contentDB.get('quests');
    const known = new Map(allQuests.map(q => [q.id, q]));
    const completed = new Set();

    if (Array.isArray(saved?.completed)) {
      for (const questId of saved.completed) {
        if (typeof questId === 'string' && known.has(questId)) completed.add(questId);
      }
    }

    const active = [];
    const seen = new Set();
    if (Array.isArray(saved?.active)) {
      for (const raw of saved.active) {
        if (!raw || typeof raw !== 'object' || typeof raw.questId !== 'string') continue;
        if (seen.has(raw.questId) || completed.has(raw.questId)) continue;
        const quest = known.get(raw.questId);
        if (!quest) continue;
        const rawValue = Number(raw.progress?.[quest.target]);
        const current = Number.isFinite(rawValue)
          ? Math.max(0, Math.min(Number(quest.count) || 0, Math.floor(rawValue)))
          : 0;
        active.push({
          questId: raw.questId,
          progress: { [quest.target]: current },
          startedAt: Number.isFinite(raw.startedAt) && raw.startedAt > 0 ? raw.startedAt : Date.now(),
        });
        seen.add(raw.questId);
      }
    }

    if (active.length > 0) this.activeQuests.set(playerId, active);
    else this.activeQuests.delete(playerId);
    if (completed.size > 0) this.completedQuests.set(playerId, completed);
    else this.completedQuests.delete(playerId);
  }

  clearPlayer(playerId) {
    this.activeQuests.delete(playerId);
    this.completedQuests.delete(playerId);
  }

  // Snapshot/UI shape with authoritative content metadata resolved at read time.
  serialize(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed = Array.from(this.completedQuests.get(playerId) || new Set());
    return {
      active: active.map(q => {
        const quest = contentDB.get('quests').find(qd => qd.id === q.questId);
        return {
          questId: q.questId,
          name: quest?.name || q.questId,
          description: quest?.description || '',
          target: quest?.target || '',
          current: q.progress[quest?.target || ''] || 0,
          needed: quest?.count || 0,
          levelRequired: quest?.levelRequired || 1,
        };
      }),
      completed,
    };
  }
}

export const questEngine = new QuestEngine();