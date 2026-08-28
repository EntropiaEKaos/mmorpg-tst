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
const bodyText = async () => (await page.locator('body').innerText()).replace(/\s+$/gm,'');
const captureText = async (key) => { texts[key] = await bodyText(); };
const screenshot = name => page.screenshot({ path:`docs/screenshots/${name}`, fullPage:false });
const escapeRegex = term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsStandalone = (text, term) => {
  const escaped = escapeRegex(term.toUpperCase());
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u').test(text.toUpperCase());
};
const assertNoLegacyEnglish = async (surface, forbidden) => {
  const text = await bodyText();
  const hits = forbidden.filter(term => containsStandalone(text, term));
  if (hits.length) throw new Error(`${surface}: untranslated visible labels: ${hits.join(', ')}`);
};
const assertPortuguese = async (surface, required) => {
  const text = (await bodyText()).toUpperCase();
  const missing = required.filter(term => !text.includes(term.toUpperCase()));
  if (missing.length) throw new Error(`${surface}: expected PT-BR labels missing: ${missing.join(', ')}`);
};

await page.goto('http://127.0.0.1:4173', { waitUntil:'networkidle' });
await page.waitForFunction(() => document.documentElement.lang === 'pt-BR');
await page.waitForTimeout(500);
await captureText('login');
await assertPortuguese('login', ['MUNDO ONLINE PERSISTENTE','CONTA SEGURA','ENTRAR','CADASTRAR','RECUPERAR','JOGO RÁPIDO OFFLINE']);
await assertNoLegacyEnglish('login', ['LOGIN','REGISTER','RECOVER','ACCOUNT NAME','PASSWORD','OFFLINE QUICK PLAY','PERSISTENT ONLINE REALM']);
await screenshot('moria-9-28-login-ptbr.png');

// Traverse the real registration -> recovery-code -> first-character flow.
await page.getByRole('button', { name:'CADASTRAR', exact:true }).click();
await page.locator('input[autocomplete="username"]').fill('revisao928');
await page.locator('input[autocomplete="new-password"]').fill('SenhaForte928!');
await assertPortuguese('registration form', ['NOME DA CONTA','SENHA','CRIAR CONTA']);
await assertNoLegacyEnglish('registration form', ['ACCOUNT NAME','PASSWORD','CREATE ACCOUNT']);
await page.locator('button.moria-button-primary').last().click();
await page.getByRole('button', { name:/SALVEI.*CONTINUAR/i }).waitFor({ state:'visible', timeout:10000 });
await assertPortuguese('recovery code', ['RECUPERAÇÃO DE CONTA','SALVE SEU CÓDIGO DE RECUPERAÇÃO','SALVEI O CÓDIGO','CONTINUAR']);
await assertNoLegacyEnglish('recovery code', ['ACCOUNT RECOVERY','SAVE YOUR RECOVERY CODE','I SAVED IT','CONTINUE']);
await page.getByRole('button', { name:/SALVEI.*CONTINUAR/i }).click();

// Character creation uses the actual game renderer for every vocation preview.
const previews = page.locator('[data-vocation-preview]');
await previews.first().waitFor({ state:'visible', timeout:10000 });
await page.waitForTimeout(350);
if (await previews.count() !== 14) throw new Error(`expected 14 vocation previews, got ${await previews.count()}`);
await captureText('characters-top');
await assertPortuguese('character creation', [
  'CONECTADO COMO REVISAO928','CRIE SEU PERSONAGEM','NOME DO PERSONAGEM','VOCAÇÃO',
  'CAVALEIRO','PALADINO','FEITICEIRO','DRUIDA','BRUXO','LADINO','SACERDOTE',
  'CAVALEIRO DA MORTE','MONGE','PATRULHEIRO','NECROMANTE','XAMÃ','TEMPLÁRIO'
]);
await assertNoLegacyEnglish('character creation', [
  'SIGNED IN AS','CHARACTER NAME','VOCATION','SELECTED','CHOOSE','CREATE HERO','KNIGHT','SORCERER','DRUID',
  'WARLOCK','ROGUE','PRIEST','DEATH KNIGHT','MONK','RANGER','NECROMANCER','SHAMAN','TEMPLAR'
]);
await screenshot('moria-9-28-character-creation-a.png');
const scrollBox = previews.first().locator('xpath=ancestor::div[contains(@class,"moria-scrollbar")]').first();
if (await scrollBox.count()) await scrollBox.evaluate(el => { el.scrollTop = el.scrollHeight; });
else await previews.last().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await captureText('characters-bottom');
await screenshot('moria-9-28-character-creation-b.png');

// Reset the temporary auth session and enter deterministic offline gameplay.
await page.evaluate(() => {
  localStorage.removeItem('moria_session_token');
  localStorage.removeItem('moria_world_events');
});
await page.reload({ waitUntil:'networkidle' });
await page.waitForFunction(() => document.documentElement.lang === 'pt-BR');
await page.getByRole('button', { name:/JOGO RÁPIDO OFFLINE/i }).click();
await page.locator('canvas.moria-world-canvas').waitFor({ state:'visible' });
await page.waitForTimeout(1200);
await captureText('gameplay');
await assertPortuguese('gameplay HUD', [
  'MASMORRA','MISTÉRIOS','LIVROS','MOEDAS','INVENT.','VIDA','DEPURAÇÃO',
  'MINIMAPA','CAVALEIRO','LIVRO DE MAGIAS','AMEAÇAS PRÓXIMAS',
  'FÚRIA','CURA DE FERIDAS','FÚRIA IMPLACÁVEL','ESCUDO MÁGICO',
  'TODOS','MUNDO','FALAR','GRUPO','GUILDA','COMÉRCIO','BATALHA','SAQUE','MISSÃO','SISTEMA','ENVIAR',
  'BEM-VINDO A MOR\'IA'
]);
await assertNoLegacyEnglish('gameplay HUD', [
  'INVENTORY','CHARACTER','QUESTS','SETTINGS','LOGOUT','DAILY REWARD','ADVENTURE BOARD',
  'DUNGEON','MYSTERY','BOOKS','COINS','SPELLBOOK','NEARBY THREATS','BERSERK','WOUND HEAL','FIERCE BERSERK','MAGIC SHIELD',
  'ALL','WORLD','SAY','PARTY','GUILD','TRADE','BATTLE','LOOT','QUEST','SYSTEM','SEND','PLAGUE RAT','WARNING','WORLD EVENT'
]);
await screenshot('moria-9-28-gameplay-ptbr-character.png');

await page.keyboard.press('i');
await page.waitForTimeout(500);
await captureText('inventory');
await assertPortuguese('inventory', ['INVENTÁRIO','ITENS','ARTESANATO','ENCAIXE','POÇÃO DE VIDA','POÇÃO DE MANA']);
await assertNoLegacyEnglish('inventory', [
  'INVENTORY','ITEMS','CRAFTING','SOCKET','EQUIP','UNEQUIP','CRAFT','RECIPE','INGREDIENTS','STATS','REQUIREMENTS',
  'HEALTH POTION','MANA POTION','GREATER HEALTH POTION'
]);
await screenshot('moria-9-28-inventory-ptbr.png');

fs.writeFileSync('browser-console.txt', errors.join('\n'));
fs.writeFileSync('visible-text-audit.json', JSON.stringify(texts,null,2));
await browser.close();
if (errors.length) process.exit(2);
