from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / 'src/components/GameScreen.tsx'
PRESENTATION = ROOT / 'src/game/combatPresentation.ts'
TEST = ROOT / 'server/test/combat-presentation.test.mjs'

PRESENTATION.write_text(r'''import { audio } from './audio';

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
''', encoding='utf-8')

screen = SCREEN.read_text(encoding='utf-8')
old_import = "import CombatTargetFrame, { type CombatTargetView } from './CombatTargetFrame';"
new_import = "import CombatTargetFrame from './CombatTargetFrame';\nimport { applyAuthoritativeCombatFeedback, resolveCombatTarget } from '../game/combatPresentation';"
if old_import not in screen:
    raise SystemExit('8.2 CombatTargetFrame import marker missing')
screen = screen.replace(old_import, new_import, 1)

old_target = """  const activeTarget: CombatTargetView | null = player.targetId
    ? ((serverSync.isActive()
        ? serverMonstersRef.current.find((monster: any) => monster.id === player.targetId && monster.hp > 0)
        : monstersRef.current.find((monster) => monster.id === player.targetId && !monster.dead)) as CombatTargetView | undefined) || null
    : null;
"""
new_target = """  const activeTarget = resolveCombatTarget(
    player.targetId,
    serverSync.isActive(),
    serverMonstersRef.current,
    monstersRef.current,
  );
"""
if old_target not in screen:
    raise SystemExit('8.2 active target resolution block missing')
screen = screen.replace(old_target, new_target, 1)

old_feedback = """          serverSync.processEvents(addFloatingText, addMessage, (event) => {
            const eventPos = event?.pos || p.pos;
            if (event?.kind === 'damage') {
              const amount = Math.max(0, Number(event.amount) || 0);
              spawnParticles(eventPos, event.color || '#ff6060', amount >= 100 ? 12 : 6);
              screenShakeRef.current = Math.max(screenShakeRef.current, amount >= 100 ? 8 : amount >= 40 ? 5 : 3);
              if (amount >= 100) audio.hitCrit(); else audio.hit();
            } else if (event?.kind === 'heal') {
              spawnParticles(eventPos, event.color || '#58d6a8', 8);
              audio.heal();
            } else if (event?.kind === 'spell') {
              spawnParticles(eventPos, event.color || '#b398ff', 10);
            } else if (event?.kind === 'levelup') {
              spawnParticles(eventPos, event.color || '#f4e04d', 24);
              audio.levelUp();
            }
          });"""
new_feedback = """          serverSync.processEvents(addFloatingText, addMessage, (event) => {
            applyAuthoritativeCombatFeedback(event, p.pos, spawnParticles, (strength) => {
              screenShakeRef.current = Math.max(screenShakeRef.current, strength);
            });
          });"""
if old_feedback not in screen:
    raise SystemExit('8.2 authoritative feedback block missing')
screen = screen.replace(old_feedback, new_feedback, 1)
SCREEN.write_text(screen, encoding='utf-8')

test = TEST.read_text(encoding='utf-8')
if "const presentation = read('src/game/combatPresentation.ts');" not in test:
    test = test.replace(
        "const sync = read('src/game/ServerSync.ts');",
        "const sync = read('src/game/ServerSync.ts');\nconst presentation = read('src/game/combatPresentation.ts');",
        1,
    )
    test += r'''

test('combat presentation policy stays outside GameScreen and remains presentation-only', () => {
  assert.match(presentation, /export function resolveCombatTarget/);
  assert.match(presentation, /export function applyAuthoritativeCombatFeedback/);
  assert.match(screen, /applyAuthoritativeCombatFeedback\(event, p\.pos, spawnParticles/);
  assert.doesNotMatch(presentation, /sendIntent|sendAttack|sendCast|player\.hp\s*[+-]=|monster\.hp\s*[+-]=/);
});
'''
TEST.write_text(test, encoding='utf-8')

print(f'GameScreen after presentation extraction: {len(screen.encode("utf-8"))} bytes')
if len(screen.encode('utf-8')) > 155_000:
    raise SystemExit('GameScreen still exceeds the 8.1 architecture budget')
print('8.2 combat presentation module extraction prepared')
