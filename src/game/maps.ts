import type { Tile, Position } from './types';

export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
export const TILE_SIZE = 32;

export type BiomeType = 'plains' | 'snow' | 'swamp' | 'desert' | 'shadow';

export interface Portal {
  pos: Position;
  targetMap: string;
  targetSpawn: Position;
  label: string;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  biome: BiomeType;
  spawnPoint: Position;
  portals: Portal[];
  townCenter: Position;
  townRange: number;
  levelRequired?: number; // level gate for dangerous zones
  dangerLevel?: string;   // descriptive label e.g. "Extreme"
}

export const MAPS: Record<string, GameMap> = {
  eldoria: {
    id: 'eldoria',
    name: 'Eldoria',
    description: 'The capital city. Lush plains and forests.',
    biome: 'plains',
    spawnPoint: { x: 40, y: 40 },
    townCenter: { x: 40, y: 40 },
    townRange: 10,
    portals: [
      { pos: { x: 10, y: 40 }, targetMap: 'frostpeak', targetSpawn: { x: 70, y: 40 }, label: '❄ To Frostpeak' },
      { pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' },
    ],
  },
  frostpeak: {
    id: 'frostpeak',
    name: 'Frostpeak',
    description: 'Frozen mountain city. Frigid and deadly.',
    biome: 'snow',
    spawnPoint: { x: 70, y: 40 },
    townCenter: { x: 65, y: 40 },
    townRange: 8,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 12, y: 40 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },
  shadowfen: {
    id: 'shadowfen',
    name: 'Shadowfen',
    description: 'Cursed swampland. Rotten and foggy.',
    biome: 'swamp',
    spawnPoint: { x: 40, y: 70 },
    townCenter: { x: 40, y: 65 },
    townRange: 8,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 70, y: 12 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 }, label: '☠ To Voidlands' },
    ],
  },
  emberhold: {
    id: 'emberhold',
    name: 'Emberhold',
    description: 'Volcanic desert. Scorched earth and lava.',
    biome: 'desert',
    spawnPoint: { x: 70, y: 10 },
    townCenter: { x: 65, y: 15 },
    townRange: 8,
    portals: [
      { pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 }, label: '❄ To Frostpeak' },
    ],
  },
  voidlands: {
    id: 'voidlands',
    name: 'Voidlands',
    description: 'The end of the world. Pure darkness and ancient evil.',
    biome: 'shadow',
    spawnPoint: { x: 70, y: 70 },
    townCenter: { x: 40, y: 40 },
    townRange: 6,
    levelRequired: 25,
    dangerLevel: 'Nightmare',
    portals: [
      { pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' },
    ],
  },
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SEEDS: Record<BiomeType, number> = {
  plains: 42,
  snow: 1337,
  swamp: 7,
  desert: 999,
  shadow: 666,
};

export function generateMap(mapId: string): Tile[][] {
  const mapData = MAPS[mapId] || MAPS.eldoria;
  const biome = mapData.biome;
  const rand = seededRandom(SEEDS[biome]);
  const map: Tile[][] = [];
  const tc = mapData.townCenter;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: Tile['type'] = 'grass';
      let walkable = true;
      let blocksSight = false;

      // Borders are walls
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        type = 'wall';
        walkable = false;
        blocksSight = true;
      }
      // Town center floor
      else if (Math.abs(x - tc.x) <= mapData.townRange && Math.abs(y - tc.y) <= mapData.townRange) {
        type = 'floor';
      }
      // Portal tiles become walkable path
      else if (mapData.portals.some((p) => p.pos.x === x && p.pos.y === y)) {
        type = 'path';
      }
      // Biome-specific terrain
      else {
        const r = rand();
        if (biome === 'snow') {
          if (r < 0.15) { type = 'tree'; walkable = false; blocksSight = true; } // snow pines
          else if (r < 0.20) { type = 'rock'; walkable = false; }
          else if (r < 0.22) { type = 'stone'; walkable = false; }
        } else if (biome === 'swamp') {
          if (r < 0.10) { type = 'bush'; walkable = false; }
          else if (r < 0.25) { type = 'water'; walkable = false; } // murky water
          else if (r < 0.30) { type = 'tree'; walkable = false; blocksSight = true; }
        } else if (biome === 'desert') {
          if (r < 0.08) { type = 'rock'; walkable = false; }
          else if (r < 0.12) { type = 'stone'; walkable = false; }
          else if (r < 0.20 && (Math.pow(x - 10, 2) + Math.pow(y - 10, 2) < 40)) { type = 'lava'; walkable = false; }
        } else if (biome === 'shadow') {
          if (r < 0.18) { type = 'rock'; walkable = false; blocksSight = true; }
          else if (r < 0.30 && (Math.pow(x - 40, 2) + Math.pow(y - 40, 2) < 100)) { type = 'lava'; walkable = false; }
        } else {
          // plains (original)
          if (r < 0.04) { type = 'bush'; walkable = false; }
          else if (r < 0.06) { type = 'stone'; walkable = false; }
          else if (r < 0.18 && ((x < 25 && y < 30) || (x > 50 && y < 30))) { type = 'tree'; walkable = false; blocksSight = true; }
        }
      }
      row.push({ type, walkable, blocksSight });
    }
    map.push(row);
  }
  return map;
}

// Biome-themed tile color override (for snow/swamp/desert/shadow on the 'grass' base)
export function getBiomeTint(biome: BiomeType): { ground: string; groundDark: string; overlay?: string; overlayAlpha?: number } {
  switch (biome) {
    case 'snow':
      return { ground: '#dfe8ee', groundDark: '#c2cdd6', overlay: '#ffffff', overlayAlpha: 0 };
    case 'swamp':
      return { ground: '#4a5a3a', groundDark: '#38452c', overlay: '#2a3a1a', overlayAlpha: 0.3 };
    case 'desert':
      return { ground: '#e8d7a1', groundDark: '#d4c08a', overlay: '#c89060', overlayAlpha: 0 };
    case 'shadow':
      return { ground: '#2a2535', groundDark: '#1e1a28', overlay: '#000000', overlayAlpha: 0.35 };
    default:
      return { ground: '#4a7c3a', groundDark: '#3d6a2f' };
  }
}
