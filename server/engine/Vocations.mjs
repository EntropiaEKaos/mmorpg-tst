// ===================================================================
//  MOR'IA SERVER — ALL 14 VOCATIONS (Authoritative)
// ===================================================================

export const VOCATIONS = {
  knight: {
    name: 'Knight', icon: '⚔', color: '#c13030',
    baseHp: 185, baseMana: 50, baseAttack: 25, baseDefense: 10, baseMagic: 3,
    hpPerLevel: 25, manaPerLevel: 5, atkPerLevel: 4, defPerLevel: 2, magPerLevel: 1,
    spells: [
      { name: 'Berserk', icon: '⚔', mana: 10, cooldown: 1800, damage: 35, range: 1.5, color: '#ff4444', type: 'aoe', levelRequired: 1 },
      { name: 'Wound Heal', icon: '❤', mana: 15, cooldown: 1500, damage: 60, range: 0, color: '#2ecc71', type: 'heal', levelRequired: 5 },
      { name: 'Fierce Berserk', icon: '🔥', mana: 30, cooldown: 4000, damage: 80, range: 1.5, color: '#ff6a00', type: 'aoe', levelRequired: 12 },
      { name: 'Magic Shield', icon: '🛡', mana: 40, cooldown: 10000, damage: 0, range: 0, color: '#4a90e2', type: 'buff', buffType: 'shield', levelRequired: 20 },
    ],
  },
  paladin: {
    name: 'Paladin', icon: '🏹', color: '#4a7c3a',
    baseHp: 150, baseMana: 80, baseAttack: 30, baseDefense: 7, baseMagic: 5,
    hpPerLevel: 18, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    spells: [
      { name: 'Divine Arrow', icon: '🏹', mana: 12, cooldown: 1500, damage: 55, range: 7, color: '#f4e04d', type: 'attack', levelRequired: 1 },
      { name: 'Divine Healing', icon: '✨', mana: 25, cooldown: 2000, damage: 80, range: 0, color: '#f4e04d', type: 'heal', levelRequired: 5 },
      { name: 'Multi Shot', icon: '🎯', mana: 30, cooldown: 3500, damage: 40, range: 6, color: '#ffcc33', type: 'aoe', levelRequired: 12 },
      { name: 'Haste', icon: '💨', mana: 20, cooldown: 8000, damage: 0, range: 0, color: '#9bd4ff', type: 'buff', buffType: 'haste', levelRequired: 20 },
    ],
  },
  sorcerer: {
    name: 'Sorcerer', icon: '🔮', color: '#9b59ff',
    baseHp: 120, baseMana: 130, baseAttack: 12, baseDefense: 4, baseMagic: 20,
    hpPerLevel: 12, manaPerLevel: 18, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Death Strike', icon: '💀', mana: 15, cooldown: 1800, damage: 65, range: 5, color: '#9b59ff', type: 'attack', levelRequired: 1 },
      { name: 'Fireball', icon: '🔥', mana: 25, cooldown: 2500, damage: 80, range: 6, color: '#ff6a00', type: 'attack', levelRequired: 5 },
      { name: 'Energy Wave', icon: '⚡', mana: 40, cooldown: 4500, damage: 110, range: 4, color: '#4a90e2', type: 'aoe', levelRequired: 12 },
      { name: 'Meteor', icon: '☄', mana: 60, cooldown: 8000, damage: 180, range: 5, color: '#ff3300', type: 'aoe', levelRequired: 20 },
    ],
  },
  druid: {
    name: 'Druid', icon: '🌿', color: '#2ecc71',
    baseHp: 130, baseMana: 140, baseAttack: 10, baseDefense: 5, baseMagic: 18,
    hpPerLevel: 14, manaPerLevel: 20, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Greater Heal', icon: '💚', mana: 20, cooldown: 1500, damage: 100, range: 0, color: '#2ecc71', type: 'heal', levelRequired: 1 },
      { name: 'Ice Strike', icon: '❄', mana: 15, cooldown: 1800, damage: 55, range: 5, color: '#9bd4ff', type: 'attack', levelRequired: 5 },
      { name: 'Mass Heal', icon: '🌸', mana: 50, cooldown: 5000, damage: 150, range: 0, color: '#ff9bcc', type: 'heal', levelRequired: 12 },
      { name: 'Ice Storm', icon: '🌨', mana: 35, cooldown: 4000, damage: 80, range: 4, color: '#4ad0ff', type: 'aoe', levelRequired: 20 },
    ],
  },
  warlock: {
    name: 'Warlock', icon: '👿', color: '#8b1a8b',
    baseHp: 125, baseMana: 150, baseAttack: 14, baseDefense: 4, baseMagic: 22,
    hpPerLevel: 13, manaPerLevel: 20, atkPerLevel: 2, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Soul Drain', icon: '💜', mana: 10, cooldown: 1500, damage: 45, range: 5, color: '#8b1a8b', type: 'attack', levelRequired: 1 },
      { name: 'Dark Heal', icon: '🖤', mana: 15, cooldown: 2000, damage: 70, range: 0, color: '#6a0a6a', type: 'heal', levelRequired: 5 },
      { name: 'Curse', icon: '☠', mana: 35, cooldown: 4000, damage: 100, range: 5, color: '#4a0a4a', type: 'attack', levelRequired: 12 },
      { name: 'Summon Demon', icon: '👹', mana: 60, cooldown: 12000, damage: 0, range: 0, color: '#ff0000', type: 'buff', levelRequired: 20 },
    ],
  },
  rogue: {
    name: 'Rogue', icon: '🗡', color: '#555555',
    baseHp: 140, baseMana: 70, baseAttack: 28, baseDefense: 6, baseMagic: 6,
    hpPerLevel: 16, manaPerLevel: 8, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    spells: [
      { name: 'Backstab', icon: '🗡', mana: 12, cooldown: 2000, damage: 80, range: 1.5, color: '#aaaaaa', type: 'attack', levelRequired: 1 },
      { name: 'Invisibility', icon: '👻', mana: 25, cooldown: 10000, damage: 0, range: 0, color: '#cccccc', type: 'buff', buffType: 'invisible', levelRequired: 5 },
      { name: 'Poison Blade', icon: '🧪', mana: 20, cooldown: 3500, damage: 60, range: 1.5, color: '#5eff5e', type: 'attack', levelRequired: 12 },
      { name: 'Shadow Step', icon: '💨', mana: 15, cooldown: 5000, damage: 50, range: 5, color: '#333333', type: 'attack', levelRequired: 20 },
    ],
  },
  priest: {
    name: 'Priest', icon: '⛪', color: '#f4e04d',
    baseHp: 135, baseMana: 160, baseAttack: 8, baseDefense: 6, baseMagic: 20,
    hpPerLevel: 15, manaPerLevel: 22, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Light Heal', icon: '✨', mana: 10, cooldown: 1000, damage: 60, range: 0, color: '#f4e04d', type: 'heal', levelRequired: 1 },
      { name: 'Holy Smite', icon: '⚡', mana: 20, cooldown: 2000, damage: 70, range: 5, color: '#f4e04d', type: 'attack', levelRequired: 5 },
      { name: 'Resurrection', icon: '🕊', mana: 80, cooldown: 20000, damage: 300, range: 0, color: '#ffffff', type: 'heal', levelRequired: 12 },
      { name: 'Holy Nova', icon: '☀', mana: 40, cooldown: 5000, damage: 90, range: 3, color: '#fff9c4', type: 'aoe', levelRequired: 20 },
    ],
  },
  deathknight: {
    name: 'Death Knight', icon: '💀', color: '#4a0e0e',
    baseHp: 200, baseMana: 90, baseAttack: 28, baseDefense: 12, baseMagic: 8,
    hpPerLevel: 28, manaPerLevel: 8, atkPerLevel: 4, defPerLevel: 3, magPerLevel: 1,
    spells: [
      { name: 'Death Strike', icon: '⚰', mana: 15, cooldown: 2000, damage: 50, range: 1.5, color: '#4a0e0e', type: 'attack', levelRequired: 1 },
      { name: 'Blood Tap', icon: '🩸', mana: 0, cooldown: 8000, damage: 80, range: 0, color: '#c13030', type: 'heal', levelRequired: 5 },
      { name: 'Army of Dead', icon: '☠', mana: 60, cooldown: 15000, damage: 120, range: 3, color: '#3a1a3a', type: 'aoe', levelRequired: 12 },
      { name: 'Unholy Frenzy', icon: '💀', mana: 30, cooldown: 6000, damage: 0, range: 0, color: '#6a0a6a', type: 'buff', buffType: 'frenzy', levelRequired: 20 },
    ],
  },
  monk: {
    name: 'Monk', icon: '🥋', color: '#e6a817',
    baseHp: 160, baseMana: 90, baseAttack: 30, baseDefense: 8, baseMagic: 12,
    hpPerLevel: 20, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 2, magPerLevel: 2,
    spells: [
      { name: 'Fist of Thunder', icon: '👊', mana: 12, cooldown: 1200, damage: 50, range: 1.5, color: '#e6a817', type: 'attack', levelRequired: 1 },
      { name: 'Chi Burst', icon: '🌀', mana: 20, cooldown: 2500, damage: 70, range: 4, color: '#ffd700', type: 'attack', levelRequired: 5 },
      { name: 'Spinning Crane', icon: '🌪', mana: 30, cooldown: 4000, damage: 85, range: 2.5, color: '#ffaa00', type: 'aoe', levelRequired: 12 },
      { name: 'Serenity', icon: '🧘', mana: 25, cooldown: 8000, damage: 120, range: 0, color: '#2ecc71', type: 'heal', levelRequired: 20 },
    ],
  },
  ranger: {
    name: 'Ranger', icon: '🏹', color: '#1a6b3a',
    baseHp: 145, baseMana: 85, baseAttack: 32, baseDefense: 6, baseMagic: 8,
    hpPerLevel: 17, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    spells: [
      { name: 'Power Shot', icon: '🏹', mana: 12, cooldown: 1400, damage: 60, range: 7, color: '#1a6b3a', type: 'attack', levelRequired: 1 },
      { name: 'Multishot', icon: '🎯', mana: 25, cooldown: 3000, damage: 45, range: 6, color: '#2ecc71', type: 'aoe', levelRequired: 5 },
      { name: 'Poison Arrow', icon: '🐍', mana: 18, cooldown: 2500, damage: 50, range: 7, color: '#5eff5e', type: 'attack', levelRequired: 12 },
      { name: 'Rain of Arrows', icon: '🌧', mana: 45, cooldown: 7000, damage: 100, range: 5, color: '#90c090', type: 'aoe', levelRequired: 20 },
    ],
  },
  necromancer: {
    name: 'Necromancer', icon: '☠', color: '#2a6a4a',
    baseHp: 125, baseMana: 155, baseAttack: 12, baseDefense: 4, baseMagic: 22,
    hpPerLevel: 13, manaPerLevel: 22, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Bone Spear', icon: '🦴', mana: 15, cooldown: 1600, damage: 60, range: 6, color: '#dddddd', type: 'attack', levelRequired: 1 },
      { name: 'Soul Drain', icon: '💀', mana: 20, cooldown: 2500, damage: 75, range: 5, color: '#2a6a4a', type: 'attack', levelRequired: 5 },
      { name: 'Corpse Explosion', icon: '💥', mana: 40, cooldown: 5000, damage: 130, range: 4, color: '#4a2a2a', type: 'aoe', levelRequired: 12 },
      { name: 'Raise Dead', icon: '🧟', mana: 50, cooldown: 10000, damage: 90, range: 3, color: '#1a4a2a', type: 'aoe', levelRequired: 20 },
    ],
  },
  berserker: {
    name: 'Berserker', icon: '🪓', color: '#a02020',
    baseHp: 175, baseMana: 60, baseAttack: 35, baseDefense: 7, baseMagic: 4,
    hpPerLevel: 22, manaPerLevel: 6, atkPerLevel: 6, defPerLevel: 1, magPerLevel: 1,
    spells: [
      { name: 'Cleave', icon: '🪓', mana: 12, cooldown: 1500, damage: 55, range: 1.5, color: '#a02020', type: 'aoe', levelRequired: 1 },
      { name: 'Whirlwind', icon: '🌀', mana: 25, cooldown: 3500, damage: 90, range: 2.5, color: '#ff3030', type: 'aoe', levelRequired: 5 },
      { name: 'Reckless Strike', icon: '💥', mana: 20, cooldown: 2500, damage: 110, range: 1.5, color: '#ff6060', type: 'attack', levelRequired: 12 },
      { name: 'Bloodrage', icon: '🩸', mana: 35, cooldown: 12000, damage: 0, range: 0, color: '#c13030', type: 'buff', buffType: 'frenzy', levelRequired: 20 },
    ],
  },
  shaman: {
    name: 'Shaman', icon: '🔱', color: '#008b8b',
    baseHp: 140, baseMana: 145, baseAttack: 14, baseDefense: 6, baseMagic: 19,
    hpPerLevel: 16, manaPerLevel: 20, atkPerLevel: 2, defPerLevel: 1, magPerLevel: 4,
    spells: [
      { name: 'Lightning Bolt', icon: '⚡', mana: 14, cooldown: 1600, damage: 58, range: 6, color: '#008b8b', type: 'attack', levelRequired: 1 },
      { name: 'Chain Heal', icon: '💚', mana: 25, cooldown: 2200, damage: 110, range: 0, color: '#2ecc71', type: 'heal', levelRequired: 5 },
      { name: 'Lava Burst', icon: '🌋', mana: 35, cooldown: 4000, damage: 95, range: 5, color: '#ff4500', type: 'attack', levelRequired: 12 },
      { name: 'Earthquake', icon: '🌍', mana: 50, cooldown: 8000, damage: 115, range: 5, color: '#8b4513', type: 'aoe', levelRequired: 20 },
    ],
  },
  templar: {
    name: 'Templar', icon: '⚜', color: '#d4af37',
    baseHp: 190, baseMana: 95, baseAttack: 26, baseDefense: 13, baseMagic: 10,
    hpPerLevel: 26, manaPerLevel: 9, atkPerLevel: 4, defPerLevel: 3, magPerLevel: 2,
    spells: [
      { name: 'Shield Bash', icon: '🛡', mana: 14, cooldown: 1800, damage: 48, range: 1.5, color: '#d4af37', type: 'attack', levelRequired: 1 },
      { name: 'Judgment', icon: '⚔', mana: 20, cooldown: 2500, damage: 70, range: 4, color: '#ffd700', type: 'attack', levelRequired: 5 },
      { name: 'Consecration', icon: '✨', mana: 35, cooldown: 5000, damage: 85, range: 3, color: '#fff9c4', type: 'aoe', levelRequired: 12 },
      { name: 'Divine Shield', icon: '🛡', mana: 40, cooldown: 12000, damage: 0, range: 0, color: '#ffffff', type: 'buff', buffType: 'shield', levelRequired: 20 },
    ],
  },
};

export const VOCATION_LIST = Object.values(VOCATIONS);
