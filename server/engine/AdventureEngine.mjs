import { objectiveKey } from './ContentIntegrity.mjs';

const COMBO_WINDOW_MS = 8000;
const CACHE_EVERY = 3;

const CONTRACTS = Object.freeze([
  { id: 'eldoria_rat_sweep', mapId: 'eldoria', title: 'Vermin Sweep', icon: '🐀', targetLabel: 'Rats', targets: ['rat'], count: 6, rewardGold: 90, rewardXp: 130, levelRequired: 1, tier: 'bronze', description: 'Clear the alleys around Eldoria before the vermin spread.' },
  { id: 'eldoria_snake_nest', mapId: 'eldoria', title: 'Snake Nest', icon: '🐍', targetLabel: 'Snakes', targets: ['snake'], count: 5, rewardGold: 120, rewardXp: 170, levelRequired: 2, tier: 'bronze', description: 'Thin the snakes stalking the roads outside the capital.' },
  { id: 'frostpeak_wolf_pack', mapId: 'frostpeak', title: 'Wolf Pack', icon: '🐺', targetLabel: 'Wolves', targets: ['wolf'], count: 5, rewardGold: 220, rewardXp: 320, levelRequired: 7, tier: 'silver', description: 'Break the pack before it closes the mountain road.' },
  { id: 'frostpeak_bear_hunt', mapId: 'frostpeak', title: 'Bear Hunt', icon: '🐻', targetLabel: 'Bears', targets: ['bear'], count: 3, rewardGold: 300, rewardXp: 420, levelRequired: 9, tier: 'silver', description: 'Bring down the great bears roaming the frozen pass.' },
  { id: 'shadowfen_orc_patrol', mapId: 'shadowfen', title: 'Orc Patrol', icon: '👹', targetLabel: 'Orcs', targets: ['orc'], count: 5, rewardGold: 420, rewardXp: 620, levelRequired: 10, tier: 'gold', description: 'Ambush the patrols gathering in the cursed marsh.' },
  { id: 'shadowfen_bone_cleanup', mapId: 'shadowfen', title: 'Bone Cleanup', icon: '💀', targetLabel: 'Skeletons', targets: ['skeleton'], count: 6, rewardGold: 360, rewardXp: 560, levelRequired: 9, tier: 'gold', description: 'Put the restless dead back beneath the swamp.' },
  { id: 'emberhold_demon_purge', mapId: 'emberhold', title: 'Demon Purge', icon: '😈', targetLabel: 'Demons', targets: ['demon'], count: 3, rewardGold: 700, rewardXp: 1100, levelRequired: 20, tier: 'mythic', description: 'Purge the fiends feeding on Emberhold\'s volcanic scars.' },
  { id: 'emberhold_dragon_trial', mapId: 'emberhold', title: 'Dragon Trial', icon: '🐉', targetLabel: 'Dragon Lords', targets: ['dragon_lord', 'dragon lord'], count: 1, rewardGold: 1600, rewardXp: 2400, levelRequired: 25, tier: 'mythic', description: 'Face a Dragon Lord and return with proof of victory.' },
  { id: 'voidlands_ghost_hunt', mapId: 'voidlands', title: 'Ghost Hunt', icon: '👻', targetLabel: 'Ghosts', targets: ['ghost'], count: 6, rewardGold: 900, rewardXp: 1350, levelRequired: 25, tier: 'void', description: 'Silence the shades haunting the edge of reality.' },
  { id: 'voidlands_lich_bounty', mapId: 'voidlands', title: 'Lich Bounty', icon: '🧙', targetLabel: 'Liches', targets: ['lich'], count: 1, rewardGold: 2200, rewardXp: 3200, levelRequired: 30, tier: 'void', description: 'Destroy a Lich before its ritual tears the Voidlands open.' },
]);

const CONTRACT_BY_ID = new Map(CONTRACTS.map(contract => [contract.id, contract]));

