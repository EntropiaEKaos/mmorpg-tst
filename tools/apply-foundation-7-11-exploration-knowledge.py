from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL EXPLORATION & KNOWLEDGE DOMAIN
// Owns gathering professions, lore books and server-secret mysteries.
// ===================================================================

import { OFFICIAL_BOOKS, MYSTERIES } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export const EXPLORATION_KNOWLEDGE_RULES = Object.freeze({
  gatherCooldownMs: 4000,
  professionMaxLevel: 100,
  maxProfessionXp: 1_000_000,
  maxBookHistory: OFFICIAL_BOOKS.length,
  mysteryAnswerMaxLength: 80,
});

export const RESOURCE_NODES = Object.freeze({
  rock: Object.freeze({ profession: 'mining', name: 'Ore', icon: '⛏', value: 15 }),
  stone: Object.freeze({ profession: 'mining', name: 'Ore', icon: '⛏', value: 15 }),
  bush: Object.freeze({ profession: 'herbalism', name: 'Herb', icon: '🌿', value: 12 }),
  water: Object.freeze({ profession: 'fishing', name: 'Fish', icon: '🐟', value: 18 }),
  tree: Object.freeze({ profession: 'woodcutting', name: 'Wood', icon: '🪵', value: 10 }),
});

const ADJACENT_TILES = Object.freeze([[1, 0], [-1, 0], [0, 1], [0, -1]].map(Object.freeze));

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialExplorationKnowledgeDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

function addItem(player, item, now = Date.now()) {
  if (!Array.isArray(player.inventory)) player.inventory = [];
  const copy = { ...item, quantity: int(item?.quantity, 1, 9999, 1) };
  if (copy.type !== 'equipment' && copy.type !== 'gem') {
    const existing = player.inventory.find(entry => entry?.name === copy.name && entry?.type === copy.type && !entry?.equipment);
    if (existing) {
      existing.quantity = int(existing.quantity, 0, 999999, 0) + copy.quantity;
      return existing;
    }
  }
  copy.id = copy.id || `explore_${now}_${Math.random()}`;
  player.inventory.push(copy);
  return copy;
}

function normalizeProfession(raw) {
  return {
    level: int(raw?.level, 1, EXPLORATION_KNOWLEDGE_RULES.professionMaxLevel, 1),
    xp: int(raw?.xp, 0, EXPLORATION_KNOWLEDGE_RULES.maxProfessionXp, 0),
  };
}

function normalizeMysteryProgress(raw, chapterCount) {
  const solved = int(raw?.solvedChapters, 0, chapterCount, 0);
  const completed = Boolean(raw?.completed) || solved >= chapterCount;
  return { solvedChapters: solved, completed };
}

export function publicMysteries() {
  return MYSTERIES.map(mystery => ({
    id: mystery.id,
    name: mystery.name,
    icon: mystery.icon,
    requiredLevel: mystery.requiredLevel,
    rewardGold: mystery.rewardGold,
    rewardXp: mystery.rewardXp,
    rewardItem: mystery.rewardItem ? { ...mystery.rewardItem } : null,
    intro: mystery.intro,
    chapters: mystery.chapters.map(chapter => ({ clue: chapter.clue, riddle: chapter.riddle, hint: chapter.hint })),
  }));
}

