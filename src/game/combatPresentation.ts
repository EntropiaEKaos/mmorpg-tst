import { audio } from './audio';
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

export function applyAuthoritativeCombatFeedback(
  event: any,
  fallbackPos: Position,
  spawnParticles: SpawnParticles,
  applyShake: ApplyShake,
): void {
  if (!event || typeof event !== 'object') return;
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
    else if (event.kind === 'boss_defeated' || event.kind === 'loot_reward') audio.hitCrit();
    else if (event.kind === 'quest_complete' || event.kind === 'task_ready' || event.kind === 'adventure_claimed') audio.heal();
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
      spawnParticles(pos, event.color || '#ff6060', amount >= 100 ? 12 : 6);
      applyShake(amount >= 100 ? 8 : amount >= 40 ? 5 : 3);
      if (amount >= 100) audio.hitCrit(); else audio.hit();
      break;
    }
    case 'heal':
      spawnParticles(pos, event.color || '#58d6a8', 8);
      audio.heal();
      break;
    case 'spell':
      spawnParticles(pos, event.color || '#b398ff', 10);
      break;
    case 'levelup':
      spawnParticles(pos, event.color || '#f4e04d', 24);
      audio.levelUp();
      break;
  }
}
