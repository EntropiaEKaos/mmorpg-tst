import type { Tile, Monster, NPC, Position } from './types';

export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
export const TILE_SIZE = 32;

import type { Building } from './render';

// Buildings placed in each town
export function getTownBuildings(biome: string): Building[] {
  const base: Building[] = [
    // Central castle
    { x: 38, y: 33, w: 5, h: 5, type: 'castle', roofColor: '#5a3a3a' },
    // Inn (east)
    { x: 47, y: 36, w: 5, h: 4, type: 'inn', roofColor: '#8b5a2a' },
    // Bank (west)
    { x: 29, y: 36, w: 4, h: 4, type: 'shop', roofColor: '#b8980a' },
    // Temple (north)
    { x: 39, y: 27, w: 4, h: 5, type: 'temple', roofColor: '#a0a0c0' },
    // Guard towers
    { x: 31, y: 31, w: 3, h: 4, type: 'tower', roofColor: '#5a5a5a' },
    { x: 47, y: 31, w: 3, h: 4, type: 'tower', roofColor: '#5a5a5a' },
    // Houses
    { x: 33, y: 43, w: 3, h: 3, type: 'house', roofColor: '#8b3a2a' },
    { x: 37, y: 44, w: 3, h: 3, type: 'house', roofColor: '#3a5a8b' },
    { x: 41, y: 44, w: 3, h: 3, type: 'house', roofColor: '#8b3a2a' },
    { x: 45, y: 43, w: 3, h: 3, type: 'house', roofColor: '#5a3a8b' },
    // Central well
    { x: 40, y: 40, w: 1, h: 1, type: 'well' },
    // Decorative trees
    { x: 35, y: 47, w: 1, h: 1, type: 'tree_deco' },
    { x: 43, y: 47, w: 1, h: 1, type: 'tree_deco' },
  ];
  if (biome === 'snow') {
    base.forEach((b) => { if (b.type !== 'well' && b.type !== 'tree_deco') b.roofColor = '#3a4a6a'; });
  } else if (biome === 'desert') {
    base.forEach((b) => { if (b.type !== 'well' && b.type !== 'tree_deco') b.roofColor = '#a8682a'; });
  } else if (biome === 'swamp') {
    base.forEach((b) => { if (b.type !== 'well' && b.type !== 'tree_deco') b.roofColor = '#3a4a2a'; });
  } else if (biome === 'shadow') {
    base.forEach((b) => { if (b.type !== 'well' && b.type !== 'tree_deco') b.roofColor = '#2a1a3a'; });
  }
  return base;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateWorld(): Tile[][] {
  const rand = seededRandom(42);
  const map: Tile[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: Tile['type'] = 'grass';
      let walkable = true;
      let blocksSight = false;

      // Borders
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        type = 'wall';
        walkable = false;
        blocksSight = true;
      }
      // Town (center) - bigger now
      else if (x >= 35 && x <= 45 && y >= 35 && y <= 45) {
        type = 'floor';
      }
      // Inn floor
      else if (x >= 47 && x <= 52 && y >= 36 && y <= 40) {
        type = 'wood_floor';
      }
      // Bank floor
      else if (x >= 32 && x <= 36 && y >= 36 && y <= 40) {
        type = 'wood_floor';
      }
      // Paths
      else if ((x >= 39 && x <= 41) || (y >= 39 && y <= 41)) {
        if (rand() < 0.7) type = 'path';
      }
      // Lake (bigger)
      else if (Math.pow(x - 18, 2) + Math.pow(y - 18, 2) < 64) {
        type = 'water';
        walkable = false;
      }
      // Lava pit
      else if (Math.pow(x - 65, 2) + Math.pow(y - 65, 2) < 36) {
        type = 'lava';
        walkable = false;
      }
      // Bridge over lake
      else if (x === 18 && y >= 12 && y <= 24 && Math.abs(Math.pow(18 - 18, 2) + Math.pow(y - 18, 2) - 64) < 15) {
        type = 'bridge';
      }
      // Forest areas
      else if (x < 30 && y < 30 && rand() < 0.18) {
        type = 'tree';
        walkable = false;
        blocksSight = true;
      } else if (x > 50 && y < 30 && rand() < 0.2) {
        type = 'tree';
        walkable = false;
        blocksSight = true;
      } else if (x < 25 && y > 55 && rand() < 0.22) {
        type = 'tree';
        walkable = false;
        blocksSight = true;
      }
      // Rocky area
      else if (x > 55 && y > 55 && rand() < 0.12) {
        type = 'rock';
        walkable = false;
        blocksSight = true;
      }
      // Sand beach
      else if (Math.pow(x - 18, 2) + Math.pow(y - 18, 2) < 80 && rand() < 0.3) {
        type = 'sand';
      }
      // Random bushes
      else if (rand() < 0.04) {
        type = 'bush';
        walkable = false;
      }
      // Random stones
      else if (rand() < 0.02) {
        type = 'stone';
        walkable = false;
      }

      row.push({ type, walkable, blocksSight });
    }
    map.push(row);
  }

  return map;
}

