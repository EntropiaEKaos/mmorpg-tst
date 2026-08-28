import { chromium } from 'playwright';
import fs from 'node:fs';

fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

const shot = (name) => page.screenshot({ path: `docs/screenshots/${name}` });
const openAdmin = async () => {
  await page.keyboard.press('Control+Shift+A');
  await page.getByText('ADMIN PANEL', { exact: false }).waitFor({ state: 'visible' });
};
const closeAdmin = async () => {
  await page.getByRole('button', { name: '✕' }).click();
  await page.getByText('ADMIN PANEL', { exact: false }).waitFor({ state: 'hidden' });
  await page.waitForTimeout(350);
};

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await shot('moria-9-27-login-revamp.png');
await page.getByRole('button', { name: /OFFLINE QUICK PLAY/i }).click();
await page.locator('canvas.moria-world-canvas').waitFor({ state: 'visible' });
await page.waitForTimeout(900);

// Deterministic presentation review through the existing offline-only admin controls.
await openAdmin();
await page.getByRole('button', { name: /Day/ }).click();
await page.getByRole('button', { name: /Clear/ }).click();
await closeAdmin();
await shot('moria-9-27-world-day.png');

await openAdmin();
await page.getByRole('button', { name: /Night/ }).click();
await page.getByRole('button', { name: /Clear/ }).click();
await closeAdmin();
await shot('moria-9-27-world-night.png');

await openAdmin();
await page.getByRole('button', { name: /Day/ }).click();
await page.getByRole('button', { name: /Storm/ }).click();
await closeAdmin();
await page.waitForTimeout(700);
await shot('moria-9-27-world-storm.png');

await openAdmin();
await page.getByRole('button', { name: /Day/ }).click();
await page.getByRole('button', { name: /Clear/ }).click();
await closeAdmin();
await page.keyboard.press('i');
await page.waitForTimeout(350);
await shot('moria-9-27-inventory-hud.png');
await page.keyboard.press('i');

fs.writeFileSync('browser-console.txt', errors.join('\n'));
await browser.close();
if (errors.length) process.exit(2);
