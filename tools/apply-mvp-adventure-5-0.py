from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Server-side Adventure Engine: repeatable hunt contracts + momentum.
# ---------------------------------------------------------------------
Path('server/engine/AdventureEngine.mjs').write_text(r'''import { objectiveKey } from './ContentIntegrity.mjs';

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
''')

# ---------------------------------------------------------------------
# Server GameState integration.
# ---------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()
s = replace_once(s,
"import { rollLoot, getStarterInventory } from './Items.mjs';\n",
"import { rollLoot, getStarterInventory, buildEquipmentLootPool } from './Items.mjs';\n",
'items import')
s = replace_once(s,
"import { questEngine } from './QuestEngine.mjs';\n",
"import { questEngine } from './QuestEngine.mjs';\nimport { adventureEngine, createAdventureState } from './AdventureEngine.mjs';\n",
'adventure import')
s = replace_once(s,
"      mounted: false, professions: {}, reputation: { town: 0 }, talents: {},\n      stats: { monstersKilled: 0, damageDealt: 0, damageTaken: 0, healingDone: 0, goldEarned: 0, deaths: 0, levelUps: 0, spellsCast: 0 },\n",
"      mounted: false, professions: {}, reputation: { town: 0 }, talents: {},\n      adventure: createAdventureState(),\n      stats: { monstersKilled: 0, damageDealt: 0, damageTaken: 0, healingDone: 0, goldEarned: 0, deaths: 0, levelUps: 0, spellsCast: 0, adventuresCompleted: 0 },\n",
'player adventure state')
s = replace_once(s,
"      case 'talent_reset': return this.handleTalentReset(player);\n      case 'quest_accept': return this.handleQuestAccept(player, payload);\n",
"      case 'talent_reset': return this.handleTalentReset(player);\n      case 'adventure_start': return this.handleAdventureStart(player, payload);\n      case 'adventure_abandon': return this.handleAdventureAbandon(player);\n      case 'adventure_claim': return this.handleAdventureClaim(player);\n      case 'quest_accept': return this.handleQuestAccept(player, payload);\n",
'adventure intents')
s = replace_once(s,
"    const derived = this.computeDerivedStats(player);\n    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100));\n",
"    const derived = this.computeDerivedStats(player);\n    const adventureKill = adventureEngine.onMonsterKill(player, monster);\n    const xpGain = Math.floor(monster.xp * (1 + derived.xpBonus / 100) * adventureKill.xpMultiplier);\n",
'adventure kill multiplier')
s = replace_once(s,
"    for (const comp of questResult.completed) {\n      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y } });\n    }\n\n    const loot = rollLoot(monster, derived.goldBonus, this.contentItems);\n",
"    for (const comp of questResult.completed) {\n      this.emitEvent(player.mapId, { kind: 'quest_complete', targetId: player.id, text: `✅ ${comp.quest.name} COMPLETE!`, color: '#2ecc71', pos: { x: player.x, y: player.y } });\n    }\n\n    if (adventureKill.comboCount > 1) {\n      this.emitEvent(player.mapId, { kind: 'adventure_combo', targetId: player.id, text: `${adventureKill.comboCount}x MOMENTUM · +${Math.round((adventureKill.comboMultiplier - 1) * 100)}% XP`, color: '#ffb84d', pos: { x: player.x, y: player.y } });\n    }\n    if (adventureKill.progress) {\n      const p = adventureKill.progress;\n      this.emitEvent(player.mapId, { kind: 'adventure_progress', targetId: player.id, text: `⚔ ${p.title}: ${p.current}/${p.needed}`, color: '#7dd3fc', pos: { x: player.x, y: player.y } });\n    }\n    if (adventureKill.becameReady) {\n      this.emitEvent(player.mapId, { kind: 'adventure_ready', targetId: player.id, text: '🏆 Hunt complete! Open Hunts (H) to claim your reward.', color: '#ffd87b', pos: { x: player.x, y: player.y } });\n    }\n\n    const loot = rollLoot(monster, derived.goldBonus, this.contentItems);\n",
'adventure kill events')

