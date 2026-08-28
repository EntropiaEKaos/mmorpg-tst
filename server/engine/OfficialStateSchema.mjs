// ===================================================================
// MOR'IA — OFFICIAL STATE SCHEMA
// Single normalization boundary for persistent official player/global state.
// ===================================================================

import { ACHIEVEMENTS, MYSTERIES, OFFICIAL_BOOKS, OFFICIAL_PETS } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US').slice(0, 80);
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const unique = values => [...new Set(values)];

export const OFFICIAL_STATE_SCHEMA_VERSION = 1;
export const OFFICIAL_STATE_LIMITS = Object.freeze({
  depot: 40,
  pets: OFFICIAL_PETS.length,
  bestiary: 500,
  bestiaryCount: 1_000_000,
  achievements: ACHIEVEMENTS.length,
  regions: 100,
  books: OFFICIAL_BOOKS.length,
  mastery: 100,
  titles: 20,
  auctions: 500,
  mail: 5000,
  credits: 5000,
  eventRewardOwners: 5000,
  eventRewardsPerOwner: 20,
});

function clone(value) {
  if (value === null || value === undefined) return value;
  return structuredClone(value);
}

function normalizeProfession(raw) {
  return { level: int(raw?.level, 1, 100, 1), xp: int(raw?.xp, 0, 1_000_000, 0) };
}

function normalizeBestiary(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(raw).slice(0, OFFICIAL_STATE_LIMITS.bestiary)) {
    const key = slug(rawKey);
    if (!key) continue;
    result[key] = Math.min(
      OFFICIAL_STATE_LIMITS.bestiaryCount,
      int(result[key], 0, OFFICIAL_STATE_LIMITS.bestiaryCount, 0)
        + int(rawValue, 0, OFFICIAL_STATE_LIMITS.bestiaryCount, 0),
    );
  }
  return result;
}

function normalizeMastery(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const [rawId, rawEntry] of Object.entries(raw).slice(0, OFFICIAL_STATE_LIMITS.mastery)) {
    const id = text(rawId, 100);
    if (!id || !isRecord(rawEntry)) continue;
    result[id] = {
      level: int(rawEntry.level, 1, 20, 1),
      xp: int(rawEntry.xp, 0, 1_000_000, 0),
    };
  }
  return result;
}

function normalizeMysteries(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const mystery of MYSTERIES) {
    if (!isRecord(raw[mystery.id])) continue;
    const chapterCount = mystery.chapters.length;
    const rawProgress = raw[mystery.id];
    const solved = int(rawProgress.solvedChapters, 0, chapterCount, 0);
    const completed = Boolean(rawProgress.completed) || solved >= chapterCount;
    result[mystery.id] = {
      solvedChapters: completed ? chapterCount : solved,
      completed,
    };
  }
  return result;
}

function normalizeEventReward(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 160);
  if (!id) return null;
  return {
    id,
    name: text(raw.name, 100) || 'World Event',
    gold: int(raw.gold, 0, 10_000_000, 0),
    xp: int(raw.xp, 0, 10_000_000, 0),
    coins: int(raw.coins, 0, 10_000, 0),
    claimed: Boolean(raw.claimed),
  };
}

