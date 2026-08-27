// ===================================================================
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
