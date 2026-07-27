// Server-side World — plain JS ESM
class Monster {
  constructor(data) {
    Object.assign(this, data);
  }
}

class WorldManager {
  constructor() {
    this.maps = new Map();
  }

  init() {
    for (const id of ['eldoria', 'frostpeak', 'shadowfen', 'emberhold', 'voidlands']) {
      this.maps.set(id, this.generate(id));
    }
  }

  getMapIds() { return Array.from(this.maps.keys()); }
  getMap(id) { return this.maps.get(id); }

  generate(id) {
    const W = 80, H = 80;
    const tiles = [];
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        let walkable = true;
        let type = 'grass';
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { walkable = false; type = 'wall'; }
        else if (x >= 35 && x <= 45 && y >= 35 && y <= 45) { type = 'floor'; }
        else if (Math.random() < 0.12) { walkable = false; type = 'tree'; }
        row.push({ walkable, type });
      }
      tiles.push(row);
    }
    return { id, name: id.charAt(0).toUpperCase() + id.slice(1), width: W, height: H, tiles };
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
    const list = templates[mapId] || [];
    const monsters = [];
    let id = 0;
    for (const t of list) {
      for (let i = 0; i < t.count; i++) {
        const x = 5 + Math.floor(Math.random() * 70);
        const y = 5 + Math.floor(Math.random() * 70);
        monsters.push({
          id: `${mapId}_m_${id++}`, name: t.name, emoji: t.emoji,
          x, y, spawnX: x, spawnY: y,
          hp: t.hp, maxHp: t.hp, attack: t.attack, defense: t.defense,
          xp: t.xp, level: t.level, color: t.color, size: t.size || 1,
          type: t.type || 'normal', dead: false, respawnAt: 0,
          lastMove: 0, lastAttack: 0, speed: 1200,
        });
      }
    }
    return monsters;
  }
}

export const WORLD = new WorldManager();
export { Monster };
