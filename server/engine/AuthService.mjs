// ===================================================================
//  MOR'IA AUTH SERVICE — server-side accounts, recovery and sessions
// ===================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = path.join(__dirname, '..', 'moria-accounts.json');

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = Object.freeze({ N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;

function scryptAsync(secret, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(secret, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

function safeEqualEncoded(a, b) {
  try {
    const aa = Buffer.from(String(a), 'base64url');
    const bb = Buffer.from(String(b), 'base64url');
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

function normalizeUsername(value) {
  if (typeof value !== 'string') return null;
  const username = value.trim();
  if (username.length < 3 || username.length > 32) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(username)) return null;
  return { display: username, key: username.toLowerCase() };
}

function normalizeCharacterName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 24) return null;
  if (!/^[\p{L}\p{N} _'-]+$/u.test(name)) return null;
  return { display: name, key: name.toLocaleLowerCase('en-US') };
}

function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 10) return 'Password must be at least 10 characters';
  if (password.length > 128) return 'Password is too long';
  return null;
}

function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    username: account.username,
    createdAt: account.createdAt,
    characters: (account.characters || []).map(c => ({
      name: c.name,
      vocation: c.vocation,
      createdAt: c.createdAt,
    })),
  };
}

export class AccountStore {
  constructor(dbFile = DEFAULT_DB_FILE) {
    this.dbFile = dbFile;
    this.data = { version: 1, accounts: {} };
    this.usernameIndex = new Map();
    this.characterIndex = new Map();
    this.dummySalt = crypto.randomBytes(16).toString('base64url');
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const parsed = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
        if (parsed && typeof parsed === 'object' && parsed.accounts && typeof parsed.accounts === 'object') {
          this.data = parsed;
        }
      }
    } catch (err) {
      console.warn('⚠ Account DB load failed:', err.message);
    }
    this.rebuildIndices();
  }

  rebuildIndices() {
    this.usernameIndex.clear();
    this.characterIndex.clear();
    for (const account of Object.values(this.data.accounts || {})) {
      if (!account || typeof account !== 'object') continue;
      const username = normalizeUsername(account.username);
      if (username) this.usernameIndex.set(username.key, account.id);
      for (const character of account.characters || []) {
        const normalized = normalizeCharacterName(character.name);
        if (normalized) this.characterIndex.set(normalized.key, account.id);
      }
    }
  }

  save() {
    const dir = path.dirname(this.dbFile);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.dbFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.dbFile);
  }

  async hashSecret(secret) {
    const salt = crypto.randomBytes(16).toString('base64url');
    const hash = (await scryptAsync(secret, salt)).toString('base64url');
    return { salt, hash };
  }

  async verifySecret(secret, credential) {
    if (!credential?.salt || !credential?.hash || typeof secret !== 'string') {
      await scryptAsync(String(secret || ''), this.dummySalt);
      return false;
    }
    try {
      const actual = (await scryptAsync(secret, credential.salt)).toString('base64url');
      return safeEqualEncoded(actual, credential.hash);
    } catch {
      return false;
    }
  }

  getById(accountId) {
    return this.data.accounts?.[accountId] || null;
  }

  getByUsername(usernameValue) {
    const username = normalizeUsername(usernameValue);
    if (!username) return null;
    const id = this.usernameIndex.get(username.key);
    return id ? this.getById(id) : null;
  }

  getPublicAccount(accountId) {
    return publicAccount(this.getById(accountId));
  }

  async register(usernameValue, password) {
    const username = normalizeUsername(usernameValue);
    if (!username) return { ok: false, error: 'Account name must be 3-32 letters, numbers, dot, dash or underscore' };
    const passwordError = validatePassword(password);
    if (passwordError) return { ok: false, error: passwordError };
    if (this.usernameIndex.has(username.key)) return { ok: false, error: 'Account name is already in use' };

    const passwordCredential = await this.hashSecret(password);
    const recoveryCode = crypto.randomBytes(24).toString('base64url');
    const recoveryCredential = await this.hashSecret(recoveryCode);
    const accountId = `acct_${crypto.randomUUID()}`;
    const account = {
      id: accountId,
      username: username.display,
      usernameKey: username.key,
      password: passwordCredential,
      recovery: recoveryCredential,
      createdAt: Date.now(),
      passwordChangedAt: Date.now(),
      characters: [],
    };

    this.data.accounts[accountId] = account;
    this.usernameIndex.set(username.key, accountId);
    this.save();
    return { ok: true, account: publicAccount(account), recoveryCode };
  }

  async authenticate(usernameValue, password) {
    const account = this.getByUsername(usernameValue);
    const valid = account
      ? await this.verifySecret(password, account.password)
      : await this.verifySecret(password, null);
    if (!account || !valid) return { ok: false, error: 'Invalid account name or password' };
    return { ok: true, account: publicAccount(account) };
  }

  async changePassword(accountId, currentPassword, newPassword) {
    const account = this.getById(accountId);
    if (!account) return { ok: false, error: 'Account not found' };
    const passwordError = validatePassword(newPassword);
    if (passwordError) return { ok: false, error: passwordError };
    if (!(await this.verifySecret(currentPassword, account.password))) return { ok: false, error: 'Current password is incorrect' };
    account.password = await this.hashSecret(newPassword);
    account.passwordChangedAt = Date.now();
    this.save();
    return { ok: true, account: publicAccount(account) };
  }

  async recover(usernameValue, recoveryCode, newPassword) {
    const account = this.getByUsername(usernameValue);
    const passwordError = validatePassword(newPassword);
    if (passwordError) return { ok: false, error: passwordError };
    const validRecovery = account
      ? await this.verifySecret(recoveryCode, account.recovery)
      : await this.verifySecret(recoveryCode, null);
    if (!account || !validRecovery) return { ok: false, error: 'Invalid account name or recovery code' };

    account.password = await this.hashSecret(newPassword);
    account.passwordChangedAt = Date.now();
    const nextRecoveryCode = crypto.randomBytes(24).toString('base64url');
    account.recovery = await this.hashSecret(nextRecoveryCode);
    this.save();
    return { ok: true, account: publicAccount(account), recoveryCode: nextRecoveryCode };
  }

  createCharacter(accountId, nameValue, vocation) {
    const account = this.getById(accountId);
    if (!account) return { ok: false, error: 'Account not found' };
    const name = normalizeCharacterName(nameValue);
    if (!name) return { ok: false, error: 'Character name must be 3-24 valid characters' };
    if (this.characterIndex.has(name.key)) return { ok: false, error: 'Character name is already in use' };
    if (typeof vocation !== 'string' || !vocation) return { ok: false, error: 'Vocation is required' };

    const character = { name: name.display, nameKey: name.key, vocation, createdAt: Date.now() };
    account.characters.push(character);
    this.characterIndex.set(name.key, accountId);
    this.save();
    return { ok: true, character: { name: character.name, vocation: character.vocation, createdAt: character.createdAt }, account: publicAccount(account) };
  }

  findCharacter(nameValue) {
    const name = normalizeCharacterName(nameValue);
    if (!name) return null;
    const accountId = this.characterIndex.get(name.key);
    if (!accountId) return null;
    const account = this.getById(accountId);
    const character = account?.characters?.find(c => normalizeCharacterName(c.name)?.key === name.key);
    return character ? { accountId, character } : null;
  }

  ownsCharacter(accountId, nameValue) {
    const found = this.findCharacter(nameValue);
    return Boolean(found && found.accountId === accountId);
  }
}

