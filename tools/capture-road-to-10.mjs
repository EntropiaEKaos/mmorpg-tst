import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('docs/screenshots');
fs.mkdirSync(outDir, { recursive: true });
const reviewDir = path.resolve('tmp/road-to-10-review');
fs.mkdirSync(reviewDir, { recursive: true });

const tabs = [
  ['9.17 Integration', 'moria-9-17-integration.png'],
  ['9.18 Economy', 'moria-9-18-regional-economy.png'],
  ['9.19 Professions', 'moria-9-19-profession-specialization.png'],
  ['9.20 Taming 2.0', 'moria-9-20-beast-care.png'],
  ['9.21 Politics', 'moria-9-21-faction-politics.png'],
  ['9.22 Warfare', 'moria-9-22-siege-warfare.png'],
  ['9.23 Dynamic World', 'moria-9-23-dynamic-world.png'],
  ['9.24 Dungeons', 'moria-9-24-dungeon-blueprints.png'],
  ['9.25 Quests', 'moria-9-25-quest-consequences.png'],
  ['9.26 Housing', 'moria-9-26-housing-services.png'],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /OFFLINE QUICK PLAY/i }).click();
  await page.locator('canvas.moria-world-canvas').waitFor({ state: 'visible' });

  await page.locator('button[title*="Offline Debug Admin"]').click();
  await page.getByRole('heading', { name: /ADMIN PANEL/i }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Game Editor \(Items\/Spells\/Maps\/NPCs\/Monsters\/Books\)/i }).click();
  await page.getByRole('heading', { name: /GAME EDITOR/i }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Road to 10 · 9\.26/i }).click();

  const director = page.locator('[data-road-to-ten="9.26"]');
  await director.waitFor({ state: 'visible' });
  await page.getByText('ROAD TO 10 · WORLD OPERATING LAYER', { exact: true }).waitFor({ state: 'visible' });

  for (const [tab, filename] of tabs) {
    await page.getByRole('button', { name: new RegExp(tab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).click();
    await page.waitForTimeout(120);
    await director.screenshot({ path: path.join(outDir, filename), animations: 'disabled' });
  }

  fs.writeFileSync(path.join(reviewDir, 'browser-console.txt'), errors.join('\n'));
  fs.writeFileSync(path.join(reviewDir, 'capture-manifest.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    url: page.url(),
    viewport: { width: 1600, height: 1000 },
    screenshots: tabs.map(([, filename]) => filename),
    consoleErrors: errors.length,
  }, null, 2));

  if (errors.length) throw new Error(`Browser review captured ${errors.length} console/page error(s):\n${errors.join('\n')}`);
} finally {
  await browser.close();
}