function freshRoadPlayer(){return {version:'9.26.0',professions:{specializations:{},discoveries:[],workOrders:[]},beastCare:{animals:{}},politics:{influence:0,votes:0,bountiesPlaced:0},warfare:{assetsBuilt:0,repairs:0,damage:0},dungeon:{blueprintId:null,path:null,puzzle:null,puzzleProgress:0,puzzleSolved:false},quests:{choices:{}},housing:{upgrades:[],shopOpen:false,shopName:'',homeScore:0}};}
function freshRoadGlobal(){return {version:'9.26.0',economy:{regions:{},ledger:[],inflationIndex:1},politics:{factions:{},diplomacy:{},bounties:[]},warfare:{nodes:{}},dynamicWorld:{regions:{},events:[],sequence:0},dungeons:{worldBosses:{},records:[]},questConsequences:{},housing:{shops:{}},sequence:0};}
function normalizeRoadPlayer(raw){const b=freshRoadPlayer();if(!isRecord(raw))return b;const p=isRecord(raw.professions)?raw.professions:{};b.professions.specializations=isRecord(p.specializations)?Object.fromEntries(Object.entries(p.specializations).slice(0,40).map(([k,v])=>[slug(k),text(v,100)]).filter(x=>x[0]&&x[1])):{};b.professions.discoveries=Array.isArray(p.discoveries)?unique(p.discoveries.map(v=>text(v,100)).filter(Boolean)).slice(-100):[];b.professions.workOrders=Array.isArray(p.workOrders)?p.workOrders.filter(isRecord).slice(-30).map(clone):[];const bc=isRecord(raw.beastCare)?raw.beastCare:{};b.beastCare.animals=isRecord(bc.animals)?Object.fromEntries(Object.entries(bc.animals).slice(0,40).map(([id,v])=>[text(id,120),clone(v)]).filter(x=>x[0])):{};b.politics={influence:int(raw.politics?.influence,0,1000000,0),votes:int(raw.politics?.votes,0,100000,0),bountiesPlaced:int(raw.politics?.bountiesPlaced,0,100000,0)};b.warfare={assetsBuilt:int(raw.warfare?.assetsBuilt,0,1000000,0),repairs:int(raw.warfare?.repairs,0,100000000,0),damage:int(raw.warfare?.damage,0,100000000,0)};b.dungeon={blueprintId:text(raw.dungeon?.blueprintId,100)||null,path:text(raw.dungeon?.path,100)||null,puzzle:text(raw.dungeon?.puzzle,100)||null,puzzleProgress:int(raw.dungeon?.puzzleProgress,0,3,0),puzzleSolved:Boolean(raw.dungeon?.puzzleSolved)};b.quests.choices=isRecord(raw.quests?.choices)?Object.fromEntries(Object.entries(raw.quests.choices).slice(0,100).map(([k,v])=>[text(k,100),text(v,100)]).filter(x=>x[0]&&x[1])):{};b.housing={upgrades:Array.isArray(raw.housing?.upgrades)?unique(raw.housing.upgrades.map(v=>text(v,100)).filter(Boolean)).slice(-12):[],shopOpen:Boolean(raw.housing?.shopOpen),shopName:text(raw.housing?.shopName,80),homeScore:int(raw.housing?.homeScore,0,10000,0)};return b;}
function normalizeRoadGlobal(raw){const b=freshRoadGlobal();if(!isRecord(raw))return b;const copyRecord=(v,max)=>isRecord(v)?Object.fromEntries(Object.entries(v).slice(0,max).map(([k,x])=>[text(k,120),clone(x)]).filter(x=>x[0])):{};b.economy.regions=copyRecord(raw.economy?.regions,200);b.economy.ledger=Array.isArray(raw.economy?.ledger)?raw.economy.ledger.filter(isRecord).slice(-200).map(clone):[];b.economy.inflationIndex=clamp(raw.economy?.inflationIndex,.75,1.5,1);b.politics.factions=copyRecord(raw.politics?.factions,100);b.politics.diplomacy=copyRecord(raw.politics?.diplomacy,300);b.politics.bounties=Array.isArray(raw.politics?.bounties)?raw.politics.bounties.filter(isRecord).slice(-100).map(clone):[];b.warfare.nodes=copyRecord(raw.warfare?.nodes,200);b.dynamicWorld.regions=copyRecord(raw.dynamicWorld?.regions,200);b.dynamicWorld.events=Array.isArray(raw.dynamicWorld?.events)?raw.dynamicWorld.events.filter(isRecord).slice(-80).map(clone):[];b.dynamicWorld.sequence=int(raw.dynamicWorld?.sequence,0,999999999,0);b.dungeons.worldBosses=copyRecord(raw.dungeons?.worldBosses,500);b.dungeons.records=Array.isArray(raw.dungeons?.records)?raw.dungeons.records.filter(isRecord).slice(-200).map(clone):[];b.questConsequences=copyRecord(raw.questConsequences,500);b.housing.shops=copyRecord(raw.housing?.shops,500);b.sequence=int(raw.sequence,0,999999999,0);return b;}

export function freshPlayerState(now = Date.now()) {
  const timestamp = Number(now) > 0 ? Number(now) : Date.now();
  return {
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    depot: [],
    pets: { owned: [], active: null },
    coins: 50,
    training: 0,
    professions: {
      mining: { level: 1, xp: 0 }, herbalism: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 }, woodcutting: { level: 1, xp: 0 },
    },
    bestiary: {}, achievements: [], regionsDiscovered: ['eldoria'],
    daily: { lastDay: '', streak: 0 },
    stamina: 2520, lastStaminaTick: timestamp,
    booksRead: [], mysteries: {},
    pvp: { enabled: false, skull: 'none', aggression: 0, lastAggression: 0 },
    mastery: {}, blessingsUntil: 0,
    titles: { owned: [], active: null },
    dungeon: { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 0, clears: 0 },
    welcomeMailSent: false,
    lastGatherAt: 0, lastMailAt: 0, lastPvpAttack: 0,
    livingRealm: { faction:{id:null,reputation:0,rank:0,joinedAt:0,defectionUntil:0,history:[]}, crafting:{skills:{},crafted:0,masterworks:0,log:[]}, taming:{skill:1,xp:0,animals:[],activeId:null,breedingCount:0}, lastNodeAttackAt:0 },
    roadToTen: freshRoadPlayer(),
  };
}

