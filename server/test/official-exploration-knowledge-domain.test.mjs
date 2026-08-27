import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPLORATION_KNOWLEDGE_RULES,
  OfficialExplorationKnowledgeDomain,
  publicMysteries,
} from '../engine/OfficialExplorationKnowledgeDomain.mjs';

function makePlayer() {
  return {
    name: 'Explorer', level: 10, mapId: 'eldoria', x: 1, y: 1,
    gold: 100, xp: 0, inventory: [], stats: { goldEarned: 0 }, reputation: { town: 0 },
    official: {
      professions: {
        mining: { level: 1, xp: 0 }, herbalism: { level: 1, xp: 0 },
        fishing: { level: 1, xp: 0 }, woodcutting: { level: 1, xp: 0 },
      },
      lastGatherAt: 0, booksRead: [], mysteries: {},
    },
  };
}

const host = {
  ensurePlayer(player) { return player.official; },
  awardReputation(player, amount) {
    player.reputation.town = (player.reputation.town || 0) + amount;
    return player.reputation.town;
  },
};

function worldWith(tileType = 'rock') {
  const tiles = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({ type: 'grass' })));
  if (tileType) tiles[1][2] = { type: tileType };
  return { getMap(id) { return id === 'eldoria' ? { tiles } : null; } };
}

test('exploration gathering requires a real adjacent resource and enforces cooldown', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  assert.equal(domain.gather(host, player, worldWith(null), 5000, () => 1), null);
  const first = domain.gather(host, player, worldWith('rock'), 5000, () => 1);
  assert.equal(first.name, 'Ore');
  assert.equal(first.quantity, 1);
  assert.equal(player.inventory[0].quantity, 1);
  assert.equal(domain.gather(host, player, worldWith('rock'), 5000 + EXPLORATION_KNOWLEDGE_RULES.gatherCooldownMs - 1, () => 1), null);
  assert.equal(domain.gather(host, player, worldWith('rock'), 5000 + EXPLORATION_KNOWLEDGE_RULES.gatherCooldownMs, () => 1).name, 'Ore');
});

test('exploration gathering bonus yield and profession level-up are server-derived', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  player.official.professions.mining = { level: 10, xp: 99 };
  const result = domain.gather(host, player, worldWith('stone'), 5000, () => 0);
  assert.equal(result.quantity, 2);
  assert.equal(result.level, 11);
  assert.equal(result.xp, 0);
  assert.equal(player.inventory.find(item => item.name === 'Ore').quantity, 2);
  assert.equal(player.professions, player.official.professions);
});

test('exploration gathering rejects invalid coordinates/world and caps profession level', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  assert.equal(domain.gather(host, player, null, 5000, () => 0), null);
  player.x = 1.5;
  assert.equal(domain.gather(host, player, worldWith('rock'), 5000, () => 0), null);
  player.x = 1;
  player.official.professions.mining = { level: 100, xp: 999999 };
  const result = domain.gather(host, player, worldWith('rock'), 5000, () => 0);
  assert.equal(result.level, 100);
  assert.ok(result.xp < 1000);
});

test('knowledge books validate catalog IDs and never duplicate history', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  assert.equal(domain.readBook(host, player, 'missing_book'), false);
  assert.equal(domain.readBook(host, player, 'chronicle_eldoria'), true);
  assert.equal(domain.readBook(host, player, 'chronicle_eldoria'), true);
  assert.deepEqual(player.official.booksRead, ['chronicle_eldoria']);
});

test('public mystery catalog never exposes server answers', () => {
  const catalog = publicMysteries();
  assert.ok(catalog.length >= 2);
  for (const mystery of catalog) {
    for (const chapter of mystery.chapters) {
      assert.equal(Object.hasOwn(chapter, 'answer'), false);
      assert.ok(chapter.riddle);
      assert.ok(chapter.hint);
    }
  }
});

test('mystery progression rejects locked and incorrect answers without rewards', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  player.level = 1;
  assert.equal(domain.answerMystery(host, player, 'lost_tome', 'lightning').ok, false);
  player.level = 10;
  const before = { gold: player.gold, xp: player.xp, rep: player.reputation.town };
  assert.deepEqual(domain.answerMystery(host, player, 'lost_tome', 'wrong'), { ok: false, error: 'Incorrect answer.' });
  assert.deepEqual({ gold: player.gold, xp: player.xp, rep: player.reputation.town }, before);
  assert.equal(player.official.mysteries.lost_tome.solvedChapters, 0);
});

test('mystery final reward is authoritative and exactly once', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  assert.equal(domain.answerMystery(host, player, 'lost_tome', ' LIGHTNING ').solvedChapters, 1);
  assert.equal(domain.answerMystery(host, player, 'lost_tome', 'artichoke').solvedChapters, 2);
  const completed = domain.answerMystery(host, player, 'lost_tome', 'MORIA', 9000);
  assert.equal(completed.ok, true);
  assert.equal(completed.completed, true);
  assert.deepEqual(completed.reward, { gold: 500, xp: 800, item: { name: 'Ancient Rune', icon: '📜', value: 300 } });
  assert.equal(player.gold, 600);
  assert.equal(player.xp, 800);
  assert.equal(player.stats.goldEarned, 500);
  assert.equal(player.reputation.town, 75);
  assert.equal(player.inventory.filter(item => item.name === 'Ancient Rune').length, 1);
  const balances = { gold: player.gold, xp: player.xp, rep: player.reputation.town, items: player.inventory.length };
  assert.deepEqual(domain.answerMystery(host, player, 'lost_tome', 'moria'), { ok: false, error: 'Mystery already completed.' });
  assert.deepEqual({ gold: player.gold, xp: player.xp, rep: player.reputation.town, items: player.inventory.length }, balances);
});

test('corrupt mystery progress fails closed instead of replaying final rewards', () => {
  const domain = new OfficialExplorationKnowledgeDomain();
  const player = makePlayer();
  player.official.mysteries.lost_tome = { solvedChapters: 999999, completed: false };
  const before = { gold: player.gold, xp: player.xp };
  assert.deepEqual(domain.answerMystery(host, player, 'lost_tome', 'moria'), { ok: false, error: 'Mystery already completed.' });
  assert.deepEqual({ gold: player.gold, xp: player.xp }, before);
  assert.deepEqual(player.official.mysteries.lost_tome, { solvedChapters: 3, completed: true });
});
