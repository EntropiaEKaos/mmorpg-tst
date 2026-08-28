from pathlib import Path
import re

path = Path('tools/upgrade-moria-9-37a-grand-sunreach.py')
text = path.read_text(encoding='utf-8')

server_current = r'''function capitalUrbanTile(config, x, y) {
  if (config?.settlementClass !== 'capital') return null;
  const bounds = config.urbanBounds;
  if (!bounds) return null;
  const minX = Number(bounds.x), minY = Number(bounds.y);
  const maxX = minX + Number(bounds.width) - 1, maxY = minY + Number(bounds.height) - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = config.townCenter.x, cy = config.townCenter.y;
  // 9.36D: capitals read as cities instead of a uniform floor plane. Five-tile
  // royal axes anchor navigation; plazas and promenades remain ordinary walkable
  // path tiles, so client prediction and authoritative collision stay identical.
  const royalAxes = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
  const secondaryBoulevards = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  const civicPlaza = Math.abs(x - cx) <= 7 && Math.abs(y - cy) <= 7;
  const crownForecourt = x >= cx - 12 && x <= cx + 12 && y >= cy - 28 && y <= cy - 20;
  const marketSquare = x >= cx - 36 && x <= cx - 14 && y >= cy - 14 && y <= cy + 8;
  const dawnSquare = x >= cx + 14 && x <= cx + 36 && y >= cy - 22 && y <= cy + 6;
  const gardenPromenade = x >= cx - 16 && x <= cx + 22 && y >= cy + 28 && y <= cy + 32;
  const ceremonial = royalAxes || secondaryBoulevards || innerRing || civicPlaza || crownForecourt || marketSquare || dawnSquare || gardenPromenade;
  return { type:ceremonial ? 'path' : 'floor', walkable:true, blocksSight:false };
}'''

client_current = r'''function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
  if (map.settlementClass !== 'capital' || !map.urbanBounds) return null;
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const royalAxes = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
  const secondaryBoulevards = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  const civicPlaza = Math.abs(x - cx) <= 7 && Math.abs(y - cy) <= 7;
  const crownForecourt = x >= cx - 12 && x <= cx + 12 && y >= cy - 28 && y <= cy - 20;
  const marketSquare = x >= cx - 36 && x <= cx - 14 && y >= cy - 14 && y <= cy + 8;
  const dawnSquare = x >= cx + 14 && x <= cx + 36 && y >= cy - 22 && y <= cy + 6;
  const gardenPromenade = x >= cx - 16 && x <= cx + 22 && y >= cy + 28 && y <= cy + 32;
  const ceremonial = royalAxes || secondaryBoulevards || innerRing || civicPlaza || crownForecourt || marketSquare || dawnSquare || gardenPromenade;
  return { type:ceremonial ? 'path' : 'floor', walkable:true, blocksSight:false };
}'''

server_pattern = re.compile(r"    old = r'''function capitalUrbanTile\(config, x, y\) \{.*?\n'''\n    new = r'''function harborShoreY\(config, x\) \{", re.S)
client_pattern = re.compile(r"    old = r'''function capitalUrbanTile\(map: GameMap, x: number, y: number\): Tile \| null \{.*?\n'''\n    new = r'''function harborShoreY\(map: GameMap, x: number\): number \{", re.S)
server_repl = "    old = r'''" + server_current + "\n'''\n    new = r'''function harborShoreY(config, x) {"
client_repl = "    old = r'''" + client_current + "\n'''\n    new = r'''function harborShoreY(map: GameMap, x: number): number {"
text, server_count = server_pattern.subn(lambda _: server_repl, text, count=1)
text, client_count = client_pattern.subn(lambda _: client_repl, text, count=1)
if server_count != 1 or client_count != 1:
    raise SystemExit(f'9.37A applicator anchor rewrite failed: server={server_count} client={client_count}')

old_fallback = r'''  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };'''
new_fallback = r'''  const royalAxes = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
  const secondaryBoulevards = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  const civicPlaza = Math.abs(x - cx) <= 7 && Math.abs(y - cy) <= 7;
  const crownForecourt = x >= cx - 12 && x <= cx + 12 && y >= cy - 28 && y <= cy - 20;
  const marketSquare = x >= cx - 36 && x <= cx - 14 && y >= cy - 14 && y <= cy + 8;
  const dawnSquare = x >= cx + 14 && x <= cx + 36 && y >= cy - 22 && y <= cy + 6;
  const gardenPromenade = x >= cx - 16 && x <= cx + 22 && y >= cy + 28 && y <= cy + 32;
  const ceremonial = royalAxes || secondaryBoulevards || innerRing || civicPlaza || crownForecourt || marketSquare || dawnSquare || gardenPromenade;
  return { type:ceremonial ? 'path' : 'floor', walkable:true, blocksSight:false };'''
if text.count(old_fallback) != 2:
    raise SystemExit(f'9.37A generated royal-grid fallback count unexpected: {text.count(old_fallback)}')
text = text.replace(old_fallback, new_fallback, 2)

old_wall = "  const landWall = y === minY || ((x === minX || x === maxX) && y < shoreY - 3);\n  if (landWall) return { type:'wall', walkable:false, blocksSight:true };"
new_wall = "  const gate = (y === minY && Math.abs(x - cx) <= 2) || (x === maxX && Math.abs(y - cy) <= 2);\n  if (gate) return { type:'path', walkable:true, blocksSight:false };\n  const landWall = y === minY || ((x === minX || x === maxX) && y < shoreY - 3);\n  if (landWall) return { type:'wall', walkable:false, blocksSight:true };"
if text.count(old_wall) != 2:
    raise SystemExit(f'9.37A harbor wall/gate count unexpected: {text.count(old_wall)}')
text = text.replace(old_wall, new_wall, 2)

old_migration = "  let changed = patchMap(sunreach);\n\n  const eldoria = maps.find(map => map?.id === 'eldoria');"
new_migration = "  let changed = patchMap(sunreach);\n  const grandTopology = Number(sunreach.width) === 160 && Number(sunreach.height) === 160 && sunreach.settlementClass === 'capital' && sunreach.urbanPlan === 'harbor-crescent';\n  if (!changed && !grandTopology) return false;\n\n  const eldoria = maps.find(map => map?.id === 'eldoria');"
if old_migration not in text:
    raise SystemExit('9.37A migration guard anchor missing')
text = text.replace(old_migration, new_migration, 1)

# The original quay probe overlapped sunreach_warehouse_03 at x=80,y=100.
# Probe an adjacent clear quay tile so the test validates road material without
# contradicting the authoritative building collision contract.
old_probe = "  assert.equal(map.tiles[100][80].type,'path');"
new_probe = "  assert.equal(map.tiles[100][82].type,'path');"
if old_probe not in text:
    raise SystemExit('9.37A quay probe anchor missing')
text = text.replace(old_probe, new_probe, 1)

path.write_text(text, encoding='utf-8')
print("Mor'ia 9.37A applicator aligned with 9.36D, harbor gates, admin-safe migration, and clear quay probe")