export function freshGlobalState() {
  return {
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0,
    livingRealm: { nodes:{}, chronicle:[], sequence:0 },
    roadToTen: freshRoadGlobal(),
  };
}

export function normalizePlayerState(saved, now = Date.now()) {
  const base = freshPlayerState(now);
  if (!isRecord(saved)) return base;

  base.depot = Array.isArray(saved.depot)
    ? saved.depot.filter(isRecord).slice(0, OFFICIAL_STATE_LIMITS.depot).map(clone)
    : [];

  const owned = Array.isArray(saved.pets?.owned)
    ? unique(saved.pets.owned.filter(id => typeof id === 'string' && OFFICIAL_PETS.some(pet => pet.id === id))).slice(0, OFFICIAL_STATE_LIMITS.pets)
    : [];
  base.pets.owned = owned;
  base.pets.active = owned.includes(saved.pets?.active) ? saved.pets.active : null;

  base.coins = int(saved.coins, 0, 10_000_000, 50);
  base.training = int(saved.training, 0, 20, 0);
  for (const key of Object.keys(base.professions)) base.professions[key] = normalizeProfession(saved.professions?.[key]);
  base.bestiary = normalizeBestiary(saved.bestiary);
  base.achievements = Array.isArray(saved.achievements)
    ? unique(saved.achievements.filter(id => ACHIEVEMENTS.some(achievement => achievement.id === id))).slice(0, OFFICIAL_STATE_LIMITS.achievements)
    : [];
  base.regionsDiscovered = Array.isArray(saved.regionsDiscovered)
    ? unique(saved.regionsDiscovered.map(value => text(value, 100)).filter(Boolean)).slice(0, OFFICIAL_STATE_LIMITS.regions)
    : ['eldoria'];
  if (!base.regionsDiscovered.includes('eldoria')) base.regionsDiscovered.unshift('eldoria');
  base.regionsDiscovered = base.regionsDiscovered.slice(0, OFFICIAL_STATE_LIMITS.regions);
  base.daily = {
    lastDay: text(saved.daily?.lastDay, 10),
    streak: int(saved.daily?.streak, 0, 7, 0),
  };
  base.stamina = int(saved.stamina, 0, 2520, 2520);
  base.lastStaminaTick = Number(saved.lastStaminaTick) > 0 ? Number(saved.lastStaminaTick) : base.lastStaminaTick;
  base.booksRead = Array.isArray(saved.booksRead)
    ? unique(saved.booksRead.filter(id => OFFICIAL_BOOKS.some(book => book.id === id))).slice(0, OFFICIAL_STATE_LIMITS.books)
    : [];
  base.mysteries = normalizeMysteries(saved.mysteries);
  base.pvp = {
    enabled: Boolean(saved.pvp?.enabled),
    skull: ['none', 'white', 'yellow', 'orange', 'red', 'black'].includes(saved.pvp?.skull) ? saved.pvp.skull : 'none',
    aggression: int(saved.pvp?.aggression, 0, 100, 0),
    lastAggression: Math.max(0, Number(saved.pvp?.lastAggression) || 0),
  };
  base.mastery = normalizeMastery(saved.mastery);
  base.blessingsUntil = Math.max(0, Number(saved.blessingsUntil) || 0);
  base.titles.owned = Array.isArray(saved.titles?.owned)
    ? unique(saved.titles.owned.map(value => text(value, 50)).filter(Boolean)).slice(0, OFFICIAL_STATE_LIMITS.titles)
    : [];
  base.titles.active = base.titles.owned.includes(saved.titles?.active) ? saved.titles.active : null;
  base.dungeon = {
    active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0,
    highestWave: int(saved.dungeon?.highestWave, 0, 10, 0),
    clears: int(saved.dungeon?.clears, 0, 1_000_000, 0),
  };
  base.welcomeMailSent = Boolean(saved.welcomeMailSent);
  if (isRecord(saved.livingRealm)) {
    const lr=saved.livingRealm;
    base.livingRealm.faction={
      id:text(lr.faction?.id,100)||null, reputation:int(lr.faction?.reputation,-5000,100000,0), rank:int(lr.faction?.rank,0,5,0),
      joinedAt:Math.max(0,Number(lr.faction?.joinedAt)||0), defectionUntil:Math.max(0,Number(lr.faction?.defectionUntil)||0),
      history:Array.isArray(lr.faction?.history)?lr.faction.history.filter(isRecord).slice(-10).map(entry=>({id:text(entry.id,100),leftAt:Math.max(0,Number(entry.leftAt)||0)})):[],
    };
    const skills={}; if(isRecord(lr.crafting?.skills)) for(const [id,skill] of Object.entries(lr.crafting.skills).slice(0,40)){const key=slug(id);if(key)skills[key]={level:int(skill?.level,1,100,1),xp:int(skill?.xp,0,1000000,0)}}
    base.livingRealm.crafting={skills,crafted:int(lr.crafting?.crafted,0,100000000,0),masterworks:int(lr.crafting?.masterworks,0,100000000,0),log:Array.isArray(lr.crafting?.log)?lr.crafting.log.filter(isRecord).slice(-100).map(clone):[]};
    const animals=Array.isArray(lr.taming?.animals)?lr.taming.animals.filter(isRecord).slice(-40).map(clone):[];
    base.livingRealm.taming={skill:int(lr.taming?.skill,1,100,1),xp:int(lr.taming?.xp,0,1000000,0),animals,activeId:animals.some(a=>a.id===lr.taming?.activeId)?lr.taming.activeId:null,breedingCount:int(lr.taming?.breedingCount,0,1000000,0)};
    base.livingRealm.lastNodeAttackAt=Math.max(0,Number(lr.lastNodeAttackAt)||0);
  }
  base.roadToTen=normalizeRoadPlayer(saved.roadToTen);
  return base;
}

