// ===================================================================
// MOR'IA 9.3 — REWARD FEEDBACK CONTRACT
// Creates presentation metadata from authoritative rewards.
// ===================================================================

const RARITY_RANK = Object.freeze({ common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 });
const RARITY_COLOR = Object.freeze({
  common: '#d7d7d7', uncommon: '#5ee06f', rare: '#5aa7ff', epic: '#b86cff', legendary: '#ffb347',
});

export function rewardRarity(item) {
  const rarity = String(item?.rarity || 'common').toLowerCase();
  return Object.prototype.hasOwnProperty.call(RARITY_RANK, rarity) ? rarity : 'common';
}

export function summarizeLoot(loot = []) {
  const items = Array.isArray(loot) ? loot.filter(Boolean) : [];
  if (items.length === 0) return null;
  let best = 'common';
  for (const item of items) {
    const rarity = rewardRarity(item);
    if (RARITY_RANK[rarity] > RARITY_RANK[best]) best = rarity;
  }
  const names = items.slice(0, 3).map(item => `${item.icon || '◆'} ${item.name || 'Loot'}`);
  const suffix = items.length > 3 ? ` +${items.length - 3}` : '';
  return {
    rarity: best,
    color: RARITY_COLOR[best],
    tier: RARITY_RANK[best],
    text: `${names.join(' · ')}${suffix}`,
  };
}

export function buildBossDefeatEvent(player, monster) {
  if (!monster || monster.type !== 'boss') return null;
  return {
    kind: 'boss_defeated',
    targetId: player?.id,
    text: `BOSS DEFEATED · ${monster.name || 'Unknown Boss'}`,
    color: '#ffbf5f',
    pos: { x: Number(monster.x) || 0, y: Number(monster.y) || 0 },
    monsterName: monster.name || 'Boss',
    vocation: player?.vocation || 'knight',
  };
}

export function buildLootRewardEvent(player, loot, pos) {
  const summary = summarizeLoot(loot);
  if (!summary) return null;
  return {
    kind: 'loot_reward',
    targetId: player?.id,
    text: summary.text,
    color: summary.color,
    rarity: summary.rarity,
    rewardTier: summary.tier,
    pos: pos || { x: Number(player?.x) || 0, y: Number(player?.y) || 0 },
    vocation: player?.vocation || 'knight',
  };
}