export function createAdventureState() {
  return {
    active: null,
    streak: 0,
    completed: 0,
    bestCombo: 0,
    combo: { count: 0, lastKillAt: 0 },
  };
}

function ensureState(player) {
  if (!player.adventure || typeof player.adventure !== 'object' || Array.isArray(player.adventure)) {
    player.adventure = createAdventureState();
  }
  if (!player.adventure.combo || typeof player.adventure.combo !== 'object') {
    player.adventure.combo = { count: 0, lastKillAt: 0 };
  }
  return player.adventure;
}

function publicContract(contract) {
  return {
    id: contract.id,
    mapId: contract.mapId,
    title: contract.title,
    icon: contract.icon,
    targetLabel: contract.targetLabel,
    count: contract.count,
    rewardGold: contract.rewardGold,
    rewardXp: contract.rewardXp,
    levelRequired: contract.levelRequired,
    tier: contract.tier,
    description: contract.description,
  };
}

function monsterKeys(monster) {
  if (!monster || typeof monster !== 'object') return new Set();
  return new Set([
    monster.name,
    monster.contentSourceId,
    monster.templateId,
  ].map(objectiveKey).filter(Boolean));
}

class AdventureEngine {
  initializePlayer(player) {
    player.adventure = createAdventureState();
    return player.adventure;
  }

  getBoard(player) {
    return CONTRACTS
      .filter(contract => contract.mapId === player.mapId)
      .map(contract => ({ ...publicContract(contract), locked: player.level < contract.levelRequired }));
  }

  start(player, contractId) {
    const state = ensureState(player);
    if (state.active) return { ok: false, error: 'Finish or abandon your current hunt first.' };
    const contract = typeof contractId === 'string' ? CONTRACT_BY_ID.get(contractId) : null;
    if (!contract) return { ok: false, error: 'Unknown hunt contract.' };
    if (contract.mapId !== player.mapId) return { ok: false, error: `Travel to ${contract.mapId} to start this hunt.` };
    if (player.level < contract.levelRequired) return { ok: false, error: `Requires level ${contract.levelRequired}.` };
    state.active = { contractId: contract.id, progress: 0, ready: false, startedAt: Date.now() };
    return { ok: true, contract: publicContract(contract) };
  }

  abandon(player) {
    const state = ensureState(player);
    if (!state.active) return { ok: false, error: 'No active hunt to abandon.' };
    const contract = CONTRACT_BY_ID.get(state.active.contractId);
    state.active = null;
    return { ok: true, contract: contract ? publicContract(contract) : null };
  }

  onMonsterKill(player, monster, now = Date.now()) {
    const state = ensureState(player);
    const withinCombo = state.combo.lastKillAt > 0 && now - state.combo.lastKillAt <= COMBO_WINDOW_MS;
    state.combo.count = withinCombo ? Math.min(99, state.combo.count + 1) : 1;
    state.combo.lastKillAt = now;
    state.bestCombo = Math.max(state.bestCombo || 0, state.combo.count);
    const comboMultiplier = 1 + Math.min(5, Math.max(0, state.combo.count - 1)) * 0.05;

    let progress = null;
    let becameReady = false;
    const active = state.active;
    const contract = active ? CONTRACT_BY_ID.get(active.contractId) : null;
    if (active && contract && contract.mapId === player.mapId && !active.ready) {
      const killed = monsterKeys(monster);
      const wanted = new Set(contract.targets.map(objectiveKey));
      if (Array.from(killed).some(key => wanted.has(key))) {
        const gain = monster?.type === 'boss' ? 2 : 1;
        active.progress = Math.min(contract.count, Math.max(0, Number(active.progress) || 0) + gain);
        if (active.progress >= contract.count) {
          active.ready = true;
          becameReady = true;
        }
        progress = {
          contractId: contract.id,
          title: contract.title,
          current: active.progress,
          needed: contract.count,
          ready: active.ready,
        };
      }
    }

    return {
      comboCount: state.combo.count,
      comboMultiplier,
      xpMultiplier: comboMultiplier,
      progress,
      becameReady,
    };
  }