export class OfficialExplorationKnowledgeDomain {
  gather(host, player, world, now = Date.now(), random = Math.random) {
    const s = state(host, player);
    const currentTime = Number(now);
    if (!Number.isFinite(currentTime) || currentTime < 0) return null;
    const lastGatherAt = Number(s.lastGatherAt) || 0;
    if (currentTime - lastGatherAt < EXPLORATION_KNOWLEDGE_RULES.gatherCooldownMs) return null;
    if (!world || typeof world.getMap !== 'function') return null;
    const map = world.getMap(player.mapId);
    if (!map || !Array.isArray(map.tiles) || !Number.isInteger(player.x) || !Number.isInteger(player.y)) return null;

    let resource = null;
    for (const [dx, dy] of ADJACENT_TILES) {
      const tile = map.tiles?.[player.y + dy]?.[player.x + dx];
      const candidate = tile ? RESOURCE_NODES[tile.type] : null;
      if (candidate) { resource = candidate; break; }
    }
    if (!resource) return null;

    if (!s.professions || typeof s.professions !== 'object') s.professions = {};
    const profession = normalizeProfession(s.professions[resource.profession]);
    s.professions[resource.profession] = profession;
    const roll = Number(typeof random === 'function' ? random() : 1);
    const bonusChance = Math.min(0.5, profession.level * 0.02);
    const quantity = 1 + (Number.isFinite(roll) && roll >= 0 && roll < bonusChance ? 1 : 0);

    s.lastGatherAt = currentTime;
    addItem(player, { name: resource.name, icon: resource.icon, type: 'material', quantity, value: resource.value }, currentTime);
    profession.xp = Math.min(EXPLORATION_KNOWLEDGE_RULES.maxProfessionXp, profession.xp + 1);
    const needed = profession.level * 10;
    if (profession.level < EXPLORATION_KNOWLEDGE_RULES.professionMaxLevel && profession.xp >= needed) {
      profession.xp -= needed;
      profession.level += 1;
    }
    if (profession.level >= EXPLORATION_KNOWLEDGE_RULES.professionMaxLevel) {
      profession.level = EXPLORATION_KNOWLEDGE_RULES.professionMaxLevel;
      profession.xp = Math.min(profession.xp, EXPLORATION_KNOWLEDGE_RULES.professionMaxLevel * 10 - 1);
    }
    player.professions = s.professions;
    return { ...resource, quantity, level: profession.level, xp: profession.xp };
  }

  readBook(host, player, bookId) {
    const s = state(host, player);
    if (!OFFICIAL_BOOKS.some(book => book.id === bookId)) return false;
    if (!Array.isArray(s.booksRead)) s.booksRead = [];
    if (!s.booksRead.includes(bookId)) {
      s.booksRead.push(bookId);
      s.booksRead = s.booksRead.filter((id, index, values) => values.indexOf(id) === index && OFFICIAL_BOOKS.some(book => book.id === id)).slice(-EXPLORATION_KNOWLEDGE_RULES.maxBookHistory);
    }
    return true;
  }

  answerMystery(host, player, mysteryId, answer, now = Date.now()) {
    const s = state(host, player);
    const mystery = MYSTERIES.find(entry => entry.id === mysteryId);
    if (!mystery || Number(player.level) < mystery.requiredLevel) return { ok: false, error: 'Mystery locked.' };
    if (!s.mysteries || typeof s.mysteries !== 'object' || Array.isArray(s.mysteries)) s.mysteries = {};

    const progress = normalizeMysteryProgress(s.mysteries[mystery.id], mystery.chapters.length);
    s.mysteries[mystery.id] = progress;
    if (progress.completed) return { ok: false, error: 'Mystery already completed.' };
    const chapter = mystery.chapters[progress.solvedChapters];
    if (!chapter) return { ok: false, error: 'Mystery state invalid.' };

    const normalizedAnswer = cleanText(answer, EXPLORATION_KNOWLEDGE_RULES.mysteryAnswerMaxLength).toLocaleLowerCase('en-US');
    if (!normalizedAnswer || normalizedAnswer !== chapter.answer.toLocaleLowerCase('en-US')) return { ok: false, error: 'Incorrect answer.' };

    progress.solvedChapters += 1;
    let reward = null;
    if (progress.solvedChapters >= mystery.chapters.length) {
      progress.solvedChapters = mystery.chapters.length;
      progress.completed = true;
      const gold = int(mystery.rewardGold, 0, 10_000_000, 0);
      const xp = int(mystery.rewardXp, 0, 10_000_000, 0);
      player.gold = Math.max(0, Number(player.gold) || 0) + gold;
      player.xp = Math.max(0, Number(player.xp) || 0) + xp;
      if (!player.stats || typeof player.stats !== 'object') player.stats = {};
      player.stats.goldEarned = Math.max(0, Number(player.stats.goldEarned) || 0) + gold;
      if (typeof host.awardReputation === 'function') host.awardReputation(player, 75);
      if (mystery.rewardItem) addItem(player, { ...mystery.rewardItem, type: 'misc', quantity: 1 }, Number(now) || Date.now());
      reward = { gold, xp, item: mystery.rewardItem ? { ...mystery.rewardItem } : null };
    }

    return { ok: true, completed: progress.completed, solvedChapters: progress.solvedChapters, reward };
  }