export function spawnInitialMonsters(): Monster[] {
  const monsters: Monster[] = [];
  let id = 0;

  const templates = [
    { name: 'Rat', hp: 20, attack: 4, defense: 1, speed: 1500, xp: 10, color: '#8b6f47', emoji: '🐀', size: 0.7, level: 1, type: 'normal' as const,
      loot: [{ name: 'Cheese', icon: '🧀', chance: 0.4, value: 3 }], count: 15, area: { xMin: 25, xMax: 34, yMin: 30, yMax: 34 } },
    { name: 'Snake', hp: 35, attack: 7, defense: 2, speed: 1400, xp: 18, color: '#4a7c3a', emoji: '🐍', size: 0.8, level: 3, type: 'normal' as const,
      loot: [{ name: 'Snake Skin', icon: '🪱', chance: 0.4, value: 6 }], count: 10, area: { xMin: 5, xMax: 16, yMin: 5, yMax: 13 } },
    { name: 'Spider', hp: 45, attack: 9, defense: 3, speed: 1300, xp: 22, color: '#2a2a2a', emoji: '🕷', size: 0.85, level: 5, type: 'normal' as const,
      loot: [{ name: 'Spider Silk', icon: '🕸', chance: 0.5, value: 10 }], count: 8, area: { xMin: 5, xMax: 15, yMin: 25, yMax: 33 } },
    { name: 'Wolf', hp: 60, attack: 12, defense: 4, speed: 1200, xp: 30, color: '#5a5a5a', emoji: '🐺', size: 0.9, level: 7, type: 'normal' as const,
      loot: [{ name: 'Meat', icon: '🍖', chance: 0.5, value: 10 }], count: 8, area: { xMin: 50, xMax: 70, yMin: 5, yMax: 18 } },
    { name: 'Bear', hp: 120, attack: 20, defense: 6, speed: 1300, xp: 55, color: '#5a3a1e', emoji: '🐻', size: 1.05, level: 10, type: 'normal' as const,
      loot: [{ name: 'Bear Paw', icon: '🐾', chance: 0.3, value: 25 }, { name: 'Meat', icon: '🍖', chance: 0.8, value: 15 }], count: 5, area: { xMin: 50, xMax: 70, yMin: 22, yMax: 32 } },
    { name: 'Orc', hp: 100, attack: 18, defense: 5, speed: 1100, xp: 55, color: '#4a5d23', emoji: '👹', size: 1.0, level: 10, type: 'normal' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 0.8, value: 20 }, { name: 'Orc Tooth', icon: '🦷', chance: 0.3, value: 25 }], count: 10, area: { xMin: 5, xMax: 25, yMin: 45, yMax: 65 } },
    { name: 'Orc Warrior', hp: 180, attack: 28, defense: 8, speed: 1000, xp: 95, color: '#3a4d13', emoji: '👹', size: 1.1, level: 15, type: 'elite' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 40 }, { name: 'Orc Tooth', icon: '🦷', chance: 0.5, value: 35 }], count: 4, area: { xMin: 8, xMax: 20, yMin: 55, yMax: 62 } },
    { name: 'Skeleton', hp: 80, attack: 15, defense: 4, speed: 1300, xp: 45, color: '#d4d4c8', emoji: '💀', size: 0.95, level: 8, type: 'normal' as const, damageType: 'death' as const,
      loot: [{ name: 'Bone', icon: '🦴', chance: 0.6, value: 12 }], count: 8, area: { xMin: 50, xMax: 60, yMin: 40, yMax: 50 } },
    { name: 'Ghost', hp: 90, attack: 22, defense: 3, speed: 1200, xp: 65, color: '#ccccff', emoji: '👻', size: 1.0, level: 12, type: 'normal' as const, damageType: 'death' as const,
      loot: [{ name: 'Ectoplasm', icon: '💨', chance: 0.5, value: 30 }], count: 5, area: { xMin: 60, xMax: 75, yMin: 35, yMax: 45 } },
    { name: 'Troll', hp: 200, attack: 30, defense: 10, speed: 1100, xp: 110, color: '#6a7c3a', emoji: '🧌', size: 1.15, level: 18, type: 'elite' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 60 }, { name: 'Troll Hide', icon: '🧶', chance: 0.4, value: 50 }], count: 4, area: { xMin: 5, xMax: 20, yMin: 65, yMax: 75 } },
    { name: 'Demon', hp: 400, attack: 50, defense: 15, speed: 900, xp: 300, color: '#c13030', emoji: '😈', size: 1.3, level: 25, type: 'elite' as const, damageType: 'fire' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 150 }, { name: 'Demon Horn', icon: '🦄', chance: 0.5, value: 200 }], count: 3, area: { xMin: 60, xMax: 75, yMin: 55, yMax: 75 } },
    // Bosses
    { name: 'Orc King', hp: 800, attack: 60, defense: 20, speed: 800, xp: 800, color: '#2a3d03', emoji: '👑', size: 1.5, level: 25, type: 'boss' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 500 }, { name: 'Crown', icon: '👑', chance: 0.8, value: 1000 }], count: 1, area: { xMin: 12, xMax: 14, yMin: 58, yMax: 60 } },
    { name: 'Dragon Lord', hp: 1500, attack: 85, defense: 30, speed: 700, xp: 2000, color: '#8b0000', emoji: '🐉', size: 1.8, level: 40, type: 'boss' as const, damageType: 'fire' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 1500 }, { name: 'Dragon Scale', icon: '🔷', chance: 1, value: 800 }, { name: 'Magic Rune', icon: '✨', chance: 0.7, value: 500 }], count: 1, area: { xMin: 66, xMax: 68, yMin: 66, yMax: 68 } },
    { name: 'Lich', hp: 1000, attack: 75, defense: 25, speed: 750, xp: 1500, color: '#4a0a4a', emoji: '🧙', size: 1.4, level: 35, type: 'boss' as const, damageType: 'death' as const,
      loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: 1000 }, { name: 'Lich Staff', icon: '🪄', chance: 0.8, value: 1200 }], count: 1, area: { xMin: 55, xMax: 57, yMin: 44, yMax: 46 } },
  ];

  for (const t of templates) {
    for (let i = 0; i < t.count; i++) {
      const pos: Position = {
        x: Math.floor(Math.random() * (t.area.xMax - t.area.xMin)) + t.area.xMin,
        y: Math.floor(Math.random() * (t.area.yMax - t.area.yMin)) + t.area.yMin,
      };
      monsters.push({
        id: `m_${id++}`,
        name: t.name,
        pos,
        hp: t.hp,
        maxHp: t.hp,
        attack: t.attack,
        defense: t.defense,
        speed: t.speed,
        xp: t.xp,
        color: t.color,
        emoji: t.emoji,
        size: t.size,
        loot: t.loot,
        level: t.level,
        type: t.type,
        damageType: t.damageType,
        lastMove: 0,
        lastAttack: 0,
        respawnPos: { ...pos },
        dead: false,
        respawnAt: 0,
      });
    }
  }

  return monsters;
}

