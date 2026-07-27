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
    if (!this.running) return;
    this.records.push({
      source, target, amount, type, critical,
      timestamp: Date.now(),
    });
  }

  getStats(): DPSStats {
    const duration = (Date.now() - this.startTime) / 1000;
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
      dps: duration > 0 ? Math.round(totalDamage / duration) : 0,
      hps: duration > 0 ? Math.round(totalHealing / duration) : 0,
      critRate: hits > 0 ? Math.round((crits / hits) * 100) : 0,
      hits,
      crits,
      maxHit,
      duration: Math.round(duration),
    };
  }

  getRecent(n = 10): DamageRecord[] {
    return this.records.slice(-n);
  }

  clear() {
    this.records = [];
    this.startTime = Date.now();
  }
}

export const dpsMeter = new DPSMeter();