adventure_methods = r'''  handleAdventureStart(player, payload) {
    const result = adventureEngine.start(player, payload.contractId);
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: result.ok ? `⚔ Hunt started: ${result.contract.title}` : `❌ ${result.error}`,
      color: result.ok ? '#7dd3fc' : '#ff6060', pos: { x: player.x, y: player.y },
    });
    return result.ok;
  }

  handleAdventureAbandon(player) {
    const result = adventureEngine.abandon(player);
    this.emitEvent(player.mapId, {
      kind: 'system', targetId: player.id,
      text: result.ok ? 'Hunt abandoned.' : `❌ ${result.error}`,
      color: result.ok ? '#cbd5e1' : '#ff6060', pos: { x: player.x, y: player.y },
    });
    return result.ok;
  }

  handleAdventureClaim(player) {
    const result = adventureEngine.claim(player);
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.error}`, color: '#ff6060', pos: { x: player.x, y: player.y } });
      return false;
    }

    player.gold += result.gold;
    player.xp += result.xp;
    player.stats.goldEarned += result.gold;
    player.stats.adventuresCompleted = Math.max(0, Number(player.stats.adventuresCompleted) || 0) + 1;

    let cacheItem = null;
    if (result.cache) {
      const pool = buildEquipmentLootPool(this.contentItems)
        .filter(item => (Number(item.level) || 1) <= player.level + 3)
        .sort((a, b) => Math.abs((Number(a.level) || 1) - player.level) - Math.abs((Number(b.level) || 1) - player.level))
        .slice(0, 6);
      if (pool.length > 0) {
        const reward = pool[Math.floor(Math.random() * pool.length)];
        cacheItem = reward.name;
        player.inventory.push({
          id: `hunt_cache_${Date.now()}_${Math.random()}`,
          name: reward.name, icon: reward.icon, quantity: 1, value: reward.value || 0,
          type: 'equipment', rarity: reward.rarity, description: reward.description,
          equipment: { ...reward, sockets: 0, socketedGems: [] },
        });
      }
    }

    const voc = VOCATIONS[player.vocation];
    while (voc && player.xp >= player.xpNext) {
      player.xp -= player.xpNext;
      player.level++;
      player.xpNext = Math.floor(player.xpNext * 1.4);
      player.maxHp += voc.hpPerLevel; player.hp = player.maxHp;
      player.maxMana += voc.manaPerLevel; player.mana = player.maxMana;
      player.attack += voc.atkPerLevel; player.defense += voc.defPerLevel; player.magic += voc.magPerLevel;
      player.stats.levelUps++;
      this.emitEvent(player.mapId, { kind: 'levelup', targetId: player.id, text: `LEVEL ${player.level}!`, color: '#f4e04d', pos: { x: player.x, y: player.y } });
    }

    const cacheText = cacheItem ? ` · 🎁 Cache: ${cacheItem}` : result.cache ? ' · 🎁 Equipment cache earned' : '';
    this.emitEvent(player.mapId, {
      kind: 'adventure_claimed', targetId: player.id,
      text: `🏆 ${result.contract.title}: +${result.gold}g +${result.xp} XP · Streak ${result.streak}${cacheText}`,
      color: '#ffd87b', pos: { x: player.x, y: player.y },
    });
    return true;
  }

'''
s = replace_once(s,
"  getQuestNpcRequirement(questId) {\n",
adventure_methods + "  getQuestNpcRequirement(questId) {\n",
'adventure handlers')
s = replace_once(s,
"      quests: questEngine.serialize(playerId),\n    };\n",
"      quests: questEngine.serialize(playerId),\n      adventure: adventureEngine.serialize(player),\n    };\n",
'adventure snapshot')
s = replace_once(s,
"    const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup']);\n",
"    const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup', 'adventure_combo', 'adventure_progress', 'adventure_ready', 'adventure_claimed']);\n",
'adventure private events')
p.write_text(s)

