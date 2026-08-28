from pathlib import Path

ROOT = Path('.')

SERVER_OLD = '''function capitalUrbanTile(config, x, y) {
  if (config?.settlementClass !== 'capital') return null;
  const bounds = config.urbanBounds;
  if (!bounds) return null;
  const minX = Number(bounds.x), minY = Number(bounds.y);
  const maxX = minX + Number(bounds.width) - 1, maxY = minY + Number(bounds.height) - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = config.townCenter.x, cy = config.townCenter.y;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };
}'''

SERVER_NEW = '''function capitalUrbanTile(config, x, y) {
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

CLIENT_OLD = '''function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
  if (map.settlementClass !== 'capital' || !map.urbanBounds) return null;
  const minX = map.urbanBounds.x, minY = map.urbanBounds.y;
  const maxX = minX + map.urbanBounds.width - 1, maxY = minY + map.urbanBounds.height - 1;
  if (x < minX || x > maxX || y < minY || y > maxY) return null;
  if (x === minX || x === maxX || y === minY || y === maxY) return { type:'wall', walkable:false, blocksSight:true };
  const cx = map.townCenter.x, cy = map.townCenter.y;
  const major = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
  const secondary = Math.abs(x - (cx - 28)) <= 1 || Math.abs(x - (cx + 28)) <= 1 || Math.abs(y - (cy - 28)) <= 1 || Math.abs(y - (cy + 28)) <= 1;
  const innerRing = Math.abs(x - (minX + 14)) <= 1 || Math.abs(x - (maxX - 14)) <= 1 || Math.abs(y - (minY + 14)) <= 1 || Math.abs(y - (maxY - 14)) <= 1;
  return { type:(major || secondary || innerRing) ? 'path' : 'floor', walkable:true, blocksSight:false };
}'''

CLIENT_NEW = '''function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {
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

for rel, old, new in [
    ('server/engine/World.mjs', SERVER_OLD, SERVER_NEW),
    ('src/game/maps.ts', CLIENT_OLD, CLIENT_NEW),
]:
    path = ROOT / rel
    text = path.read_text(encoding='utf-8')
    if new not in text:
        if old not in text:
            raise SystemExit(f'urban plan anchor not found: {rel}')
        text = text.replace(old, new, 1)
    path.write_text(text, encoding='utf-8')

# Add civic wayfinding/decor while staying below the capital prop budget.
grand = ROOT / 'server/engine/GrandEldoria.mjs'
text = grand.read_text(encoding='utf-8')
anchor = "  for (const [x,y] of [[70,122],[74,124],[88,124],[92,122],[90,116],[70,116]]) add('pine',x,y,'#6e9b5a');\n  return props.slice(0, 96);"
replacement = "  for (const [x,y] of [[70,122],[74,124],[88,124],[92,122],[90,116],[70,116]]) add('pine',x,y,'#6e9b5a');\n  for (const [x,y,label] of [[72,72,'Praça da Coroa'],[88,72,'Praça da Coroa'],[72,88,'Praça da Coroa'],[88,88,'Praça da Coroa'],[46,68,'Grande Mercado'],[114,60,'Bairro da Aurora'],[68,110,'Passeio dos Jardins'],[96,110,'Passeio dos Jardins']]) add('sign',x,y,'#d8b45a',label);\n  for (const [x,y] of [[74,74],[86,74],[74,86],[86,86]]) add('statue',x,y,'#c9b68d','Guarda da Coroa');\n  return props.slice(0, 112);"
if replacement not in text:
    if anchor not in text:
        raise SystemExit('Grand Eldoria prop anchor not found')
    text = text.replace(anchor, replacement, 1)
grand.write_text(text, encoding='utf-8')

# Replace the last visible English technical noun in the editor summary.
designer = ROOT / 'src/components/CityDesigner.tsx'
text = designer.read_text(encoding='utf-8')
text = text.replace('{occupancy} tiles bloqueados', '{occupancy} blocos ocupados')
designer.write_text(text, encoding='utf-8')

# Focused runtime contract.
test_path = ROOT / 'server/test/grand-eldoria-urban-polish-9-36.test.mjs'
test_path.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WorldManager } from '../engine/World.mjs';
import { GRAND_ELDORIA_MAP } from '../engine/GrandEldoria.mjs';

test('9.36D Grand Eldoria exposes civic plazas and stronger royal axes', () => {
  const world = new WorldManager();
  const map = world.getMap('eldoria');
  assert.equal(map.width, 160);
  assert.equal(map.height, 160);
  assert.equal(map.tiles[80][86].type, 'path'); // civic plaza
  assert.equal(map.tiles[56][80].type, 'path'); // crown forecourt
  assert.equal(map.tiles[76][64].type, 'path'); // market square
  assert.equal(map.tiles[82][116].type, 'path'); // dawn square edge
  assert.equal(map.tiles[110][72].type, 'path'); // garden promenade
  assert.equal(map.tiles[36][36].type, 'floor'); // quiet urban fabric still exists
  assert.equal(map.tiles[60][28].type, 'wall'); // city wall remains authoritative
  assert.equal(map.tiles[80][28].type, 'path'); // west gate remains open
});

test('9.36D client and server share the same ceremonial urban plan vocabulary', () => {
  const server = fs.readFileSync(new URL('../engine/World.mjs', import.meta.url), 'utf8');
  const client = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url), 'utf8');
  for (const token of ['royalAxes','secondaryBoulevards','civicPlaza','crownForecourt','marketSquare','dawnSquare','gardenPromenade']) {
    assert.match(server, new RegExp(token));
    assert.match(client, new RegExp(token));
  }
});

test('9.36D civic wayfinding remains decorative and inside capital budgets', () => {
  assert.ok(GRAND_ELDORIA_MAP.props.length >= 90);
  assert.ok(GRAND_ELDORIA_MAP.props.length <= 112);
  assert.ok(GRAND_ELDORIA_MAP.props.some(entry => entry.kind === 'sign' && entry.label === 'Praça da Coroa'));
  assert.ok(GRAND_ELDORIA_MAP.props.some(entry => entry.kind === 'statue' && entry.label === 'Guarda da Coroa'));
});
''', encoding='utf-8')

doc_path = ROOT / 'docs/MORIA_9_36_GRAND_ELDORIA.md'
doc = doc_path.read_text(encoding='utf-8')
section = r'''

### 9.36D — Urban Polish

A densidade da 9.36C foi preservada, mas a capital passou a ter **hierarquia urbana legível**. Os eixos reais agora têm cinco tiles de largura, o centro cívico forma uma praça ampla e o plano inclui adro da Coroa, praça mercantil, praça da Aurora e passeio dos Jardins. Tudo continua usando apenas tiles autoritativos `path/floor/wall`: não existe colisão decorativa paralela nem divergência entre cliente e servidor.

A orientação urbana também ganhou placas e guardas-estátua em pontos cívicos, mantendo o orçamento de props da classe `capital`. No City Designer, o contador de ocupação passou de “tiles bloqueados” para **blocos ocupados**.
'''
if '### 9.36D — Urban Polish' not in doc:
    doc += section
doc_path.write_text(doc, encoding='utf-8')

print("Mor'ia 9.36D Grand Eldoria urban polish prepared")