export class SessionManager {
  constructor({ ttlMs = SESSION_TTL_MS, idleMs = SESSION_IDLE_MS } = {}) {
    this.ttlMs = ttlMs;
    this.idleMs = idleMs;
    this.sessions = new Map();
  }

  tokenKey(token) {
    if (typeof token !== 'string' || token.length < 32 || token.length > 256) return null;
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  prune(now = Date.now()) {
    for (const [key, session] of this.sessions) {
      if (session.expiresAt <= now || now - session.lastSeenAt > this.idleMs) this.sessions.delete(key);
    }
  }

  create(accountId, { revokeExisting = false } = {}) {
    this.prune();
    if (revokeExisting) this.revokeAccount(accountId);
    const token = crypto.randomBytes(32).toString('base64url');
    const key = this.tokenKey(token);
    const now = Date.now();
    this.sessions.set(key, {
      accountId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + this.ttlMs,
    });
    return { token, key, expiresAt: now + this.ttlMs };
  }

  validate(token, { touch = true } = {}) {
    const key = this.tokenKey(token);
    if (!key) return null;
    const session = this.validateKey(key, { touch });
    return session ? { key, ...session } : null;
  }

  validateKey(key, { touch = true } = {}) {
    const session = this.sessions.get(key);
    if (!session) return null;
    const now = Date.now();
    if (session.expiresAt <= now || now - session.lastSeenAt > this.idleMs) {
      this.sessions.delete(key);
      return null;
    }
    if (touch) session.lastSeenAt = now;
    return { ...session };
  }

  rotate(token) {
    const session = this.validate(token, { touch: false });
    if (!session) return null;
    this.sessions.delete(session.key);
    return this.create(session.accountId);
  }

  revoke(token) {
    const key = this.tokenKey(token);
    if (key) this.sessions.delete(key);
  }

  revokeKey(key) {
    if (key) this.sessions.delete(key);
  }

  revokeAccount(accountId) {
    for (const [key, session] of this.sessions) {
      if (session.accountId === accountId) this.sessions.delete(key);
    }
  }
}

export const accountStore = new AccountStore();
export const sessionManager = new SessionManager();
export { normalizeUsername, normalizeCharacterName, validatePassword, publicAccount };
