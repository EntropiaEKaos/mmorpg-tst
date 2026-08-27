from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / 'src/components/GameScreen.tsx'
ADAPTERS = ROOT / 'src/game/serverContentAdapters.ts'
ARCH_TEST = ROOT / 'server/test/client-architecture.test.mjs'
DOC = ROOT / 'docs/MORIA_8_1_QUALITY_FOUNDATION.md'
TX_MANAGER = ROOT / 'server/engine/OfficialTransactionManager.mjs'

screen = SCREEN.read_text(encoding='utf-8')
start_marker = 'function customNpcToRuntime'
end_marker = 'export default function GameScreen'

if start_marker not in screen or end_marker not in screen:
    raise SystemExit('GameScreen adapter block markers were not found')

start = screen.index(start_marker)
end = screen.index(end_marker)
helper_block = screen[start:end].rstrip()

exports = {
    'function customNpcToRuntime': 'export function customNpcToRuntime',
    'function customMonsterToRuntime': 'export function customMonsterToRuntime',
    'const customContentOnMap': 'export const customContentOnMap',
    'function serverNpcToClient': 'export function serverNpcToClient',
    'function spellContentSlug': 'export function spellContentSlug',
    'function mergeServerSpells': 'export function mergeServerSpells',
    'function serverQuestToClient': 'export function serverQuestToClient',
}
for old, new in exports.items():
    if old not in helper_block:
        raise SystemExit(f'Expected helper declaration missing: {old}')
    helper_block = helper_block.replace(old, new, 1)

adapter_source = """import type { Monster, NPC, Quest, Spell } from './types';
import { MAPS, MAP_HEIGHT, MAP_WIDTH } from './maps';
import type { CustomMonster, CustomNPC } from './content';

""" + helper_block + '\n'
ADAPTERS.write_text(adapter_source, encoding='utf-8')

screen = screen[:start] + screen[end:]
anchor = "from '../game/content';"
if anchor not in screen:
    raise SystemExit('Content import anchor not found')
insert_at = screen.index(anchor) + len(anchor)
adapter_import = "\nimport { customContentOnMap, customMonsterToRuntime, customNpcToRuntime, mergeServerSpells, serverNpcToClient, serverQuestToClient, spellContentSlug } from '../game/serverContentAdapters';"
screen = screen[:insert_at] + adapter_import + screen[insert_at:]
SCREEN.write_text(screen, encoding='utf-8')

architecture_test = r"""import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gameScreenUrl = new URL('../../src/components/GameScreen.tsx', import.meta.url);
const adaptersUrl = new URL('../../src/game/serverContentAdapters.ts', import.meta.url);

const gameScreen = readFileSync(gameScreenUrl, 'utf8');
const adapters = readFileSync(adaptersUrl, 'utf8');

test('GameScreen keeps server-content normalization outside the UI orchestrator', () => {
  assert.doesNotMatch(gameScreen, /function customNpcToRuntime/);
  assert.doesNotMatch(gameScreen, /function customMonsterToRuntime/);
  assert.doesNotMatch(gameScreen, /function mergeServerSpells/);
  assert.doesNotMatch(gameScreen, /function serverQuestToClient/);
  assert.match(gameScreen, /serverContentAdapters/);
  assert.match(adapters, /export function customNpcToRuntime/);
  assert.match(adapters, /export function mergeServerSpells/);
  assert.match(adapters, /export function serverQuestToClient/);
});

test('GameScreen monolith cannot silently grow past the 8.1 decomposition budget', () => {
  const bytes = Buffer.byteLength(gameScreen, 'utf8');
  assert.ok(bytes <= 155_000, `GameScreen is ${bytes} bytes; 8.1 budget is 155000 bytes`);
});
"""
ARCH_TEST.write_text(architecture_test, encoding='utf-8')

tx = TX_MANAGER.read_text(encoding='utf-8')
old_tx_catch = """    } catch (error) {
      rollbackRuntime();
      throw error;
    } finally {
"""
new_tx_catch = """    } catch (error) {
      rollbackRuntime();
      // prepareCommit runs after the domain operation has returned ok=true. If
      // that hook throws, `result.ok` is still true, so the finally block alone
      // cannot distinguish the failed prepare phase from a valid commit path.
      // Release the unit-of-work lock explicitly before propagating the error.
      this.active = false;
      this.saveRequested = false;
      throw error;
    } finally {
"""
if old_tx_catch not in tx:
    raise SystemExit('OfficialTransactionManager exception path marker was not found')
tx = tx.replace(old_tx_catch, new_tx_catch, 1)
TX_MANAGER.write_text(tx, encoding='utf-8')
# The migration workflow stages an explicit allowlist. Stage this pre-existing
# 8.0 correctness fix here so it is committed only after all validation gates pass.
subprocess.run(['git', 'add', 'server/engine/OfficialTransactionManager.mjs'], cwd=ROOT, check=True)

doc = """# Mor'ia 8.1 — Quality Foundation

## Objective

Version 8.1 starts the quality-first evolution of the 8.x line. The goal is to make future combat, world, progression, social and Studio work safer instead of adding more responsibility to the existing UI and server monoliths.

## Changes in this gate

- CI now protects `content-expansion-8.0`, all `moria-8.*` evolution branches and the future `moria-9.*` line.
- Server-content normalization has been extracted from `GameScreen.tsx` into `src/game/serverContentAdapters.ts`.
- A regression test prevents those adapters from leaking back into the UI orchestrator.
- A size budget prevents `GameScreen.tsx` from silently returning to its pre-8.1 size while further decomposition is underway.
- The 8.0 transaction manager now releases its unit-of-work lock if `prepareCommit` throws after a successful domain operation, preventing subsequent official transactions from being blocked.
- Existing server-authoritative domains, transaction boundaries and runtime coordinator remain the source of truth for online systems.

## Quality rule for 8.x

Every structural or gameplay change must pass dependency audit, client typecheck, production build, server syntax validation and the full server test suite before it is committed by an automated migration workflow.

## Next decomposition targets

1. input/hotkey orchestration;
2. canvas rendering and camera lifecycle;
3. online snapshot/content synchronization;
4. modal/panel orchestration;
5. combat presentation effects.

Each extraction should preserve behavior first and only then add new game-feel features.
"""
DOC.write_text(doc, encoding='utf-8')

print(f'GameScreen: {len(screen.encode("utf-8"))} bytes')
print(f'Adapters: {len(adapter_source.encode("utf-8"))} bytes')
print('Transaction prepare-exception lock fix prepared')
print('8.1 quality-foundation migration prepared')
