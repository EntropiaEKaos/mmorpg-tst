import { audio } from './audio';
import { dispatchCinematicReward } from './cinematicRewards';
import { classCombatFx, rewardFxForEvent } from './rewardPresentation';

export interface CombatTargetCandidate {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dead?: boolean;
  emoji?: string;
  type?: string;
  level?: number;
  attack?: number;
  defense?: number;
  pos?: { x: number; y: number };
  x?: number;
  y?: number;
}

export function resolveCombatTarget(
  targetId: string | null | undefined,
  authoritative: boolean,
  serverMonsters: CombatTargetCandidate[],
  localMonsters: CombatTargetCandidate[],
): CombatTargetCandidate | null {
  if (!targetId) return null;
  const source = authoritative ? serverMonsters : localMonsters;
  return source.find((monster) => monster.id === targetId && (authoritative ? monster.hp > 0 : !monster.dead)) || null;
}

type Position = { x: number; y: number };
type SpawnParticles = (pos: Position, color: string, count: number) => void;
type ApplyShake = (strength: number) => void;

type SchoolFx = { core: string; accent: string; spark: string };

const SCHOOL_FX: Record<string, SchoolFx> = {
  physical: { core: '#f0d7ad', accent: '#d6874d', spark: '#fff2ce' },
  magic: { core: '#bda7ff', accent: '#7e68da', spark: '#e8ddff' },
  arcane: { core: '#c991ff', accent: '#6f42c1', spark: '#f2ddff' },
  fire: { core: '#ff6b32', accent: '#ffb347', spark: '#ffe28a' },
  water: { core: '#55cfff', accent: '#367bd6', spark: '#d3f5ff' },
  earth: { core: '#b89157', accent: '#6f9b54', spark: '#e5d0a4' },
  lightning: { core: '#8de8ff', accent: '#6d71ff', spark: '#f4fbff' },
  ice: { core: '#bcefff', accent: '#71bfff', spark: '#ffffff' },
  death: { core: '#9e73bd', accent: '#532d6e', spark: '#d7bedf' },
  holy: { core: '#fff1a8', accent: '#f2c85b', spark: '#ffffff' },
  nature: { core: '#7ee58a', accent: '#43a65e', spark: '#d8ffd5' },
  poison: { core: '#a7dc56', accent: '#5d8d2e', spark: '#ddff9d' },
  shadow: { core: '#9c6ce5', accent: '#3d255d', spark: '#d3b7ff' },
};

function schoolFx(raw: unknown, fallback?: string): SchoolFx {
  return SCHOOL_FX[String(raw || '').toLowerCase()] || {
    core: fallback || '#ff6060',
    accent: fallback || '#c84545',
    spark: '#fff0e6',
  };
}

function layeredBurst(spawnParticles: SpawnParticles, pos: Position, fx: SchoolFx, scale = 1): void {
  const bounded = Math.max(0.65, Math.min(2.1, scale));
  spawnParticles(pos, fx.core, Math.round(7 * bounded));
  spawnParticles(pos, fx.accent, Math.round(4 * bounded));
  spawnParticles(pos, fx.spark, Math.round(2 * bounded));
}

function applyReactionBurst(event: any, pos: Position, spawnParticles: SpawnParticles, applyShake: ApplyShake): boolean {
  const reaction = String(event.reaction || event.text || '').toLowerCase();
  if (!reaction && event.kind !== 'elemental_reaction') return false;

  const fx = schoolFx(event.school, event.color);
  let scale = 1.15;
  if (/shatter|thermal shock|detonation|conductive/.test(reaction)) scale = 1.85;
  else if (/freeze|steam|exorc|purify|bloom/.test(reaction)) scale = 1.48;
  layeredBurst(spawnParticles, pos, fx, scale);

  if (/steam/.test(reaction)) spawnParticles(pos, '#eefcff', 10);
  if (/freeze|shatter/.test(reaction)) spawnParticles(pos, '#ffffff', 12);
  if (/conductive|lightning/.test(reaction)) spawnParticles(pos, '#dffcff', 11);
  if (/detonation|arcane/.test(reaction)) spawnParticles(pos, '#f0c9ff', 11);
  if (/holy|purify|exorc/.test(reaction)) spawnParticles(pos, '#fff9cf', 12);
  applyShake(scale >= 1.8 ? 9 : scale >= 1.4 ? 6 : 4);
  return true;
}

export function applyAuthoritativeCombatFeedback(
  event: any,
  fallbackPos: Position,
  spawnParticles: SpawnParticles,
  applyShake: ApplyShake,
): void {
  if (!event || typeof event !== 'object') return;
  dispatchCinematicReward(event);
  const pos = event.pos && Number.isFinite(event.pos.x) && Number.isFinite(event.pos.y)
    ? event.pos as Position
    : fallbackPos;

  const rewardFx = rewardFxForEvent(event);
  if (rewardFx) {
    spawnParticles(pos, rewardFx.color, rewardFx.particles);
    if (rewardFx.secondary && rewardFx.secondary !== rewardFx.color) {
      spawnParticles(pos, rewardFx.secondary, Math.max(4, Math.floor(rewardFx.particles * 0.45)));
    }
    if (rewardFx.shake > 0) applyShake(rewardFx.shake);
    if (event.kind === 'levelup') audio.levelUp();
    else if (event.kind === 'boss_defeated' || event.kind === 'boss_intro' || event.kind === 'loot_reward' || event.kind === 'reward_chest_opened') audio.hitCrit();
    else if (event.kind === 'quest_complete' || event.kind === 'task_ready' || event.kind === 'adventure_claimed' || event.kind === 'achievement_unlocked' || event.kind === 'cosmetic_unlocked') audio.heal();
    return;
  }

  // Mor'ia 9.30: authoritative school/reaction fields drive presentation only.
  if (applyReactionBurst(event, pos, spawnParticles, applyShake)) {
    if (event.kind === 'damage' || event.kind === 'elemental_reaction') audio.hitCrit();
    return;
  }

  const classFx = classCombatFx(event);
  if (classFx) {
    spawnParticles(pos, classFx.color, classFx.particles);
    spawnParticles(pos, classFx.secondary, Math.max(3, Math.floor(classFx.particles * 0.35)));
    if (classFx.shake > 0) applyShake(classFx.shake);
    if (event.kind === 'damage') {
      const amount = Math.max(0, Number(event.amount) || 0);
      if (event.critical || amount >= 100) audio.hitCrit(); else audio.hit();
    } else if (event.kind === 'heal') {
      audio.heal();
    }
    return;
  }

  switch (event.kind) {
    case 'damage': {
      const amount = Math.max(0, Number(event.amount) || 0);
      const fx = schoolFx(event.school, event.color);
      layeredBurst(spawnParticles, pos, fx, event.critical ? 1.65 : amount >= 100 ? 1.45 : amount >= 40 ? 1.05 : 0.78);
      applyShake(event.critical ? 9 : amount >= 100 ? 7 : amount >= 40 ? 5 : 3);
      if (event.critical || amount >= 100) audio.hitCrit(); else audio.hit();
      break;
    }
    case 'heal':
      layeredBurst(spawnParticles, pos, { core: event.color || '#58d6a8', accent: '#b8ffd9', spark: '#ffffff' }, 1.15);
      audio.heal();
      break;
    case 'spell':
      layeredBurst(spawnParticles, pos, schoolFx(event.school, event.color), 1.2);
      break;
    case 'levelup':
      layeredBurst(spawnParticles, pos, { core: event.color || '#f4e04d', accent: '#fff3a0', spark: '#ffffff' }, 2);
      audio.levelUp();
      break;
  }
}