# ---------------------------------------------------------------------
# Persist adventure state server-side.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()
s = replace_once(s,
"import { questEngine } from './engine/QuestEngine.mjs';\n",
"import { questEngine } from './engine/QuestEngine.mjs';\nimport { adventureEngine } from './engine/AdventureEngine.mjs';\n",
'server adventure import')
s = replace_once(s,
"    quests: questEngine.exportState(p.id),\n    mapId: p.mapId,\n",
"    quests: questEngine.exportState(p.id),\n    adventure: adventureEngine.exportState(p),\n    mapId: p.mapId,\n",
'save adventure')
s = replace_once(s,
"  if (saved.stats && typeof saved.stats === 'object' && !Array.isArray(saved.stats)) p.stats = { ...p.stats, ...saved.stats };\n\n  const mapData = typeof saved.mapId === 'string' ? WORLD.getMap(saved.mapId) : null;\n",
"  if (saved.stats && typeof saved.stats === 'object' && !Array.isArray(saved.stats)) p.stats = { ...p.stats, ...saved.stats };\n  adventureEngine.restorePlayer(p, saved.adventure);\n\n  const mapData = typeof saved.mapId === 'string' ? WORLD.getMap(saved.mapId) : null;\n",
'restore adventure')
p.write_text(s)

# ---------------------------------------------------------------------
# Client sync intents + feedback.
# ---------------------------------------------------------------------
p = Path('src/game/ServerSync.ts')
s = p.read_text()
s = replace_once(s,
"  sendTalentReset() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'talent_reset', payload: {} });\n  }\n\n  updateSnapshot(snap: ServerSnapshot) {\n",
"  sendTalentReset() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'talent_reset', payload: {} });\n  }\n\n  sendAdventureStart(contractId: string) {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'adventure_start', payload: { contractId } });\n  }\n\n  sendAdventureAbandon() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'adventure_abandon', payload: {} });\n  }\n\n  sendAdventureClaim() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'adventure_claim', payload: {} });\n  }\n\n  updateSnapshot(snap: ServerSnapshot) {\n",
'adventure client intents')
s = replace_once(s,
"        case 'quest_complete':\n          if (event.text) addMessage('Quest', event.text, event.color || '#58d6a8', 'quest');\n          break;\n        case 'death':\n",
"        case 'quest_complete':\n          if (event.text) addMessage('Quest', event.text, event.color || '#58d6a8', 'quest');\n          break;\n        case 'adventure_combo':\n          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#ffb84d', true);\n          break;\n        case 'adventure_progress':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#7dd3fc', 'battle');\n          break;\n        case 'adventure_ready':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'system');\n          break;\n        case 'adventure_claimed':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot');\n          break;\n        case 'death':\n",
'adventure event feedback')
p.write_text(s)

