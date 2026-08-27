// ===================================================================
// MOR'IA — OFFICIAL TRANSACTION MANAGER
// Crash-recoverable unit-of-work for official mutations that span the global
// official store and one or more player records.
// ===================================================================

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const OFFICIAL_TRANSACTION_JOURNAL_VERSION = 1;
export const OFFICIAL_TRANSACTION_MAX_BYTES = 32 * 1024 * 1024;

const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const clone = value => structuredClone(value);

function syncDirectory(directory) {
  let fd = null;
  try {
    fd = fs.openSync(directory, 'r');
    fs.fsyncSync(fd);
  } catch {
    // Directory fsync is not supported by every platform. File fsync + atomic
    // rename still protects readers from partial JSON.
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

function snapshotRuntimePlayer(player) {
  if (!isRecord(player)) return null;
  const state = {};
  for (const [key, value] of Object.entries(player)) {
    if (key === 'ws') continue;
    try { state[key] = clone(value); } catch {}
  }
  return state;
}

function restoreRuntimePlayer(player, snapshot) {
  if (!isRecord(player) || !isRecord(snapshot)) return;
  for (const key of Object.keys(player)) {
    if (key === 'ws') continue;
    if (!Object.hasOwn(snapshot, key)) delete player[key];
  }
  for (const [key, value] of Object.entries(snapshot)) player[key] = clone(value);
}

function validAdapter(adapter) {
  return Boolean(
    adapter
    && typeof adapter.capture === 'function'
    && typeof adapter.persist === 'function'
    && typeof adapter.restore === 'function'
  );
}

export class OfficialTransactionManager {
  constructor(repository, options = {}) {
    if (!repository || typeof repository.save !== 'function' || typeof repository.file !== 'string') {
      throw new TypeError('OfficialTransactionManager requires an OfficialStateRepository-compatible repository.');
    }
    this.repository = repository;
    this.journalFile = path.resolve(String(options.journalFile || `${repository.file}.txn-journal.json`));
    const maxBytes = Number(options.maxBytes);
    this.maxBytes = Number.isSafeInteger(maxBytes) && maxBytes > 0 ? maxBytes : OFFICIAL_TRANSACTION_MAX_BYTES;
    this.active = false;
    this.saveRequested = false;
  }

  deferSave() {
    if (!this.active) return false;
    this.saveRequested = true;
    return true;
  }

  hasPendingJournal() {
    try { return fs.existsSync(this.journalFile); } catch { return false; }
  }

  readJournal() {
    try {
      if (!fs.existsSync(this.journalFile)) return null;
      const stat = fs.statSync(this.journalFile);
      if (!stat.isFile() || stat.size <= 0 || stat.size > this.maxBytes) return false;
      const parsed = JSON.parse(fs.readFileSync(this.journalFile, 'utf8'));
      if (!isRecord(parsed) || parsed.version !== OFFICIAL_TRANSACTION_JOURNAL_VERSION) return false;
      if (!isRecord(parsed.previousGlobal) || !isRecord(parsed.previousPlayers)) return false;
      return parsed;
    } catch (error) {
      console.warn('⚠ Official transaction journal read failed:', error?.message || error);
      return false;
    }
  }

  writeJournal(journal) {
    const directory = path.dirname(this.journalFile);
    const temp = `${this.journalFile}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    let fd = null;
    try {
      const payload = `${JSON.stringify(journal, null, 2)}\n`;
      if (Buffer.byteLength(payload, 'utf8') > this.maxBytes) return false;
      fs.mkdirSync(directory, { recursive: true });
      fd = fs.openSync(temp, 'wx', 0o600);
      fs.writeFileSync(fd, payload, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(temp, this.journalFile);
      syncDirectory(directory);
      return true;
    } catch (error) {
      console.warn('⚠ Official transaction journal write failed:', error?.message || error);
      return false;
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
      try { fs.rmSync(temp, { force: true }); } catch {}
    }
  }

  clearJournal() {
    const directory = path.dirname(this.journalFile);
    try {
      fs.rmSync(this.journalFile, { force: true });
      syncDirectory(directory);
      return true;
    } catch (error) {
      console.warn('⚠ Official transaction journal cleanup failed:', error?.message || error);
      return false;
    }
  }

  recover(host, adapter) {
    if (!host || !isRecord(host.global) || !validAdapter(adapter)) {
      return { ok: false, recovered: false, error: 'Invalid transaction recovery context.' };
    }
    const journal = this.readJournal();
    if (journal === null) return { ok: true, recovered: false, error: null };
    if (journal === false) return { ok: false, recovered: false, error: 'Transaction journal is corrupt or oversized.' };

    const previousGlobal = clone(journal.previousGlobal);
    const previousPlayers = clone(journal.previousPlayers);
    const globalRestored = this.repository.save(previousGlobal);
    const playersRestored = globalRestored && adapter.restore(previousPlayers) === true;
    if (!globalRestored || !playersRestored) {
      return { ok: false, recovered: false, error: 'Pending transaction rollback could not be persisted.' };
    }

    host.global = previousGlobal;
    if (!this.clearJournal()) {
      return { ok: false, recovered: false, error: 'Recovered transaction but could not clear recovery journal.' };
    }
    return { ok: true, recovered: true, transactionId: journal.id || null, action: journal.action || null, error: null };
  }

  run(host, { action = '', adapter = null, runtimePlayers = [], prepareCommit = null } = {}, operation) {
    if (!host || !isRecord(host.global) || typeof operation !== 'function' || !validAdapter(adapter)) {
      return { ok: false, detail: null, transactionError: 'Durable transaction context unavailable.' };
    }
    if (this.active) {
      return { ok: false, detail: null, transactionError: 'Nested official transactions are not allowed.' };
    }
    if (this.hasPendingJournal()) {
      return { ok: false, detail: null, transactionError: 'Pending transaction recovery blocks new mutations.' };
    }

    let previousPlayers;
    try { previousPlayers = adapter.capture(); } catch { previousPlayers = null; }
    if (!isRecord(previousPlayers)) {
      return { ok: false, detail: null, transactionError: 'Could not capture durable player state.' };
    }

    const previousGlobal = clone(host.global);
    const trackedPlayers = Array.isArray(runtimePlayers)
      ? runtimePlayers.filter(isRecord).map(player => ({ player, snapshot: snapshotRuntimePlayer(player) })).filter(entry => entry.snapshot)
      : [];

    const rollbackRuntime = () => {
      host.global = clone(previousGlobal);
      for (const entry of trackedPlayers) restoreRuntimePlayer(entry.player, entry.snapshot);
    };

    this.active = true;
    this.saveRequested = false;
    let result;
    try {
      result = operation();
      if (!result || typeof result !== 'object' || !result.ok) {
        rollbackRuntime();
        return result && typeof result === 'object'
          ? { ...result, transactionError: null }
          : { ok: false, detail: null, transactionError: null };
      }
      if (typeof prepareCommit === 'function') prepareCommit();
    } catch (error) {
      rollbackRuntime();
      // prepareCommit runs after the domain operation has returned ok=true. If
      // that hook throws, `result.ok` is still true, so the finally block alone
      // cannot distinguish the failed prepare phase from a valid commit path.
      // Release the unit-of-work lock explicitly before propagating the error.
      this.active = false;
      this.saveRequested = false;
      throw error;
    } finally {
      // Keep the transaction active through durable commit below only when the
      // operation succeeded. Failed/throwing operations never touched disk.
      if (!result || !result.ok) {
        this.active = false;
        this.saveRequested = false;
      }
    }

    const journal = {
      version: OFFICIAL_TRANSACTION_JOURNAL_VERSION,
      id: `otx_${crypto.randomUUID()}`,
      action: typeof action === 'string' ? action.slice(0, 80) : '',
      createdAt: Date.now(),
      previousGlobal,
      previousPlayers: clone(previousPlayers),
    };

    if (!this.writeJournal(journal)) {
      rollbackRuntime();
      this.active = false;
      this.saveRequested = false;
      return { ok: false, detail: null, transactionError: 'Could not prepare durable transaction journal.' };
    }

    const globalCommitted = this.repository.save(host.global);
    const playersCommitted = globalCommitted && adapter.persist() === true;
    if (globalCommitted && playersCommitted && this.clearJournal()) {
      this.active = false;
      this.saveRequested = false;
      return { ...result, transactionId: journal.id, transactionError: null };
    }

    rollbackRuntime();
    const globalRolledBack = this.repository.save(previousGlobal);
    let playersRolledBack = false;
    try { playersRolledBack = adapter.restore(previousPlayers) === true; } catch {}
    if (globalRolledBack && playersRolledBack) this.clearJournal();

    this.active = false;
    this.saveRequested = false;
    return {
      ok: false,
      detail: null,
      transactionError: globalRolledBack && playersRolledBack
        ? 'Durable transaction failed and was rolled back.'
        : 'Durable transaction failed; recovery journal retained for restart recovery.',
    };
  }
}