  publicMysteries() {
    return publicMysteries();
  }
}

export const officialExplorationKnowledgeDomain = new OfficialExplorationKnowledgeDomain();
'''
write('server/engine/OfficialExplorationKnowledgeDomain.mjs', DOMAIN)

TEST = r'''import test from 'node:test';
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
'''
write('server/test/official-exploration-knowledge-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.11 — Exploration & Knowledge Domain

Foundation 7.11 extracts gathering professions, lore books and mystery progression into `OfficialExplorationKnowledgeDomain`.

The domain owns authoritative resource-tile discovery, four-direction adjacency, gathering cooldowns, profession XP/level caps, deterministic bonus-yield rules, catalog-backed book history, secret mystery answers, normalized mystery progress and exactly-once final rewards.

`OfficialSystems` remains the compatibility façade and the public snapshot still exposes the same `books`, `mysteries` and profession state shapes. Mystery answers never enter the public catalog.

This boundary prepares MOR'IA for resource tiers, gathering tools, rare nodes, regional professions, archaeology, codex collections, lore achievements, multi-stage riddles, treasure maps and exploration seasons without regrowing the core runtime monolith.
'''
write('docs/FOUNDATION_7_11_EXPLORATION_KNOWLEDGE.md', DOC)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialInventoryEconomyDomain } from './OfficialInventoryEconomyDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialExplorationKnowledgeDomain } from './OfficialExplorationKnowledgeDomain.mjs';\n", 'exploration knowledge import')
text = replace_once(text,
"""  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES,\n  ACHIEVEMENTS, SETS,\n""",
"""  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,\n  ACHIEVEMENTS, SETS,\n""", 'remove mysteries import')

helpers = r'''function addItem(player, item) {
  const copy = { ...item };
  copy.quantity = int(copy.quantity, 1, 9999, 1);
  if (copy.type !== 'equipment' && copy.type !== 'gem') {
    const existing = player.inventory.find(entry => entry.name === copy.name && entry.type === copy.type && !entry.equipment);
    if (existing) { existing.quantity = int(existing.quantity, 0, 999999, 0) + copy.quantity; return existing; }
  }
  copy.id = copy.id || `official_${Date.now()}_${Math.random()}`;
  player.inventory.push(copy);
  return copy;
}

function consumeNamed(player, name, quantity) {
  let remaining = quantity;
  for (const item of player.inventory) {
    if (item.name !== name || remaining <= 0) continue;
    const take = Math.min(int(item.quantity, 0, 999999, 0), remaining);
    item.quantity -= take;
    remaining -= take;
  }
  player.inventory = player.inventory.filter(item => Number(item.quantity) > 0 || item.type === 'equipment');
  return remaining === 0;
}

function publicMysteries() {
  return MYSTERIES.map(m => ({
    id: m.id, name: m.name, icon: m.icon, requiredLevel: m.requiredLevel,
    rewardGold: m.rewardGold, rewardXp: m.rewardXp, rewardItem: m.rewardItem, intro: m.intro,
    chapters: m.chapters.map(c => ({ clue: c.clue, riddle: c.riddle, hint: c.hint })),
  }));
}

'''
text = replace_once(text, helpers, '', 'legacy exploration helpers')

