// ===================================================================
// MOR'IA — OFFICIAL SNAPSHOT READ MODEL
// Projects authoritative runtime state into a detached, bounded client view.
// Persistent/runtime objects must never cross this boundary by reference.
// ===================================================================

import {
  ACHIEVEMENTS,
  OFFICIAL_BOOKS,
  OFFICIAL_COIN_STORE,
  OFFICIAL_FOOD,
  OFFICIAL_GEMS,
  OFFICIAL_PETS,
  OFFICIAL_RECIPES,
  OFFICIAL_SHOP,
} from './OfficialCatalogs.mjs';
import { officialExplorationKnowledgeDomain } from './OfficialExplorationKnowledgeDomain.mjs';
import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';

const clamp = (value, min, max, fallback = min) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const playerKey = name => String(name || '').trim().toLocaleLowerCase('en-US').slice(0, 80);
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const clone = value => value === undefined ? undefined : structuredClone(value);

export const OFFICIAL_SNAPSHOT_LIMITS = Object.freeze({
  mail: 50,
  auctions: 100,
  nearbyPvp: 100,
  pendingRewards: 20,
});

function projectMail(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 160);
  if (!id) return null;
  return {
    id,
    from: text(raw.from, 80),
    to: playerKey(raw.to),
    subject: text(raw.subject, 80),
    body: text(raw.body, 500),
    gold: int(raw.gold, 0, 1_000_000, 0),
    item: isRecord(raw.item) ? clone(raw.item) : null,
    claimed: Boolean(raw.claimed),
    read: Boolean(raw.read),
    sentAt: Math.max(0, Number(raw.sentAt) || 0),
    system: Boolean(raw.system),
  };
}

function projectAuction(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 160);
  if (!id || !isRecord(raw.item)) return null;
  return {
    id,
    seller: text(raw.seller, 80),
    price: int(raw.price, 1, 10_000_000, 1),
    item: clone(raw.item),
    createdAt: Math.max(0, Number(raw.createdAt) || 0),
  };
}

function projectWorldEvent(raw, pendingRewards) {
  const event = isRecord(raw) ? raw : {};
  return {
    id: text(event.id, 100),
    name: text(event.name, 100),
    icon: text(event.icon, 8),
    mapId: text(event.mapId, 50),
    target: text(event.target, 100),
    needed: int(event.needed, 0, 10_000, 0),
    progress: int(event.progress, 0, 10_000, 0),
    rewardGold: int(event.rewardGold, 0, 10_000_000, 0),
    rewardXp: int(event.rewardXp, 0, 10_000_000, 0),
    rewardCoins: int(event.rewardCoins, 0, 10_000, 0),
    completed: Boolean(event.completed),
    startedAt: Math.max(0, Number(event.startedAt) || 0),
    expiresAt: Math.max(0, Number(event.expiresAt) || 0),
    completedAt: Math.max(0, Number(event.completedAt) || 0),
    pendingRewards: Array.isArray(pendingRewards)
      ? clone(pendingRewards.slice(-OFFICIAL_SNAPSHOT_LIMITS.pendingRewards))
      : [],
  };
}

function projectNearbyPvp(host, player, nearbyPlayers) {
  if (!Array.isArray(nearbyPlayers)) return [];
  const result = [];
  const seen = new Set();
  for (const candidate of nearbyPlayers) {
    if (!candidate || candidate === player || candidate.id === player?.id) continue;
    if (candidate.mapId !== player?.mapId) continue;
    const id = text(candidate.id, 120);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const publicState = typeof host.publicPvp === 'function' ? host.publicPvp(candidate) : {};
    result.push({
      id,
      name: text(candidate.name, 80),
      level: int(candidate.level, 1, 1_000_000, 1),
      hp: int(candidate.hp, 0, 1_000_000_000, 0),
      maxHp: int(candidate.maxHp, 1, 1_000_000_000, 1),
      enabled: Boolean(publicState?.enabled),
      skull: text(publicState?.skull, 20) || 'none',
      title: text(publicState?.title, 50) || null,
    });
    if (result.length >= OFFICIAL_SNAPSHOT_LIMITS.nearbyPvp) break;
  }
  return result;
}

