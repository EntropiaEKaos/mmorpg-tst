import { chromium } from 'playwright';
import fs from 'node:fs';

const out = '/tmp/moria916-capture';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const consoleLines = [];

page.on('console', message => {
  const line = `[${message.type()}] ${message.text()}`;
  consoleLines.push(line);
  if (message.type() === 'error') errors.push(line);
});
page.on('pageerror', error => {
  const line = `[pageerror] ${error.message}`;
  consoleLines.push(line);
  errors.push(line);
});

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /OFFLINE QUICK PLAY/i }).click();
await page.waitForSelector('canvas', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/moria-9-16-gameplay.png` });

await page.getByRole('button', { name: /Debug/i }).click();
await page.getByRole('button', { name: /Game Editor/i }).click();
await page.getByRole('button', { name: /Living Realm 9\.16/i }).click();
await page.getByText(/THE LIVING REALM/i).first().waitFor({ state: 'visible', timeout: 10000 });

const shots = [
  [/Nodes/i, 'moria-9-16-living-nodes.png'],
  [/Factions/i, 'moria-9-16-factions.png'],
  [/Chronicle/i, 'moria-9-16-chronicle.png'],
  [/Grand Craft/i, 'moria-9-16-grand-crafting.png'],
  [/Taming/i, 'moria-9-16-taming-breeding.png'],
];

for (const [label, file] of shots) {
  await page.getByRole('button', { name: label }).last().click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/${file}` });
}

fs.writeFileSync(`${out}/browser-console.txt`, consoleLines.join('\n'));
fs.writeFileSync(`${out}/browser-errors.txt`, errors.join('\n'));
await browser.close();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
