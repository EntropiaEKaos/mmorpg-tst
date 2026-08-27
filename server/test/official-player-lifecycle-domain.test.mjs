import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_LIFECYCLE_RULES, OfficialPlayerLifecycleDomain } from '../engine/OfficialPlayerLifecycleDomain.mjs';

function fixture(saveResult = true) {
  const player = {
    name: 'Lifecycle Hero', gold: 100, stats: { goldEarned: 5 },
    official: { welcomeMailSent: false },
  };
  let saves = 0;
  const host = {
    global: { credits: {}, mail: [] },
    ensurePlayer(value) { return value.official; },
    save() { saves += 1; return saveResult; },
    get saves() { return saves; },
  };
  return { host, player };
}

test('player lifecycle applies offline credit once and removes the durable entitlement', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture();
  host.global.credits['lifecycle hero'] = 250;
  const first = domain.onLogin(host, player, 1000);
  assert.deepEqual(first, { ok: true, creditedGold: 250, welcomeQueued: true });
  assert.equal(player.gold, 350);
  assert.equal(player.stats.goldEarned, 255);
  assert.equal(Object.hasOwn(host.global.credits, 'lifecycle hero'), false);
  const second = domain.onLogin(host, player, 2000);
  assert.deepEqual(second, { ok: true, creditedGold: 0, welcomeQueued: false });
  assert.equal(player.gold, 350);
});

test('player lifecycle welcome mail is stable and idempotent by recipient', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture();
  domain.onLogin(host, player, 1000);
  assert.equal(host.global.mail.length, 1);
  assert.equal(host.global.mail[0].id, 'welcome_lifecycle hero');
  assert.equal(host.global.mail[0].gold, PLAYER_LIFECYCLE_RULES.welcomeGold);

  player.official.welcomeMailSent = false;
  const replay = domain.onLogin(host, player, 2000);
  assert.equal(replay.welcomeQueued, false);
  assert.equal(host.global.mail.length, 1);
  assert.equal(player.official.welcomeMailSent, true);
});

test('player lifecycle recognizes legacy welcome mail and avoids duplicate recovery delivery', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture();
  host.global.mail.push({
    id: 'welcome_legacy_random', from: 'Postmaster Edwin', to: 'lifecycle hero',
    subject: "Welcome to Mor'ia!", system: true,
  });
  const result = domain.onLogin(host, player, 1000);
  assert.equal(result.welcomeQueued, false);
  assert.equal(host.global.mail.length, 1);
  assert.equal(player.official.welcomeMailSent, true);
});

test('player lifecycle performs one global save for combined credit and welcome mutations', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture();
  host.global.credits['lifecycle hero'] = 10;
  domain.onLogin(host, player, 1000);
  assert.equal(host.saves, 1);
});

test('player lifecycle rolls back credit and welcome mutations if durable save fails', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture(false);
  host.global.credits['lifecycle hero'] = 250;
  const result = domain.onLogin(host, player, 1000);
  assert.deepEqual(result, { ok: false, creditedGold: 0, welcomeQueued: false });
  assert.equal(player.gold, 100);
  assert.equal(player.stats.goldEarned, 5);
  assert.equal(player.official.welcomeMailSent, false);
  assert.equal(host.global.credits['lifecycle hero'], 250);
  assert.deepEqual(host.global.mail, []);
});

test('player lifecycle caps welcome mail while keeping the newest stable message', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  const { host, player } = fixture();
  host.global.mail = Array.from({ length: PLAYER_LIFECYCLE_RULES.maxMail }, (_, i) => ({ id: `old_${i}` }));
  domain.onLogin(host, player, 1000);
  assert.equal(host.global.mail.length, PLAYER_LIFECYCLE_RULES.maxMail);
  assert.equal(host.global.mail.at(-1).id, 'welcome_lifecycle hero');
  assert.equal(host.global.mail.some(mail => mail.id === 'old_0'), false);
});

test('player lifecycle rejects malformed hosts and unnamed players without mutation', () => {
  const domain = new OfficialPlayerLifecycleDomain();
  assert.deepEqual(domain.onLogin(null, { name: 'Hero' }), { ok: false, creditedGold: 0, welcomeQueued: false });
  const { host, player } = fixture();
  player.name = '   ';
  assert.deepEqual(domain.onLogin(host, player), { ok: false, creditedGold: 0, welcomeQueued: false });
  assert.equal(host.saves, 0);
});
