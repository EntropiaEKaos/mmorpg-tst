// ===================================================================
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
