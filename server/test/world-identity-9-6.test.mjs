import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WorldManager } from '../engine/World.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';

const readClient = relative => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

function baseMap(overrides = {}) {
  return {
    id: 'test_city', name: 'Test City', biome: 'plains', description: '9.6 validation fixture', levelRequired: 1, seed: 123,
    spawnX: 40, spawnY: 40, townX: 40, townY: 40, townRange: 8, access: 'public', portals: [],
    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
    districts: [{ id:'civic', name:'Civic Ward', icon:'♜', x:40, y:40, radius:4, color:'#d8b45a' }],
    landmarks: [{ id:'keep', name:'Test Keep', kind:'keep', icon:'♜', x:36, y:33, w:6, h:5 }],
    props: [{ id:'banner', kind:'banner', x:40, y:44, color:'#d8b45a' }],
    ...overrides,
  };
}

test('9.6 built-in cities expose distinct normalized identity', () => {
  const world = new WorldManager();
  const defs = world.getDefinitions();
  const expected = new Map([
    ['eldoria','royal'], ['frostpeak','alpine'], ['shadowfen','marsh'], ['emberhold','forge'], ['voidlands','void'],
  ]);
  for (const [id, style] of expected) {
    const map = defs.find(entry => entry.id === id);
    assert.ok(map, `missing ${id}`);
    assert.equal(map.cityStyle, style);
    assert.match(map.cityAccent, /^#[0-9a-f]{6}$/i);
    assert.match(map.roofColor, /^#[0-9a-f]{6}$/i);
    assert.match(map.wallColor, /^#[0-9a-f]{6}$/i);
    assert.match(map.roadColor, /^#[0-9a-f]{6}$/i);
    assert.ok(map.districts.length >= 4, `${id} districts`);
    assert.ok(map.landmarks.length >= 5, `${id} landmarks`);
    assert.ok(map.props.length >= 12, `${id} props`);
  }
  assert.equal(new Set([...expected.keys()].map(id => defs.find(entry => entry.id === id).cityStyle)).size, expected.size);
});

test('9.6 content studio authors and validates city identity fields', () => {
  const stub = { get: () => [] };
  const schema = getContentStudioSchema('maps', stub);
  for (const field of ['cityStyle','cityAccent','roofColor','wallColor','roadColor','districts','landmarks','props']) {
    assert.ok(schema.fields.includes(field), `missing studio field ${field}`);
  }
  assert.ok(schema.options.cityStyles.includes('royal'));
  assert.equal(validateStudioRecord('maps', baseMap()), null);
  assert.match(validateStudioRecord('maps', baseMap({ cityAccent: 'red' })), /cityAccent/);
  assert.match(validateStudioRecord('maps', baseMap({ landmarks: [{ id:'bad', name:'Bad', kind:'copied_city_asset', x:40, y:40, w:4, h:4 }] })), /landmark kind/);
  assert.match(validateStudioRecord('maps', baseMap({ props: Array.from({ length: 81 }, (_, i) => ({ id:`p${i}`, kind:'banner', x:40, y:40 })) })), /at most 80/);
});

test('9.6 authoritative world round-trips edited city identity', () => {
  const world = new WorldManager();
  world.syncContentMaps([baseMap({ cityStyle:'crystal', cityAccent:'#66ddff', townX:32, townY:34 })]);
  const map = world.getDefinitions().find(entry => entry.id === 'test_city');
  assert.equal(map.cityStyle, 'crystal');
  assert.equal(map.cityAccent, '#66ddff');
  assert.equal(map.townX, 32);
  assert.equal(map.townY, 34);
  assert.equal(map.landmarks[0].name, 'Test Keep');
});

test('9.6 client city designer is live and minimap consumes real maps', () => {
  const editor = readClient('src/components/GameEditor.tsx');
  const designer = readClient('src/components/CityDesigner.tsx');
  const minimap = readClient('src/components/WorldMiniMap.tsx');
  const maps = readClient('src/game/maps.ts');
  assert.match(editor, /City Designer · Live/);
  assert.match(editor, /<CityDesigner onApplied=/);
  assert.doesNotMatch(editor, /Maps · Preview/);
  assert.match(designer, /APPLY TO WORLD/);
  assert.match(designer, /moria_city_designer_maps/);
  assert.match(designer, /syncServerMaps\(records\)/);
  assert.match(minimap, /generateMap\(map\.id\)/);
  assert.match(minimap, /getCityMinimapMarkers\(map\)/);
  assert.doesNotMatch(minimap, /Math\.hypot\(x - 18, y - 18\)/);
  assert.match(maps, /cityStyle: CityStyle/);
  assert.match(maps, /withCityDefaults/);
});

test('9.6 presentation remains modular and GameScreen stays inside architecture budget', () => {
  const screen = readClient('src/components/GameScreen.tsx');
  const city = readClient('src/game/cityPresentation.ts');
  assert.match(screen, /getCityBuildings\(MAPS\.eldoria\)/);
  assert.match(screen, /drawCityTileOverlay/);
  assert.match(screen, /drawCityDecor/);
  assert.match(screen, /mapId=\{currentMapId\}/);
  assert.match(city, /export function getCityBuildings/);
  assert.match(city, /export function drawCityDecor/);
  const bytes = Buffer.byteLength(screen, 'utf8');
  assert.ok(bytes <= 155000, `GameScreen.tsx is ${bytes} bytes; guard is 155000`);
});

test('9.6 alpha content assigns original Mor\'ia city styles to every launch region', () => {
  const alpha = fs.readFileSync(new URL('../engine/AlphaContent.mjs', import.meta.url), 'utf8');
  for (const style of ['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']) {
    assert.match(alpha, new RegExp(`['\"]${style}['\"]`), `missing ${style}`);
  }
  for (const name of ['Eldoria Heartlands','Sunreach Coast','Ironwood March','Frostpeak','Shadowfen','Emberhold','Crystal Deep','Stormwatch Isle','Voidlands','Nightfall Citadel','Astra Sanctum']) {
    assert.match(alpha, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
