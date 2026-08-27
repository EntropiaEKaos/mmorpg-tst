from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

REPOSITORY = r'''// ===================================================================
// MOR'IA — OFFICIAL STATE REPOSITORY
// Durable JSON adapter behind the versioned official state schema.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeGlobalState } from './OfficialStateSchema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_OFFICIAL_STATE_FILE = process.env.MORIA_OFFICIAL_DB || path.join(__dirname, '..', 'moria-official.json');
export const OFFICIAL_STATE_MAX_BYTES = 16 * 1024 * 1024;

function syncDirectory(directory) {
  let fd = null;
  try {
    fd = fs.openSync(directory, 'r');
    fs.fsyncSync(fd);
  } catch {
    // Some filesystems/platforms do not permit directory fsync. The file
    // itself is already synced and the atomic rename still protects readers.
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

export class OfficialStateRepository {
  constructor(file = DEFAULT_OFFICIAL_STATE_FILE, options = {}) {
    this.file = path.resolve(String(file || DEFAULT_OFFICIAL_STATE_FILE));
    const maxBytes = Number(options.maxBytes);
    this.maxBytes = Number.isSafeInteger(maxBytes) && maxBytes > 0 ? maxBytes : OFFICIAL_STATE_MAX_BYTES;
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return null;
      const stat = fs.statSync(this.file);
      if (!stat.isFile() || stat.size > this.maxBytes) return null;
      const rawText = fs.readFileSync(this.file, 'utf8');
      const raw = JSON.parse(rawText);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      return normalizeGlobalState(raw);
    } catch (error) {
      console.warn('⚠ Official state repository load failed:', error?.message || error);
      return null;
    }
  }

  save(state) {
    const directory = path.dirname(this.file);
    const temp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    let fd = null;
    try {
      const normalized = normalizeGlobalState(state);
      const payload = `${JSON.stringify(normalized, null, 2)}\n`;
      if (Buffer.byteLength(payload, 'utf8') > this.maxBytes) return false;

      fs.mkdirSync(directory, { recursive: true });
      fd = fs.openSync(temp, 'wx', 0o600);
      fs.writeFileSync(fd, payload, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(temp, this.file);
      syncDirectory(directory);
      return true;
    } catch (error) {
      console.warn('⚠ Official state repository save failed:', error?.message || error);
      return false;
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
      try { fs.rmSync(temp, { force: true }); } catch {}
    }
  }
}
'''
write('server/engine/OfficialStateRepository.mjs', REPOSITORY)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { OfficialStateRepository } from '../engine/OfficialStateRepository.mjs';

function tempRepository(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-official-repository-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'official.json');
  return { dir, file, repo: new OfficialStateRepository(file, options) };
}

test('official state repository treats missing files as no persisted state', t => {
  const { repo } = tempRepository(t);
  assert.equal(repo.load(), null);
});

test('official state repository atomically writes normalized durable state', t => {
  const { dir, file, repo } = tempRepository(t);
  assert.equal(repo.save({
    auctions: [{ id: 'a1' }],
    credits: { Alice: 10, ALICE: 20 },
    eventSequence: 5_000_000,
  }), true);
  assert.equal(fs.existsSync(file), true);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(raw.credits.alice, 30);
  assert.equal(raw.eventSequence, 999999);
  assert.equal(fs.readdirSync(dir).some(name => name.endsWith('.tmp')), false);
});

test('official state repository load always crosses the versioned normalization boundary', t => {
  const { file, repo } = tempRepository(t);
  fs.writeFileSync(file, JSON.stringify({
    credits: { Alice: -100, Bob: 50 },
    eventRewards: { ALICE: [{ id: 'r1', gold: -1, xp: 3, coins: 2, claimed: false }] },
    auctions: 'not-an-array',
  }));
  const loaded = repo.load();
  assert.deepEqual(loaded.auctions, []);
  assert.equal(loaded.credits.alice, 0);
  assert.equal(loaded.credits.bob, 50);
  assert.deepEqual(loaded.eventRewards.alice[0], { id: 'r1', name: 'World Event', gold: 0, xp: 3, coins: 2, claimed: false });
});

test('official state repository fails closed on corrupt JSON without rewriting it', t => {
  const { file, repo } = tempRepository(t);
  const corrupt = '{ definitely-not-json';
  fs.writeFileSync(file, corrupt);
  assert.equal(repo.load(), null);
  assert.equal(fs.readFileSync(file, 'utf8'), corrupt);
});

