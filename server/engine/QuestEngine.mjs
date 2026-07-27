// ===================================================================
//  QUEST ENGINE — Server-authoritative quest management
//  Validates objectives, tracks progress, distributes rewards.
//  Clients CANNOT fake quest completion.
// ===================================================================

import { contentDB } from './ContentDB.mjs';

class QuestEngine {
  constructor() {
    // Active quests: playerId -> { questId, progress: { target: count }, startedAt }
    this.activeQuests = new Map();
    // Completed: playerId -> Set<questId>
    this.completedQuests = new Map();
  }

  // ===== PLAYER QUEST STATE =====
  getPlayerQuests(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed = Array.from(this.completedQuests.get(playerId) || new Set());
    return { active, completed };
  }

  // ===== ACCEPT QUEST =====
  acceptQuest(playerId, questId) {
    const quest = contentDB.get('quests').find(q => q.id === questId);
    if (!quest) return { success: false, reason: 'Quest not found' };

    const player = this.getPlayer(playerId);
    if (!player) return { success: false, reason: 'Player not found' };

    // Check level requirement
    if (player.level < quest.levelRequired) {
      return { success: false, reason: `Requires level ${quest.levelRequired}` };
    }

    // Check prerequisites
    const completed = this.completedQuests.get(playerId) || new Set();
    for (const reqId of quest.requires || []) {
      if (!completed.has(reqId)) {
        return { success: false, reason: 'Prerequisites not met' };
      }
    }

    // Check not already active/completed
    const active = this.activeQuests.get(playerId) || [];
    if (active.some(q => q.questId === questId)) return { success: false, reason: 'Already active' };
    if (completed.has(questId)) return { success: false, reason: 'Already completed' };

    // Start quest
    if (!this.activeQuests.has(playerId)) this.activeQuests.set(playerId, []);
    active.push({
      questId,
      progress: { [quest.target]: 0 },
      startedAt: Date.now(),
    });
    this.activeQuests.set(playerId, active);

    return { success: true, quest };
  }

  // ===== PROGRESS QUEST (called when player kills monster/fish/gathers) =====
  progressQuest(playerId, targetType, amount = 1) {
    const active = this.activeQuests.get(playerId) || [];
    let progressed = [];
    for (const q of active) {
      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);
      if (!quest) continue;
      if (quest.target === targetType) {
        q.progress[targetType] = (q.progress[targetType] || 0) + amount;
        const needed = quest.count;
        const current = q.progress[targetType];
        progressed.push({ questId: q.questId, name: quest.name, current, needed });
      }
    }
    return progressed;
  }

  // ===== CHECK COMPLETION =====
  checkCompletion(playerId) {
    const active = this.activeQuests.get(playerId) || [];
    const completed: any[] = [];
    for (const q of active) {
      const quest = contentDB.get('quests').find(qd => qd.id === q.questId);
      if (!quest) continue;
      const current = q.progress[quest.target] || 0;
      if (current >= quest.count) {
        completed.push({ ...q, quest });
      }
    }
    return completed;
  }

  // ===== COMPLETE QUEST =====
  completeQuest(playerId, questId) {
    const active = this.activeQuests.get(playerId) || [];
    const qIndex = active.findIndex(q => q.questId === questId);
    if (qIndex < 0) return { success: false, reason: 'Quest not active' };

    const q = active[qIndex];
    const quest = contentDB.get('quests').find(qd => qd.id === questId);
    if (!quest) return { success: false, reason: 'Quest not found' };

    // Check if actually complete
    const current = q.progress[quest.target] || 0;
    if (current < quest.count) return { success: false, reason: 'Not complete yet' };

    // Remove from active
    active.splice(qIndex, 1);
    this.activeQuests.set(playerId, active);

    // Add to completed
    if (!this.completedQuests.has(playerId)) this.completedQuests.set(playerId, new Set());
    this.completedQuests.get(playerId).add(questId);

    // Return rewards
    return {
      success: true,
      quest,
      rewards: {
        gold: quest.rewardGold,
        xp: quest.rewardXp,
        item: quest.rewardItem,
      },
    };
  }

  // ===== HELPERS =====
  getPlayer(playerId) {
    // This will be set by the GameEngine
    return globalThis.__players?.get(playerId) || null;
  }

  // Register the player map so we can look up players
  registerPlayers(playerMap) {
    globalThis.__players = playerMap;
  }

  // Called by GameEngine on monster kill
  onMonsterKill(playerId, monsterName) {
    const progressed = this.progressQuest(playerId, monsterName);
    const completed = this.checkCompletion(playerId);
    return { progressed, completed };
  }

  // Serialize for client sync
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
