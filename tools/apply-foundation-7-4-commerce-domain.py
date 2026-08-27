from pathlib import Path
import re

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    write(path, text.replace(old, new, 1))

replace_once('server/engine/OfficialSystems.mjs',
"import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';",
"import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';\nimport { officialCommerceDomain } from './OfficialCommerceDomain.mjs';")

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
pattern = re.compile(r"\n  listAuction\(player, itemId, rawPrice\) \{.*?\n  \}\n\n  claimWorldEvent\(player\) \{", re.S)
replacement = r'''
  listAuction(player, itemId, rawPrice) {
    return officialCommerceDomain.listAuction(this, player, itemId, rawPrice);
  }

  buyAuction(player, listingId, findOnlinePlayer = null) {
    return officialCommerceDomain.buyAuction(this, player, listingId, findOnlinePlayer);
  }

  cancelAuction(player, listingId) {
    return officialCommerceDomain.cancelAuction(this, player, listingId);
  }

  sendMail(player, payload, characterExists = null) {
    return officialCommerceDomain.sendMail(this, player, payload, characterExists);
  }

  markMail(player, mailId, action) {
    return officialCommerceDomain.markMail(this, player, mailId, action);
  }

  claimWorldEvent(player) {'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'{path}: commerce method block not found exactly once')
write(path, text)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialCommerceDomain } from '../engine/OfficialCommerceDomain.mjs';

function makeHost() {
  let saves = 0;
  const host = {
    global: { auctions: [], mail: [], credits: {} },
    ensurePlayer(player) {
      if (!player.official) player.official = { lastMailAt: 0 };
      return player.official;
    },
    save() { saves++; return true; },
    get saves() { return saves; },
  };
  return host;
}

function player(name, gold = 500) {
  return {
    name, gold, inventory: [], official: { lastMailAt: 0 },
    stats: { goldEarned: 0 },
  };
}

test('commerce domain auction preserves ownership and offline seller credit semantics', () => {
  const domain = new OfficialCommerceDomain();
  const host = makeHost();
  const seller = player('Seller');
  const buyer = player('Buyer');
  seller.inventory.push({ id: 'blade', name: 'Blade', type: 'equipment', quantity: 1, equipment: { attack: 3 } });

  assert.equal(domain.listAuction(host, seller, 'blade', 125), true);
  assert.equal(seller.inventory.length, 0);
  assert.equal(host.global.auctions.length, 1);
  const listing = host.global.auctions[0];
  assert.equal(domain.buyAuction(host, buyer, listing.id), true);
  assert.equal(buyer.gold, 375);
  assert.equal(host.global.credits.seller, 125);
  assert.equal(buyer.inventory.some(item => item.name === 'Blade'), true);
  assert.equal(host.global.auctions.length, 0);
  assert.equal(host.saves, 2);
});

test('commerce domain auction credits an online seller immediately and cancel restores item', () => {
  const domain = new OfficialCommerceDomain();
  const host = makeHost();
  const seller = player('Online Seller', 100);
  const buyer = player('Buyer', 300);
  seller.inventory.push({ id: 'ore', name: 'Ore', type: 'material', quantity: 4 });

  assert.equal(domain.listAuction(host, seller, 'ore', 90), true);
  const first = host.global.auctions[0];
  assert.equal(domain.buyAuction(host, buyer, first.id, key => key === 'online seller' ? seller : null), true);
  assert.equal(seller.gold, 190);
  assert.equal(seller.stats.goldEarned, 90);
  assert.equal(host.global.credits['online seller'], undefined);

  seller.inventory.push({ id: 'herb', name: 'Herb', type: 'material', quantity: 2 });
  assert.equal(domain.listAuction(host, seller, 'herb', 40), true);
  const second = host.global.auctions[0];
  assert.equal(domain.cancelAuction(host, seller, second.id), true);
  assert.equal(seller.inventory.some(item => item.name === 'Herb'), true);
  assert.equal(host.global.auctions.length, 0);
});

test('commerce domain mail atomically charges sender and allows one claim before safe deletion', () => {
  const domain = new OfficialCommerceDomain();
  const host = makeHost();
  const sender = player('Sender', 200);
  const receiver = player('Receiver', 10);
  sender.inventory.push({ id: 'stack', name: 'Ore', type: 'material', quantity: 3 });

  const payload = { target: 'Receiver', subject: 'Shipment', body: 'Take this.', gold: 25, itemId: 'stack' };
  assert.equal(domain.sendMail(host, sender, payload, name => name === 'Receiver'), true);
  assert.equal(sender.gold, 170);
  assert.equal(sender.inventory[0].quantity, 2);
  assert.equal(host.global.mail.length, 1);
  const mail = host.global.mail[0];

  assert.equal(domain.markMail(host, receiver, mail.id, 'delete'), false);
  assert.equal(domain.markMail(host, receiver, mail.id, 'claim'), true);
  assert.equal(receiver.gold, 35);
  assert.equal(receiver.stats.goldEarned, 25);
  assert.equal(receiver.inventory.some(item => item.name === 'Ore'), true);
  assert.equal(domain.markMail(host, receiver, mail.id, 'claim'), false);
  assert.equal(domain.markMail(host, receiver, mail.id, 'delete'), true);
  assert.equal(host.global.mail.length, 0);
});

test('commerce domain rejects invalid hosts and malformed ownership operations fail closed', () => {
  const domain = new OfficialCommerceDomain();
  const p = player('Tester');
  assert.equal(domain.listAuction({}, p, 'missing', 10), false);
  assert.equal(domain.buyAuction({}, p, 'missing'), false);
  assert.equal(domain.cancelAuction({}, p, 'missing'), false);
  assert.equal(domain.sendMail({}, p, {}, () => true), false);
  assert.equal(domain.markMail({}, p, 'missing', 'claim'), false);
});
'''
write('server/test/official-commerce-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.4 — Commerce Domain Extraction

Foundation 7.4 performs the first domain extraction from the large official-systems service without changing the public gameplay protocol or persistence format.

## Commerce & Messaging domain

`OfficialCommerceDomain.mjs` now owns:

- auction listing;
- auction purchase and online/offline seller settlement;
- auction cancellation and item return;
- player mail creation, postage, gold and item attachments;
- mail read/claim/delete lifecycle.

`OfficialSystems` retains compatibility wrappers with the same method names and signatures, so the action registry, GameState and clients require no protocol changes.

The domain receives the official host explicitly rather than importing the singleton. This keeps tests isolated and avoids a circular dependency while preserving the existing global JSON schema.

## Why this matters

Auction and mail are the natural expansion point for marketplace search, buy orders, COD, guild banking, escrow and system deliveries. Those features can now evolve in a focused domain instead of adding more stateful transaction code to `OfficialSystems.mjs`.

The new unit suite verifies offline credits, online seller settlement, cancellation, mail attachment/gold claims, one-time claiming and fail-closed host validation. Existing end-to-end official and persistence tests continue to validate the compatibility wrappers.
'''
write('docs/FOUNDATION_7_4_COMMERCE_DOMAIN.md', DOC)

print('Foundation 7.4 commerce domain extraction applied')
