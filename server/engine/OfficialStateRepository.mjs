// ===================================================================
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
