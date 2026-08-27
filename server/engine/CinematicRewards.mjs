// ===================================================================
// MOR'IA 9.4 — AUTHORITATIVE CINEMATIC REWARD CONTRACTS
// Presentation metadata is derived from server-confirmed game outcomes.
// ===================================================================

const RARITY_COLOR = Object.freeze({
  common: '#d7d7d7', uncommon: '#5ee06f', rare: '#5aa7ff', epic: '#b86cff', legendary: '#ffb347',
});

const cleanText = (value, fallback, max = 100) => {
  const text = typeof value === 'string' ? value.trim().slice(0, max) : '';
  return text || fallback;
};

const safePos = (source, fallback = { x: 0, y: 0 }) => ({
  x: Number.isFinite(Number(source?.x)) ? Number(source.x) : Number(fallback?.x) || 0,
  y: Number.isFinite(Number(source?.y)) ? Number(source.y) : Number(fallback?.y) || 0,
});

function baseEvent(kind, player, data = {}) {
  return {
    kind,
    targetId: player?.id,
    vocation: player?.vocation || 'knight',
    pos: safePos(data.pos, player),
    ...data,
  };
}

export function buildBossIntroEvent(player, monster) {
  if (!monster || monster.type !== 'boss') return null;
  const name = cleanText(monster.name, 'Unknown Boss');
  return baseEvent('boss_intro', player, {
    text: name,
    title: 'BOSS APPROACHES',
    subtitle: name,
    icon: monster.emoji || '👑',
    color: /^#[0-9a-fA-F]{3,8}$/.test(String(monster.color || '')) ? monster.color : '#ffbf5f',
    pos: safePos(monster),
    monsterId: monster.id,
    monsterName: name,
    level: Math.max(1, Math.floor(Number(monster.level) || 1)),
  });
}

export function buildRegionDiscoveryEvent(player, map) {
  if (!map?.id) return null;
  const name = cleanText(map.name, map.id);
  return baseEvent('region_discovered', player, {
    text: `REGION DISCOVERED · ${name}`,
    title: 'REGION DISCOVERED',
    subtitle: name,
    icon: '🗺️',
    color: '#7dd3fc',
    regionId: String(map.id).slice(0, 100),
    regionName: name,
    description: cleanText(map.description, '', 180),
  });
}

export function buildAchievementUnlockEvent(player, achievement) {
  if (!achievement?.id) return null;
  const name = cleanText(achievement.name, achievement.id);
  const coins = Math.max(0, Math.floor(Number(achievement.coins) || 0));
  return baseEvent('achievement_unlocked', player, {
    text: `ACHIEVEMENT · ${name}${coins ? ` · +${coins} coins` : ''}`,
    title: 'ACHIEVEMENT UNLOCKED',
    subtitle: name,
    icon: achievement.icon || '🏆',
    color: '#c084fc',
    achievementId: String(achievement.id).slice(0, 100),
    coins,
  });
}

export function buildCosmeticUnlockEvent(player, reward = {}) {
  const type = reward.type === 'mount' ? 'mount' : reward.type === 'addon' ? 'addon' : 'outfit';
  const name = cleanText(reward.name, type === 'mount' ? 'New Mount' : type === 'addon' ? 'New Addon' : 'New Outfit');
  const color = /^#[0-9a-fA-F]{3,8}$/.test(String(reward.color || '')) ? reward.color : (type === 'mount' ? '#d9bd7a' : '#d49bc8');
  return baseEvent('cosmetic_unlocked', player, {
    text: `${type.toUpperCase()} UNLOCKED · ${name}`,
    title: type === 'mount' ? 'MOUNT UNLOCKED' : type === 'addon' ? 'ADDON UNLOCKED' : 'OUTFIT UNLOCKED',
    subtitle: name,
    icon: reward.icon || (type === 'mount' ? '🐎' : type === 'addon' ? '✨' : '🧥'),
    color,
    unlockType: type,
    unlockId: cleanText(reward.id, name, 100),
  });
}

export function buildRewardChestEvent(player, reward = {}) {
  const rarity = Object.prototype.hasOwnProperty.call(RARITY_COLOR, reward.rarity) ? reward.rarity : 'rare';
  const name = cleanText(reward.name, 'Equipment Cache');
  return baseEvent('reward_chest_opened', player, {
    text: `REWARD CHEST · ${name}`,
    title: 'REWARD CHEST OPENED',
    subtitle: name,
    icon: reward.icon || '🎁',
    color: RARITY_COLOR[rarity],
    rarity,
    rewardName: name,
  });
}