methods = r'''  gather(player, world) {
    const s = this.ensurePlayer(player);
    const now = Date.now();
    if (now - s.lastGatherAt < 4000) return null;
    const map = world.getMap(player.mapId);
    if (!map) return null;
    const resources = {
      rock: { profession: 'mining', name: 'Ore', icon: '⛏', value: 15 },
      stone: { profession: 'mining', name: 'Ore', icon: '⛏', value: 15 },
      bush: { profession: 'herbalism', name: 'Herb', icon: '🌿', value: 12 },
      water: { profession: 'fishing', name: 'Fish', icon: '🐟', value: 18 },
      tree: { profession: 'woodcutting', name: 'Wood', icon: '🪵', value: 10 },
    };
    const around = [[1,0],[-1,0],[0,1],[0,-1]];
    let found = null;
    for (const [dx, dy] of around) {
      const tile = map.tiles?.[player.y + dy]?.[player.x + dx];
      if (tile && resources[tile.type]) { found = resources[tile.type]; break; }
    }
    if (!found) return null;
    s.lastGatherAt = now;
    const prof = s.professions[found.profession];
    const qty = 1 + (Math.random() < Math.min(0.5, prof.level * 0.02) ? 1 : 0);
    addItem(player, { name: found.name, icon: found.icon, type: 'material', quantity: qty, value: found.value });
    prof.xp += 1;
    if (prof.xp >= prof.level * 10 && prof.level < 100) { prof.xp -= prof.level * 10; prof.level++; }
    player.professions = s.professions;
    return { ...found, quantity: qty, level: prof.level, xp: prof.xp };
  }

  readBook(player, bookId) {
    const s = this.ensurePlayer(player);
    if (!OFFICIAL_BOOKS.some(b => b.id === bookId)) return false;
    if (!s.booksRead.includes(bookId)) s.booksRead.push(bookId);
    return true;
  }

  answerMystery(player, mysteryId, answer) {
    const s = this.ensurePlayer(player);
    const mystery = MYSTERIES.find(m => m.id === mysteryId);
    if (!mystery || player.level < mystery.requiredLevel) return { ok: false, error: 'Mystery locked.' };
    const progress = s.mysteries[mystery.id] || { solvedChapters: 0, completed: false };
    if (progress.completed) return { ok: false, error: 'Mystery already completed.' };
    const chapter = mystery.chapters[progress.solvedChapters];
    if (!chapter) return { ok: false, error: 'Mystery state invalid.' };
    if (cleanText(answer, 80).toLowerCase() !== chapter.answer.toLowerCase()) return { ok: false, error: 'Incorrect answer.' };
    progress.solvedChapters++;
    if (progress.solvedChapters >= mystery.chapters.length) {
      progress.completed = true;
      player.gold += mystery.rewardGold; player.xp += mystery.rewardXp;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + mystery.rewardGold;
      this.awardReputation(player, 75);
      if (mystery.rewardItem) addItem(player, { ...mystery.rewardItem, type: 'misc', quantity: 1 });
    }
    s.mysteries[mystery.id] = progress;
    return { ok: true, completed: progress.completed, solvedChapters: progress.solvedChapters, reward: progress.completed ? { gold: mystery.rewardGold, xp: mystery.rewardXp, item: mystery.rewardItem } : null };
  }
'''
replacement = r'''  gather(player, world) {
    return officialExplorationKnowledgeDomain.gather(this, player, world);
  }

  readBook(player, bookId) {
    return officialExplorationKnowledgeDomain.readBook(this, player, bookId);
  }

  answerMystery(player, mysteryId, answer) {
    return officialExplorationKnowledgeDomain.answerMystery(this, player, mysteryId, answer);
  }
'''
text = replace_once(text, methods, replacement, 'exploration knowledge methods')
text = replace_once(text, 'mysteries: publicMysteries(), achievements:', 'mysteries: officialExplorationKnowledgeDomain.publicMysteries(), achievements:', 'public mystery snapshot')
write(path, text)

print('Foundation 7.11 exploration/knowledge domain extraction applied')
