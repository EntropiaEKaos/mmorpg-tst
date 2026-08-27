from pathlib import Path

DOMAIN = Path('server/engine/OfficialInventoryEconomyDomain.mjs')
TEST = Path('server/test/official-inventory-economy-domain.test.mjs')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

text = DOMAIN.read_text(encoding='utf-8')
text = replace_once(text, """  bank(player, direction, rawAmount) {
    const amount = int(rawAmount, 1, INVENTORY_ECONOMY_RULES.maxBankTransfer, 0);
    if (!amount) return false;
""", """  bank(player, direction, rawAmount) {
    const amount = Number(rawAmount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > INVENTORY_ECONOMY_RULES.maxBankTransfer) return false;
""", 'strict bank amount validation')
DOMAIN.write_text(text, encoding='utf-8')

text = TEST.read_text(encoding='utf-8')
text = replace_once(text, """  assert.equal(domain.bank(p, 'deposit', -1), false);
  assert.equal(domain.bank(p, 'withdraw', INVENTORY_ECONOMY_RULES.maxBankTransfer + 1), false);
""", """  assert.equal(domain.bank(p, 'deposit', -1), false);
  assert.equal(domain.bank(p, 'deposit', 1.5), false);
  assert.equal(domain.bank(p, 'withdraw', INVENTORY_ECONOMY_RULES.maxBankTransfer + 1), false);
""", 'bank invalid amount tests')
text = replace_once(text, """test('inventory economy coin sinks are atomic and refund failed equipment cache', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  const before = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'equipment_cache', [], 1000), false);
  assert.equal(p.official.coins, before);
  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), true);
  assert.equal(p.inventory.find(i => i.name === 'Health Potion').quantity, 5);
  const afterSupplies = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'blessing', [], 2000), true);
  assert.equal(p.official.blessingsUntil, 2000 + INVENTORY_ECONOMY_RULES.blessingDurationMs);
  assert.ok(p.official.coins < afterSupplies);
});
""", """test('inventory economy coin sinks are atomic on rejection and consume exactly once on success', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.official.coins = 0;
  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), false);
  assert.equal(p.official.coins, 0);
  assert.equal(p.inventory.length, 0);

  p.official.coins = 500;
  assert.equal(domain.buyCoinItem(host, p, 'equipment_cache', [], 1000), true);
  assert.equal(p.official.coins, 400);
  assert.equal(p.inventory.some(i => i.type === 'equipment'), true);

  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), true);
  assert.equal(p.inventory.find(i => i.name === 'Health Potion').quantity, 5);
  const afterSupplies = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'blessing', [], 2000), true);
  assert.equal(p.official.blessingsUntil, 2000 + INVENTORY_ECONOMY_RULES.blessingDurationMs);
  assert.equal(p.official.coins, afterSupplies - 60);

  p.official.titles.owned.push('Shadow Walker');
  const beforeDuplicateTitle = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'title_shadow', [], 3000), false);
  assert.equal(p.official.coins, beforeDuplicateTitle);
});
""", 'coin sink atomicity test')
TEST.write_text(text, encoding='utf-8')

print('Foundation 7.10 economy validation hardened')
