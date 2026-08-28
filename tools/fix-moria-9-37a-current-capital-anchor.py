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

# The generated fallback must also preserve the current 9.36D royal-grid plan.
server_old_fallback = r'''  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };'''
server_new_fallback = r'''  const royalAxes = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
  const secondaryBoulevards = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  const civicPlaza = Math.abs(x - cx) <= 7 && Math.abs(y - cy) <= 7;
  const crownForecourt = x >= cx - 12 && x <= cx + 12 && y >= cy - 28 && y <= cy - 20;
  const marketSquare = x >= cx - 36 && x <= cx - 14 && y >= cy - 14 && y <= cy + 8;
  const dawnSquare = x >= cx + 14 && x <= cx + 36 && y >= cy - 22 && y <= cy + 6;
  const gardenPromenade = x >= cx - 16 && x <= cx + 22 && y >= cy + 28 && y <= cy + 32;
  const ceremonial = royalAxes || secondaryBoulevards || innerRing || civicPlaza || crownForecourt || marketSquare || dawnSquare || gardenPromenade;
  return { type:ceremonial ? 'path' : 'floor', walkable:true, blocksSight:false };'''

# There are two generated fallback strings (server and client) with identical statements.
fallback_count = text.count(server_old_fallback)
if fallback_count != 2:
    raise SystemExit(f'9.37A generated royal-grid fallback count unexpected: {fallback_count}')
text = text.replace(server_old_fallback, server_new_fallback, 2)

path.write_text(text, encoding='utf-8')
print("Mor'ia 9.37A applicator aligned with 9.36D anchors and royal-grid fallback")
