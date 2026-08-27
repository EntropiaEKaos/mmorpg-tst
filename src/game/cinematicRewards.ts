export const CINEMATIC_EVENT_NAME = 'moria:cinematic-reward';

export type CinematicKind =
  | 'boss_intro'
  | 'region_discovered'
  | 'achievement_unlocked'
  | 'cosmetic_unlocked'
  | 'reward_chest_opened';

export interface CinematicRewardDescriptor {
  kind: CinematicKind;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: number;
  intensity: number;
  description?: string;
}

const KNOWN = new Set<CinematicKind>([
  'boss_intro', 'region_discovered', 'achievement_unlocked', 'cosmetic_unlocked', 'reward_chest_opened',
]);

export function cinematicForEvent(event: any): CinematicRewardDescriptor | null {
  if (!event || typeof event !== 'object' || !KNOWN.has(event.kind)) return null;
  const kind = event.kind as CinematicKind;
  const defaults: Record<CinematicKind, Omit<CinematicRewardDescriptor, 'kind'>> = {
    boss_intro: { title: 'BOSS APPROACHES', subtitle: 'Unknown Boss', icon: '👑', color: '#ffbf5f', duration: 3200, intensity: 5 },
    region_discovered: { title: 'REGION DISCOVERED', subtitle: 'Unknown Region', icon: '🗺️', color: '#7dd3fc', duration: 2800, intensity: 3 },
    achievement_unlocked: { title: 'ACHIEVEMENT UNLOCKED', subtitle: 'New Achievement', icon: '🏆', color: '#c084fc', duration: 3000, intensity: 4 },
    cosmetic_unlocked: { title: 'COSMETIC UNLOCKED', subtitle: 'New Cosmetic', icon: '✨', color: '#d49bc8', duration: 3000, intensity: 4 },
    reward_chest_opened: { title: 'REWARD CHEST OPENED', subtitle: 'Treasure Acquired', icon: '🎁', color: '#ffb347', duration: 3000, intensity: 4 },
  };
  const base = defaults[kind];
  return {
    kind,
    title: typeof event.title === 'string' && event.title ? event.title.slice(0, 80) : base.title,
    subtitle: typeof event.subtitle === 'string' && event.subtitle ? event.subtitle.slice(0, 120) : base.subtitle,
    icon: typeof event.icon === 'string' && event.icon ? event.icon.slice(0, 8) : base.icon,
    color: /^#[0-9a-fA-F]{3,8}$/.test(String(event.color || '')) ? event.color : base.color,
    duration: base.duration,
    intensity: base.intensity,
    description: typeof event.description === 'string' ? event.description.slice(0, 180) : undefined,
  };
}

export function dispatchCinematicReward(event: any): CinematicRewardDescriptor | null {
  const descriptor = cinematicForEvent(event);
  if (!descriptor) return null;
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(CINEMATIC_EVENT_NAME, { detail: descriptor }));
  }
  return descriptor;
}
