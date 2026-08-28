import { chromium } from 'playwright';
import fs from 'node:fs';

fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));

// Keep the capture deterministic while still exercising LoginScreen's real authenticated flow.
await page.route('http://127.0.0.1:3000/api/auth/register', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      account: { id:'visual-review-account', username:'revisao928', createdAt:Date.now(), characters:[] },
      sessionToken:'visual-review-token',
      expiresAt:Date.now()+3600000,
      recoveryCode:'MORIA-928-REVIEW-CODE',
    }),
  });
});

const texts = {};
const captureText = async (key) => {
  texts[key] = (await page.locator('body').innerText()).replace(/\s+$/gm,'');
};
const screenshot = name => page.screenshot({ path:`docs/screenshots/${name}`, fullPage:false });
const assertNoLegacyEnglish = async (surface, forbidden) => {
  const text = (await page.locator('body').innerText()).toUpperCase();
  const hits = forbidden.filter(term => text.includes(term.toUpperCase()));
  if (hits.length) throw new Error(`${surface}: untranslated visible labels: ${hits.join(', ')}`);
};

await page.goto('http://127.0.0.1:4173', { waitUntil:'networkidle' });
await page.waitForFunction(() => document.documentElement.lang === 'pt-BR');
await page.waitForTimeout(500);
await captureText('login');
await assertNoLegacyEnglish('login', ['LOGIN','REGISTER','RECOVER','ACCOUNT NAME','PASSWORD','OFFLINE QUICK PLAY','PERSISTENT ONLINE REALM']);
await screenshot('moria-9-28-login-ptbr.png');

// Traverse the real registration -> recovery-code -> first-character flow.
await page.getByRole('button', { name:'CADASTRAR', exact:true }).click();
await page.locator('input[autocomplete="username"]').fill('revisao928');
await page.locator('input[autocomplete="new-password"]').fill('SenhaForte928!');
await assertNoLegacyEnglish('registration form', ['ACCOUNT NAME','PASSWORD','CREATE ACCOUNT']);
await page.locator('button.moria-button-primary').last().click();
await page.getByRole('button', { name:/SALVEI.*CONTINUAR/i }).waitFor({ state:'visible', timeout:10000 });
await assertNoLegacyEnglish('recovery code', ['ACCOUNT RECOVERY','SAVE YOUR RECOVERY CODE','I SAVED IT','CONTINUE']);
await page.getByRole('button', { name:/SALVEI.*CONTINUAR/i }).click();

// Character creation uses the actual game renderer for every vocation preview.
const previews = page.locator('[data-vocation-preview]');
await previews.first().waitFor({ state:'visible', timeout:10000 });
await page.waitForTimeout(350);
if (await previews.count() !== 14) throw new Error(`expected 14 vocation previews, got ${await previews.count()}`);
await captureText('characters-top');
await assertNoLegacyEnglish('character creation', ['CHARACTER NAME','VOCATION','SELECTED','CHOOSE','CREATE HERO','KNIGHT','SORCERER','DRUID','ROGUE','PRIEST','RANGER','NECROMANCER','SHAMAN','TEMPLAR']);
await screenshot('moria-9-28-character-creation-a.png');
const scrollBox = previews.first().locator('xpath=ancestor::div[contains(@class,"moria-scrollbar")]').first();
if (await scrollBox.count()) await scrollBox.evaluate(el => { el.scrollTop = el.scrollHeight; });
else await previews.last().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await captureText('characters-bottom');
await screenshot('moria-9-28-character-creation-b.png');

// Reset the temporary auth session and enter deterministic offline gameplay.
await page.evaluate(() => localStorage.removeItem('moria_session_token'));
await page.reload({ waitUntil:'networkidle' });
await page.waitForFunction(() => document.documentElement.lang === 'pt-BR');
await page.getByRole('button', { name:/JOGO RÁPIDO OFFLINE/i }).click();
await page.locator('canvas.moria-world-canvas').waitFor({ state:'visible' });
await page.waitForTimeout(1000);
await captureText('gameplay');
await assertNoLegacyEnglish('gameplay HUD', ['INVENTORY','CHARACTER','QUESTS','SETTINGS','LOGOUT','DAILY REWARD','ADVENTURE BOARD']);
await screenshot('moria-9-28-gameplay-ptbr-character.png');

await page.keyboard.press('i');
await page.waitForTimeout(450);
await captureText('inventory');
await assertNoLegacyEnglish('inventory', ['INVENTORY','EQUIP','UNEQUIP','CRAFT','RECIPE','INGREDIENTS','STATS','REQUIREMENTS']);
await screenshot('moria-9-28-inventory-ptbr.png');

fs.writeFileSync('browser-console.txt', errors.join('\n'));
fs.writeFileSync('visible-text-audit.json', JSON.stringify(texts,null,2));
await browser.close();
if (errors.length) process.exit(2);