function projectState(host, player) {
  const state = host.ensurePlayer(player);
  return clone({
    depot: Array.isArray(state.depot) ? state.depot : [],
    pets: isRecord(state.pets) ? state.pets : { owned: [], active: null },
    coins: int(state.coins, 0, 10_000_000, 0),
    training: int(state.training, 0, 20, 0),
    professions: isRecord(state.professions) ? state.professions : {},
    bestiary: isRecord(state.bestiary) ? state.bestiary : {},
    achievements: Array.isArray(state.achievements) ? state.achievements : [],
    daily: isRecord(state.daily) ? state.daily : { lastDay: '', streak: 0 },
    stamina: int(state.stamina, 0, 2520, 0),
    booksRead: Array.isArray(state.booksRead) ? state.booksRead : [],
    mysteries: isRecord(state.mysteries) ? state.mysteries : {},
    pvp: isRecord(state.pvp) ? state.pvp : { enabled: false, skull: 'none', aggression: 0, lastAggression: 0 },
    mastery: isRecord(state.mastery) ? state.mastery : {},
    blessingsUntil: Math.max(0, Number(state.blessingsUntil) || 0),
    titles: isRecord(state.titles) ? state.titles : { owned: [], active: null },
    dungeon: isRecord(state.dungeon) ? state.dungeon : {},
    reputation: { ...(isRecord(player?.reputation) ? player.reputation : { town: 0 }) },
    shopDiscount: typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0,
  });
}

function projectCatalogs() {
  return {
    pets: clone(OFFICIAL_PETS),
    gems: clone(OFFICIAL_GEMS),
    shop: clone(OFFICIAL_SHOP),
    food: clone(OFFICIAL_FOOD),
    recipes: clone(OFFICIAL_RECIPES),
    coinStore: clone(OFFICIAL_COIN_STORE),
    books: clone(OFFICIAL_BOOKS),
    mysteries: clone(officialExplorationKnowledgeDomain.publicMysteries()),
    achievements: ACHIEVEMENTS.map(({ test, ...publicFields }) => clone(publicFields)),
  };
}

export class OfficialSnapshotReadModel {
  snapshot(host, player, nearbyPlayers = []) {
    if (!host || typeof host.ensurePlayer !== 'function' || !isRecord(host.global)) {
      throw new TypeError('OfficialSnapshotReadModel requires an OfficialSystems-compatible host.');
    }
    if (!player) throw new TypeError('OfficialSnapshotReadModel requires a player.');

    const event = typeof host.ensureWorldEvent === 'function' ? host.ensureWorldEvent() : null;
    const key = playerKey(player.name);
    const inbox = Array.isArray(host.global.mail)
      ? host.global.mail
        .filter(mail => playerKey(mail?.to) === key)
        .slice(-OFFICIAL_SNAPSHOT_LIMITS.mail)
        .map(projectMail)
        .filter(Boolean)
      : [];
    const auctions = Array.isArray(host.global.auctions)
      ? host.global.auctions
        .slice(-OFFICIAL_SNAPSHOT_LIMITS.auctions)
        .map(projectAuction)
        .filter(Boolean)
      : [];
    const pendingRewards = officialWorldEventDomain.pendingRewards(host, player);

    return {
      state: projectState(host, player),
      catalogs: projectCatalogs(),
      mail: inbox,
      auctions,
      worldEvent: projectWorldEvent(event, pendingRewards),
      nearbyPvp: projectNearbyPvp(host, player, nearbyPlayers),
    };
  }
}

export const officialSnapshotReadModel = new OfficialSnapshotReadModel();
