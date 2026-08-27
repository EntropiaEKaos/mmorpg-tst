from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL PLAYER LIFECYCLE DOMAIN
// Owns idempotent login entitlements, offline credits and welcome delivery.
// ===================================================================

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US').slice(0, 80);

export const PLAYER_LIFECYCLE_RULES = Object.freeze({
  welcomeGold: 100,
  maxMail: 5000,
  maxOfflineCredit: 1_000_000_000,
});

function requireHost(host) {
  return Boolean(
    host
    && host.global
    && Array.isArray(host.global.mail)
    && host.global.credits
    && typeof host.ensurePlayer === 'function'
    && typeof host.save === 'function'
  );
}

function hasWelcomeMail(host, key) {
  const stableId = `welcome_${key}`;
  return host.global.mail.some(mail =>
    mail?.id === stableId
    || (mail?.system === true && mail?.to === key && mail?.from === 'Postmaster Edwin' && mail?.subject === "Welcome to Mor'ia!")
  );
}

export class OfficialPlayerLifecycleDomain {
  onLogin(host, player, now = Date.now()) {
    if (!requireHost(host) || !player || typeof player !== 'object') return { ok: false, creditedGold: 0, welcomeQueued: false };
    const key = playerKey(player.name);
    if (!key) return { ok: false, creditedGold: 0, welcomeQueued: false };
    const state = host.ensurePlayer(player);

    if (!player.stats || typeof player.stats !== 'object' || Array.isArray(player.stats)) player.stats = {};
    player.gold = Math.max(0, Number(player.gold) || 0);
    player.stats.goldEarned = Math.max(0, Number(player.stats.goldEarned) || 0);

    const previousGold = player.gold;
    const previousGoldEarned = player.stats.goldEarned;
    const previousWelcomeFlag = Boolean(state.welcomeMailSent);
    const previousCredit = host.global.credits[key];
    const previousMailLength = host.global.mail.length;

    let creditedGold = 0;
    let welcomeQueued = false;
    let changedGlobal = false;

    const credit = int(host.global.credits[key], 0, PLAYER_LIFECYCLE_RULES.maxOfflineCredit, 0);
    if (credit > 0) {
      player.gold += credit;
      player.stats.goldEarned += credit;
      delete host.global.credits[key];
      creditedGold = credit;
      changedGlobal = true;
    }

    if (!state.welcomeMailSent) {
      if (!hasWelcomeMail(host, key)) {
        const timestamp = Number(now) > 0 ? Number(now) : Date.now();
        host.global.mail.push({
          id: `welcome_${key}`,
          kind: 'welcome',
          from: 'Postmaster Edwin',
          to: key,
          subject: "Welcome to Mor'ia!",
          body: `Welcome, ${String(player.name || '').slice(0, 80)}. Your official online journey begins here.`,
          gold: PLAYER_LIFECYCLE_RULES.welcomeGold,
          claimed: false,
          read: false,
          sentAt: timestamp,
          system: true,
        });
        host.global.mail = host.global.mail.slice(-PLAYER_LIFECYCLE_RULES.maxMail);
        welcomeQueued = true;
        changedGlobal = true;
      }
      state.welcomeMailSent = true;
    }

    if (changedGlobal && !host.save()) {
      player.gold = previousGold;
      player.stats.goldEarned = previousGoldEarned;
      state.welcomeMailSent = previousWelcomeFlag;
      if (previousCredit === undefined) delete host.global.credits[key];
      else host.global.credits[key] = previousCredit;
      if (welcomeQueued) {
        const stableId = `welcome_${key}`;
        host.global.mail = host.global.mail.filter((mail, index) => index < previousMailLength || mail?.id !== stableId);
      }
      return { ok: false, creditedGold: 0, welcomeQueued: false };
    }

    return { ok: true, creditedGold, welcomeQueued };
  }
}

export const officialPlayerLifecycleDomain = new OfficialPlayerLifecycleDomain();
'''
write('server/engine/OfficialPlayerLifecycleDomain.mjs', DOMAIN)

TEST = r'''import test from 'node:test';
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
'''
write('server/test/official-player-lifecycle-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.15 — Player Lifecycle Domain

Foundation 7.15 extracts login-time entitlements into `OfficialPlayerLifecycleDomain`.

The domain owns offline-credit settlement, welcome-mail delivery and the login-time durability boundary. Welcome mail now uses a stable per-character identity and recognizes the legacy welcome format, making recovery idempotent even when a character flag and global mail state disagree. Combined login mutations require one global save, and a failed durable save rolls back credit and newly queued welcome mutations in memory.

`OfficialSystems.onLogin()` remains as a compatibility façade. This boundary prepares transactional account entitlements, compensation ledgers, referral rewards, subscription perks, seasonal grants and migration rewards without mixing lifecycle rules into the core runtime.
'''
write('docs/FOUNDATION_7_15_PLAYER_LIFECYCLE.md', DOC)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { DEFAULT_OFFICIAL_STATE_FILE, OfficialStateRepository } from './OfficialStateRepository.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialPlayerLifecycleDomain } from './OfficialPlayerLifecycleDomain.mjs';\n", 'player lifecycle import')
old = r'''  onLogin(player) {
    const s = this.ensurePlayer(player);
    const key = playerKey(player.name);
    const credit = int(this.global.credits[key], 0, 1_000_000_000, 0);
    if (credit > 0) {
      player.gold += credit;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + credit;
      delete this.global.credits[key];
      this.save();
    }
    if (!s.welcomeMailSent) {
      this.global.mail.push({
        id: `welcome_${Date.now()}_${Math.random()}`, from: 'Postmaster Edwin', to: key,
        subject: 'Welcome to Mor\'ia!', body: `Welcome, ${player.name}. Your official online journey begins here.`,
        gold: 100, claimed: false, read: false, sentAt: Date.now(), system: true,
      });
      s.welcomeMailSent = true;
      this.save();
    }
  }
'''
new = r'''  onLogin(player) {
    return officialPlayerLifecycleDomain.onLogin(this, player);
  }
'''
text = replace_once(text, old, new, 'login lifecycle method')
write(path, text)

print('Foundation 7.15 player lifecycle domain extraction applied')