# ---------------------------------------------------------------------
# Hunt Board visual component.
# ---------------------------------------------------------------------
Path('src/components/AdventureBoard.tsx').write_text(r'''export interface AdventureContractView {
  id: string;
  mapId: string;
  title: string;
  icon: string;
  targetLabel: string;
  count: number;
  rewardGold: number;
  rewardXp: number;
  levelRequired: number;
  tier: string;
  description: string;
  locked?: boolean;
}

export interface AdventureSnapshot {
  board: AdventureContractView[];
  active: (AdventureContractView & { progress: number; ready: boolean; startedAt: number }) | null;
  streak: number;
  completed: number;
  bestCombo: number;
  combo: { count: number; multiplier: number };
  nextCacheIn: number;
}

interface Props {
  state: AdventureSnapshot | null;
  connected: boolean;
  onStart: (contractId: string) => void;
  onAbandon: () => void;
  onClaim: () => void;
  onClose: () => void;
}

const TIER: Record<string, { label: string; color: string; glow: string }> = {
  bronze: { label: 'BRONZE', color: '#d9a066', glow: 'rgba(217,160,102,.16)' },
  silver: { label: 'SILVER', color: '#b9c7d8', glow: 'rgba(185,199,216,.16)' },
  gold: { label: 'GOLD', color: '#ffd87b', glow: 'rgba(255,216,123,.17)' },
  mythic: { label: 'MYTHIC', color: '#c084fc', glow: 'rgba(192,132,252,.18)' },
  void: { label: 'VOID', color: '#8b5cf6', glow: 'rgba(139,92,246,.22)' },
};

export default function AdventureBoard({ state, connected, onStart, onAbandon, onClaim, onClose }: Props) {
  const active = state?.active || null;
  return (
    <div className="moria-overlay absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="moria-panel relative w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}
           style={{ boxShadow: '0 35px 120px rgba(0,0,0,.72), 0 0 80px rgba(245,158,11,.08)' }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_5%,rgba(245,158,11,.10),transparent_30%),radial-gradient(circle_at_88%_15%,rgba(56,189,248,.08),transparent_28%)]" />
        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="moria-eyebrow text-amber-200/70">MVP ADVENTURE LOOP</div>
              <h2 className="moria-title mt-1 text-2xl font-black tracking-[0.14em] text-amber-100">⚔ HUNT BOARD</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400">Choose one hunt, chain kills to build Momentum, then claim escalating rewards. Every third contract awards an equipment cache.</p>
            </div>
            <button onClick={onClose} className="moria-button rounded-xl px-3 py-2 text-slate-300">✕</button>
          </div>

          {!connected ? (
            <div className="rounded-2xl border border-sky-300/20 bg-sky-950/20 p-8 text-center">
              <div className="text-4xl">🌐</div>
              <div className="mt-3 font-bold text-sky-100">Hunts are server-authoritative</div>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">Connect to the Mor'ia server to start contracts. Progress, Momentum, gold, XP and cache items are all verified and persisted by the server.</p>
            </div>
          ) : !state ? (
            <div className="py-12 text-center text-sm text-slate-400">Synchronizing Hunt Board…</div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat icon="🔥" label="STREAK" value={`${state.streak}`} note={`+${Math.min(state.streak, 5) * 10}% next reward`} />
                <Stat icon="⚡" label="MOMENTUM" value={state.combo.count > 0 ? `${state.combo.count}x` : '—'} note={state.combo.count > 1 ? `+${Math.round((state.combo.multiplier - 1) * 100)}% kill XP` : 'Chain kills within 8s'} />
                <Stat icon="🏆" label="COMPLETED" value={`${state.completed}`} note={`Best combo ${state.bestCombo}x`} />
                <Stat icon="🎁" label="NEXT CACHE" value={`${state.nextCacheIn}`} note="contracts remaining" />
              </div>

              {active && (
                <div className="mb-5 rounded-2xl border p-4" style={{ borderColor: active.ready ? 'rgba(255,216,123,.55)' : 'rgba(125,211,252,.28)', background: active.ready ? 'rgba(92,63,18,.22)' : 'rgba(7,35,58,.28)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="text-4xl">{active.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[9px] font-black tracking-[0.18em] text-sky-300/70">ACTIVE HUNT</div>
                          <div className="text-lg font-black text-slate-100">{active.title}</div>
                        </div>
                        <div className="text-right text-xs text-amber-200">{active.rewardGold}g · {active.rewardXp} XP</div>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/50">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-amber-300 transition-all" style={{ width: `${Math.min(100, (active.progress / Math.max(1, active.count)) * 100)}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>Defeat {active.targetLabel}</span><span>{active.progress}/{active.count}</span></div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      {active.ready ? (
                        <button onClick={onClaim} className="moria-button-primary rounded-xl px-4 py-2 text-xs font-black tracking-wider text-amber-50">🏆 CLAIM</button>
                      ) : (
                        <button onClick={onAbandon} className="moria-button rounded-xl px-4 py-2 text-xs text-rose-200">Abandon</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {state.board.map((contract) => {
                  const tier = TIER[contract.tier] || TIER.bronze;
                  const disabled = Boolean(active) || contract.locked;
                  return (
                    <button key={contract.id} disabled={disabled} onClick={() => onStart(contract.id)}
                      className={`group rounded-2xl border p-4 text-left transition-all ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:-translate-y-0.5 hover:border-amber-200/40'}`}
                      style={{ borderColor: `${tier.color}38`, background: `linear-gradient(135deg, ${tier.glow}, rgba(5,8,13,.72))` }}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-3xl">{contract.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-black text-slate-100">{contract.title}</div>
                            <span className="text-[8px] font-black tracking-[0.18em]" style={{ color: tier.color }}>{tier.label}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-slate-400">{contract.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                            <span className="moria-chip rounded-lg px-2 py-1 text-sky-200">⚔ {contract.count} {contract.targetLabel}</span>
                            <span className="moria-chip rounded-lg px-2 py-1 text-amber-200">🪙 {contract.rewardGold}</span>
                            <span className="moria-chip rounded-lg px-2 py-1 text-violet-200">✦ {contract.rewardXp} XP</span>
                            {contract.locked && <span className="moria-chip rounded-lg px-2 py-1 text-rose-200">🔒 Lv {contract.levelRequired}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {state.board.length === 0 && <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-slate-400">No Hunt Board contracts are available in this region yet.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="text-[8px] font-black tracking-[0.16em] text-slate-500">{icon} {label}</div>
      <div className="mt-1 text-xl font-black text-slate-100">{value}</div>
      <div className="mt-0.5 text-[9px] text-slate-500">{note}</div>
    </div>
  );
}
''')

