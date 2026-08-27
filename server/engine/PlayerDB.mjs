// Server-side Player persistence — FULL UNIFIED SAVE
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.MORIA_PLAYER_DB || path.join(__dirname, '..', 'moria-players.json');

class PlayerDB {
  constructor() {
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        console.log(`📦 Player DB: ${Object.keys(this.data).length} heroes saved`);
      }
    } catch (e) { console.warn('⚠ Player DB load failed:', e.message); }
  }

  save() {
    try {
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, DB_FILE);
    } catch (e) { console.warn('⚠ Player DB save failed:', e.message); }
  }

  get(name) { return this.data[name] || null; }
  exists(name) { return name in this.data; }

  findNameCaseInsensitive(name) {
    if (typeof name !== 'string') return null;
    const key = name.trim().toLocaleLowerCase('en-US');
    return Object.keys(this.data).find(existing => existing.toLocaleLowerCase('en-US') === key) || null;
  }

  existsCaseInsensitive(name) { return Boolean(this.findNameCaseInsensitive(name)); }

  // Stores the FULL unified save object (talents, gems, blessings, etc.)
  set(name, saveData) {
    if (!this.data[name]) this.data[name] = {};
    this.data[name] = { ...saveData, lastSeen: Date.now() };
  }
}

export const playerDB = new PlayerDB();
