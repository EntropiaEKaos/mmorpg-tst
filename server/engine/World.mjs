// ===================================================================
//  MOR'IA SERVER WORLD — deterministic and authoritative
//  Keep terrain/portal metadata aligned with src/game/maps.ts.
// ===================================================================

class Monster {
  constructor(data) {
    Object.assign(this, data);
  }
}

const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;

const MAP_CONFIG = Object.freeze({
  eldoria: {
    id: 'eldoria', biome: 'plains', spawnPoint: { x: 40, y: 40 },
    townCenter: { x: 40, y: 40 }, townRange: 10,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 } },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 } },
    ],
  },
  frostpeak: {
    id: 'frostpeak', biome: 'snow', spawnPoint: { x: 70, y: 40 },
    townCenter: { x: 65, y: 40 }, townRange: 8,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 } },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 } },
    ],
  },
  shadowfen: {
    id: 'shadowfen', biome: 'swamp', spawnPoint: { x: 40, y: 70 },
    townCenter: { x: 40, y: 65 }, townRange: 8,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 } },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 } },
    ],
  },
  emberhold: {
    id: 'emberhold', biome: 'desert', spawnPoint: { x: 70, y: 10 },
    townCenter: { x: 65, y: 15 }, townRange: 8,
    portals: [
      { pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 } },
    ],
  },
  voidlands: {
    id: 'voidlands', biome: 'shadow', spawnPoint: { x: 70, y: 70 },
    townCenter: { x: 40, y: 40 }, townRange: 6, levelRequired: 25,
    portals: [
      { pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 } },
    ],
  },
});

const SEEDS = Object.freeze({ plains: 42, snow: 1337, swamp: 7, desert: 999, shadow: 666 });

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function isPortal(config, x, y) {
  return config.portals.some(portal => portal.pos.x === x && portal.pos.y === y);
}

class WorldManager {
  constructor() {
    this.maps = new Map();
  }

  init() {
    this.maps.clear();
    for (const id of Object.keys(MAP_CONFIG)) this.maps.set(id, this.generate(id));
  }

  getMapIds() { return Array.from(this.maps.keys()); }
  getMap(id) { return this.maps.get(id); }