# ---------------------------------------------------------------------
# GameScreen: surface board, tracker and snapshot state.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
"import DPSMeter from './DPSMeter';\n",
"import DPSMeter from './DPSMeter';\nimport AdventureBoard, { type AdventureSnapshot } from './AdventureBoard';\n",
'adventure component import')
s = replace_once(s,
"  const [showQuestLog, setShowQuestLog] = useState(false);\n",
"  const [showQuestLog, setShowQuestLog] = useState(false);\n  const [showAdventure, setShowAdventure] = useState(false);\n  const [adventureState, setAdventureState] = useState<AdventureSnapshot | null>(null);\n  const lastAdventureSignatureRef = useRef('');\n",
'adventure state')
s = replace_once(s,
"      if (e.key.toLowerCase() === 'q') setShowQuestLog((s) => !s);\n",
"      if (e.key.toLowerCase() === 'q') setShowQuestLog((s) => !s);\n      if (e.key.toLowerCase() === 'h') setShowAdventure((s) => !s);\n",
'adventure hotkey')
s = replace_once(s,
"          const { x, y, inventory: serverInventory, quests: serverQuestState, skills: _serverSkills, stats: serverStats, ws: _ws, ...compatibleServerPlayer } = sp;\n",
"          const { x, y, inventory: serverInventory, quests: serverQuestState, adventure: serverAdventure, skills: _serverSkills, stats: serverStats, ws: _ws, ...compatibleServerPlayer } = sp;\n",
'adventure snapshot destructure')
s = replace_once(s,
"          if (serverStats && typeof serverStats === 'object') p.stats = { ...p.stats, ...serverStats };\n",
"          if (serverStats && typeof serverStats === 'object') p.stats = { ...p.stats, ...serverStats };\n          if (serverAdventure && typeof serverAdventure === 'object') {\n            const signature = JSON.stringify(serverAdventure);\n            if (signature !== lastAdventureSignatureRef.current) {\n              lastAdventureSignatureRef.current = signature;\n              setAdventureState(serverAdventure as AdventureSnapshot);\n            }\n          }\n",
'adventure snapshot sync')
s = replace_once(s,
"  const quickActions: Record<string, { icon: string; label: string; hotkey: string; onClick: () => void }> = {\n    quests: { icon: '📜', label: 'Quests', hotkey: 'Q', onClick: () => setShowQuestLog((v) => !v) },\n",
"  const quickActions: Record<string, { icon: string; label: string; hotkey: string; onClick: () => void }> = {\n    adventure: { icon: '⚔', label: 'Hunts', hotkey: 'H', onClick: () => setShowAdventure((v) => !v) },\n    quests: { icon: '📜', label: 'Quests', hotkey: 'Q', onClick: () => setShowQuestLog((v) => !v) },\n",
'adventure topbar action')
tracker = r'''
          {/* Active Hunt Tracker */}
          {serverSync.isActive() && adventureState?.active && (
            <div className="moria-panel absolute left-3 top-[132px] z-10 w-[245px] rounded-2xl border border-sky-300/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="moria-eyebrow text-[8px] text-sky-200/70">⚔ ACTIVE HUNT</div>
                {adventureState.combo.count > 1 && <div className="text-[9px] font-black text-amber-300">⚡ {adventureState.combo.count}x · +{Math.round((adventureState.combo.multiplier - 1) * 100)}% XP</div>}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl">{adventureState.active.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-slate-100">{adventureState.active.title}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/50">
                    <div className={`h-full ${adventureState.active.ready ? 'bg-amber-300' : 'bg-sky-400'}`} style={{ width: `${Math.min(100, (adventureState.active.progress / Math.max(1, adventureState.active.count)) * 100)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>{adventureState.active.targetLabel}</span><span>{adventureState.active.progress}/{adventureState.active.count}</span></div>
                </div>
              </div>
              {adventureState.active.ready && <button onClick={() => setShowAdventure(true)} className="moria-button-primary mt-2 w-full rounded-lg py-1 text-[9px] font-black">🏆 REWARD READY</button>}
            </div>
          )}
'''
s = replace_once(s,
"          {/* Active Quest Tracker */}\n",
tracker + "\n          {/* Active Quest Tracker */}\n",
'adventure active tracker')
overlay = r'''
          {showAdventure && (
            <AdventureBoard
              state={adventureState}
              connected={serverSync.isActive()}
              onStart={(contractId) => serverSync.sendAdventureStart(contractId)}
              onAbandon={() => serverSync.sendAdventureAbandon()}
              onClaim={() => serverSync.sendAdventureClaim()}
              onClose={() => setShowAdventure(false)}
            />
          )}
'''
s = replace_once(s,
"          {showQuestLog && (\n",
overlay + "\n          {showQuestLog && (\n",
'adventure board overlay')
s = replace_once(s,
"  const PANELS = [\n    { id: 'quests', label: 'Quest Log', icon: '📜' },\n",
"  const PANELS = [\n    { id: 'adventure', label: 'Hunt Board', icon: '⚔' },\n    { id: 'quests', label: 'Quest Log', icon: '📜' },\n",
'adventure UI layout panel')
p.write_text(s)

