import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('9.35B client map model generates declared dimensions instead of global 80x80', () => {
  const source = read('src/game/maps.ts');
  assert.match(source, /MAX_MAP_DIMENSION = 192/);
  assert.match(source, /getMapDimensions/);
  assert.match(source, /for \(let y = 0; y < mapHeight; y\+\+\)/);
  assert.match(source, /for \(let x = 0; x < mapWidth; x\+\+\)/);
  assert.match(source, /targetWidth - 2/);
});

test('9.35B minimap scales sampling markers and player by the selected map dimensions', () => {
  const source = read('src/components/WorldMiniMap.tsx');
  assert.match(source, /getMapDimensions\(map\)/);
  assert.match(source, /data-map-width=\{mapWidth\}/);
  assert.match(source, /data-map-height=\{mapHeight\}/);
  assert.match(source, /player\.pos\.x \* scale/);
});

test('9.35B City Designer uses live dimensions and capital authoring budgets', () => {
  const source = read('src/components/CityDesigner.tsx');
  assert.match(source, /landmarkLimit = isCapital \? 64 : 12/);
  assert.match(source, /data-city-designer-preview/);
  assert.match(source, /data-landmark-limit=\{landmarkLimit\}/);
  assert.doesNotMatch(source, /max = 78/);
});

test('9.35B visual proof owns a synthetic 160x160 capital with far-side content', () => {
  const source = read('src/visualQa.tsx');
  assert.match(source, /qa_grand_capital/);
  assert.match(source, /width: 160, height: 160/);
  assert.match(source, /qa_far_keep/);
  assert.match(source, /x: 136, y: 118/);
});
