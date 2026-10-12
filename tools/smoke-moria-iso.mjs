import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.MORIA_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const output = 'artifacts/moria-iso-smoke';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] });
const report = [];
const issues = [];

function instrument(page, label) {
  page.on('pageerror', error => issues.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') issues.push(`${label}: console: ${message.text()}`);
  });
}
async function readyIso(page) {
  await page.locator('[data-testid="iso-next-root"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="iso-next-canvas"]')?.getAttribute('data-pixi-mount') === 'active', null, { timeout: 15000 }).catch(async error => {
    const details = await page.locator('[data-testid="iso-next-canvas"]').evaluate(node => ({ lifecycle: node.dataset.isoLifecycle, pixiMount: node.dataset.pixiMount, pixiError: node.dataset.pixiError, threeMount: node.dataset.threeMount }));
    throw new Error(`ISO Pixi mount failed: ${JSON.stringify(details)}; ${error.message}`);
  });
  await page.locator('canvas[data-testid="iso-pixi-canvas"]').waitFor({ state: 'visible' });
}
async function demo(page, suffix) {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).click();
  await readyIso(page);
  await page.locator('[data-testid="iso-player-hud"]').waitFor({ state: 'visible' });
  const initial = await page.evaluate(() => window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos);
  assert.ok(initial && typeof initial.x === 'number', 'Quick Play authoritative-shaped snapshot must expose a position');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowUp');
  await page.waitForFunction(prev => window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos?.y < prev, initial.y, { timeout: 4000 });
  assert.equal(await page.locator('[data-testid="iso-action-bar"]').count(), 0, 'Inert duplicate action bar must not return');
  await page.screenshot({ path: `${output}/quick-play-${suffix}.png`, fullPage: false });
  report.push(`Quick Play ${suffix}: renderer mounted, hero visible, keyboard movement worked`);
}

try {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const status = await health.json();
  assert.equal(status.status, 'online');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(desktop, 'desktop');
  await demo(desktop, 'desktop');
  await desktop.getByRole('button', { name: 'Sair', exact: true }).click();
  await desktop.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).waitFor({ state: 'visible' });
  report.push('Logout: clickable and returns to login screen');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  instrument(mobile, 'mobile');
  await demo(mobile, 'mobile');

  const legacy = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(legacy, 'legacy');
  await legacy.goto(`${base}/legacy`, { waitUntil: 'domcontentloaded' });
  await legacy.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).click();
  await legacy.locator('canvas.moria-world-canvas').waitFor({ state: 'visible', timeout: 12000 });
  await legacy.screenshot({ path: `${output}/legacy.png`, fullPage: false });
  report.push('Legacy: separate route and offline renderer available');

  const stamp = Date.now().toString().slice(-9);
  const username = `smoke_${stamp}`;
  const characterName = `SmokeHero${stamp.slice(-6)}`;
  const password = `MoriaSmokeStrong-${stamp}`;
  const registered = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  assert.equal(registered.status, 201, `register: ${await registered.text()}`);
  const registration = await registered.json();
  const created = await fetch(`${base}/api/characters`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${registration.sessionToken}` }, body: JSON.stringify({ name: characterName, vocation: 'knight' }) });
  assert.equal(created.status, 201, `character creation: ${await created.text()}`);

  const online = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(online, 'online');
  await online.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await online.locator('[autocomplete="username"]').fill(username);
  await online.locator('[autocomplete="current-password"]').fill(password);
  await online.locator('button.moria-button-primary').last().click();
  await readyIso(online);
  await online.getByText('Servidor autoritativo • LIVE').waitFor({ state: 'visible', timeout: 16000 });
  await online.locator('[data-testid="iso-player-hud"]').waitFor({ state: 'visible' });
  await online.screenshot({ path: `${output}/online.png`, fullPage: false });
  report.push('Online: real HTTP login, character ownership, WebSocket auth, server snapshot, Pixi mount');

  if (issues.length) throw new Error(`Browser runtime errors:\n${issues.join('\n')}`);
  console.log('MOR\'IA ISO SMOKE PASS:\n' + report.join('\n'));
} catch (error) {
  console.error('MOR\'IA ISO SMOKE FAILED:', error);
  await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), issues, report }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
