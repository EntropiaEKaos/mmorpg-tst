// ===================================================================
//  MOR'IA RATE LIMITER — bounded in-memory fixed-window limiter
// ===================================================================

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export class BoundedWindowRateLimiter {
  constructor({ maxEntries = 10_000 } = {}) {
    this.maxEntries = positiveInteger(maxEntries, 10_000);
    this.entries = new Map();
  }

  get size() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  prune(now = Date.now()) {
    for (const [key, state] of this.entries) {
      if (!state || now >= state.resetAt) this.entries.delete(key);
    }
    this.enforceBound();
    return this.entries.size;
  }

  enforceBound() {
    while (this.entries.size > this.maxEntries) {
      let evictionKey = null;
      let earliestReset = Infinity;
      for (const [key, state] of this.entries) {
        const resetAt = Number(state?.resetAt) || 0;
        if (resetAt < earliestReset) {
          earliestReset = resetAt;
          evictionKey = key;
        }
      }
      if (evictionKey === null) break;
      this.entries.delete(evictionKey);
    }
  }

  consume(key, { limit, windowMs, now = Date.now() } = {}) {
    const normalizedKey = String(key || 'unknown');
    const normalizedLimit = positiveInteger(limit, 1);
    const normalizedWindow = positiveInteger(windowMs, 60_000);

    let state = this.entries.get(normalizedKey);
    if (!state || now >= state.resetAt) {
      state = { count: 0, resetAt: now + normalizedWindow };
    }

    state.count += 1;
    this.entries.set(normalizedKey, state);

    if (this.entries.size > this.maxEntries) {
      this.prune(now);
      // The current key may have been evicted if it was already expired by the
      // supplied clock. Restore only a fresh current window and keep the map bounded.
      if (!this.entries.has(normalizedKey)) {
        this.entries.set(normalizedKey, state);
        this.enforceBound();
      }
    }

    const allowed = state.count <= normalizedLimit;
    return {
      allowed,
      count: state.count,
      limit: normalizedLimit,
      resetAt: state.resetAt,
      retryAfterMs: allowed ? 0 : Math.max(1, state.resetAt - now),
    };
  }
}
