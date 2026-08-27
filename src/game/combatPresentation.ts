import { audio } from './audio';

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
