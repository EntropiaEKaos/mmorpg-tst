export interface DamageRecord {
  source: string;
  target: string;
  amount: number;
  timestamp: number;
  type: 'physical' | 'magical' | 'heal';
  critical: boolean;
}

export interface DPSStats {
  totalDamage: number;
  totalHealing: number;
  dps: number;
  hps: number;
  critRate: number;
  hits: number;
  crits: number;
  maxHit: number;
  duration: number;
}

class DPSMeter {
  private records: DamageRecord[] = [];
  private startTime = 0;
  private running = false;

  start() {
    this.records = [];
    this.startTime = Date.now();
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  record(source: string, target: string, amount: number, type: DamageRecord['type'], critical: boolean) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!this.running) {
      // Start lazily on the first real combat event so callers cannot silently
      // forget to initialize the meter before recording.
      this.startTime = Date.now();
      this.running = true;
    }
    this.records.push({
      source, target, amount, type, critical,
      timestamp: Date.now(),
    });
    // The UI only needs a combat-session window. Bound memory in very long sessions.
    if (this.records.length > 5000) this.records.splice(0, this.records.length - 5000);
  }

  getStats(): DPSStats {
    if (this.records.length === 0 || this.startTime <= 0) {
      return { totalDamage: 0, totalHealing: 0, dps: 0, hps: 0, critRate: 0, hits: 0, crits: 0, maxHit: 0, duration: 0 };
    }

    const duration = Math.max(0.001, (Date.now() - this.startTime) / 1000);
    const damageRecords = this.records.filter((r) => r.type !== 'heal');
    const healRecords = this.records.filter((r) => r.type === 'heal');
    const totalDamage = damageRecords.reduce((s, r) => s + r.amount, 0);
    const totalHealing = healRecords.reduce((s, r) => s + r.amount, 0);
    const hits = damageRecords.length;
    const crits = damageRecords.filter((r) => r.critical).length;
    const maxHit = Math.max(0, ...damageRecords.map((r) => r.amount));

    return {
      totalDamage,
      totalHealing,
      dps: Math.round(totalDamage / duration),
      hps: Math.round(totalHealing / duration),
      critRate: hits > 0 ? Math.round((crits / hits) * 100) : 0,
      hits,
      crits,
      maxHit,
      duration: Math.round(duration),
    };
  }

  getRecent(n = 10): DamageRecord[] {
    return this.records.slice(-Math.max(0, n));
  }

  clear() {
    this.records = [];
    this.startTime = 0;
    this.running = false;
  }
}

export const dpsMeter = new DPSMeter();