  claim(player) {
    const state = ensureState(player);
    const active = state.active;
    const contract = active ? CONTRACT_BY_ID.get(active.contractId) : null;
    if (!active || !contract) return { ok: false, error: 'No active hunt.' };
    if (!active.ready || Number(active.progress) < contract.count) return { ok: false, error: 'Hunt objective is not complete yet.' };

    const multiplier = 1 + Math.min(5, Math.max(0, Number(state.streak) || 0)) * 0.10;
    const gold = Math.floor(contract.rewardGold * multiplier);
    const xp = Math.floor(contract.rewardXp * multiplier);
    state.completed = Math.max(0, Number(state.completed) || 0) + 1;
    state.streak = Math.min(999, Math.max(0, Number(state.streak) || 0) + 1);
    const cache = state.completed % CACHE_EVERY === 0;
    state.active = null;
    return { ok: true, contract: publicContract(contract), gold, xp, multiplier, cache, streak: state.streak, completed: state.completed };
  }

  serialize(player, now = Date.now()) {
    const state = ensureState(player);
    const contract = state.active ? CONTRACT_BY_ID.get(state.active.contractId) : null;
    const comboLive = state.combo.lastKillAt > 0 && now - state.combo.lastKillAt <= COMBO_WINDOW_MS;
    const comboCount = comboLive ? state.combo.count : 0;
    return {
      board: this.getBoard(player),
      active: contract ? {
        ...publicContract(contract),
        progress: Math.max(0, Math.min(contract.count, Number(state.active.progress) || 0)),
        ready: Boolean(state.active.ready),
        startedAt: Number(state.active.startedAt) || 0,
      } : null,
      streak: Math.max(0, Number(state.streak) || 0),
      completed: Math.max(0, Number(state.completed) || 0),
      bestCombo: Math.max(0, Number(state.bestCombo) || 0),
      combo: {
        count: comboCount,
        multiplier: 1 + Math.min(5, Math.max(0, comboCount - 1)) * 0.05,
      },
      nextCacheIn: CACHE_EVERY - (Math.max(0, Number(state.completed) || 0) % CACHE_EVERY),
    };
  }

  exportState(player) {
    const state = ensureState(player);
    return {
      active: state.active ? {
        contractId: state.active.contractId,
        progress: Math.max(0, Math.floor(Number(state.active.progress) || 0)),
        ready: Boolean(state.active.ready),
        startedAt: Number(state.active.startedAt) || Date.now(),
      } : null,
      streak: Math.max(0, Math.floor(Number(state.streak) || 0)),
      completed: Math.max(0, Math.floor(Number(state.completed) || 0)),
      bestCombo: Math.max(0, Math.floor(Number(state.bestCombo) || 0)),
    };
  }

  restorePlayer(player, saved) {
    const state = createAdventureState();
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      state.streak = Math.max(0, Math.floor(Number(saved.streak) || 0));
      state.completed = Math.max(0, Math.floor(Number(saved.completed) || 0));
      state.bestCombo = Math.max(0, Math.floor(Number(saved.bestCombo) || 0));
      const rawActive = saved.active;
      if (rawActive && typeof rawActive === 'object' && typeof rawActive.contractId === 'string') {
        const contract = CONTRACT_BY_ID.get(rawActive.contractId);
        if (contract) {
          const progress = Math.max(0, Math.min(contract.count, Math.floor(Number(rawActive.progress) || 0)));
          state.active = {
            contractId: contract.id,
            progress,
            ready: progress >= contract.count || Boolean(rawActive.ready),
            startedAt: Number(rawActive.startedAt) > 0 ? Number(rawActive.startedAt) : Date.now(),
          };
        }
      }
    }
    player.adventure = state;
    return state;
  }
}

export const adventureEngine = new AdventureEngine();
export { CONTRACTS, COMBO_WINDOW_MS, CACHE_EVERY };
