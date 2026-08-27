import { getClassVisualIdentity } from './classIdentity';

export interface RewardFxRecipe {
  color: string;
  secondary: string;
  particles: number;
  shake: number;
  floating?: string;
  big?: boolean;
}

export function rewardFxForEvent(event: any): RewardFxRecipe | null {
  if (!event || typeof event !== 'object') return null;
  const identity = getClassVisualIdentity(event.vocation);
  const posColor = event.color || identity.primary;
  switch (event.kind) {
    case 'loot_reward': {
      const tier = Math.max(0, Math.min(4, Number(event.rewardTier) || 0));
      return {
        color: posColor,
        secondary: identity.accent,
        particles: 12 + tier * 7,
        shake: tier >= 4 ? 8 : tier >= 3 ? 5 : 1,
        floating: tier >= 2 ? `${String(event.rarity || 'loot').toUpperCase()} DROP!` : undefined,
        big: tier >= 2,
      };
    }
    case 'boss_defeated':
      return { color: '#ffbf5f', secondary: identity.accent, particles: 52, shake: 12, floating: event.text || 'BOSS DEFEATED!', big: true };
    case 'levelup':
      return { color: '#ffe36b', secondary: identity.accent, particles: 38, shake: 5, floating: event.text || 'LEVEL UP!', big: true };
    case 'quest_complete':
      return { color: '#58d6a8', secondary: '#d9fff1', particles: 26, shake: 2, floating: event.text || 'QUEST COMPLETE!', big: true };
    case 'task_ready':
      return { color: '#ffd87b', secondary: identity.accent, particles: 24, shake: 2, floating: 'TASK COMPLETE!', big: true };
    case 'adventure_ready':
    case 'adventure_claimed':
      return { color: '#ffca65', secondary: identity.accent, particles: 30, shake: 3, floating: event.kind === 'adventure_claimed' ? 'REWARD CLAIMED!' : 'HUNT COMPLETE!', big: true };
    case 'appearance_update':
      return { color: '#d49bc8', secondary: '#ffe3f8', particles: 18, shake: 0 };
    case 'mount_update':
      return { color: '#d9bd7a', secondary: '#fff0bd', particles: 20, shake: 1 };
    case 'housing_update':
      return { color: '#d9bd7a', secondary: '#f2ddaf', particles: 16, shake: 0 };
    default:
      return null;
  }
}

export function classCombatFx(event: any): RewardFxRecipe | null {
  if (!event || typeof event !== 'object' || !['damage', 'heal', 'spell'].includes(event.kind)) return null;
  const identity = getClassVisualIdentity(event.vocation);
  const amount = Math.max(0, Number(event.amount) || 0);
  const critical = Boolean(event.critical) || amount >= 120;
  const styleBonus = identity.particleBias;
  if (event.kind === 'heal') {
    return { color: event.color || identity.primary, secondary: identity.accent, particles: 8 + styleBonus, shake: 0 };
  }
  if (event.kind === 'spell') {
    return { color: event.color || identity.primary, secondary: identity.accent, particles: 10 + styleBonus * 2, shake: identity.combatStyle === 'arcane' ? 3 : 1 };
  }
  return {
    color: event.color || identity.primary,
    secondary: identity.accent,
    particles: (critical ? 14 : 6) + styleBonus,
    shake: critical ? 8 : amount >= 50 ? 5 : 3,
  };
}
