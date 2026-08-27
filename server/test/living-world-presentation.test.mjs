import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const screen = read('src/components/GameScreen.tsx');
const atmosphere = read('src/game/worldAtmosphere.ts');
const banner = read('src/components/RegionBanner.tsx');
const weather = read('src/components/Weather.tsx');

test('living-world atmosphere is extracted from the GameScreen orchestrator', () => {
  assert.match(screen, /drawWorldAtmosphere\(/);
  assert.doesNotMatch(screen, /Biome overlay \(shadowlands darkness/);
  assert.match(atmosphere, /export function drawWorldAtmosphere/);
  assert.match(atmosphere, /ATMOSPHERE_PROFILES/);
});

test('weather is deterministic per realm time window and presentation-only', () => {
  assert.match(atmosphere, /export function weatherForMap/);
  assert.match(screen, /setInterval\(refreshWeather, 45_000\)/);
  assert.doesNotMatch(atmosphere, /sendIntent|sendOfficial|player\.hp|monster\.hp/);
});

test('region arrival communicates identity danger and weather', () => {
  assert.match(screen, /<RegionBanner/);
  assert.match(banner, /Recommended level/);
  assert.match(banner, /WEATHER_ICON/);
  assert.match(weather, /prefers-reduced-motion|moria-snow-drop|moria-rain-drop/);
});