export function spawnNPCs(): NPC[] {
  return [
    {
      id: 'merchant_gorn',
      name: 'Gorn',
      pos: { x: 38, y: 38 },
      emoji: '🧙',
      color: '#9b59ff',
      role: 'merchant',
      dialogues: [
        {
          text: 'Welcome to my shop, traveler! What would you like to buy?',
          options: [
            { text: 'Show me your wares.', action: 'shop' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
      shop: [
        { name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' },
        { name: 'Mana Potion', icon: '🧴', type: 'potion', price: 50, description: 'Restores 50 Mana' },
        { name: 'Greater Health Potion', icon: '🍷', type: 'potion', price: 150, description: 'Restores 200 HP' },
        { name: 'Fishing Rod', icon: '🎣', type: 'misc', price: 100, description: 'For catching fish' },
      ],
    },
    {
      id: 'banker',
      name: 'Banker Elric',
      pos: { x: 34, y: 38 },
      emoji: '👨‍💼',
      color: '#f4e04d',
      role: 'banker',
      dialogues: [
        {
          text: 'Welcome to the bank. Your gold is safe here.',
          options: [
            { text: 'Deposit all gold', action: 'bank' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'innkeeper',
      name: 'Helena',
      pos: { x: 49, y: 38 },
      emoji: '👩',
      color: '#ff9bcc',
      role: 'innkeeper',
      dialogues: [
        {
          text: 'Welcome to the inn! Rest here to fully recover (50 gold).',
          options: [
            { text: 'Rest here (50 gold)', action: 'heal' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'quest_giver_1',
      name: 'Captain Thane',
      pos: { x: 42, y: 36 },
      emoji: '🎖',
      color: '#c13030',
      role: 'quest',
      questId: 'quest_rats',
      dialogues: [
        {
          text: 'Hero! The town is infested with rats. Will you help us?',
          options: [
            { text: 'I will help! (Accept quest)', action: 'quest', questId: 'quest_rats' },
            { text: 'Not now.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'quest_giver_2',
      name: 'Wizard Merlyn',
      pos: { x: 40, y: 42 },
      emoji: '🧙‍♂',
      color: '#3498db',
      role: 'quest',
      questId: 'quest_orcs',
      dialogues: [
        {
          text: 'Young adventurer, the orcs in the south are growing bold. Prove your strength!',
          options: [
            { text: 'I will slay them! (Accept quest)', action: 'quest', questId: 'quest_orcs' },
            { text: 'Maybe later.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'trainer',
      name: 'Master Kai',
      pos: { x: 43, y: 40 },
      emoji: '🥋',
      color: '#ff8c00',
      role: 'trainer',
      dialogues: [
        {
          text: 'Train with me to enhance your skills! (Free every 5 levels)',
          options: [
            { text: 'Train me! (200 gold)', action: 'train' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'guard_1',
      name: 'Town Guard',
      pos: { x: 35, y: 35 },
      emoji: '💂',
      color: '#a8a8a8',
      role: 'guard',
      dialogues: [
        {
          text: 'Keep safe, adventurer. Watch out for monsters outside the walls.',
          options: [{ text: 'Thank you.', action: 'bye' }],
        },
      ],
    },
    // More Tibia-style NPCs
    {
      id: 'blacksmith',
      name: 'Borin Hammerfell',
      pos: { x: 33, y: 43 },
      emoji: '🔨',
      color: '#ff8c00',
      role: 'merchant',
      dialogues: [
        {
          text: 'The forge burns hot! Need steel and armor, traveler?',
          options: [
            { text: 'Show me your wares.', action: 'shop' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
      shop: [
        { name: 'Steel Sword', icon: '⚔', type: 'equipment', price: 500, equipment: { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 } as any },
        { name: 'Iron Helmet', icon: '⛑', type: 'equipment', price: 250, equipment: { id: 'iron_helm', name: 'Iron Helmet', icon: '⛑', slot: 'helmet', armor: 5, rarity: 'common', level: 2, value: 80 } as any },
        { name: 'Leather Armor', icon: '🎽', type: 'equipment', price: 400, equipment: { id: 'leather_armor', name: 'Leather Armor', icon: '🎽', slot: 'armor', armor: 8, rarity: 'uncommon', level: 3, value: 150 } as any },
      ],
    },
    {
      id: 'priest_npc',
      name: 'Brother Aldric',
      pos: { x: 40, y: 28 },
      emoji: '⛪',
      color: '#fff9c4',
      role: 'quest',
      questId: 'quest_skeleton',
      dialogues: [
        {
          text: 'The graveyard is restless, child. Undead walk where they should sleep. Will you cleanse them?',
          options: [
            { text: 'I shall cleanse the undead. (Accept)', action: 'quest', questId: 'quest_skeleton' },
            { text: 'I must prepare first.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'priestess',
      name: 'Priestess Lyra',
      pos: { x: 42, y: 28 },
      emoji: '🙏',
      color: '#ff9bcc',
      role: 'innkeeper',
      dialogues: [
        {
          text: 'May the light guide you. Rest here to restore body and soul (50 gold).',
          options: [
            { text: 'Rest here (50 gold)', action: 'heal' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'postmaster',
      name: 'Postmaster Edwin',
      pos: { x: 31, y: 37 },
      emoji: '📮',
      color: '#f4e04d',
      role: 'guard',
      dialogues: [
        {
          text: 'Welcome to the Mor\'ia Post! I handle all mail and parcels. Check your inbox anytime via the Mail button.',
          options: [
            { text: 'Open my mailbox', action: 'mail' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'librarian',
      name: 'Sage Eleanor',
      pos: { x: 40, y: 45 },
      emoji: '📚',
      color: '#9b59ff',
      role: 'guard',
      dialogues: [
        {
          text: 'Knowledge is power, traveler. Visit the Library to read ancient tomes and uncover lore.',
          options: [
            { text: 'Open the Library', action: 'books' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
    },
    {
      id: 'guard_2',
      name: 'Gate Guard Marcus',
      pos: { x: 45, y: 35 },
      emoji: '🛡',
      color: '#a8a8a8',
      role: 'guard',
      dialogues: [
        {
          text: 'The roads beyond the walls are dangerous. Dragons lurk in the southeast, and demons in the south.',
          options: [{ text: 'Understood.', action: 'bye' }],
        },
      ],
    },
    {
      id: 'merchant_2',
      name: 'Madame Zara',
      pos: { x: 39, y: 44 },
      emoji: '🔮',
      color: '#c832ff',
      role: 'merchant',
      dialogues: [
        {
          text: 'Potions, reagents, and curiosities... step into my tent, brave one.',
          options: [
            { text: 'Show me your wares.', action: 'shop' },
            { text: 'Farewell.', action: 'bye' },
          ],
        },
      ],
      shop: [
        { name: 'Greater Health Potion', icon: '🍷', type: 'potion', price: 150, description: 'Restores 200 HP' },
        { name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' },
        { name: 'Mana Potion', icon: '🧴', type: 'potion', price: 50, description: 'Restores 50 Mana' },
        { name: 'Fishing Rod', icon: '🎣', type: 'misc', price: 100, description: 'For catching fish' },
      ],
    },
  ];
}
