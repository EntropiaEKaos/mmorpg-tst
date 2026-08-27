import test from 'node:test';
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