# ---------------------------------------------------------------------
# Include Hunt Board in user-customizable topbar order.
# ---------------------------------------------------------------------
p = Path('src/game/content.ts')
s = p.read_text()
s = replace_once(s,
"export const DEFAULT_UI_PANEL_ORDER = [\n  'quests', 'char', 'talents', 'bestiary', 'dps', 'dungeon', 'pet', 'mystery',\n",
"export const DEFAULT_UI_PANEL_ORDER = [\n  'adventure', 'quests', 'char', 'talents', 'bestiary', 'dps', 'dungeon', 'pet', 'mystery',\n",
'adventure default panel order')
p.write_text(s)

# ---------------------------------------------------------------------
# Regression coverage.
# ---------------------------------------------------------------------
Path('server/test/adventure.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureEngine, createAdventureState, COMBO_WINDOW_MS } from '../engine/AdventureEngine.mjs';
import { engine } from '../engine/GameState.mjs';

let seq = 0;
function makePlayer(mapId = 'eldoria', level = 1) {
  const id = `adventure_test_${Date.now()}_${seq++}`;
  const player = engine.playerConnect(id, `Hunter${seq}`, 'knight', null);
  player.mapId = mapId;
  player.level = level;
  player.adventure = createAdventureState();
  return { id, player };
}

function cleanup(id) {
  engine.playerDisconnect(id);
}

test('hunt board is regional and enforces level gates', () => {
  const { id, player } = makePlayer('emberhold', 10);
  try {
    const board = adventureEngine.serialize(player).board;
    assert.ok(board.some(contract => contract.id === 'emberhold_demon_purge'));
    assert.equal(board.find(contract => contract.id === 'emberhold_demon_purge').locked, true);
    assert.equal(adventureEngine.start(player, 'emberhold_demon_purge').ok, false);
    player.level = 25;
    assert.equal(adventureEngine.start(player, 'emberhold_demon_purge').ok, true);
  } finally { cleanup(id); }
});

test('monster kills build momentum and canonical contract progress', () => {
  const { id, player } = makePlayer();
  try {
    assert.equal(adventureEngine.start(player, 'eldoria_rat_sweep').ok, true);
    const first = adventureEngine.onMonsterKill(player, { name: 'Rat', type: 'normal' }, 1000);
    const second = adventureEngine.onMonsterKill(player, { name: 'Rat', type: 'normal' }, 2000);
    assert.equal(first.comboCount, 1);
    assert.equal(second.comboCount, 2);
    assert.equal(second.xpMultiplier, 1.05);
    assert.equal(second.progress.current, 2);
    const reset = adventureEngine.onMonsterKill(player, { name: 'Snake', type: 'normal' }, 2000 + COMBO_WINDOW_MS + 1);
    assert.equal(reset.comboCount, 1);
  } finally { cleanup(id); }
});

test('completed hunt claims authoritative gold/xp and every third claim awards equipment cache', () => {
  const { id, player } = makePlayer('eldoria', 5);
  try {
    player.adventure.completed = 2;
    player.adventure.streak = 2;
    assert.equal(engine.processIntent(id, { type: 'adventure_start', payload: { contractId: 'eldoria_rat_sweep' } }), true);
    for (let i = 0; i < 6; i++) adventureEngine.onMonsterKill(player, { name: 'Rat', type: 'normal' }, 1000 + i * 500);
    const beforeGold = player.gold;
    const beforeInventory = player.inventory.length;
    assert.equal(engine.processIntent(id, { type: 'adventure_claim', payload: {} }), true);
    assert.ok(player.gold > beforeGold);
    assert.equal(player.adventure.completed, 3);
    assert.equal(player.adventure.active, null);
    assert.equal(player.inventory.length, beforeInventory + 1);
    assert.equal(player.stats.adventuresCompleted, 1);
  } finally { cleanup(id); }
});

test('hunt state round-trips through persistence without persisting transient combo', () => {
  const { id, player } = makePlayer();
  const { id: id2, player: restored } = makePlayer();
  try {
    adventureEngine.start(player, 'eldoria_rat_sweep');
    adventureEngine.onMonsterKill(player, { name: 'Rat', type: 'normal' }, 1000);
    player.adventure.streak = 4;
    player.adventure.completed = 7;
    const saved = adventureEngine.exportState(player);
    adventureEngine.restorePlayer(restored, saved);
    const snapshot = adventureEngine.serialize(restored, 999999);
    assert.equal(snapshot.active.progress, 1);
    assert.equal(snapshot.streak, 4);
    assert.equal(snapshot.completed, 7);
    assert.equal(snapshot.combo.count, 0);
  } finally { cleanup(id); cleanup(id2); }
});

test('hunt cannot be double-started and abandon clears only the active contract', () => {
  const { id, player } = makePlayer();
  try {
    assert.equal(adventureEngine.start(player, 'eldoria_rat_sweep').ok, true);
    assert.equal(adventureEngine.start(player, 'eldoria_snake_nest').ok, false);
    player.adventure.streak = 3;
    assert.equal(adventureEngine.abandon(player).ok, true);
    assert.equal(player.adventure.active, null);
    assert.equal(player.adventure.streak, 3);
  } finally { cleanup(id); }
});
''')

Path('docs/MVP_ADVENTURE_5_0.md').write_text(r'''# MOR'IA MVP Adventure 5.0

## Goal

Turn the hardened MMO foundation into a repeatable 10–20 minute gameplay loop that always gives the player a clear next objective.

## Hunt Board

- Press **H** or click **Hunts** in the top bar.
- Each region offers two server-owned hunt contracts tuned to that area's monsters and level range.
- Only one hunt can be active at a time.
- Progress is awarded by authoritative monster kills, not client messages.
- The board, active hunt, progress, streak and completion count are all delivered in server snapshots.

## Momentum

Kills chained within 8 seconds build Momentum:

- 1x: normal XP
- 2x: +5% kill XP
- 3x: +10%
- 4x: +15%
- 5x: +20%
- 6x and higher: +25% cap

Momentum is intentionally transient and is not restored after reconnect.

## Reward streak

Claiming completed contracts builds a persistent streak. The next contract reward gains +10% per streak, capped at +50%.

Every third completed contract awards an authoritative equipment cache selected from the live item/content pool near the player's current level.

## Persistence and trust boundary

Persisted:
- active contract and progress
- completed hunt count
- reward streak
- best combo

Not persisted:
- current Momentum combo timer/count

The client can only send `adventure_start`, `adventure_abandon`, and `adventure_claim` intents. Kills, progress, rewards, cache items, XP multipliers and persistence are server-owned.
''')

print('MVP Adventure 5.0 applied')
