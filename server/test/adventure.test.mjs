import test from 'node:test';
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