test('official state repository rejects oversized input on load', t => {
  const { file, repo } = tempRepository(t, { maxBytes: 64 });
  fs.writeFileSync(file, JSON.stringify({ data: 'x'.repeat(128) }));
  assert.equal(repo.load(), null);
});

test('official state repository rejects oversized output without partial files', t => {
  const { dir, file, repo } = tempRepository(t, { maxBytes: 32 });
  assert.equal(repo.save({ mail: [{ id: 'x', body: 'a'.repeat(100) }] }), false);
  assert.equal(fs.existsSync(file), false);
  assert.equal(fs.readdirSync(dir).some(name => name.endsWith('.tmp')), false);
});

test('official state repository replaces an existing snapshot atomically', t => {
  const { file, repo } = tempRepository(t);
  assert.equal(repo.save({ credits: { Alice: 10 } }), true);
  assert.equal(repo.save({ credits: { Alice: 25 } }), true);
  const loaded = repo.load();
  assert.equal(loaded.credits.alice, 25);
  assert.equal(fs.readFileSync(file, 'utf8').includes('"alice": 10'), false);
});
'''
write('server/test/official-state-repository.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.14 — Official State Repository

Foundation 7.14 extracts durable official-state filesystem I/O into `OfficialStateRepository`.

The repository enforces a maximum file size, routes every load/save through `OfficialStateSchema`, writes to exclusive temporary files with owner-only permissions, flushes file data before rename, atomically replaces the live snapshot and cleans temporary files on failure. Corrupt or oversized state fails closed and is never silently overwritten during load.

`OfficialSystems` is now an orchestration façade: it owns the live state reference but delegates physical persistence to the repository. This is the adapter seam for replacing JSON with PostgreSQL, SQLite, Redis-backed coordination or another durable store without changing combat, economy, progression, events or exploration domains.
'''
write('docs/FOUNDATION_7_14_STATE_REPOSITORY.md', DOC)

path_systems = 'server/engine/OfficialSystems.mjs'
text = read(path_systems)
text = replace_once(text, "import fs from 'fs';\nimport path from 'path';\nimport { fileURLToPath } from 'url';\n", '', 'filesystem imports')
anchor = "import { exportPlayerState, freshGlobalState, freshPlayerState, normalizeGlobalState, normalizePlayerState } from './OfficialStateSchema.mjs';\n"
text = replace_once(text, anchor, "import { exportPlayerState, freshGlobalState, freshPlayerState, normalizePlayerState } from './OfficialStateSchema.mjs';\nimport { DEFAULT_OFFICIAL_STATE_FILE, OfficialStateRepository } from './OfficialStateRepository.mjs';\n", 'repository import')
old_default = r'''const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = process.env.MORIA_OFFICIAL_DB || path.join(__dirname, '..', 'moria-official.json');

'''
text = replace_once(text, old_default, '', 'default db path')
text = replace_once(text, '  constructor(dbFile = DEFAULT_DB_FILE) {\n    this.dbFile = dbFile;\n    this.global = freshGlobalState();', '  constructor(dbFile = DEFAULT_OFFICIAL_STATE_FILE) {\n    this.dbFile = dbFile;\n    this.repository = new OfficialStateRepository(dbFile);\n    this.global = freshGlobalState();', 'repository constructor')
old_load = r'''  load() {
    try {
      if (!fs.existsSync(this.dbFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      this.global = normalizeGlobalState(raw);
      return true;
    } catch (error) {
      console.warn('⚠ Official systems DB load failed:', error?.message || error);
      return false;
    }
  }

  save() {
    const temp = `${this.dbFile}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
      fs.writeFileSync(temp, JSON.stringify(this.global, null, 2));
      fs.renameSync(temp, this.dbFile);
      return true;
    } catch (error) {
      try { fs.rmSync(temp, { force: true }); } catch {}
      console.warn('⚠ Official systems DB save failed:', error?.message || error);
      return false;
    }
  }
'''
new_load = r'''  load() {
    const loaded = this.repository.load();
    if (!loaded) return false;
    this.global = loaded;
    return true;
  }

  save() {
    return this.repository.save(this.global);
  }
'''
text = replace_once(text, old_load, new_load, 'repository load save delegation')
write(path_systems, text)

print('Foundation 7.14 official state repository extraction applied')
