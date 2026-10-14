// Read-only terrain projection for clients; the WorldManager remains authoritative.
// Compact tile codes avoid sending complete 160x160 maps on each 20Hz snapshot.
export const TERRAIN_CODES = Object.freeze({
  grass: 'g', floor: 'f', path: 'p', wall: 'w', water: 'a',
  tree: 't', rock: 'r', snow: 's', lava: 'l', bridge: 'b',
  stone: 'o', sand: 'd', bush: 'u', wood_floor: 'h',
});
const MAX_RADIUS = 22;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function buildTerrainPatch(map, playerX, playerY, radius = 20) {
  if (!map || !Array.isArray(map.tiles) || !Number.isFinite(playerX) || !Number.isFinite(playerY)) return null;
  const width = Math.floor(Number(map.width) || 0);
  const height = Math.floor(Number(map.height) || 0);
  if (width < 1 || height < 1) return null;
  const range = clamp(Math.floor(Number(radius) || 20), 1, MAX_RADIUS);
  const x0 = clamp(Math.floor(playerX) - range, 0, width - 1);
  const y0 = clamp(Math.floor(playerY) - range, 0, height - 1);
  const x1 = clamp(Math.floor(playerX) + range, x0, width - 1);
  const y1 = clamp(Math.floor(playerY) + range, y0, height - 1);
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let row = '';
    for (let x = x0; x <= x1; x++) {
      const type = map.tiles[y]?.[x]?.type;
      row += TERRAIN_CODES[type] || '?';
    }
    rows.push(row);
  }
  // Rectangle footprints come directly from the WorldManager / Studio config.
  // The renderer uses these ONLY for visuals; the server owns collisions.
  const landmarks = (Array.isArray(map.landmarks) ? map.landmarks : [])
    .filter(entry => entry && Number.isInteger(entry.x) && Number.isInteger(entry.y)
      && Number.isInteger(entry.w) && Number.isInteger(entry.h)
      && entry.w > 0 && entry.h > 0
      && entry.x < x1 + 3 && entry.y < y1 + 3
      && entry.x + entry.w > x0 - 2 && entry.y + entry.h > y0 - 2)
    .slice(0, 24)
    .map(entry => ({
      id: String(entry.id || '').slice(0, 60),
      name: String(entry.name || '').slice(0, 70),
      kind: String(entry.kind || 'house').slice(0, 20),
      x: entry.x, y: entry.y, w: entry.w, h: entry.h,
    }));
  const color = value => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : undefined;
  return {
    version: 1, mapId: String(map.id || ''), biome: String(map.biome || 'plains'),
    originX: x0, originY: y0, rows,
    cityStyle: String(map.cityStyle || 'royal').slice(0, 24),
    roofColor: color(map.roofColor),
    wallColor: color(map.wallColor),
    landmarks,
  };
}

export function shouldSendTerrainPatch(previous, player, chunkSize = 4) {
  const x = Math.floor(Number(player?.x));
  const y = Math.floor(Number(player?.y));
  const mapId = String(player?.mapId || '');
  if (!mapId || !Number.isFinite(x) || !Number.isFinite(y)) return { send: false, key: previous || '' };
  const key = `${mapId}:${Math.floor(x / chunkSize)}:${Math.floor(y / chunkSize)}`;
  return { send: previous !== key, key };
}