export function normalizeGlobalState(raw) {
  const base = freshGlobalState();
  if (!isRecord(raw)) return base;
  base.auctions = Array.isArray(raw.auctions)
    ? raw.auctions.filter(isRecord).slice(-OFFICIAL_STATE_LIMITS.auctions).map(clone)
    : [];
  base.mail = Array.isArray(raw.mail)
    ? raw.mail.filter(isRecord).slice(-OFFICIAL_STATE_LIMITS.mail).map(clone)
    : [];

  if (isRecord(raw.credits)) {
    for (const [rawName, rawCredit] of Object.entries(raw.credits).slice(0, OFFICIAL_STATE_LIMITS.credits)) {
      const key = playerKey(rawName);
      if (!key) continue;
      base.credits[key] = Math.min(1_000_000_000, int(base.credits[key], 0, 1_000_000_000, 0) + int(rawCredit, 0, 1_000_000_000, 0));
    }
  }

  if (isRecord(raw.eventRewards)) {
    for (const [rawName, rawQueue] of Object.entries(raw.eventRewards).slice(0, OFFICIAL_STATE_LIMITS.eventRewardOwners)) {
      const key = playerKey(rawName);
      if (!key || !Array.isArray(rawQueue)) continue;
      const queue = rawQueue.map(normalizeEventReward).filter(Boolean).slice(-OFFICIAL_STATE_LIMITS.eventRewardsPerOwner);
      if (queue.length) base.eventRewards[key] = queue;
    }
  }

  base.event = isRecord(raw.event) ? clone(raw.event) : null;
  base.eventSequence = int(raw.eventSequence, 0, 999_999, 0);
  if (isRecord(raw.livingRealm)) {
    const lr=raw.livingRealm; const nodes={};
    if(isRecord(lr.nodes)) for(const [id,node] of Object.entries(lr.nodes).slice(0,200)){const key=text(id,100);if(key&&isRecord(node))nodes[key]=clone(node)}
    base.livingRealm={nodes,chronicle:Array.isArray(lr.chronicle)?lr.chronicle.filter(isRecord).slice(-250).map(clone):[],sequence:int(lr.sequence,0,999999999,0)};
  }
  base.roadToTen=normalizeRoadGlobal(raw.roadToTen);
  return base;
}

export function exportPlayerState(state) {
  const s = normalizePlayerState(state);
  return clone({
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    depot: s.depot,
    pets: s.pets,
    coins: s.coins,
    training: s.training,
    professions: s.professions,
    bestiary: s.bestiary,
    achievements: s.achievements,
    regionsDiscovered: s.regionsDiscovered,
    daily: s.daily,
    stamina: s.stamina,
    lastStaminaTick: s.lastStaminaTick,
    booksRead: s.booksRead,
    mysteries: s.mysteries,
    pvp: {
      enabled: s.pvp.enabled,
      skull: s.pvp.skull,
      aggression: s.pvp.aggression,
      lastAggression: s.pvp.lastAggression,
    },
    mastery: s.mastery,
    blessingsUntil: s.blessingsUntil,
    titles: s.titles,
    dungeon: { highestWave: s.dungeon.highestWave, clears: s.dungeon.clears },
    welcomeMailSent: s.welcomeMailSent,
    livingRealm: s.livingRealm,
    roadToTen: s.roadToTen,
  });
}