  generate(id) {
    const config = MAP_CONFIG[id] || MAP_CONFIG.eldoria;
    const rand = seededRandom(SEEDS[config.biome]);
    const tiles = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        let type = 'grass';
        let walkable = true;
        let blocksSight = false;

        if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
          type = 'wall'; walkable = false; blocksSight = true;
        } else if (Math.abs(x - config.townCenter.x) <= config.townRange && Math.abs(y - config.townCenter.y) <= config.townRange) {
          type = 'floor';
        } else if (isPortal(config, x, y)) {
          type = 'path';
        } else {
          const r = rand();
          if (config.biome === 'snow') {
            if (r < 0.15) { type = 'tree'; walkable = false; blocksSight = true; }
            else if (r < 0.20) { type = 'rock'; walkable = false; }
            else if (r < 0.22) { type = 'stone'; walkable = false; }
          } else if (config.biome === 'swamp') {
            if (r < 0.10) { type = 'bush'; walkable = false; }
            else if (r < 0.25) { type = 'water'; walkable = false; }
            else if (r < 0.30) { type = 'tree'; walkable = false; blocksSight = true; }
          } else if (config.biome === 'desert') {
            if (r < 0.08) { type = 'rock'; walkable = false; }
            else if (r < 0.12) { type = 'stone'; walkable = false; }
            else if (r < 0.20 && (Math.pow(x - 10, 2) + Math.pow(y - 10, 2) < 40)) { type = 'lava'; walkable = false; }
          } else if (config.biome === 'shadow') {
            if (r < 0.18) { type = 'rock'; walkable = false; blocksSight = true; }
            else if (r < 0.30 && (Math.pow(x - 40, 2) + Math.pow(y - 40, 2) < 100)) { type = 'lava'; walkable = false; }
          } else {
            if (r < 0.04) { type = 'bush'; walkable = false; }
            else if (r < 0.06) { type = 'stone'; walkable = false; }
            else if (r < 0.18 && ((x < 25 && y < 30) || (x > 50 && y < 30))) { type = 'tree'; walkable = false; blocksSight = true; }
          }
        }
        row.push({ walkable, type, blocksSight });
      }
      tiles.push(row);
    }

    return {
      ...config,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tiles,
      portals: config.portals.map(p => ({ pos: { ...p.pos }, targetMap: p.targetMap, targetSpawn: { ...p.targetSpawn } })),
    };
  }

  findWalkableSpawn(map, preferred) {
    if (preferred && map.tiles?.[preferred.y]?.[preferred.x]?.walkable) return { ...preferred };
    for (let attempt = 0; attempt < 300; attempt++) {
      const x = 5 + Math.floor(Math.random() * 70);
      const y = 5 + Math.floor(Math.random() * 70);
      if (map.tiles?.[y]?.[x]?.walkable) return { x, y };
    }
    return { ...map.spawnPoint };
  }

  spawnMonsters(mapId) {
    const templates = {
      eldoria: [
        { name: 'Rat', emoji: '🐀', hp: 20, attack: 4, defense: 1, xp: 10, level: 1, color: '#8b6f47', size: 0.7, count: 10 },
        { name: 'Snake', emoji: '🐍', hp: 35, attack: 7, defense: 2, xp: 18, level: 3, color: '#4a7c3a', size: 0.8, count: 8 },
      ],
      frostpeak: [
        { name: 'Wolf', emoji: '🐺', hp: 60, attack: 12, defense: 4, xp: 30, level: 7, color: '#5a5a5a', size: 0.9, count: 8 },
        { name: 'Bear', emoji: '🐻', hp: 120, attack: 20, defense: 6, xp: 55, level: 10, color: '#5a3a1e', size: 1.05, count: 5 },
      ],
      shadowfen: [
        { name: 'Orc', emoji: '👹', hp: 100, attack: 18, defense: 5, xp: 55, level: 10, color: '#4a5d23', size: 1.0, count: 8 },
        { name: 'Skeleton', emoji: '💀', hp: 80, attack: 15, defense: 4, xp: 45, level: 8, color: '#d4d4c8', size: 0.95, count: 8 },
      ],
      emberhold: [
        { name: 'Demon', emoji: '😈', hp: 400, attack: 50, defense: 15, xp: 300, level: 25, color: '#c13030', size: 1.3, count: 3 },
        { name: 'Dragon Lord', emoji: '🐉', hp: 1500, attack: 85, defense: 30, xp: 2000, level: 40, color: '#8b0000', size: 1.8, count: 1, type: 'boss' },
      ],
      voidlands: [
        { name: 'Ghost', emoji: '👻', hp: 90, attack: 22, defense: 3, xp: 65, level: 12, color: '#ccccff', size: 1.0, count: 8 },
        { name: 'Lich', emoji: '🧙', hp: 1000, attack: 75, defense: 25, xp: 1500, level: 35, color: '#4a0a4a', size: 1.4, count: 1, type: 'boss' },
      ],
    };

    const map = this.getMap(mapId);
    const list = templates[mapId] || [];
    const monsters = [];
    let id = 0;
    for (const template of list) {
      for (let i = 0; i < template.count; i++) {
        const pos = this.findWalkableSpawn(map);
        monsters.push({
          id: `${mapId}_m_${id++}`, name: template.name, emoji: template.emoji,
          x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,
          hp: template.hp, maxHp: template.hp, attack: template.attack, defense: template.defense,
          xp: template.xp, level: template.level, color: template.color, size: template.size || 1,
          type: template.type || 'normal', dead: false, respawnAt: 0,
          lastMove: 0, lastAttack: 0, speed: 1200,
        });
      }
    }
    return monsters;
  }
}

export const WORLD = new WorldManager();
export { Monster, MAP_CONFIG };