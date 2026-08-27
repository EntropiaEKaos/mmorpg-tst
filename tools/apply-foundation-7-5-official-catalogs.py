from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
start_marker = 'export const OFFICIAL_PETS = Object.freeze(['
end_marker = '\n\nfunction freshPlayerState() {'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('OfficialSystems catalog block boundaries not found')
block = text[start:end].rstrip() + '\n'

for name in ['MYSTERIES', 'DUNGEON_WAVES', 'DEFAULT_EVENTS', 'ACHIEVEMENTS', 'SETS']:
    old = f'const {name} = Object.freeze('
    new = f'export const {name} = Object.freeze('
    if block.count(old) != 1:
        raise SystemExit(f'catalog block expected one {name} declaration, found {block.count(old)}')
    block = block.replace(old, new, 1)

catalog = '''// ===================================================================
// MOR'IA — OFFICIAL IMMUTABLE CATALOGS
// Pure declarative game data shared by official domains. Runtime mutations,
// player state and persistence intentionally do not belong in this module.
// ===================================================================

''' + block
write('server/engine/OfficialCatalogs.mjs', catalog)

imports = '''import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES, DUNGEON_WAVES, DEFAULT_EVENTS,
  ACHIEVEMENTS, SETS,
} from './OfficialCatalogs.mjs';
export {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,
} from './OfficialCatalogs.mjs';
'''
anchor = "import { officialCommerceDomain } from './OfficialCommerceDomain.mjs';\n"
if text.count(anchor) != 1:
    raise SystemExit('OfficialSystems commerce import anchor not found exactly once')
text = text.replace(anchor, anchor + imports, 1)
text = text[:text.find(start_marker)] + text[end:]
# Removing the catalog shifts indexes; rebuild from original replacement safely.
original = read(path)
start = original.find(start_marker)
end = original.find(end_marker, start)
base = original[:start] + original[end:]
base = base.replace(anchor, anchor + imports, 1)
write(path, base)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES, DUNGEON_WAVES, DEFAULT_EVENTS,
  ACHIEVEMENTS, SETS,
} from '../engine/OfficialCatalogs.mjs';
import {
  OFFICIAL_PETS as LEGACY_PETS,
  OFFICIAL_GEMS as LEGACY_GEMS,
  OFFICIAL_SHOP as LEGACY_SHOP,
  OFFICIAL_FOOD as LEGACY_FOOD,
  OFFICIAL_RECIPES as LEGACY_RECIPES,
  OFFICIAL_COIN_STORE as LEGACY_COIN_STORE,
  OFFICIAL_BOOKS as LEGACY_BOOKS,
} from '../engine/OfficialSystems.mjs';

const uniqueIds = (items) => new Set(items.map(item => item.id)).size === items.length;

test('official catalogs are isolated, frozen and keep unique public IDs', () => {
  const publicCatalogs = [OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES, OFFICIAL_COIN_STORE, OFFICIAL_BOOKS];
  for (const catalog of publicCatalogs) {
    assert.equal(Object.isFrozen(catalog), true);
    assert.equal(catalog.length > 0, true);
    assert.equal(uniqueIds(catalog), true);
  }
  assert.equal(Object.isFrozen(MYSTERIES), true);
  assert.equal(Object.isFrozen(DUNGEON_WAVES), true);
  assert.equal(Object.isFrozen(DEFAULT_EVENTS), true);
  assert.equal(Object.isFrozen(ACHIEVEMENTS), true);
  assert.equal(Object.isFrozen(SETS), true);
});

test('OfficialSystems legacy catalog exports remain identity-compatible', () => {
  assert.equal(LEGACY_PETS, OFFICIAL_PETS);
  assert.equal(LEGACY_GEMS, OFFICIAL_GEMS);
  assert.equal(LEGACY_SHOP, OFFICIAL_SHOP);
  assert.equal(LEGACY_FOOD, OFFICIAL_FOOD);
  assert.equal(LEGACY_RECIPES, OFFICIAL_RECIPES);
  assert.equal(LEGACY_COIN_STORE, OFFICIAL_COIN_STORE);
  assert.equal(LEGACY_BOOKS, OFFICIAL_BOOKS);
});

test('official catalog references remain internally valid', () => {
  const petIds = new Set(OFFICIAL_PETS.map(item => item.id));
  const gemIds = new Set(OFFICIAL_GEMS.map(item => item.id));
  assert.equal(petIds.size, OFFICIAL_PETS.length);
  assert.equal(gemIds.size, OFFICIAL_GEMS.length);
  for (const mystery of MYSTERIES) {
    assert.equal(Array.isArray(mystery.chapters) && mystery.chapters.length > 0, true);
    for (const chapter of mystery.chapters) assert.equal(typeof chapter.answer === 'string' && chapter.answer.length > 0, true);
  }
  for (const wave of DUNGEON_WAVES) {
    assert.equal(Number(wave.hp) > 0, true);
    assert.equal(Number(wave.count) > 0, true);
  }
  for (const event of DEFAULT_EVENTS) {
    assert.equal(typeof event.mapId === 'string' && event.mapId.length > 0, true);
    assert.equal(typeof event.target === 'string' && event.target.length > 0, true);
  }
});
'''
write('server/test/official-catalogs.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.5 — Official Catalog Layer

Foundation 7.5 separates immutable official game data from stateful runtime logic.

## `OfficialCatalogs.mjs`

The new catalog module owns the declarative definitions for:

- pets;
- gems;
- NPC shop goods;
- food buffs;
- crafting recipes;
- coin-store products;
- books;
- mysteries;
- dungeon waves;
- fallback world events;
- achievements;
- equipment sets and bonuses.

`OfficialSystems` imports the catalogs for runtime use and re-exports the seven historical public `OFFICIAL_*` catalogs, preserving module compatibility for existing callers.

## Expansion benefit

New official content can now be reviewed and evolved independently from transactions, persistence and player-state logic. This also gives later migrations a clean path toward ContentDB/admin-driven versions of these catalogs without first disentangling them from the monolithic service.

CI verifies immutable arrays, unique public IDs, legacy export identity and critical internal references such as mystery answers, dungeon wave stats and fallback event targets.
'''
write('docs/FOUNDATION_7_5_CATALOGS.md', DOC)

print('Foundation 7.5 official catalog extraction applied')
